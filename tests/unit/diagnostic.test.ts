import { describe, expect, it } from 'vitest';
import { answerQuestion, diagnosticResult, nextQuestion, startDiagnostic, priorFor } from '../../src/core/diagnostic';
import { CHAIN, POOL } from './fixtures';

function simulate(knows: Set<string>, level: 0 | 1 | 2 | 3 = 1) {
  let st = startDiagnostic('t', CHAIN, level, 'standard', 0);
  let q;
  let guard = 0;
  while ((q = nextQuestion(st, CHAIN, POOL)) && guard++ < 50) {
    st = answerQuestion(st, CHAIN, { ex: q.id, skill: q.skill, kind: q.kind, correct: knows.has(q.skill), dontKnow: false });
  }
  return { st, res: diagnosticResult(st, CHAIN) };
}

describe('adaptive diagnostic', () => {
  it('priors decrease with tier and increase with self-reported level', () => {
    expect(priorFor(1, 1)).toBeGreaterThan(priorFor(1, 3));
    expect(priorFor(3, 1)).toBeGreaterThan(priorFor(0, 1));
  });
  it('first question targets an informative (central) skill, not a leaf', () => {
    const st = startDiagnostic('t', CHAIN, 1, 'standard', 0);
    const q = nextQuestion(st, CHAIN, POOL)!;
    expect(['t.b', 't.c', 't.a']).toContain(q.skill);
  });
  it('an expert is classified as knowing everything in fewer questions than the cap', () => {
    const { st, res } = simulate(new Set(CHAIN.map((s) => s.id)), 2);
    expect(res.skills.every((r) => r.verdict === 'known')).toBe(true);
    expect(st.answers.length).toBeLessThan(st.maxQuestions);
    expect(res.start).toBeNull();
  });
  it('never stops before the minimum number of questions while items remain', () => {
    const { st } = simulate(new Set(CHAIN.map((s) => s.id)), 3);
    expect(st.answers.length).toBeGreaterThanOrEqual(Math.min(6, POOL.filter((e) => e.diag).length));
  });
  it('a novice gets gaps and the start point is the root', () => {
    const { res } = simulate(new Set(), 1);
    expect(res.skills.filter((r) => r.verdict === 'gap').length).toBeGreaterThanOrEqual(4);
    expect(res.start).toBe('t.a');
  });
  it('partial knowledge: knows a,b but not c,d,e → starts at a gap whose prerequisites are known', () => {
    const { res } = simulate(new Set(['t.a', 't.b']), 1);
    const v = Object.fromEntries(res.skills.map((r) => [r.skill, r.verdict]));
    expect(v['t.a']).toBe('known');
    expect(v['t.b']).toBe('known');
    expect(v['t.d']).toBe('gap');
    expect(v['t.e']).not.toBe('known');
    expect(['t.c', 't.e']).toContain(res.start);
  });
  it('"не знаю" is strong negative evidence and propagates to dependents', () => {
    let st = startDiagnostic('t', CHAIN, 2, 'standard', 0);
    const before = st.p['t.d'];
    st = answerQuestion(st, CHAIN, { ex: 't.b.1', skill: 't.b', kind: 'mcq', correct: false, dontKnow: true });
    expect(st.p['t.b']).toBeLessThan(0.1);
    expect(st.p['t.d']).toBeLessThan(before);
  });
  it('a correct guess counts less than a confident correct answer', () => {
    const st = startDiagnostic('t', CHAIN, 1, 'standard', 0);
    const sure = answerQuestion(st, CHAIN, { ex: 't.b.1', skill: 't.b', kind: 'mcq', correct: true, dontKnow: false, confidence: 'sure' });
    const guess = answerQuestion(st, CHAIN, { ex: 't.b.1', skill: 't.b', kind: 'mcq', correct: true, dontKnow: false, confidence: 'guess' });
    expect(guess.p['t.b']).toBeLessThan(sure.p['t.b']);
  });
  it('results explain inferred verdicts', () => {
    const { res } = simulate(new Set(['t.a', 't.b', 't.c', 't.d', 't.e']), 1);
    expect(res.skills.every((r) => r.reasons.length > 0)).toBe(true);
  });
});
