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

export function mergeSettings(base: Settings, patch: SettingsPatch): Settings {
  const out = structuredClone(base) as unknown as Record<string, Record<string, unknown>>;
  for (const [section, values] of Object.entries(patch)) {
    if (!values) continue;
    out[section] = { ...out[section], ...(values as Record<string, unknown>) };
  }
  return out as unknown as Settings;
}

/** Fill missing keys from defaults (forward-compatible loads) and drop invalid values. */
export function normalizeSettings(raw: unknown): Settings {
  const merged = mergeSettings(DEFAULT_SETTINGS, (raw ?? {}) as SettingsPatch);
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
