import { useEffect } from 'react';
import type { Settings } from '../core/settings';
import { useApp, useStore } from '../state/store';
import { setTimeoutSec } from '../runner/runner';
import { isDarkColor } from '../core/color';

const DARK = new Set(['dark', 'midnight', 'terminal', 'contrast']);
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

export function resolvedTheme(theme: Settings['appearance']['theme']): string {
  return theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme;
}
export const isDarkTheme = (theme: Settings['appearance']['theme']) =>
  theme === 'custom' ? isDarkColor(useStore.getState().s.settings.appearance.customTheme.bg) : DARK.has(resolvedTheme(theme));

const BASE_RADIUS = { sharp: [4, 3], rounded: [14, 9], soft: [22, 14] } as const;
const GLASS = { off: 'none', soft: 'blur(8px)', strong: 'blur(26px)' } as const;

/** CSS variables of the user's own palette; surfaces stay translucent so glass blur still shows. */
export function customThemeVars(t: Settings['appearance']['customTheme']): Record<string, string> {
  return {
    '--bg': t.bg,
    '--bg-2': `color-mix(in srgb, ${t.bg} 55%, ${t.surface})`,
    '--surface': `color-mix(in srgb, ${t.surface} 88%, transparent)`,
    '--surface-2': `color-mix(in srgb, ${t.surface} 85%, ${t.text})`,
    '--surface-solid': t.surface,
    '--border': t.border,
    '--text': t.text,
    '--text-dim': t.dim,
    '--code-bg': t.code,
    '--glass': 'blur(12px)',
    'color-scheme': isDarkColor(t.bg) ? 'dark' : 'light',
  };
}
const CUSTOM_KEYS = Object.keys(customThemeVars({ bg: '#000000', surface: '#000000', text: '#000000', dim: '#000000', border: '#000000', code: '#000000' }));

export function motionAllowed(m: Settings['appearance']['motion']): boolean {
  if (m === 'none') return false;
  if (m === 'reduced') return false;
  return !(typeof matchMedia !== 'undefined' && matchMedia('(prefers-reduced-motion: reduce)').matches);
}

/** Mirror appearance settings onto <html> so CSS can react to them. */
export function useApplyTheme() {
  const a = useApp((s) => s.settings.appearance);
  const timeout = useApp((s) => s.settings.editor.timeoutSec);
  useEffect(() => setTimeoutSec(timeout), [timeout]);
  useEffect(() => {
    const apply = () => {
      const el = document.documentElement;
      el.dataset.theme = resolvedTheme(a.theme);
      el.dataset.density = a.density;
      el.dataset.radius = a.radius;
      el.dataset.motion = a.motion;
      el.dataset.font = a.uiFont;
      el.dataset.codefont = a.codeFont;
      el.style.setProperty('--accent', a.accent);
      el.style.setProperty('--fs', String(a.fontScale));
      el.style.setProperty('--lh', String(a.lineHeight));
      const setOrClear = (k: string, v: string | null) => (v === null ? el.style.removeProperty(k) : el.style.setProperty(k, v));
      const custom = a.theme === 'custom' ? customThemeVars(a.customTheme) : null;
      for (const k of CUSTOM_KEYS) setOrClear(k, custom ? custom[k] : null);
      if (a.glass !== 'theme') el.style.setProperty('--glass', GLASS[a.glass]);
      const [r, rs] = BASE_RADIUS[a.radius];
      const scaled = a.cornerScale !== 1;
      setOrClear('--radius', scaled ? `${Math.round(r * a.cornerScale)}px` : null);
      setOrClear('--radius-sm', scaled ? `${Math.round(rs * a.cornerScale)}px` : null);
      setOrClear('--shadow', a.cardShadow ? null : 'none');
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(el).getPropertyValue('--bg').trim() || '#0b0d15');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [a]);
}

export const ACCENTS = ['#7c5cff', '#4f8cff', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#06b6d4', '#84cc16'];
