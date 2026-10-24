import type { Exercise, Project, Route, Skill } from '../core/types';
import { pythonRoute } from './python';
import { javascriptRoute } from './javascript';
import { algorithmsRoute } from './algorithms';
import { sqlRoute } from './sql';

export const ROUTES: Route[] = [pythonRoute, javascriptRoute, algorithmsRoute, sqlRoute];
export const ALL_SKILLS: Skill[] = ROUTES.flatMap((r) => r.skills);
export const ALL_EXERCISES: Exercise[] = ROUTES.flatMap((r) => r.exercises);
export const ALL_PROJECTS: Project[] = ROUTES.flatMap((r) => r.projects);

export const SKILL_BY_ID = new Map(ALL_SKILLS.map((s) => [s.id, s]));
export const EXERCISE_BY_ID = new Map(ALL_EXERCISES.map((e) => [e.id, e]));
export const ROUTE_BY_ID = new Map(ROUTES.map((r) => [r.id, r]));

export function exercisesForSkill(skillId: string): Exercise[] {
  return ALL_EXERCISES.filter((e) => e.skill === skillId);
}
