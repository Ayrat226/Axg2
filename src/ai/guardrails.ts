// Guardrails around AI replies: never let the tutor hand out the solution of an active exercise,
// and never let learner-supplied text act as instructions.

export const MAX_DATA_CHARS = 6000;
export const SIMILARITY_LIMIT = 0.8;
export const DEFAULT_MAX_CODE_LINES = 6;

/** Wrap learner-controlled text as inert data. The marker characters are removed from the text itself. */
export function wrapAsData(label: string, text: string, max = MAX_DATA_CHARS): string {
  const safe = text.replace(/[⟦⟧]/g, '').replace(/\r\n/g, '\n');
  const clipped = safe.length > max ? `${safe.slice(0, max)}\n… (обрезано)` : safe;
  return `⟦DATA ${label}⟧\n${clipped}\n⟦/DATA⟧`;
}

const stripComments = (code: string): string =>
  code
    .split('\n')
    .map((l) => l.replace(/(^|\s)(#|\/\/|--)\s.*$/, '$1').replace(/^\s*(#|\/\/|--).*$/, ''))
    .join('\n');

export function tokens(code: string): string[] {
  return stripComments(code).toLowerCase().match(/[a-zа-яё_]\w*|\d+(?:\.\d+)?|"[^"\n]*"|'[^'\n]*'|==|!=|<=|>=|=>|->|\S/g) ?? [];
}

/** Jaccard similarity of token multisets: whitespace, comments and letter case do not matter. */
export function similarity(a: string, b: string): number {
  const ca = new Map<string, number>();
  const cb = new Map<string, number>();
  for (const t of tokens(a)) ca.set(t, (ca.get(t) ?? 0) + 1);
  for (const t of tokens(b)) cb.set(t, (cb.get(t) ?? 0) + 1);
  if (!ca.size && !cb.size) return 0;
  let inter = 0;
  let union = 0;
  for (const k of new Set([...ca.keys(), ...cb.keys()])) {
    const x = ca.get(k) ?? 0;
    const y = cb.get(k) ?? 0;
    inter += Math.min(x, y);
    union += Math.max(x, y);
  }
  return union ? inter / union : 0;
}

const FENCE = /```[^\n]*\n([\s\S]*?)(?:```|$)/g;

export const countCodeLines = (code: string): number => code.split('\n').filter((l) => l.trim()).length;

export interface GuardOptions {
  /** Reference solution(s) of the active exercise (never sent to the provider). */
  reference?: string[];
  /** Largest code block (in non-empty lines) that may stay in the reply. */
  maxLines?: number;
  /** Shown in place of a removed block. */
  hint?: string;
}
export interface GuardResult { text: string; filtered: boolean; reasons: ('similar' | 'long')[] }

export const FILTER_NOTICE = '🔒 Здесь был фрагмент кода, слишком похожий на готовое решение или слишком длинный. AI-наставник не выдаёт решения активных заданий — попробуйте собрать ответ сами.';

export function guardReply(reply: string, opts: GuardOptions = {}): GuardResult {
  const max = opts.maxLines ?? DEFAULT_MAX_CODE_LINES;
  const reasons = new Set<'similar' | 'long'>();
  let kept = 0;
  const text = reply.replace(FENCE, (block: string, body: string) => {
    const lines = countCodeLines(body);
    const similar = !!opts.reference?.some((r) => tokens(r).length >= 3 && tokens(body).length >= 3 && similarity(body, r) > SIMILARITY_LIMIT);
    const long = lines > max || kept + lines > max * 2;
    if (!similar && !long) {
      kept += lines;
      return block;
    }
    if (similar) reasons.add('similar');
    if (long) reasons.add('long');
    return `\n> ${FILTER_NOTICE}\n`;
  });
  const filtered = reasons.size > 0;
  const withHint = filtered && opts.hint ? `${text.trim()}\n\n**Подсказка:** ${opts.hint}` : text.trim();
  return { text: withHint, filtered, reasons: [...reasons] };
}
