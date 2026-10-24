// Daily challenge: three retrieval-practice items, seeded by the local date and interleaving skills the learner
// already touched. The chosen set and results are pinned in `drafts` (a persisted string map) so they survive
// reloads and do not change as answers move the learner model.
import type { Exercise, Skill } from './types';
import type { AppState } from './state';
import { dayKey } from './state';
import { skillStatus, type SkillStatus } from './model';

export const DAILY_SIZE = 3;
export const dailyDraftKey = (key: string) => `daily:${key}`;

export interface DailyProgress {
  key: string;
  ids: string[];
  /** Outcome of each answered item, in order. */
  results: boolean[];
}

export interface DailyStatus {
  key: string;
  total: number;
  answered: number;
  correct: number;
  started: boolean;
  done: boolean;
}

export function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function seededRandom(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function readDaily(state: Pick<AppState, 'drafts'>, key: string): DailyProgress | null {
  const raw = state.drafts[dailyDraftKey(key)];
  if (!raw) return null;
  try {
    const v = JSON.parse(raw) as { ids?: unknown; r?: unknown };
    if (!Array.isArray(v.ids) || !v.ids.every((x) => typeof x === 'string') || !Array.isArray(v.r)) return null;
    return { key, ids: v.ids as string[], results: (v.r as unknown[]).map((x) => x === 1) };
  } catch {
    return null;
  }
}

export const serializeDaily = (p: DailyProgress) => JSON.stringify({ ids: p.ids, r: p.results.map((x) => (x ? 1 : 0)) });

export function dailyStatus(state: Pick<AppState, 'drafts'>, now: number): DailyStatus {
  const key = dayKey(now);
  const p = readDaily(state, key);
  const total = p?.ids.length ?? DAILY_SIZE;
  const answered = p ? Math.min(p.results.length, total) : 0;
  return { key, total, answered, correct: p ? p.results.filter(Boolean).length : 0, started: answered > 0, done: !!p && answered >= total };
}

const STATUS_WEIGHT: Record<SkillStatus, number> = { rusty: 4, learning: 3, mastered: 2, probable: 1.5, durable: 1, new: 0 };
/** Target difficulty from the estimated probability of knowing the skill. */
export const targetDifficulty = (p: number): 1 | 2 | 3 => (p < 0.35 ? 1 : p < 0.7 ? 2 : 3);

/** Pick DAILY_SIZE exercise ids for the day. Pure: same date + same learner state => same set. */
export function buildDaily(state: AppState, now: number, content: { skills: Skill[]; exercises: Exercise[] }, activeRoute?: string): string[] {
  const key = dayKey(now);
  const rnd = seededRandom(hashStr(`daily:${key}`));
  const usable = new Map<string, Exercise[]>();
  for (const e of content.exercises) if (e.kind !== 'explain') usable.set(e.skill, [...(usable.get(e.skill) ?? []), e]);
  const skills = content.skills.filter((s) => usable.has(s.id));

  // Efraimidis–Spirakis weighted sampling without replacement.
  const keyed = (list: Skill[], w: (s: Skill) => number) => list.map((s) => ({ s, k: -Math.log(rnd() || 1e-9) / w(s) })).sort((a, b) => a.k - b.k).map((x) => x.s);
  const practised = skills.filter((s) => STATUS_WEIGHT[skillStatus(state.skills[s.id], now)] > 0);
  const chosen: Skill[] = [];
  for (const s of keyed(practised, (x) => STATUS_WEIGHT[skillStatus(state.skills[x.id], now)])) {
    if (chosen.length >= DAILY_SIZE) break;
    chosen.push(s);
  }
  if (chosen.length < DAILY_SIZE) {
    const tier1 = skills.filter((s) => s.tier === 1 && !chosen.includes(s));
    const inRoute = tier1.filter((s) => s.route === activeRoute);
    for (const s of [...keyed(inRoute, () => 1), ...keyed(tier1.filter((s) => s.route !== activeRoute), () => 1)]) {
      if (chosen.length >= DAILY_SIZE) break;
      chosen.push(s);
    }
  }
  for (const s of keyed(skills.filter((x) => !chosen.includes(x)), () => 1)) {
    if (chosen.length >= DAILY_SIZE) break;
    chosen.push(s);
  }
  // Interleave: avoid consecutive items from the same route when possible.
  const ordered: Skill[] = [];
  const rest = [...chosen];
  while (rest.length) {
    const i = rest.findIndex((s) => s.route !== ordered[ordered.length - 1]?.route);
    ordered.push(...rest.splice(i < 0 ? 0 : i, 1));
  }

  const usedKinds: string[] = [];
  return ordered.map((s) => {
    const target = targetDifficulty(state.skills[s.id]?.p ?? 0.15);
    const score = (e: Exercise) => {
      const seen = state.seen[e.id];
      return Math.abs(e.difficulty - target) * 2 + (seen ? Math.min(6, seen.n * 2) : 0) + (usedKinds.includes(e.kind) ? 1.5 : 0) + rnd() * 0.5;
    };
    const best = [...usable.get(s.id)!].map((e) => ({ e, sc: score(e) })).sort((a, b) => a.sc - b.sc)[0].e;
    usedKinds.push(best.kind);
    return best.id;
  });
}
