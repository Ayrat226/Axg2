// Editor for the user's own palette: live preview, WCAG contrast check, base palettes and reset.
import { useEffect, useState } from 'react';
import { isHex, themeContrast } from '../../core/color';
import { DEFAULT_CUSTOM_THEME, type CustomTheme } from '../../core/settings';
import { actions, useApp } from '../../state/store';
import { Section } from './SettingControls';

const FIELDS: { key: keyof CustomTheme; label: string }[] = [
  { key: 'bg', label: 'Фон' },
  { key: 'surface', label: 'Карточки' },
  { key: 'text', label: 'Текст' },
  { key: 'dim', label: 'Приглушённый текст' },
  { key: 'border', label: 'Границы' },
  { key: 'code', label: 'Фон кода' },
];

export const CUSTOM_BASES: Record<string, { title: string; colors: CustomTheme }> = {
  dark: { title: 'Тёмная', colors: { bg: '#0b0d15', surface: '#161a2a', text: '#e8eaf3', dim: '#9aa1b8', border: '#2a3045', code: '#0f1220' } },
  light: { title: 'Светлая', colors: { bg: '#f4f6fb', surface: '#ffffff', text: '#161a2a', dim: '#5b6278', border: '#cdd3e3', code: '#f6f8fc' } },
  paper: { title: 'Бумага', colors: { bg: '#f3ede2', surface: '#fcf9f2', text: '#2c2418', dim: '#6e6250', border: '#d9cfbd', code: '#f7f1e6' } },
  midnight: { title: 'Полночь', colors: { bg: '#050816', surface: '#121b45', text: '#e6ecff', dim: '#a9b6e6', border: '#2c3a78', code: '#070c26' } },
  terminal: { title: 'Терминал', colors: { bg: '#020403', surface: '#0a1a10', text: '#c9ffe1', dim: '#7fcfa3', border: '#1c4a30', code: '#010402' } },
  sakura: { title: 'Сакура', colors: { bg: '#fff4f7', surface: '#ffffff', text: '#3b1d2a', dim: '#7a4a5e', border: '#efc7d6', code: '#fff7fa' } },
};

function ColorField({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  const valid = isHex(draft);
  return (
    <div className="color-field">
      <input type="color" value={value} aria-label={`${label}: выбор цвета`} onChange={(e) => onChange(e.target.value)} />
      <label className="grow small">
        <span style={{ display: 'block', fontWeight: 600 }}>{label}</span>
        <input
          type="text" className="mono" value={draft} maxLength={7} spellCheck={false} autoComplete="off"
          aria-label={`${label}: код цвета`} aria-invalid={!valid}
          onChange={(e) => { setDraft(e.target.value); if (isHex(e.target.value)) onChange(e.target.value.toLowerCase()); }}
          onBlur={() => setDraft(value)}
        />
        {!valid && <span className="tiny" style={{ color: 'var(--err)' }}>⚠ формат #rrggbb</span>}
      </label>
    </div>
  );
}

export function CustomThemeEditor() {
  const a = useApp((s) => s.settings.appearance);
  const t = a.customTheme;
  const set = (patch: Partial<CustomTheme>) => actions().updateSettings({ appearance: { customTheme: { ...t, ...patch } } });
  const checks = themeContrast(t, a.accent);
  const bad = checks.filter((c) => !c.ok);
  const active = a.theme === 'custom';
  return (
    <Section title="Своя тема" sub="шесть цветов + акцент, проверка контраста WCAG AA">
      <div className="grid cols-2" style={{ alignItems: 'start' }}>
        <div className="stack tight" data-testid="custom-theme-fields">
          {FIELDS.map((f) => <ColorField key={f.key} label={f.label} value={t[f.key]} onChange={(v) => set({ [f.key]: v })} />)}
          <div className="row tight">
            <label className="row tight small">
              Взять за основу
              <select
                aria-label="Взять за основу готовую палитру" value=""
                onChange={(e) => { const b = CUSTOM_BASES[e.target.value]; if (b) set({ ...b.colors }); }}
              >
                <option value="">выбрать…</option>
                {Object.entries(CUSTOM_BASES).map(([id, b]) => <option key={id} value={id}>{b.title}</option>)}
              </select>
            </label>
            <button className="btn sm ghost" onClick={() => set({ ...DEFAULT_CUSTOM_THEME })} data-testid="custom-theme-reset">Сбросить цвета</button>
          </div>
          {!active && (
            <button className="btn primary sm" onClick={() => actions().updateSettings({ appearance: { theme: 'custom' } })} data-testid="custom-theme-activate">Включить свою тему</button>
          )}
          {active && <span className="chip ok" data-testid="custom-theme-active">✓ Своя тема включена</span>}
        </div>
        <div className="stack tight">
          <div
            className="custom-preview" data-testid="custom-theme-preview" aria-label="Предпросмотр своей темы" role="img"
            style={{ background: t.bg, color: t.text, borderColor: t.border }}
          >
            <div className="custom-preview-card" style={{ background: t.surface, borderColor: t.border }}>
              <strong>Заголовок карточки</strong>
              <div style={{ color: t.dim }}>Приглушённый пояснительный текст</div>
              <div className="row tight" style={{ marginTop: 6 }}>
                <span className="custom-preview-btn" style={{ background: a.accent }}>Кнопка</span>
                <span style={{ color: a.accent, textDecoration: 'underline' }}>ссылка</span>
              </div>
              <pre className="custom-preview-code" style={{ background: t.code, color: t.text, borderColor: t.border }}>{'def hello():\n    return "Привет"'}</pre>
            </div>
          </div>
          <div className="stack tight" data-testid="contrast-report">
            <strong className="small">Контраст (WCAG AA: текст ≥ 4.5:1, элементы ≥ 3:1)</strong>
            <ul className="small" style={{ margin: 0, paddingLeft: 0, listStyle: 'none' }}>
              {checks.map((c) => (
                <li key={c.id} data-ok={c.ok} className="row tight">
                  <span aria-hidden="true">{c.ok ? '✓' : '⚠'}</span>
                  <span className="grow">{c.label}</span>
                  <span className="mono">{c.ratio.toFixed(1)}:1</span>
                  <span className={`chip ${c.ok ? 'ok' : 'warn'}`}>{c.ok ? 'норма' : `ниже ${c.min}:1`}</span>
                </li>
              ))}
            </ul>
            {bad.length > 0 && <div className="card feedback partial small" role="status" data-testid="contrast-warning">⚠ Сочетаний ниже нормы: {bad.length}. Такой текст будет трудно читать — осветлите текст или затемните фон.</div>}
          </div>
        </div>
      </div>
    </Section>
  );
}
