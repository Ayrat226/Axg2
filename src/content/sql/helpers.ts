/** Fenced SQL block for lesson markdown (keeps backticks out of string literals). */
export const sqlBlock = (code: string): string => '```sql\n' + code.trim() + '\n```';

/** Joins markdown paragraphs. */
export const md = (...parts: string[]): string => parts.join('\n\n');
