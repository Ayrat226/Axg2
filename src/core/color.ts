// Pure colour helpers: WCAG relative luminance and contrast ratio for the custom-theme editor.

export const isHex = (s: string): boolean => /^#[0-9a-fA-F]{6}$/.test(s);

function channel(v: number): number {
  const c = v / 255;
  return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
}

export function luminance(hex: string): number {
  if (!isHex(hex)) return 0;
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * channel((n >> 16) & 255) + 0.7152 * channel((n >> 8) & 255) + 0.0722 * channel(n & 255);
}

export function contrastRatio(a: string, b: string): number {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

export const AA_TEXT = 4.5;
export const AA_UI = 3;

/** Dark if white text would contrast better than black on it. */
export const isDarkColor = (hex: string): boolean => luminance(hex) < 0.179;

export interface ContrastCheck { id: string; label: string; ratio: number; min: number; ok: boolean }

export function themeContrast(t: { bg: string; surface: string; text: string; dim: string }, accent: string): ContrastCheck[] {
  const rows: [string, string, string, string, number][] = [
    ['text-bg', 'Текст на фоне', t.text, t.bg, AA_TEXT],
    ['text-surface', 'Текст на карточке', t.text, t.surface, AA_TEXT],
    ['dim-bg', 'Приглушённый текст на фоне', t.dim, t.bg, AA_TEXT],
    ['dim-surface', 'Приглушённый текст на карточке', t.dim, t.surface, AA_TEXT],
    ['accent-bg', 'Акцент на фоне (элементы интерфейса)', accent, t.bg, AA_UI],
  ];
  return rows.map(([id, label, fg, bg, min]) => {
    const ratio = contrastRatio(fg, bg);
    return { id, label, ratio, min, ok: ratio >= min };
  });
}
