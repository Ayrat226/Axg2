import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { contrastRatio, isHex, themeContrast } from '../../src/core/color';
import { explainError, formatTerm, shape } from '../../src/core/feedback';
import {
  DEFAULT_CUSTOM_THEME, DEFAULT_SETTINGS, MAX_USER_PRESETS, analogyMode, countUserPresetChanges, createUserPreset, mergeSettings, normalizeSettings,
  parseUserPreset, serializeUserPreset, userPresetPatch, type SettingsPatch,
} from '../../src/core/settings';
import { SETTINGS_INDEX, searchSettings } from '../../src/ui/screens/settingsIndex';

const err = { type: 'IndexError', message: 'list index out of range', line: 3, traceback: '' };
const e = explainError(err, 'python', 'a = [1]\nprint(a[5])');

describe('backward-compatible settings', () => {
  it('fills new fields for settings saved before they existed', () => {
    const old = structuredClone(DEFAULT_SETTINGS) as unknown as Record<string, Record<string, unknown>>;
    for (const k of ['customTheme', 'glass', 'cornerScale', 'cardShadow']) delete old.appearance[k];
    for (const k of ['analogyStyle', 'maxHints']) delete old.learning[k];
    for (const k of ['termsStyle', 'socraticDelay']) delete old.feedback[k];
    delete (old as Record<string, unknown>).userPresets;
    old.appearance.theme = 'terminal';
    old.learning.sessionSize = 9;
    const s = normalizeSettings(old);
    expect(s.appearance.theme).toBe('terminal');
    expect(s.learning.sessionSize).toBe(9);
    expect(s.appearance.customTheme).toEqual(DEFAULT_CUSTOM_THEME);
    expect(s.appearance.glass).toBe('theme');
    expect(s.appearance.cardShadow).toBe(true);
    expect(s.learning.analogyStyle).toBe('everyday');
    expect(s.learning.maxHints).toBe(5);
    expect(s.feedback.termsStyle).toBe('ru+en');
    expect(s.feedback.socraticDelay).toBe(false);
    expect(s.userPresets).toEqual([]);
  });

  it('accepts empty or garbage input', () => {
    expect(normalizeSettings(undefined)).toEqual(DEFAULT_SETTINGS);
    expect(normalizeSettings('x').userPresets).toEqual([]);
  });

  it('deep-merges a partial custom theme and keeps arrays whole', () => {
    const m = mergeSettings(DEFAULT_SETTINGS, { appearance: { customTheme: { bg: '#111111' } } } as SettingsPatch);
    expect(m.appearance.customTheme.bg).toBe('#111111');
    expect(m.appearance.customTheme.text).toBe(DEFAULT_CUSTOM_THEME.text);
    const p = createUserPreset(DEFAULT_SETTINGS, { title: 'A', icon: '⭐', id: 'a' });
    expect(mergeSettings(DEFAULT_SETTINGS, { userPresets: [p] }).userPresets).toEqual([p]);
  });

  it('repairs an invalid custom theme without losing the rest of the section', () => {
    const s = normalizeSettings({ appearance: { theme: 'custom', accent: '#112233', customTheme: { bg: 'red' } } });
    expect(s.appearance.accent).toBe(DEFAULT_SETTINGS.appearance.accent); // the whole broken section is reset
    expect(s.learning).toEqual(DEFAULT_SETTINGS.learning);
  });

  it('drops invalid and duplicate user presets', () => {
    const good = createUserPreset(DEFAULT_SETTINGS, { title: 'Good', icon: '🚀', id: 'g' });
    const s = normalizeSettings({ userPresets: [good, good, { id: 'x' }, 7, { ...good, id: 'y', title: '' }] });
    expect(s.userPresets.map((p) => p.id)).toEqual(['g']);
    const many = Array.from({ length: MAX_USER_PRESETS + 5 }, (_, i) => ({ ...good, id: `p${i}` }));
    expect(normalizeSettings({ userPresets: many }).userPresets).toHaveLength(MAX_USER_PRESETS);
  });
});

describe('user profiles', () => {
  const tuned = mergeSettings(DEFAULT_SETTINGS, { appearance: { theme: 'sakura' }, learning: { sessionSize: 11 }, feedback: { tone: 'socratic' } });

  it('snapshots only chosen sections and never itself', () => {
    const p = createUserPreset(tuned, { title: '  Вечер  ', icon: '🌙', sections: ['appearance', 'feedback'], id: 'v' });
    expect(p.title).toBe('Вечер');
    expect(Object.keys(p.settings).sort()).toEqual(['appearance', 'feedback']);
    expect(JSON.stringify(p)).not.toContain('userPresets');
    const all = createUserPreset(tuned, { title: 'Всё', icon: '⭐' });
    expect(Object.keys(all.settings)).not.toContain('userPresets');
  });

  it('applies through merge and reports differences', () => {
    const p = createUserPreset(tuned, { title: 'T', icon: '⭐', sections: ['learning'], id: 't' });
    expect(countUserPresetChanges(p, tuned)).toBe(0);
    expect(countUserPresetChanges(p, DEFAULT_SETTINGS)).toBe(1);
    const applied = normalizeSettings(mergeSettings(DEFAULT_SETTINGS, userPresetPatch(p)));
    expect(applied.learning.sessionSize).toBe(11);
    expect(applied.appearance.theme).toBe(DEFAULT_SETTINGS.appearance.theme);
  });

  it('round-trips through export/import', () => {
    const p = createUserPreset(tuned, { title: 'Туда-обратно', icon: '🎧', id: 'r' });
    const res = parseUserPreset(serializeUserPreset(p), 'new-id');
    expect(res.ok).toBe(true);
    if (res.ok) {
      expect(res.preset.id).toBe('new-id');
      expect(res.preset.title).toBe('Туда-обратно');
      expect(normalizeSettings(mergeSettings(DEFAULT_SETTINGS, userPresetPatch(res.preset))).appearance.theme).toBe('sakura');
    }
  });

  it('rejects malformed imports', () => {
    const bad = (x: unknown) => parseUserPreset(typeof x === 'string' ? x : JSON.stringify(x));
    expect(bad('not json').ok).toBe(false);
    expect(bad({ kind: 'other' }).ok).toBe(false);
    expect(bad({ kind: 'learnlab-profile', title: '', settings: { learning: {} } }).ok).toBe(false);
    expect(bad({ kind: 'learnlab-profile', title: 'x', settings: { learning: { sessionSize: 999 } } }).ok).toBe(false);
    expect(bad({ kind: 'learnlab-profile', title: 'x', settings: { unknown: { a: 1 } } }).ok).toBe(false);
    expect(parseUserPreset('x'.repeat(70_000)).ok).toBe(false);
  });

  it('drops unknown keys and sections but keeps valid ones', () => {
    const res = parseUserPreset(JSON.stringify({ kind: 'learnlab-profile', title: 'ok', settings: { learning: { sessionSize: 7, evil: 1 }, userPresets: [1], bogus: {} } }));
    expect(res.ok).toBe(true);
    if (res.ok) expect(res.preset.settings).toEqual({ learning: { sessionSize: 7 } });
  });
});

describe('contrast', () => {
  it('matches known WCAG values', () => {
    expect(contrastRatio('#000000', '#ffffff')).toBeCloseTo(21, 0);
    expect(contrastRatio('#777777', '#ffffff')).toBeCloseTo(4.48, 1);
    expect(isHex('#abcdef')).toBe(true);
    expect(isHex('abc')).toBe(false);
  });
  it('flags low-contrast pairs', () => {
    const ok = themeContrast(DEFAULT_CUSTOM_THEME, '#7c5cff');
    expect(ok.filter((c) => c.id !== 'accent-bg').every((c) => c.ok)).toBe(true);
    const bad = themeContrast({ ...DEFAULT_CUSTOM_THEME, text: '#2a2f45' }, '#7c5cff');
    expect(bad.find((c) => c.id === 'text-bg')!.ok).toBe(false);
  });
});

describe('explanation personalisation (shape)', () => {
  const base = { depth: 'standard', tone: 'friendly', showTerms: true } as const;
  it('formats terms by style', () => {
    const t = { ru: 'индекс', en: 'index' };
    expect(formatTerm(t, 'ru')).toBe('индекс');
    expect(formatTerm(t, 'ru+en')).toBe('индекс — index');
    expect(formatTerm(t, 'en-first')).toBe('index — индекс');
    expect(formatTerm(t)).toBe('индекс — index');
  });
  it('applies terms style and hides terms when disabled', () => {
    expect(shape(e, { ...base, termsStyle: 'en-first' }).termLabel).toMatch(/^[A-Za-z]/);
    expect(shape(e, { ...base, termsStyle: 'ru' }).termLabel).not.toMatch(/ — /);
    expect(shape(e, { ...base, showTerms: false, termsStyle: 'ru' }).termLabel).toBeUndefined();
  });
  it('gates the explanation behind the questions only when asked and when questions exist', () => {
    expect(shape(e, base).gated).toBe(false);
    const gated = shape(e, { ...base, socraticDelay: true });
    expect(gated.gated).toBe(true);
    expect(gated.questions.length).toBeGreaterThan(0);
    expect(shape({ ...e, questions: [] }, { ...base, socraticDelay: true }).gated).toBe(false);
  });
});

describe('analogy mode', () => {
  it('lets the legacy switch win', () => {
    expect(analogyMode({ showAnalogies: false, analogyStyle: 'visual' })).toBe('none');
    expect(analogyMode({ showAnalogies: true, analogyStyle: 'visual' })).toBe('visual');
  });
});

describe('settings search', () => {
  it('finds settings by label, hint and keyword, ё-insensitive', () => {
    expect(searchSettings('шрифт кода')[0].label).toBe('Шрифт кода');
    expect(searchSettings('тайм-аут')[0].label).toBe('Тайм-аут выполнения');
    expect(searchSettings('подсказ').some((x) => x.label === 'Максимум подсказок на задание')).toBe(true);
    expect(searchSettings('ключ').some((x) => x.tab === 'ai')).toBe(true);
    expect(searchSettings('ПОЛНОЧЬ')[0].tab).toBe('appearance');
    expect(searchSettings('zzzzqq')).toEqual([]);
    expect(searchSettings('  ')).toEqual([]);
  });
  it('index labels exist in the UI sources (no drift)', () => {
    const src = ['src/ui/screens/Settings.tsx', 'src/ui/components/AiSettings.tsx', 'src/ui/components/CustomThemeEditor.tsx', 'src/ui/components/UserProfiles.tsx']
      .map((f) => readFileSync(f, 'utf8')).join('\n');
    const missing = SETTINGS_INDEX.filter((x) => !src.includes(`label="${x.label}"`) && !src.includes(`title="${x.label}"`));
    expect(missing.map((x) => x.label)).toEqual([]);
  });
});
