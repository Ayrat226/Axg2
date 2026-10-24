// Simplified FSRS (Free Spaced Repetition Scheduler, v4.5 formulas and default weights,
// https://github.com/open-spaced-repetition/fsrs4anki/wiki/The-Algorithm). Scheduling is per *skill*:
// each review draws a fresh exercise, so learners practise applying the skill, not recalling one card.

export type Grade = 1 | 2 | 3 | 4; // again, hard, good, easy

export interface MemoryState {
  /** Stability in days: interval at which recall probability drops to 90 %. */
  s: number;
  /** Difficulty 1..10. */
  d: number;
  last: number;
  due: number;
  reps: number;
  lapses: number;
}

const W = [0.4872, 1.4003, 3.7145, 13.8206, 5.1618, 1.2298, 0.8975, 0.031, 1.6474, 0.1367, 1.0461, 2.1072, 0.0793, 0.3246, 1.587, 0.2272, 2.8755];
const DECAY = -0.5;
const FACTOR = 19 / 81; // ensures R(S) = 0.9
export const DAY = 86_400_000;

const clampD = (d: number) => Math.min(10, Math.max(1, d));

export function retrievability(mem: MemoryState, now: number): number {
  const t = Math.max(0, (now - mem.last) / DAY);
  return Math.pow(1 + (FACTOR * t) / mem.s, DECAY);
}

export function intervalDays(s: number, retention: number): number {
  const days = (s / FACTOR) * (Math.pow(retention, 1 / DECAY) - 1);
  return Math.min(365, Math.max(1, Math.round(days)));
}

const initD = (g: Grade) => clampD(W[4] - (g - 3) * W[5]);

export function review(mem: MemoryState | undefined, g: Grade, now: number, retention = 0.9): MemoryState {
  if (!mem) {
    const s = W[g - 1];
    const d = initD(g);
    return { s, d, last: now, due: now + intervalDays(s, retention) * DAY, reps: 1, lapses: g === 1 ? 1 : 0 };
  }
  const r = retrievability(mem, now);
  const d0 = clampD(mem.d - W[6] * (g - 3));
  const d = clampD(W[7] * initD(3) + (1 - W[7]) * d0);
  let s: number;
  if (g === 1) {
    s = W[11] * Math.pow(mem.d, -W[12]) * (Math.pow(mem.s + 1, W[13]) - 1) * Math.exp(W[14] * (1 - r));
    s = Math.min(s, mem.s);
  } else {
    const hard = g === 2 ? W[15] : 1;
    const easy = g === 4 ? W[16] : 1;
    s = mem.s * (1 + Math.exp(W[8]) * (11 - mem.d) * Math.pow(mem.s, -W[9]) * (Math.exp(W[10] * (1 - r)) - 1) * hard * easy);
  }
  s = Math.max(0.1, s);
  // Failed items come back the same day (short relearning step) rather than after a full interval.
  const due = g === 1 ? now + 10 * 60_000 : now + intervalDays(s, retention) * DAY;
  return { s, d, last: now, due, reps: mem.reps + 1, lapses: mem.lapses + (g === 1 ? 1 : 0) };
}

export function gradeFrom(
  correct: boolean,
  hints: number,
  revealed: boolean,
  confidence?: 'sure' | 'unsure' | 'guess',
  ms?: number,
): Grade {
  if (!correct || revealed) return 1;
  if (hints > 0 || confidence === 'guess' || confidence === 'unsure') return 2;
  return confidence === 'sure' && ms !== undefined && ms < 30_000 ? 4 : 3;
}
