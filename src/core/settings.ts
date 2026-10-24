import { z } from 'zod';

export const GOALS = ['quick', 'systematic', 'interview', 'project', 'refresh'] as const;
export type GoalMode = (typeof GOALS)[number];

export const GOAL_INFO: Record<GoalMode, { title: string; icon: string; desc: string }> = {
  quick: { title: 'Быстро познакомиться', icon: '⚡', desc: 'Краткие объяснения, меньше задач, акцент на главном.' },
  systematic: { title: 'Системно изучить', icon: '🧱', desc: 'Полные объяснения, все типы задач, отсроченные проверки мастерства.' },
  interview: { title: 'Подготовка к собеседованию', icon: '🎯', desc: 'Темы с собеседований, задачи на код и объяснение решений.' },
  project: { title: 'Создать проект', icon: '🛠️', desc: 'Минимум теории до старта проекта, обучение через шаги проекта.' },
  refresh: { title: 'Освежить забытое', icon: '🔁', desc: 'Диагностика и повторение, без повторного прохождения известного.' },
};

export const THEMES = ['system', 'dark', 'light', 'midnight', 'paper', 'terminal', 'sakura', 'contrast'] as const;
/** Themes selectable in settings: the built-in ones plus the user's own palette. */
export const ALL_THEMES = [...THEMES, 'custom'] as const;
export type ThemeId = (typeof ALL_THEMES)[number];
export const THEME_INFO: Record<ThemeId, string> = {
  system: 'Как в системе',
  dark: 'Тёмная',
  light: 'Светлая',
  midnight: 'Полночь',
  paper: 'Бумага',
  terminal: 'Терминал',
  sakura: 'Сакура',
  contrast: 'Высокий контраст',
  custom: 'Своя тема',
};

export const WIDGETS = ['continue', 'plan', 'routes', 'constellation', 'reviews', 'mistakes', 'metrics', 'week'] as const;
export type WidgetId = (typeof WIDGETS)[number];
export const WIDGET_INFO: Record<WidgetId, string> = {
  continue: 'Продолжить обучение',
  plan: 'План на сегодня',
  routes: 'Маршруты',
  constellation: 'Созвездие навыков',
  reviews: 'Повторение',
  mistakes: 'Работа над ошибками',
  metrics: 'Показатели обучения',
  week: 'Неделя',
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const customThemeSchema = z.object({ bg: hex, surface: hex, text: hex, dim: hex, border: hex, code: hex });
export type CustomTheme = z.infer<typeof customThemeSchema>;

export const MAX_USER_PRESETS = 24;
export const userPresetSchema = z.object({
  id: z.string().min(1).max(40),
  title: z.string().trim().min(1).max(40),
  icon: z.string().min(1).max(8),
  /** Snapshot of the chosen sections (never includes userPresets). */
  settings: z.record(z.string(), z.record(z.string(), z.unknown())),
});
export type UserPreset = z.infer<typeof userPresetSchema>;
export const PRESET_SECTIONS = ['appearance', 'learning', 'feedback', 'editor', 'dashboard'] as const;
export type PresetSection = (typeof PRESET_SECTIONS)[number];
export const SECTION_TITLE: Record<PresetSection, string> = {
  appearance: 'Внешний вид', learning: 'Обучение', feedback: 'Объяснения ошибок', editor: 'Редактор', dashboard: 'Главная',
};

export const settingsSchema = z.object({
  appearance: z.object({
    theme: z.enum(ALL_THEMES),
    accent: hex,
    fontScale: z.number().min(0.8).max(1.5),
    uiFont: z.enum(['system', 'rounded', 'serif', 'readable']),
    codeFont: z.enum(['system-mono', 'consolas', 'courier']),
    density: z.enum(['compact', 'comfortable', 'spacious']),
    radius: z.enum(['sharp', 'rounded', 'soft']),
    motion: z.enum(['full', 'reduced', 'none']),
    background: z.enum(['aurora', 'constellation', 'grid', 'plain']),
    sidebar: z.enum(['expanded', 'collapsed']),
    editorLayout: z.enum(['side', 'stacked']),
    lineHeight: z.number().min(1.3).max(2),
    customTheme: customThemeSchema,
    glass: z.enum(['theme', 'off', 'soft', 'strong']),
    cornerScale: z.number().min(0.5).max(1.6),
    cardShadow: z.boolean(),
  }),
  learning: z.object({
    goal: z.enum(GOALS),
    explanationDepth: z.enum(['brief', 'standard', 'deep']),
    showAnalogies: z.boolean(),
    stepByStepExamples: z.boolean(),
    hintMode: z.enum(['on-request', 'after-fail', 'off']),
    hintAfterFails: z.number().int().min(1).max(5),
    askConfidence: z.boolean(),
    predictBeforeRun: z.boolean(),
    interleave: z.boolean(),
    sessionSize: z.number().int().min(3).max(15),
    dailyMinutes: z.number().int().min(5).max(180),
    newPerDay: z.number().int().min(1).max(6),
    targetRetention: z.number().min(0.75).max(0.97),
    masteryThreshold: z.number().min(0.85).max(0.98),
    diagnosticLength: z.enum(['short', 'standard', 'thorough']),
    celebrate: z.enum(['full', 'subtle', 'off']),
    showTimer: z.boolean(),
    analogyStyle: z.enum(['everyday', 'engineering', 'visual', 'none']),
    maxHints: z.number().int().min(1).max(5),
  }),
  feedback: z.object({
    depth: z.enum(['brief', 'standard', 'deep']),
    tone: z.enum(['friendly', 'neutral', 'socratic']),
    showTraceback: z.boolean(),
    showTerms: z.boolean(),
    autoExplain: z.boolean(),
    termsStyle: z.enum(['ru', 'ru+en', 'en-first']),
    socraticDelay: z.boolean(),
  }),
  editor: z.object({
    fontSize: z.number().int().min(11).max(24),
    tabSize: z.union([z.literal(2), z.literal(4)]),
    lineNumbers: z.boolean(),
    wordWrap: z.boolean(),
    autoClose: z.boolean(),
    highlightLine: z.boolean(),
    runShortcut: z.enum(['mod-enter', 'shift-enter']),
    timeoutSec: z.number().int().min(2).max(20),
  }),
  dashboard: z.object({
    widgets: z.array(z.object({ id: z.enum(WIDGETS), visible: z.boolean() })),
  }),
  userPresets: z.array(userPresetSchema).max(MAX_USER_PRESETS),
});

export type Settings = z.infer<typeof settingsSchema>;

export const DEFAULT_CUSTOM_THEME: CustomTheme = { bg: '#0f1424', surface: '#1a2138', text: '#e8eaf3', dim: '#a3abc4', border: '#3a4466', code: '#0b1020' };

export const DEFAULT_SETTINGS: Settings = {
  appearance: {
    theme: 'system',
    accent: '#7c5cff',
    fontScale: 1,
    uiFont: 'system',
    codeFont: 'system-mono',
    density: 'comfortable',
    radius: 'rounded',
    motion: 'full',
    background: 'aurora',
    sidebar: 'expanded',
    editorLayout: 'side',
    lineHeight: 1.6,
    customTheme: { ...DEFAULT_CUSTOM_THEME },
    glass: 'theme',
    cornerScale: 1,
    cardShadow: true,
  },
  learning: {
    goal: 'systematic',
    explanationDepth: 'standard',
    showAnalogies: true,
    stepByStepExamples: true,
    hintMode: 'on-request',
    hintAfterFails: 2,
    askConfidence: true,
    predictBeforeRun: false,
    interleave: true,
    sessionSize: 6,
    dailyMinutes: 25,
    newPerDay: 2,
    targetRetention: 0.9,
    masteryThreshold: 0.95,
    diagnosticLength: 'standard',
    celebrate: 'subtle',
    showTimer: false,
    analogyStyle: 'everyday',
    maxHints: 5,
  },
  feedback: {
    depth: 'standard',
    tone: 'friendly',
    showTraceback: true,
    showTerms: true,
    autoExplain: true,
    termsStyle: 'ru+en',
    socraticDelay: false,
  },
  editor: {
    fontSize: 14,
    tabSize: 4,
    lineNumbers: true,
    wordWrap: false,
    autoClose: true,
    highlightLine: true,
    runShortcut: 'mod-enter',
    timeoutSec: 6,
  },
  dashboard: { widgets: WIDGETS.map((id) => ({ id, visible: true })) },
  userPresets: [],
};

type DeepPartial<T> = { [K in keyof T]?: T[K] extends object ? (T[K] extends unknown[] ? T[K] : DeepPartial<T[K]>) : T[K] };
export type SettingsPatch = DeepPartial<Settings>;

const isPlain = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);

/** Objects merge recursively, arrays and primitives replace. */
function deepMerge(base: unknown, patch: unknown): unknown {
  if (!isPlain(base) || !isPlain(patch)) return patch === undefined ? base : structuredClone(patch);
  const out: Record<string, unknown> = { ...base };
  for (const [k, v] of Object.entries(patch)) if (v !== undefined) out[k] = deepMerge(base[k], v);
  return out;
}

export function mergeSettings(base: Settings, patch: SettingsPatch): Settings {
  return deepMerge(structuredClone(base), patch) as Settings;
}

const sanitizeUserPresets = (raw: unknown): UserPreset[] => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: UserPreset[] = [];
  for (const item of raw) {
    const r = userPresetSchema.safeParse(item);
    if (r.success && !seen.has(r.data.id) && out.length < MAX_USER_PRESETS) {
      seen.add(r.data.id);
      out.push(r.data);
    }
  }
  return out;
};

/** Fill missing keys from defaults (forward-compatible loads) and drop invalid values. */
export function normalizeSettings(raw: unknown): Settings {
  const input = isPlain(raw) ? { ...raw, userPresets: sanitizeUserPresets(raw.userPresets) } : {};
  const merged = mergeSettings(DEFAULT_SETTINGS, input as SettingsPatch);
  const res = settingsSchema.safeParse(merged);
  if (res.success) {
    const known = new Set(WIDGETS);
    const seen = new Set<string>();
    const widgets = res.data.dashboard.widgets.filter((w) => known.has(w.id) && !seen.has(w.id) && seen.add(w.id));
    for (const id of WIDGETS) if (!seen.has(id)) widgets.push({ id, visible: true });
    return { ...res.data, dashboard: { widgets } };
  }
  // Repair field by field: keep valid sections, reset broken ones.
  const fixed = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, unknown>;
  const shape = settingsSchema.shape as Record<string, z.ZodTypeAny>;
  for (const key of Object.keys(shape)) {
    const r = shape[key].safeParse((merged as unknown as Record<string, unknown>)[key]);
    if (r.success) fixed[key] = r.data;
  }
  return fixed as unknown as Settings;
}

// ---------- user profiles (saved snapshots of settings) ----------

export const newPresetId = (): string => `up-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;

/** Snapshot the chosen sections of the current settings; userPresets is never part of a snapshot. */
export function createUserPreset(
  s: Settings,
  opts: { title: string; icon: string; sections?: readonly PresetSection[]; id?: string },
): UserPreset {
  const sections = opts.sections?.length ? opts.sections : PRESET_SECTIONS;
  const snap: Record<string, Record<string, unknown>> = {};
  for (const sec of sections) snap[sec] = structuredClone(s[sec]) as unknown as Record<string, unknown>;
  return { id: opts.id ?? newPresetId(), title: opts.title.trim().slice(0, 40) || 'Мой профиль', icon: opts.icon || '⭐', settings: snap };
}

export function userPresetPatch(p: UserPreset): SettingsPatch {
  const out: Record<string, unknown> = {};
  for (const sec of PRESET_SECTIONS) if (sec in p.settings) out[sec] = p.settings[sec];
  return out as SettingsPatch;
}
export const userPresetSections = (p: UserPreset): PresetSection[] => PRESET_SECTIONS.filter((k) => k in p.settings);

/** How many values in the snapshot differ from the current settings. */
export function countUserPresetChanges(p: UserPreset, s: Settings): number {
  let n = 0;
  for (const sec of userPresetSections(p)) {
    const cur = s[sec] as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(p.settings[sec])) if (JSON.stringify(cur[k]) !== JSON.stringify(v)) n++;
  }
  return n;
}

const EXPORT_KIND = 'learnlab-profile';
const MAX_IMPORT_CHARS = 60_000;

export const serializeUserPreset = (p: UserPreset): string =>
  JSON.stringify({ kind: EXPORT_KIND, version: 1, title: p.title, icon: p.icon, settings: p.settings }, null, 2);

export type ParsedPreset = { ok: true; preset: UserPreset } | { ok: false; error: string };

/** Validate an imported profile: unknown sections/keys are dropped, invalid values reject the file. */
export function parseUserPreset(text: string, id?: string): ParsedPreset {
  if (text.length > MAX_IMPORT_CHARS) return { ok: false, error: 'Файл слишком большой для профиля.' };
  let raw: unknown;
  try {
    raw = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Это не JSON-файл.' };
  }
  if (!isPlain(raw) || raw.kind !== EXPORT_KIND) return { ok: false, error: 'Это не файл профиля LearnLab.' };
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  if (!title || title.length > 40) return { ok: false, error: 'У профиля нет названия (1–40 символов).' };
  const icon = typeof raw.icon === 'string' && raw.icon.length > 0 && raw.icon.length <= 8 ? raw.icon : '⭐';
  if (!isPlain(raw.settings)) return { ok: false, error: 'В файле нет настроек.' };
  const snap: Record<string, Record<string, unknown>> = {};
  for (const sec of PRESET_SECTIONS) {
    if (!(sec in raw.settings)) continue;
    const shape = settingsSchema.shape[sec] as unknown as z.ZodObject;
    const r = shape.partial().safeParse(raw.settings[sec]);
    if (!r.success) return { ok: false, error: `Раздел «${SECTION_TITLE[sec]}» содержит недопустимые значения.` };
    if (Object.keys(r.data).length) snap[sec] = r.data as Record<string, unknown>;
  }
  if (!Object.keys(snap).length) return { ok: false, error: 'В профиле нет известных настроек.' };
  return { ok: true, preset: { id: id ?? newPresetId(), title, icon, settings: snap } };
}

/** Analogy mode in effect: the legacy on/off switch wins over the style. */
export const analogyMode = (L: Pick<Settings['learning'], 'showAnalogies' | 'analogyStyle'>): Settings['learning']['analogyStyle'] =>
  L.showAnalogies ? L.analogyStyle : 'none';

export interface Preset {
  id: string;
  title: string;
  icon: string;
  desc: string;
  patch: SettingsPatch;
}

export const PRESETS: Preset[] = [
  {
    id: 'novice',
    title: 'Новичок',
    icon: '🌱',
    desc: 'Подробные объяснения, пошаговые примеры, подсказки после ошибки, дружелюбный тон.',
    patch: {
      learning: { explanationDepth: 'standard', stepByStepExamples: true, hintMode: 'after-fail', hintAfterFails: 1, showAnalogies: true, sessionSize: 5 },
      feedback: { depth: 'deep', tone: 'friendly', showTerms: true },
    },
  },
  {
    id: 'practitioner',
    title: 'Практик',
    icon: '⚙️',
    desc: 'Короткие объяснения, подсказки только по запросу, больше задач в сессии.',
    patch: {
      learning: { explanationDepth: 'brief', stepByStepExamples: false, hintMode: 'on-request', sessionSize: 8, showAnalogies: false },
      feedback: { depth: 'brief', tone: 'neutral' },
    },
  },
  {
    id: 'socratic',
    title: 'Сократический',
    icon: '🦉',
    desc: 'Ошибки объясняются наводящими вопросами; предсказание вывода перед запуском.',
    patch: { learning: { predictBeforeRun: true, hintMode: 'on-request' }, feedback: { tone: 'socratic', depth: 'standard' } },
  },
  {
    id: 'challenge',
    title: 'Испытание',
    icon: '🔥',
    desc: 'Без подсказок, глубокие объяснения после ответа, высокий порог мастерства.',
    patch: { learning: { hintMode: 'off', masteryThreshold: 0.97, explanationDepth: 'deep', sessionSize: 10 }, feedback: { depth: 'deep' } },
  },
  {
    id: 'focus',
    title: 'Фокус',
    icon: '🎧',
    desc: 'Минимум анимаций и отвлечений, простой фон, компактный интерфейс.',
    patch: { appearance: { motion: 'reduced', background: 'plain', density: 'compact' }, learning: { celebrate: 'off' } },
  },
  {
    id: 'accessible',
    title: 'Доступность',
    icon: '♿',
    desc: 'Крупный шрифт, высокий контраст, удобочитаемый шрифт, без анимаций.',
    patch: {
      appearance: { theme: 'contrast', fontScale: 1.25, uiFont: 'readable', motion: 'none', background: 'plain', lineHeight: 1.8, density: 'spacious' },
      editor: { fontSize: 17, wordWrap: true },
    },
  },
];
