import { describe, expect, it } from 'vitest';
import { applyEvidence, applyCheck, bktPosterior, evidenceWeight, masteryReached, newSkillState, skillStatus, CHECK_DELAYS_DAYS, type SkillState } from '../../src/core/model';
import { DAY } from '../../src/core/srs';

const opts = { now: 1_000_000, masteryThreshold: 0.95, retention: 0.9 };
const ev = (kind: 'mcq' | 'code' | 'predict' | 'explain', correct: boolean, extra: object = {}) => ({ ex: `x.${kind}`, kind, correct, hints: 0, revealed: false, source: 'practice' as const, ...extra });

describe('BKT', () => {
  it('correct answers raise and wrong answers lower the estimate', () => {
    expect(bktPosterior(0.5, true, 0.25)).toBeGreaterThan(0.5);
    expect(bktPosterior(0.5, false, 0.25)).toBeLessThan(0.5);
  });
  it('a correct MCQ (guessable) is weaker evidence than correct code', () => {
    expect(bktPosterior(0.3, true, 0.25)).toBeLessThan(bktPosterior(0.3, true, 0.03));
  });
  it('hints, guesses and self-assessment reduce evidence weight', () => {
    expect(evidenceWeight({ kind: 'code', correct: true, hints: 0, revealed: false })).toBe(1);
    expect(evidenceWeight({ kind: 'code', correct: true, hints: 2, revealed: false })).toBe(0.5);
    expect(evidenceWeight({ kind: 'code', correct: true, hints: 0, revealed: false, confidence: 'guess' })).toBe(0.5);
    expect(evidenceWeight({ kind: 'explain', correct: true, hints: 0, revealed: false })).toBeCloseTo(0.4);
  });
  it('very fast correct answers to recognition items are treated as likely guesses', () => {
    expect(evidenceWeight({ kind: 'mcq', correct: true, hints: 0, revealed: false, ms: 900 })).toBe(0.5);
    expect(evidenceWeight({ kind: 'mcq', correct: true, hints: 0, revealed: false, ms: 9000 })).toBe(1);
    expect(evidenceWeight({ kind: 'code', correct: true, hints: 0, revealed: false, ms: 900 })).toBe(1);
  });
  it('revealed solutions count as incorrect', () => {
    const s = applyEvidence(newSkillState(0.5), ev('code', true, { revealed: true }), opts);
    expect(s.p).toBeLessThan(0.5);
    expect(s.evidence[0].correct).toBe(false);
  });
});

describe('mastery', () => {
  it('requires several independent answers of different kinds including recall', () => {
    let s = newSkillState(0.2);
    for (let i = 0; i < 6; i++) s = applyEvidence(s, ev('mcq', true), opts);
    expect(s.p).toBeGreaterThan(0.95);
    expect(s.masteredAt).toBeUndefined(); // only recognition items
    s = applyEvidence(s, ev('code', true), opts);
    expect(s.masteredAt).toBe(opts.now);
    expect(s.checkDue).toBe(opts.now + CHECK_DELAYS_DAYS[0] * DAY);
  });
  it('hinted successes do not produce mastery', () => {
    let s = newSkillState(0.2);
    for (let i = 0; i < 10; i++) s = applyEvidence(s, ev(i % 2 ? 'mcq' : 'code', true, { hints: 1 }), opts);
    expect(masteryReached(s, 0.95)).toBe(false);
  });
  it('delayed check: pass → durable, fail → reopened', () => {
    let s: SkillState = { ...newSkillState(0.97), masteredAt: 1, checkStage: 0, checkDue: 2 };
    const passed = applyCheck(s, true, 10);
    expect(passed.durableAt).toBe(10);
    expect(passed.checkStage).toBe(1);
    expect(passed.checkDue).toBe(10 + CHECK_DELAYS_DAYS[1] * DAY);
    s = applyCheck(passed, false, 20);
    expect(s.masteredAt).toBeUndefined();
    expect(s.durableAt).toBeUndefined();
    expect(s.p).toBeLessThanOrEqual(0.6);
  });
  it('status reflects diagnostic claims until practised', () => {
    expect(skillStatus(undefined, 0)).toBe('new');
    expect(skillStatus({ ...newSkillState(), diagP: 0.9 }, 0)).toBe('probable');
    expect(skillStatus({ ...newSkillState(), claimedKnown: true }, 0)).toBe('probable');
    const practised = applyEvidence({ ...newSkillState(), diagP: 0.9 }, ev('mcq', false), opts);
    expect(skillStatus(practised, opts.now)).toBe('learning');
  });
});
