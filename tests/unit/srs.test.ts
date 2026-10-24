import { describe, expect, it } from 'vitest';
import { review, retrievability, intervalDays, gradeFrom, DAY } from '../../src/core/srs';

describe('FSRS-lite', () => {
  it('R(S) = 0.9 by construction', () => {
    const mem = { s: 10, d: 5, last: 0, due: 0, reps: 1, lapses: 0 };
    expect(retrievability(mem, 10 * DAY)).toBeCloseTo(0.9, 5);
    expect(retrievability(mem, 0)).toBe(1);
  });
  it('higher target retention → shorter intervals', () => {
    expect(intervalDays(10, 0.95)).toBeLessThan(intervalDays(10, 0.85));
    expect(intervalDays(10, 0.9)).toBe(10);
  });
  it('successful reviews grow stability; lapses shrink it and return the item soon', () => {
    let m = review(undefined, 3, 0);
    const s1 = m.s;
    m = review(m, 3, m.due);
    expect(m.s).toBeGreaterThan(s1);
    const lapse = review(m, 1, m.due);
    expect(lapse.s).toBeLessThan(m.s);
    expect(lapse.lapses).toBe(1);
    expect(lapse.due - m.due).toBeLessThan(DAY);
  });
  it('grades from outcomes', () => {
    expect(gradeFrom(false, 0, false)).toBe(1);
    expect(gradeFrom(true, 0, true)).toBe(1);
    expect(gradeFrom(true, 1, false)).toBe(2);
    expect(gradeFrom(true, 0, false)).toBe(3);
    expect(gradeFrom(true, 0, false, 'sure', 5000)).toBe(4);
  });
});
