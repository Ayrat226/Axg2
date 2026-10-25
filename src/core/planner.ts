// Adaptive plan: what to do next and why. Every recommendation carries a human-readable reason,
// and the learner can always pick something else (learner control).
import type { Exercise, Project, Skill } from './types';
import type { AppState } from './state';
import { dayKey } from './state';
import { buildGraph } from './graph';
import { isDone, RECALL_KINDS, skillStatus } from './model';
import { retrievability } from './srs';

export type Activity =
  | { type: 'diagnostic'; route: string; reason: string; minutes: number }
  | { type: 'check'; skill: string; reason: string; minutes: number }
  | { type: 'review'; skills: string[]; reason: string; minutes: number }
  | { type: 'verify'; skill: string; reason: string; minutes: number }
  | { type: 'learn'; skill: string; reason: string; minutes: number }
  | { type: 'practice'; skill: string; reason: string; minutes: number }
  | { type: 'mistakes'; count: number; reason: string; minutes: number }
  | { type: 'project'; project: string; reason: string; minutes: number };

export interface ContentIndex {
  skills: Skill[];
  exercises: Exercise[];
  projects: Project[];
}

export function dueChecks(state: AppState, skills: Skill[], now: number): string[] {
  return skills.filter((s) => {
    const st = state.skills[s.id];
    return st?.checkDue !== undefined && st.checkDue <= now;
  }).map((s) => s.id);
}

export function dueReviews(state: AppState, skills: Skill[], now: number): string[] {
  return skills
    .filter((s) => {
      const st = state.skills[s.id];
      return st?.mem && st.mem.due <= now && !(st.checkDue !== undefined && st.checkDue <= now);
    })
    .sort((a, b) => retrievability(state.skills[a.id].mem!, now) - retrievability(state.skills[b.id].mem!, now))
    .map((s) => s.id);
}

/** Everything a review session would serve now: overdue delayed checks first, then due reviews. */
export function dueAll(state: AppState, skills: Skill[], now: number): string[] {
  return [...new Set([...dueChecks(state, skills, now), ...dueReviews(state, skills, now)])];
}

export function missingPrereqs(state: AppState, skill: Skill, all: Map<string, Skill>, now: number): Skill[] {
  return skill.prereqs.filter((p) => all.has(p) && !isDone(skillStatus(state.skills[p], now))).map((p) => all.get(p)!);
}

export function routeProgress(state: AppState, skills: Skill[], now: number) {
  const st = skills.map((s) => skillStatus(state.skills[s.id], now));
  return {
    total: skills.length,
    mastered: st.filter((x) => x === 'mastered' || x === 'durable' || x === 'rusty').length,
    durable: st.filter((x) => x === 'durable').length,
    probable: st.filter((x) => x === 'probable').length,
    learning: st.filter((x) => x === 'learning').length,
  };
}

/** Next skill to learn: first in prerequisite order that is not done, preferring ones whose prerequisites are done. */
export function nextSkill(state: AppState, skills: Skill[], now: number, goal = state.settings.learning.goal): Skill | null {
  const g = buildGraph(skills);
  const byId = new Map(skills.map((s) => [s.id, s]));
  const open = g.topo.map((id) => byId.get(id)!).filter((s) => !isDone(skillStatus(state.skills[s.id], now)));
  const ready = open.filter((s) => g.parents.get(s.id)!.every((p) => isDone(skillStatus(state.skills[p], now))));
  const pool = ready.length ? ready : open;
  const inProgress = pool.find((s) => skillStatus(state.skills[s.id], now) === 'learning');
  if (inProgress) return inProgress;
  if (goal === 'interview') return pool.find((s) => s.interview) ?? pool[0] ?? null;
  return pool[0] ?? null;
}

export function minutesToday(state: AppState, now: number): number {
  return Math.round((state.days[dayKey(now)]?.ms ?? 0) / 60000);
}

export function planDay(state: AppState, routeId: string, content: ContentIndex, now: number): Activity[] {
  const L = state.settings.learning;
  const route = state.routes[routeId];
  const goal = route?.goal ?? L.goal;
  const skills = content.skills.filter((s) => s.route === routeId);
  const byId = new Map(content.skills.map((s) => [s.id, s]));
  let budget = Math.max(5, L.dailyMinutes - minutesToday(state, now));
  const plan: Activity[] = [];
  const push = (a: Activity) => { plan.push(a); budget -= a.minutes; };

  if (!route?.diagnosticAt && !skills.some((s) => state.skills[s.id]?.evidence.length) && goal !== 'quick') {
    push({ type: 'diagnostic', route: routeId, minutes: 8, reason: 'Короткая адаптивная диагностика покажет, что вы уже знаете, и позволит не тратить время на известное.' });
  }
  for (const id of dueChecks(state, skills, now).slice(0, 2)) {
    push({ type: 'check', skill: id, minutes: 3, reason: `Отсроченная проверка: подтвердите, что «${byId.get(id)!.title}» сохранилось в памяти.` });
  }
  const reviews = dueReviews(state, skills, now);
  if (reviews.length && budget > 0) {
    const take = reviews.slice(0, Math.max(1, Math.min(reviews.length, Math.floor(budget / 2 / 2))));
    push({ type: 'review', skills: take, minutes: take.length * 2, reason: `${take.length} ${plural(take.length, 'тема', 'темы', 'тем')} на грани забывания — повторение сейчас эффективнее всего.` });
  }
  const unresolved = state.mistakes.filter((m) => !m.resolvedAt && byId.get(m.skill)?.route === routeId);
  if (unresolved.length >= 3 && budget > 0) {
    push({ type: 'mistakes', count: unresolved.length, minutes: 6, reason: `Накопилось ${unresolved.length} неразобранных ошибок — целевая практика по ним.` });
  }
  if (goal === 'refresh') return plan;

  const probable = skills.filter((s) => skillStatus(state.skills[s.id], now) === 'probable').slice(0, 2);
  for (const s of probable) if (budget > 0) push({ type: 'verify', skill: s.id, minutes: 3, reason: `Диагностика показала, что «${s.title}» вам, вероятно, знакомо. Одна задача подтвердит это.` });

  let newCount = 0;
  const taken = new Set(plan.flatMap((a) => ('skill' in a ? [a.skill] : [])));
  const fake: AppState = { ...state, skills: { ...state.skills } };
  while (budget > 0 && newCount < L.newPerDay) {
    const s = nextSkill(fake, skills, now, goal);
    if (!s || taken.has(s.id)) break;
    taken.add(s.id);
    const status = skillStatus(state.skills[s.id], now);
    const minutes = goal === 'quick' ? Math.ceil(s.estMinutes * 0.6) : s.estMinutes;
    const missing = missingPrereqs(state, s, byId, now);
    const why = missing.length ? ` Сначала стоит закрепить: ${missing.map((m) => `«${m.title}»`).join(', ')}.` : '';
    if (status === 'learning') push({ type: 'practice', skill: s.id, minutes, reason: `Продолжение: тема начата, но мастерство ещё не доказано.${why}` });
    else push({ type: 'learn', skill: s.id, minutes, reason: `Следующая тема маршрута: все её основы освоены.${why}` });
    newCount++;
    fake.skills[s.id] = { ...(fake.skills[s.id] ?? { p: 0.95, evidence: [], checkStage: 0 }), masteredAt: now, p: 0.99 };
  }
  for (const p of content.projects.filter((p) => p.route === routeId && !state.projects[p.id]?.completedAt)) {
    const ready = p.prereqs.every((id) => isDone(skillStatus(state.skills[id], now)));
    if (ready && (goal === 'project' || budget > 10)) {
      push({ type: 'project', project: p.id, minutes: 20, reason: `Все темы для проекта «${p.title}» освоены — пора применить их вместе.` });
      break;
    }
  }
  return plan;
}

export function plural(n: number, one: string, few: string, many: string): string {
  const m10 = n % 10, m100 = n % 100;
  if (m10 === 1 && m100 !== 11) return one;
  if (m10 >= 2 && m10 <= 4 && (m100 < 10 || m100 >= 20)) return few;
  return many;
}

export type PickMode = 'practice' | 'review' | 'check' | 'verify' | 'mistakes';

/** Choose the next exercise: difficulty adapts to the estimate, kinds rotate, recent items are avoided. */
export function pickExercise(
  state: AppState,
  skillId: string,
  exercises: Exercise[],
  opts: { mode: PickMode; now: number; exclude?: Set<string>; goal?: string; misconception?: string },
): Exercise | null {
  const pool = exercises.filter((e) => e.skill === skillId && !opts.exclude?.has(e.id));
  if (!pool.length) return null;
  const st = state.skills[skillId];
  const p = st?.p ?? 0.15;
  const target = p < 0.35 ? 1 : p < 0.7 ? 2 : 3;
  const recentKinds = (st?.evidence ?? []).slice(-3).map((e) => e.kind);
  const strict = opts.mode === 'check' || opts.mode === 'verify' || opts.mode === 'review';
  const score = (e: Exercise) => {
    const seen = state.seen[e.id];
    let s = 0;
    if (strict) {
      s += RECALL_KINDS.includes(e.kind) ? 0 : 6;
      if (e.kind === 'explain') s += 10;
      s += seen ? (seen.ok ? 4 : 2) : 0; // prefer unseen items (true recall, not memorised answers)
      s += opts.mode === 'check' ? Math.abs(e.difficulty - 2) : 0;
    } else {
      s += Math.abs(e.difficulty - target) * 2;
      s += recentKinds.includes(e.kind) ? 2 : 0;
      s += seen ? Math.min(6, seen.n * 2) - (seen.ok ? 0 : 1) : 0;
      if (opts.goal === 'interview' && (e.kind === 'code' || e.kind === 'explain')) s -= 1.5;
      if (opts.goal === 'quick' && (e.kind === 'mcq' || e.kind === 'predict')) s -= 1.5;
      if (e.kind === 'explain' && (st?.evidence.length ?? 0) < 2) s += 3;
    }
    if (opts.misconception && e.kind === 'mcq' && e.options.some((o) => o.misconception === opts.misconception)) s -= 5;
    return s + (hash(e.id + Math.floor(opts.now / 3_600_000)) % 100) / 1000;
  };
  return [...pool].sort((a, b) => score(a) - score(b))[0];
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}
