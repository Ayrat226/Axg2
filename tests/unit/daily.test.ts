import { describe, expect, it } from 'vitest';
import { initialState, dayKey } from '../../src/core/state';
import { buildDaily, dailyStatus, dailyDraftKey, readDaily, serializeDaily, DAILY_SIZE, targetDifficulty } from '../../src/core/daily';
import { newSkillState } from '../../src/core/model';
import { stateSchema, validateState } from '../../src/core/storage';
import { ALL_EXERCISES, ALL_SKILLS, EXERCISE_BY_ID, SKILL_BY_ID } from '../../src/content';
import { code, mcq, skill } from './fixtures';

const real = { skills: ALL_SKILLS, exercises: ALL_EXERCISES };
const T = new Date(2026, 5, 15, 10).getTime();
const DAY = 86_400_000;

describe('daily challenge', () => {
  it('is deterministic for the same date and state, and varies by date', () => {
    const s = initialState(T);
    expect(buildDaily(s, T, real, 'python')).toEqual(buildDaily(s, T + 3_600_000, real, 'python'));
    const days = new Set(Array.from({ length: 8 }, (_, i) => buildDaily(s, T + i * DAY, real, 'python').join()));
    expect(days.size).toBeGreaterThan(3);
  });

  it('gives a brand-new learner three tier-1 items, preferring the active route', () => {
    const s = initialState(T);
    for (let i = 0; i < 6; i++) {
      const ids = buildDaily(s, T + i * DAY, real, 'javascript');
      expect(ids).toHaveLength(DAILY_SIZE);
      const skills = ids.map((id) => SKILL_BY_ID.get(EXERCISE_BY_ID.get(id)!.skill)!);
      expect(new Set(skills.map((x) => x.id)).size).toBe(DAILY_SIZE);
      expect(skills.every((x) => x.tier === 1)).toBe(true);
      expect(skills.filter((x) => x.route === 'javascript').length).toBeGreaterThanOrEqual(1);
    }
  });

  it('draws from practised skills first and never repeats a skill', () => {
    const s = initialState(T);
    const touched = ['py.loops', 'py.functions', 'py.lists', 'js.loops'].filter((id) => SKILL_BY_ID.has(id));
    for (const id of touched) s.skills[id] = { ...newSkillState(0.5), lessonAt: T };
    for (let i = 0; i < 5; i++) {
      const ids = buildDaily(s, T + i * DAY, real, 'python');
      const sk = ids.map((id) => EXERCISE_BY_ID.get(id)!.skill);
      expect(new Set(sk).size).toBe(DAILY_SIZE);
      expect(sk.filter((x) => touched.includes(x)).length).toBe(Math.min(DAILY_SIZE, touched.length));
    }
  });

  it('adapts difficulty to the skill estimate and avoids explain items', () => {
    const sk = [skill('t.a'), skill('t.b'), skill('t.c')];
    const pool = sk.flatMap((x) => [mcq(`${x.id}.1`, x.id), code(`${x.id}.2`, x.id, 2), code(`${x.id}.3`, x.id, 3)]);
    const low = initialState(T), high = initialState(T);
    for (const x of sk) { low.skills[x.id] = { ...newSkillState(0.1), lessonAt: 1 }; high.skills[x.id] = { ...newSkillState(0.95), lessonAt: 1 }; }
    const diff = (s: typeof low) => buildDaily(s, T, { skills: sk, exercises: pool }).map((id) => pool.find((e) => e.id === id)!.difficulty);
    expect(diff(low).every((d) => d === 1)).toBe(true);
    expect(diff(high).every((d) => d === 3)).toBe(true);
    expect(targetDifficulty(0.5)).toBe(2);
    expect(buildDaily(initialState(T), T, real).every((id) => EXERCISE_BY_ID.get(id)!.kind !== 'explain')).toBe(true);
  });

  it('works with fewer than three skills in content', () => {
    const sk = [skill('t.a'), skill('t.b')];
    expect(buildDaily(initialState(T), T, { skills: sk, exercises: sk.map((x) => mcq(`${x.id}.1`, x.id)) })).toHaveLength(2);
  });

  it('tracks completion per day through the persisted drafts map', () => {
    const s = initialState(T);
    expect(dailyStatus(s, T)).toMatchObject({ answered: 0, done: false, started: false });
    const key = dayKey(T);
    s.drafts[dailyDraftKey(key)] = serializeDaily({ key, ids: ['a.1', 'a.2', 'a.3'], results: [true, false] });
    expect(dailyStatus(s, T)).toMatchObject({ answered: 2, correct: 1, done: false, started: true });
    s.drafts[dailyDraftKey(key)] = serializeDaily({ key, ids: ['a.1', 'a.2', 'a.3'], results: [true, false, true] });
    expect(dailyStatus(s, T)).toMatchObject({ answered: 3, correct: 2, done: true });
    expect(dailyStatus(s, T + DAY).done).toBe(false);
  });

  it('ignores corrupt pinned data', () => {
    const s = initialState(T);
    for (const bad of ['', '{', '{"ids":1}', '{"ids":[1],"r":[]}', 'null']) {
      s.drafts[dailyDraftKey(dayKey(T))] = bad;
      expect(readDaily(s, dayKey(T))).toBeNull();
      expect(dailyStatus(s, T).done).toBe(false);
    }
  });

  it('survives storage validation (drafts persist; unknown top-level keys would be stripped)', () => {
    const s = initialState(T);
    const key = dayKey(T);
    s.drafts[dailyDraftKey(key)] = serializeDaily({ key, ids: ['a.1'], results: [true] });
    const r = validateState(JSON.parse(JSON.stringify(s)));
    expect(r.ok && dailyStatus(r.state, T).done).toBe(true);
    const stripped = stateSchema.parse({ ...s, daily: { x: 1 } }) as Record<string, unknown>;
    expect('daily' in stripped).toBe(false);
  });
});
