import { describe, expect, it } from 'vitest';
import { initialState } from '../../src/core/state';
import { nextSkill, planDay, pickExercise, dueReviews, plural } from '../../src/core/planner';
import { newSkillState } from '../../src/core/model';
import { CHAIN, POOL } from './fixtures';

const content = { skills: CHAIN, exercises: POOL, projects: [] };

describe('planner', () => {
  it('suggests the diagnostic first for a fresh route', () => {
    const s = initialState(0);
    s.routes.t = { startedAt: 0, goal: 'systematic' };
    const plan = planDay(s, 't', content, 0);
    expect(plan[0].type).toBe('diagnostic');
    expect(plan.every((a) => a.reason.length > 10)).toBe(true);
  });
  it('next skill respects prerequisites', () => {
    const s = initialState(0);
    expect(nextSkill(s, CHAIN, 0)?.id).toBe('t.a');
    s.skills['t.a'] = { ...newSkillState(0.99), masteredAt: 1 };
    expect(['t.b', 't.e']).toContain(nextSkill(s, CHAIN, 2)?.id);
  });
  it('respects new-skills-per-day and the daily time budget', () => {
    const s = initialState(0);
    s.routes.t = { startedAt: 0, goal: 'systematic', diagnosticAt: 1 };
    s.settings.learning.newPerDay = 1;
    const plan = planDay(s, 't', content, 0);
    expect(plan.filter((a) => a.type === 'learn').length).toBe(1);
  });
  it('refresh goal only plans reviews/checks/mistakes', () => {
    const s = initialState(0);
    s.routes.t = { startedAt: 0, goal: 'refresh', diagnosticAt: 1 };
    s.skills['t.a'] = { ...newSkillState(0.9), mem: { s: 1, d: 5, last: 0, due: 10, reps: 1, lapses: 0 } };
    const plan = planDay(s, 't', content, 100);
    expect(plan.map((a) => a.type)).toEqual(['review']);
    expect(dueReviews(s, CHAIN, 100)).toEqual(['t.a']);
  });
  it('checks prefer unseen recall items', () => {
    const s = initialState(0);
    s.seen['t.a.2'] = { n: 1, last: 0, ok: true };
    const e = pickExercise(s, 't.a', POOL, { mode: 'check', now: 0 });
    expect(e?.id).toBe('t.a.3');
  });
  it('practice adapts difficulty to the estimate', () => {
    const s = initialState(0);
    s.skills['t.a'] = newSkillState(0.1);
    expect(pickExercise(s, 't.a', POOL, { mode: 'practice', now: 0 })?.difficulty).toBe(1);
  });
  it('russian plurals', () => {
    expect([1, 2, 5, 11, 21, 22].map((n) => plural(n, 'тема', 'темы', 'тем'))).toEqual(['тема', 'темы', 'тем', 'тем', 'тема', 'темы']);
  });
});
