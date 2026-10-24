// Adaptive placement diagnostic. Each answer updates a per-skill knowledge estimate and propagates
// along the prerequisite graph (knowing an advanced skill is evidence for its prerequisites; failing a
// basic skill is evidence against its dependents), so ~10–15 questions can map a 12-skill route.
import type { Exercise, Skill } from './types';
import { buildGraph, type SkillGraph } from './graph';
import { bktPosterior, GUESS, type Confidence } from './model';

export type DiagLength = 'short' | 'standard' | 'thorough';
export const DIAG_MAX: Record<DiagLength, number> = { short: 8, standard: 12, thorough: 18 };
export type SelfLevel = 0 | 1 | 2 | 3;
export const SELF_LEVELS: { level: SelfLevel; title: string; desc: string }[] = [
  { level: 0, title: 'С нуля', desc: 'Никогда не программировал(а) на этом' },
  { level: 1, title: 'Немного', desc: 'Пробовал(а), знаю основы' },
  { level: 2, title: 'Уверенно', desc: 'Пишу небольшие программы' },
  { level: 3, title: 'Опытно', desc: 'Использую в работе или учёбе' },
];

/** Below this many answers the estimate is too fragile to stop (see docs/RESEARCH.md). */
export const DIAG_MIN = 6;
const UNCERTAIN_LO = 0.2;
const UNCERTAIN_HI = 0.8;
const PROPAGATION = 0.55;
const QUICK_KINDS = ['mcq', 'predict', 'parsons'];
const SKIP = new Set(['explain']);

export interface DiagAnswer {
  ex: string;
  skill: string;
  kind: Exercise['kind'];
  correct: boolean;
  dontKnow: boolean;
  confidence?: Confidence;
  ms?: number;
}

export interface DiagState {
  route: string;
  startedAt: number;
  selfLevel: SelfLevel;
  maxQuestions: number;
  p: Record<string, number>;
  answers: DiagAnswer[];
  finished: boolean;
}

export function priorFor(level: SelfLevel, tier: number): number {
  const base = [0.12, 0.35, 0.55, 0.72][level];
  return Math.min(0.9, Math.max(0.05, base - (tier - 1) * 0.08));
}

export function startDiagnostic(route: string, skills: Skill[], level: SelfLevel, length: DiagLength, now: number): DiagState {
  const p: Record<string, number> = {};
  for (const s of skills) p[s.id] = priorFor(level, s.tier);
  return { route, startedAt: now, selfLevel: level, maxQuestions: DIAG_MAX[length], p, answers: [], finished: false };
}

const entropy = (p: number) => (p <= 0 || p >= 1 ? 0 : -(p * Math.log2(p) + (1 - p) * Math.log2(1 - p)));

function candidates(state: DiagState, pool: Exercise[], skillId: string): Exercise[] {
  const used = new Set(state.answers.map((a) => a.ex));
  return pool.filter((e) => e.skill === skillId && e.diag && !SKIP.has(e.kind) && !used.has(e.id));
}

/** Expected information over the whole graph: uncertainty of the skill plus what its answer tells about related skills. */
export function skillScore(state: DiagState, g: SkillGraph, id: string): number {
  let score = entropy(state.p[id]);
  for (const [a, d] of g.ancestors(id)) score += entropy(state.p[a]) * Math.pow(PROPAGATION, d) * 0.5;
  for (const [c, d] of g.descendants(id)) score += entropy(state.p[c]) * Math.pow(PROPAGATION, d) * 0.5;
  const asked = state.answers.filter((a) => a.skill === id).length;
  return score / (1 + asked * 0.7);
}

export function nextQuestion(state: DiagState, skills: Skill[], pool: Exercise[]): Exercise | null {
  if (state.finished || state.answers.length >= state.maxQuestions) return null;
  const g = buildGraph(skills);
  let open = skills.filter((s) => state.p[s.id] > UNCERTAIN_LO && state.p[s.id] < UNCERTAIN_HI && candidates(state, pool, s.id).length);
  if (!open.length && state.answers.length < DIAG_MIN) {
    // Confirm the least certain remaining estimates instead of stopping on very little evidence.
    open = skills.filter((s) => candidates(state, pool, s.id).length).sort((a, b) => Math.abs(state.p[a.id] - 0.5) - Math.abs(state.p[b.id] - 0.5)).slice(0, 3);
  }
  if (!open.length) return null;
  const best = open.map((s) => ({ s, score: skillScore(state, g, s.id) })).sort((a, b) => b.score - a.score || a.s.tier - b.s.tier)[0].s;
  const items = candidates(state, pool, best.id);
  const askedKinds = new Set(state.answers.filter((a) => a.skill === best.id).map((a) => a.kind));
  // First a quick recognition item; once the estimate leans "known", confirm with a recall item.
  const wantRecall = state.p[best.id] >= 0.5 || askedKinds.size > 0;
  const rank = (e: Exercise) =>
    (askedKinds.has(e.kind) ? 10 : 0) + (QUICK_KINDS.includes(e.kind) === !wantRecall ? 0 : 3) + e.difficulty;
  return [...items].sort((a, b) => rank(a) - rank(b))[0];
}

export function answerQuestion(state: DiagState, skills: Skill[], a: DiagAnswer): DiagState {
  const g = buildGraph(skills);
  const p = { ...state.p };
  const before = p[a.skill];
  const correct = a.correct && !a.dontKnow;
  const guess = a.dontKnow ? 0.01 : Math.max(GUESS[a.kind], a.confidence === 'guess' ? 0.5 : 0);
  const slip = a.dontKnow ? 0.02 : 0.1;
  let post = bktPosterior(before, correct, guess, slip);
  if (correct && a.confidence === 'guess') post = before + (post - before) * 0.5;
  p[a.skill] = Math.min(0.98, Math.max(0.02, post));
  const delta = p[a.skill] - before;
  if (delta > 0) {
    for (const [id, d] of g.ancestors(a.skill)) p[id] = Math.min(0.97, p[id] + (1 - p[id]) * Math.min(1, delta * 1.5) * Math.pow(PROPAGATION, d));
  } else if (delta < 0) {
    for (const [id, d] of g.descendants(a.skill)) p[id] = Math.max(0.03, p[id] - p[id] * Math.min(1, -delta * 1.5) * Math.pow(PROPAGATION, d));
  }
  const next = { ...state, p, answers: [...state.answers, a] };
  return next;
}

export type DiagVerdict = 'known' | 'partial' | 'gap';

export interface DiagResultSkill {
  skill: string;
  p: number;
  verdict: DiagVerdict;
  /** Human-readable reasons for the verdict (explainable recommendation). */
  reasons: string[];
  direct: number;
  directCorrect: number;
}

export function verdictOf(p: number): DiagVerdict {
  return p >= 0.8 ? 'known' : p >= 0.45 ? 'partial' : 'gap';
}

export function diagnosticResult(state: DiagState, skills: Skill[]): { skills: DiagResultSkill[]; start: string | null } {
  const g = buildGraph(skills);
  const byId = new Map(skills.map((s) => [s.id, s]));
  const res = g.topo.map((id) => {
    const direct = state.answers.filter((a) => a.skill === id);
    const ok = direct.filter((a) => a.correct && !a.dontKnow);
    const reasons: string[] = [];
    if (direct.length) {
      reasons.push(`Прямых вопросов: ${direct.length}, верно: ${ok.length}.`);
      if (direct.some((a) => a.dontKnow)) reasons.push('Вы отметили «не знаю».');
      if (ok.some((a) => a.confidence === 'guess')) reasons.push('Часть верных ответов — наугад, они учтены с меньшим весом.');
    } else {
      const anc = [...g.descendants(id).keys()].filter((c) => state.answers.some((a) => a.skill === c && a.correct && !a.dontKnow));
      const failedPre = [...g.ancestors(id).keys()].filter((c) => state.answers.some((a) => a.skill === c && (!a.correct || a.dontKnow)));
      if (anc.length) reasons.push(`Вывод по связанным темам: вы справились с «${byId.get(anc[0])!.title}», которая опирается на эту.`);
      if (failedPre.length) reasons.push(`Вывод по связанным темам: были трудности с базовой темой «${byId.get(failedPre[0])!.title}».`);
      if (!anc.length && !failedPre.length) reasons.push('Прямых вопросов не было — оценка по вашему уровню опыта.');
    }
    return { skill: id, p: state.p[id], verdict: verdictOf(state.p[id]), reasons, direct: direct.length, directCorrect: ok.length };
  });
  const start = res.find((r) => r.verdict !== 'known')?.skill ?? null;
  return { skills: res, start };
}

/** Rough remaining-question estimate for the progress bar. */
export function remainingEstimate(state: DiagState, skills: Skill[]): number {
  const open = skills.filter((s) => state.p[s.id] > UNCERTAIN_LO && state.p[s.id] < UNCERTAIN_HI).length;
  return Math.max(0, Math.min(state.maxQuestions - state.answers.length, Math.ceil(open * 0.6)));
}
