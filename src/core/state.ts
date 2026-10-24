import type { GoalMode, Settings } from './settings';
import { DEFAULT_SETTINGS } from './settings';
import type { SkillState, Confidence } from './model';
import type { DiagState, SelfLevel } from './diagnostic';

export const STATE_VERSION = 1;

export type MistakeCategory = 'syntax' | 'runtime' | 'logic' | 'edge' | 'concept' | 'output';
export const MISTAKE_INFO: Record<MistakeCategory, { label: string; icon: string }> = {
  syntax: { label: 'Синтаксис', icon: '✏️' },
  runtime: { label: 'Ошибка выполнения', icon: '💥' },
  logic: { label: 'Логика', icon: '🧩' },
  edge: { label: 'Граничный случай', icon: '📐' },
  concept: { label: 'Заблуждение', icon: '💡' },
  output: { label: 'Неверное предсказание', icon: '🔮' },
};

export interface Mistake {
  id: string;
  t: number;
  ex: string;
  skill: string;
  category: MistakeCategory;
  errType?: string;
  misconception?: string;
  note: string;
  resolvedAt?: number;
}

export interface RouteState {
  startedAt: number;
  goal: GoalMode;
  diagnosticAt?: number;
  selfLevel?: SelfLevel;
}

export interface ProjectState {
  step: number;
  code: string;
  startedAt: number;
  completedAt?: number;
  hints: number;
}

export interface DayLog {
  ms: number;
  items: number;
  correct: number;
}

export interface Profile {
  name: string;
  onboarded: boolean;
  activeRoute?: string;
  createdAt: number;
}

export interface SeenInfo {
  n: number;
  last: number;
  ok: boolean;
}

export interface AppState {
  version: number;
  profile: Profile;
  settings: Settings;
  skills: Record<string, SkillState>;
  routes: Record<string, RouteState>;
  mistakes: Mistake[];
  projects: Record<string, ProjectState>;
  drafts: Record<string, string>;
  days: Record<string, DayLog>;
  seen: Record<string, SeenInfo>;
  /** Confidence calibration: [correct, total] per confidence level. */
  calibration: Record<Confidence, [number, number]>;
  diag?: DiagState;
}

export function initialState(now = Date.now()): AppState {
  return {
    version: STATE_VERSION,
    profile: { name: '', onboarded: false, createdAt: now },
    settings: structuredClone(DEFAULT_SETTINGS),
    skills: {},
    routes: {},
    mistakes: [],
    projects: {},
    drafts: {},
    days: {},
    seen: {},
    calibration: { sure: [0, 0], unsure: [0, 0], guess: [0, 0] },
  };
}

export function dayKey(t: number): string {
  const d = new Date(t);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
