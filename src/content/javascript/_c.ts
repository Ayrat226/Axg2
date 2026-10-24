// Authoring helpers for the JavaScript route (not content).
// Escape a backtick as \` and a template placeholder as \${ inside these tags; every other backslash stays literal.
function dedent(s: string): string {
  const lines = s.replace(/\\`/g, '`').replace(/\\\$\{/g, '${').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indent = Math.min(...lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length));
  return lines.map((l) => l.slice(indent)).join('\n');
}

/** Plain dedented text (learner code, expected output). */
export const c = (s: TemplateStringsArray): string => dedent(s.raw.join(''));

/** Fenced ```js block for lesson markdown. */
export const js = (s: TemplateStringsArray): string => '```js\n' + dedent(s.raw.join('')) + '\n```';

/** Join markdown blocks with blank lines. */
export const md = (...parts: string[]): string => parts.join('\n\n');
