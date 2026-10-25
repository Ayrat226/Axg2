import type { Exercise, Project, Route, Skill } from '../core/types';
import { pythonRoute } from './python';
import { javascriptRoute } from './javascript';
import { algorithmsRoute } from './algorithms';
import { sqlRoute } from './sql';
import genPython from './generated/python.json' with { type: 'json' };
import genJavascript from './generated/javascript.json' with { type: 'json' };
import genAlgorithms from './generated/algorithms.json' with { type: 'json' };
import genSql from './generated/sql.json' with { type: 'json' };

// Model-drafted exercises (tag `ai`) that passed execution validation and cross-model review in scripts/ai/generate.ts;
// tests/content re-validates them like hand-written ones.
const GENERATED: Record<string, Exercise[]> = {
  python: genPython as unknown as Exercise[],
  javascript: genJavascript as unknown as Exercise[],
  algorithms: genAlgorithms as unknown as Exercise[],
  sql: genSql as unknown as Exercise[],
};

export const ROUTES: Route[] = [pythonRoute, javascriptRoute, algorithmsRoute, sqlRoute].map((r) => ({
  ...r,
  exercises: [...r.exercises, ...(GENERATED[r.id] ?? [])],
}));
export const ALL_SKILLS: Skill[] = ROUTES.flatMap((r) => r.skills);
export const ALL_EXERCISES: Exercise[] = ROUTES.flatMap((r) => r.exercises);
export const ALL_PROJECTS: Project[] = ROUTES.flatMap((r) => r.projects);

export const SKILL_BY_ID = new Map(ALL_SKILLS.map((s) => [s.id, s]));
export const EXERCISE_BY_ID = new Map(ALL_EXERCISES.map((e) => [e.id, e]));
export const ROUTE_BY_ID = new Map(ROUTES.map((r) => [r.id, r]));

export function exercisesForSkill(skillId: string): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.skill === skillId);
}
