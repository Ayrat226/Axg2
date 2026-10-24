// Learner model: Bayesian Knowledge Tracing per skill with graded (soft) evidence,
// mastery that requires varied independent evidence, and delayed mastery checks.
import type { ExerciseKind } from './types';
import { DAY, gradeFrom, retrievability, review, type MemoryState } from './srs';

export type Confidence = 'sure' | 'unsure' | 'guess';
export type EvidenceSource = 'practice' | 'diagnostic' | 'review' | 'check' | 'project';

export interface Evidence {
  t: number;
  ex: string;
  kind: ExerciseKind;
  correct: boolean;
  hints: number;
  revealed: boolean;
  confidence?: Confidence;
  source: EvidenceSource;
  ms?: number;
}

export interface SkillState {
  p: number;
  evidence: Evidence[];
  lessonAt?: number;
  masteredAt?: number;
  durableAt?: number;
  /** Timestamp of the next delayed mastery check (undefined = none pending). */
  checkDue?: number;
  /** Delayed checks passed so far (0..CHECK_DELAYS.length). */
  checkStage: number;
  mem?: MemoryState;
  /** Learner said "I already know this" — treated as a hypothesis until verified. */
  claimedKnown?: boolean;
  diagP?: number;
  diagAt?: number;
}

export type SkillStatus = 'new' | 'learning' | 'probable' | 'mastered' | 'durable' | 'rusty';

export const STATUS_INFO: Record<SkillStatus, { label: string; color: string; desc: string }> = {
  new: { label: 'Не начато', color: 'var(--st-new)', desc: 'Ещё нет данных.' },
  learning: { label: 'Изучаю', color: 'var(--st-learning)', desc: 'Есть попытки, но мастерство не доказано.' },
  probable: { label: 'Вероятно знаю', color: 'var(--st-probable)', desc: 'По диагностике или вашей оценке; нужно подтвердить задачей.' },
  mastered: { label: 'Освоено', color: 'var(--st-mastered)', desc: 'Несколько самостоятельных решений разных типов.' },
  durable: { label: 'Закреплено', color: 'var(--st-durable)', desc: 'Пройдена отсроченная проверка спустя неделю и больше.' },
  rusty: { label: 'Пора освежить', color: 'var(--st-rusty)', desc: 'Вероятность вспомнить упала — нужна практика.' },
};

export const CHECK_DELAYS_DAYS = [7, 30, 90];
const SLIP = 0.1;
const TRANSIT = 0.1;
export const GUESS: Record<ExerciseKind, number> = { mcq: 0.25, predict: 0.05, code: 0.03, fix: 0.08, parsons: 0.15, explain: 0.3 };
/** Kinds that require producing an answer (recall/application), not just recognising one. */
export const RECALL_KINDS: ExerciseKind[] = ['code', 'fix', 'predict'];

export const newSkillState = (p = 0.15): SkillState => ({ p, evidence: [], checkStage: 0 });

/** How much an observation should move the estimate: hints, revealed solutions and guesses count less. */
export function evidenceWeight(e: Pick<Evidence, 'kind' | 'correct' | 'hints' | 'revealed' | 'confidence'>): number {
  let w = 1;
  if (e.kind === 'explain') w *= 0.4; // self-assessed
  if (e.correct) {
    w *= Math.max(0.25, 1 - 0.25 * e.hints);
    if (e.confidence === 'guess') w *= 0.5;
  }
  return w;
}

export function bktPosterior(p: number, correct: boolean, guess: number, slip = SLIP): number {
  const num = correct ? p * (1 - slip) : p * slip;
  const den = correct ? num + (1 - p) * guess : num + (1 - p) * (1 - guess);
  return den === 0 ? p : num / den;
}

export function isIndependent(e: Evidence): boolean {
  return e.correct && e.hints === 0 && !e.revealed && e.confidence !== 'guess' && e.kind !== 'explain';
}

export function masteryReached(s: SkillState, threshold: number): boolean {
  if (s.p < threshold) return false;
  const indep = s.evidence.filter((e) => isIndependent(e) && e.source !== 'diagnostic');
  const diagIndep = s.evidence.filter((e) => isIndependent(e) && e.source === 'diagnostic');
  const all = [...indep, ...diagIndep];
  return (
    indep.length >= 1 &&
    all.length >= 3 &&
    all.some((e) => RECALL_KINDS.includes(e.kind)) &&
    new Set(all.map((e) => e.kind)).size >= 2
  );
}

export interface ApplyOptions {
  now: number;
  masteryThreshold: number;
  retention: number;
}

export function applyEvidence(prev: SkillState, raw: Omit<Evidence, 't'>, o: ApplyOptions): SkillState {
  const e: Evidence = { ...raw, correct: raw.correct && !raw.revealed, t: o.now };
  const s: SkillState = { ...prev, evidence: [...prev.evidence, e].slice(-40) };
  const post = bktPosterior(prev.p, e.correct, Math.max(GUESS[e.kind], e.confidence === 'guess' ? 0.5 : 0));
  let p = prev.p + evidenceWeight(e) * (post - prev.p);
  if (e.source !== 'diagnostic' && e.source !== 'check') p = p + (1 - p) * TRANSIT * (e.correct ? 1 : 0.5);
  s.p = Math.min(0.995, Math.max(0.005, p));

  if (e.source !== 'diagnostic') {
    s.mem = review(prev.mem, gradeFrom(e.correct, e.hints, e.revealed, e.confidence, e.ms), o.now, o.retention);
  }
  if (e.source === 'check') return applyCheck(s, e.correct, o.now);
  if (!s.masteredAt && masteryReached(s, o.masteryThreshold)) {
    s.masteredAt = o.now;
    s.checkStage = 0;
    s.checkDue = o.now + CHECK_DELAYS_DAYS[0] * DAY;
  }
  return s;
}

/** A delayed check confirms durable mastery; failing it reopens the skill instead of hiding the gap. */
export function applyCheck(s: SkillState, passed: boolean, now: number): SkillState {
  if (passed) {
    const stage = s.checkStage + 1;
    return {
      ...s,
      checkStage: stage,
      durableAt: s.durableAt ?? now,
      checkDue: stage < CHECK_DELAYS_DAYS.length ? now + CHECK_DELAYS_DAYS[stage] * DAY : undefined,
    };
  }
  return { ...s, p: Math.min(s.p, 0.6), masteredAt: undefined, durableAt: undefined, checkDue: undefined, checkStage: 0 };
}

export function skillStatus(s: SkillState | undefined, now: number): SkillStatus {
  if (!s) return 'new';
  const fading = s.mem ? retrievability(s.mem, now) < 0.7 : false;
  if (s.durableAt) return fading ? 'rusty' : 'durable';
  if (s.masteredAt) return fading ? 'rusty' : 'mastered';
  const practised = s.evidence.some((e) => e.source !== 'diagnostic');
  if ((s.diagP !== undefined && s.diagP >= 0.8 && !practised) || (s.claimedKnown && !practised)) return 'probable';
  if (s.evidence.length || s.lessonAt) return 'learning';
  return 'new';
}

export const isDone = (st: SkillStatus) => st === 'mastered' || st === 'durable' || st === 'probable' || st === 'rusty';

export interface SkillMetrics {
  attempts: number;
  correct: number;
  independent: number;
  hinted: number;
  revealed: number;
}

export function metricsOf(s: SkillState | undefined): SkillMetrics {
  const ev = s?.evidence ?? [];
  return {
    attempts: ev.length,
    correct: ev.filter((e) => e.correct).length,
    independent: ev.filter(isIndependent).length,
    hinted: ev.filter((e) => e.hints > 0).length,
    revealed: ev.filter((e) => e.revealed).length,
  };
}
