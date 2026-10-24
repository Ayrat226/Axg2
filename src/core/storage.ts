// Persistence: versioned schema, validation on load, automatic backup of the last good state,
// validated import/export. User code workers never get access to localStorage.
import { z } from 'zod';
import { initialState, STATE_VERSION, type AppState } from './state';
import { normalizeSettings } from './settings';

export const STORAGE_KEY = 'learnlab:state';
export const BACKUP_KEY = 'learnlab:state:backup';

const kind = z.enum(['mcq', 'predict', 'code', 'fix', 'parsons', 'explain']);
const conf = z.enum(['sure', 'unsure', 'guess']);
const num = z.number().finite();

const evidence = z.object({
  t: num, ex: z.string(), kind, correct: z.boolean(), hints: num, revealed: z.boolean(),
  confidence: conf.optional(), source: z.enum(['practice', 'diagnostic', 'review', 'check', 'project']), ms: num.optional(),
});
const mem = z.object({ s: num, d: num, last: num, due: num, reps: num, lapses: num });
const skillState = z.object({
  p: z.number().min(0).max(1), evidence: z.array(evidence), lessonAt: num.optional(), masteredAt: num.optional(),
  durableAt: num.optional(), checkDue: num.optional(), checkStage: num, mem: mem.optional(),
  claimedKnown: z.boolean().optional(), diagP: num.optional(), diagAt: num.optional(),
});
const diagState = z.object({
  route: z.string(), startedAt: num, selfLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]),
  maxQuestions: num, p: z.record(z.string(), num), finished: z.boolean(),
  answers: z.array(z.object({ ex: z.string(), skill: z.string(), kind, correct: z.boolean(), dontKnow: z.boolean(), confidence: conf.optional(), ms: num.optional() })),
});

export const stateSchema = z.object({
  version: z.number().int(),
  profile: z.object({ name: z.string().max(80), onboarded: z.boolean(), activeRoute: z.string().optional(), createdAt: num }),
  settings: z.unknown(),
  skills: z.record(z.string(), skillState),
  routes: z.record(z.string(), z.object({
    startedAt: num, goal: z.enum(['quick', 'systematic', 'interview', 'project', 'refresh']),
    diagnosticAt: num.optional(), selfLevel: z.union([z.literal(0), z.literal(1), z.literal(2), z.literal(3)]).optional(),
  })),
  mistakes: z.array(z.object({
    id: z.string(), t: num, ex: z.string(), skill: z.string(),
    category: z.enum(['syntax', 'runtime', 'logic', 'edge', 'concept', 'output']),
    errType: z.string().optional(), misconception: z.string().optional(), note: z.string(), resolvedAt: num.optional(),
  })),
  projects: z.record(z.string(), z.object({ step: num, code: z.string(), startedAt: num, completedAt: num.optional(), hints: num })),
  drafts: z.record(z.string(), z.string()),
  days: z.record(z.string(), z.object({ ms: num, items: num, correct: num })),
  seen: z.record(z.string(), z.object({ n: num, last: num, ok: z.boolean() })),
  calibration: z.object({ sure: z.tuple([num, num]), unsure: z.tuple([num, num]), guess: z.tuple([num, num]) }),
  diag: diagState.optional(),
});

/** Upgrade older payloads to the current version. */
export function migrate(raw: Record<string, unknown>): Record<string, unknown> {
  const out = { ...raw };
  const v = typeof out.version === 'number' ? out.version : 0;
  if (v < 1) {
    out.version = 1;
    out.calibration ??= { sure: [0, 0], unsure: [0, 0], guess: [0, 0] };
    out.seen ??= {};
    out.drafts ??= {};
  }
  return out;
}

export function validateState(raw: unknown): { ok: true; state: AppState } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'Данные не являются объектом.' };
  const migrated = migrate(raw as Record<string, unknown>);
  if ((migrated.version as number) > STATE_VERSION) return { ok: false, error: 'Данные созданы более новой версией LearnLab.' };
  const res = stateSchema.safeParse({ ...initialState(), ...migrated });
  if (!res.success) {
    const issue = res.error.issues[0];
    return { ok: false, error: `Неверная структура: ${issue.path.join('.')} — ${issue.message}` };
  }
  return { ok: true, state: { ...(res.data as unknown as AppState), settings: normalizeSettings(res.data.settings) } };
}

export interface LoadResult {
  state: AppState;
  notice?: string;
}

export function loadState(storage: Storage): LoadResult {
  const tryKey = (key: string) => {
    const text = storage.getItem(key);
    if (text === null) return null;
    try {
      return validateState(JSON.parse(text));
    } catch {
      return { ok: false as const, error: 'Повреждённый JSON' };
    }
  };
  const main = tryKey(STORAGE_KEY);
  if (main === null) return { state: initialState() };
  if (main.ok) return { state: main.state };
  const backup = tryKey(BACKUP_KEY);
  if (backup?.ok) {
    storage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, storage.getItem(STORAGE_KEY) ?? '');
    return { state: backup.state, notice: `Сохранение было повреждено (${main.error}). Восстановлена резервная копия.` };
  }
  storage.setItem(`${STORAGE_KEY}:corrupt:${Date.now()}`, storage.getItem(STORAGE_KEY) ?? '');
  return { state: initialState(), notice: `Сохранение повреждено и резервной копии нет (${main.error}). Повреждённые данные сохранены отдельно, начат новый профиль.` };
}

let lastBackup = 0;

export function saveState(storage: Storage, state: AppState, now = Date.now()): { ok: true } | { ok: false; error: string } {
  try {
    const text = JSON.stringify(state);
    // Keep the previous good state as a backup, refreshed at most once a minute.
    if (now - lastBackup > 60_000) {
      const prev = storage.getItem(STORAGE_KEY);
      if (prev) storage.setItem(BACKUP_KEY, prev);
      lastBackup = now;
    }
    storage.setItem(STORAGE_KEY, text);
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

export function checksum(text: string): string {
  let h = 2166136261;
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619);
  return (h >>> 0).toString(16).padStart(8, '0');
}

export function exportState(state: AppState, now = Date.now()): string {
  const body = JSON.stringify(state);
  return JSON.stringify({ app: 'learnlab', format: 1, exportedAt: new Date(now).toISOString(), checksum: checksum(body), state: JSON.parse(body) }, null, 2);
}

export interface ImportSummary {
  skills: number;
  evidence: number;
  mistakes: number;
  exportedAt?: string;
  checksumOk: boolean;
}

export function parseImport(text: string): { ok: true; state: AppState; summary: ImportSummary } | { ok: false; error: string } {
  if (text.length > 20_000_000) return { ok: false, error: 'Файл слишком большой.' };
  let doc: unknown;
  try {
    doc = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Файл не является корректным JSON.' };
  }
  const d = doc as { app?: string; state?: unknown; checksum?: string; exportedAt?: string };
  if (d?.app !== 'learnlab' || !d.state) return { ok: false, error: 'Это не файл экспорта LearnLab.' };
  const v = validateState(d.state);
  if (!v.ok) return v;
  const checksumOk = d.checksum === checksum(JSON.stringify(d.state));
  const skills = Object.values(v.state.skills);
  return {
    ok: true,
    state: v.state,
    summary: { skills: skills.length, evidence: skills.reduce((n, s) => n + s.evidence.length, 0), mistakes: v.state.mistakes.length, exportedAt: d.exportedAt, checksumOk },
  };
}
