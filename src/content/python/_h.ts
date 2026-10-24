// Authoring helpers for Python content: `py` keeps backslashes raw; `md` also turns § into a backtick.
export const py = String.raw;
export const md = (s: TemplateStringsArray, ...v: unknown[]): string => String.raw(s, ...v).replace(/§/g, '`');
