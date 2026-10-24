import { useEffect } from 'react';
import type { Settings } from '../core/settings';
import { useApp } from '../state/store';
import { setTimeoutSec } from '../runner/runner';

const DARK = new Set(['dark', 'midnight', 'terminal', 'contrast']);
const systemDark = () => typeof matchMedia !== 'undefined' && matchMedia('(prefers-color-scheme: dark)').matches;

export function resolvedTheme(theme: Settings['appearance']['theme']): string {
  return theme === 'system' ? (systemDark() ? 'dark' : 'light') : theme;
}
export const isDarkTheme = (theme: Settings['appearance']['theme']) => DARK.has(resolvedTheme(theme));

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
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(el).getPropertyValue('--bg').trim() || '#0b0d15');
    };
    apply();
    const mq = matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, [a]);
}

export const ACCENTS = ['#7c5cff', '#4f8cff', '#14b8a6', '#22c55e', '#f59e0b', '#ef4444', '#ec4899', '#a855f7', '#06b6d4', '#84cc16'];
