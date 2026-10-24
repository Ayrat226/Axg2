// Mutation operators for "Охота на баги": turn a reference solution into a subtly broken program.
// Tokenizer-aware (strings, comments, regex literals are never touched); pure and deterministic per seed.
import type { BugType } from './types';

export type MutLang = 'python' | 'javascript';

export type MutationClass =
  | 'boundary' | 'compare' | 'loop-bound' | 'off-by-one' | 'index-shift'
  | 'arith' | 'logic-op' | 'negation' | 'return' | 'constant' | 'func';

export const MUTATION_INFO: Record<MutationClass, { label: string; icon: string; bug: BugType; tip: string }> = {
  boundary: { label: 'Граница сравнения', icon: '📏', bug: 'edge', tip: 'Проверяйте крайние значения: < или <=, > или >=.' },
  compare: { label: 'Перевёрнутое условие', icon: '🔀', bug: 'logic', tip: 'Читайте условие вслух: что оно проверяет на самом деле?' },
  'loop-bound': { label: 'Граница цикла', icon: '🔁', bug: 'edge', tip: 'Выпишите первую и последнюю итерации — верны ли они?' },
  'off-by-one': { label: 'Ошибка на единицу', icon: '1️⃣', bug: 'edge', tip: 'Подставьте маленький пример и посчитайте вручную.' },
  'index-shift': { label: 'Сдвиг индекса', icon: '📍', bug: 'edge', tip: 'Какой элемент берётся при первом и последнем значении индекса?' },
  arith: { label: 'Арифметический знак', icon: '➕', bug: 'logic', tip: 'Пройдите формулу на числах: совпадает ли знак с задачей?' },
  'logic-op': { label: 'Логический оператор', icon: '🔗', bug: 'logic', tip: 'Составьте таблицу истинности для and/or (&&/||).' },
  negation: { label: 'Потерянное отрицание', icon: '🚫', bug: 'logic', tip: 'Проверьте, не перевёрнуто ли условие целиком.' },
  return: { label: 'Потерянный результат', icon: '↩️', bug: 'logic', tip: 'Убедитесь, что функция возвращает именно то, что нужно.' },
  constant: { label: 'Булева константа', icon: '🔘', bug: 'logic', tip: 'Начальные значения флагов задают исход всей логики.' },
  func: { label: 'Не та функция', icon: '🧮', bug: 'logic', tip: 'min/max и any/all легко перепутать — сверяйте с условием.' },
};

export interface Mutant {
  code: string;
  cls: MutationClass;
  /** Human description of what was changed, in Russian. */
  desc: string;
  line: number;
  before: string;
  after: string;
  /** May make the program loop forever (counter or loop-condition change): try such mutants last. */
  risky: boolean;
}

export const bugTypeOf = (cls: MutationClass): BugType => MUTATION_INFO[cls].bug;

type TokType = 'ws' | 'nl' | 'str' | 'com' | 'num' | 'id' | 'op';
interface Tok { t: TokType; s: string; a: number; b: number }

const OPS = ['>>>=', '===', '!==', '**=', '//=', '<<=', '>>=', '>>>', '...', '&&', '||', '??', '==', '!=', '<=', '>=', '=>', '->', ':=', '+=', '-=', '*=', '/=', '%=', '&=', '|=', '^=', '++', '--', '**', '//', '<<', '>>', '?.'];
const PY_KW = new Set(['and', 'or', 'not', 'in', 'is', 'if', 'else', 'elif', 'return', 'yield', 'lambda', 'while', 'for', 'assert', 'del', 'print', 'from', 'import', 'with', 'as', 'raise', 'await']);
const JS_KW = new Set(['return', 'typeof', 'case', 'in', 'of', 'instanceof', 'new', 'delete', 'void', 'yield', 'await', 'else', 'do', 'throw', 'if', 'while', 'for']);
const ID_START = /[\p{L}_$]/u;
const ID_PART = /[\p{L}\p{N}_$]/u;
const NUM = /^\d[\d_]*(?:\.\d[\d_]*)?(?:[eE][+-]?\d+)?n?/;

export function tokenize(code: string, lang: MutLang): Tok[] {
  const toks: Tok[] = [];
  const py = lang === 'python';
  const n = code.length;
  let i = 0;
  const push = (t: TokType, a: number, b: number) => { toks.push({ t, s: code.slice(a, b), a, b }); i = b; };
  const lastSig = () => { for (let k = toks.length - 1; k >= 0; k--) if (toks[k].t !== 'ws' && toks[k].t !== 'nl' && toks[k].t !== 'com') return toks[k]; return undefined; };
  const readQuoted = (qpos: number): number => {
    const q = code[qpos];
    if (py && code.startsWith(q.repeat(3), qpos)) {
      let j = qpos + 3;
      while (j < n && !code.startsWith(q.repeat(3), j)) j += code[j] === '\\' ? 2 : 1;
      return Math.min(n, j + 3);
    }
    let j = qpos + 1;
    if (q === '`') {
      let depth = 0;
      while (j < n) {
        const c = code[j];
        if (c === '\\') { j += 2; continue; }
        if (depth === 0 && c === '`') return j + 1;
        if (c === '$' && code[j + 1] === '{') { depth++; j += 2; continue; }
        if (depth > 0 && c === '}') depth--;
        j++;
      }
      return n;
    }
    while (j < n && code[j] !== q && code[j] !== '\n') j += code[j] === '\\' ? 2 : 1;
    return Math.min(n, j + 1);
  };
  while (i < n) {
    const c = code[i];
    if (c === '\n') { push('nl', i, i + 1); continue; }
    if (c === ' ' || c === '\t' || c === '\r') { let j = i + 1; while (j < n && (code[j] === ' ' || code[j] === '\t' || code[j] === '\r')) j++; push('ws', i, j); continue; }
    if (py && c === '#') { let j = i; while (j < n && code[j] !== '\n') j++; push('com', i, j); continue; }
    if (!py && c === '/' && code[i + 1] === '/') { let j = i; while (j < n && code[j] !== '\n') j++; push('com', i, j); continue; }
    if (!py && c === '/' && code[i + 1] === '*') { const e = code.indexOf('*/', i + 2); push('com', i, e < 0 ? n : e + 2); continue; }
    if (c === '"' || c === "'" || (!py && c === '`')) { push('str', i, readQuoted(i)); continue; }
    if (!py && c === '/') {
      const p = lastSig();
      const regexOk = !p || (p.t === 'op' && ![')', ']', '}'].includes(p.s) && !['++', '--'].includes(p.s)) || (p.t === 'id' && JS_KW.has(p.s));
      if (regexOk) {
        let j = i + 1, cls = false;
        while (j < n && code[j] !== '\n' && (cls || code[j] !== '/')) { if (code[j] === '\\') j++; else if (code[j] === '[') cls = true; else if (code[j] === ']') cls = false; j++; }
        if (code[j] === '/') { j++; while (j < n && /[a-z]/i.test(code[j])) j++; push('str', i, j); continue; }
      }
    }
    if (/\d/.test(c) || (c === '.' && /\d/.test(code[i + 1] ?? ''))) {
      const m = NUM.exec(code.slice(i)) ?? [c];
      push('num', i, i + Math.max(1, m[0].length));
      continue;
    }
    if (ID_START.test(c)) {
      let j = i + 1;
      while (j < n && ID_PART.test(code[j])) j++;
      const word = code.slice(i, j);
      if (py && /^[rbfuRBFU]{1,2}$/.test(word) && (code[j] === '"' || code[j] === "'")) { push('str', i, readQuoted(j)); continue; }
      push('id', i, j);
      continue;
    }
    const op = OPS.find((o) => code.startsWith(o, i));
    push('op', i, i + (op ? op.length : 1));
  }
  return toks;
}

interface Edit { a: number; b: number; text: string }
interface Site { edit: Edit; cls: MutationClass; desc: string }

const isTrivia = (t: Tok) => t.t === 'ws' || t.t === 'nl' || t.t === 'com';

export function mutationSites(code: string, lang: MutLang): Site[] {
  const py = lang === 'python';
  const KW = py ? PY_KW : JS_KW;
  const toks = tokenize(code, lang);
  const sig = toks.filter((t) => !isTrivia(t));
  const sites: Site[] = [];
  const add = (a: number, b: number, text: string, cls: MutationClass, desc: string) => sites.push({ edit: { a, b, text }, cls, desc });

  // Bracket context for every significant token: enclosing brackets with the token that owns them.
  const ctx: { open: string; owner?: Tok; subscript: boolean }[][] = [];
  const stack: { open: string; owner?: Tok; subscript: boolean }[] = [];
  const match = new Map<number, number>();
  const openIdx: number[] = [];
  const valueEnd = (t?: Tok) => !!t && (t.t === 'num' || t.t === 'str' || (t.t === 'id' && !KW.has(t.s)) || (t.t === 'op' && (t.s === ')' || t.s === ']')));
  sig.forEach((t, k) => {
    if (t.t === 'op' && (t.s === ')' || t.s === ']' || t.s === '}')) { stack.pop(); const o = openIdx.pop(); if (o !== undefined) match.set(o, k); }
    ctx[k] = stack.slice();
    if (t.t === 'op' && (t.s === '(' || t.s === '[' || t.s === '{')) {
      stack.push({ open: t.s, owner: sig[k - 1], subscript: t.s === '[' && valueEnd(sig[k - 1]) });
      openIdx.push(k);
    }
  });
  const inLoopHeader = (k: number) => ctx[k].some((c) => c.open === '(' && c.owner?.t === 'id' && (c.owner.s === 'range' || (!py && c.owner.s === 'for')));
  const REL: Record<string, [string, MutationClass]> = {
    '<': ['<=', 'boundary'], '<=': ['<', 'boundary'], '>': ['>=', 'boundary'], '>=': ['>', 'boundary'],
    '==': ['!=', 'compare'], '!=': ['==', 'compare'], '===': ['!==', 'compare'], '!==': ['===', 'compare'],
  };
  const FLIP: Record<string, string> = { '<': '>', '>': '<' };
  const FN: Record<string, string> = { min: 'max', max: 'min', any: 'all', all: 'any' };

  sig.forEach((t, k) => {
    const prev = sig[k - 1], next = sig[k + 1];
    if (t.t === 'op') {
      const rel = REL[t.s];
      if (rel) {
        const desc = rel[1] === 'boundary' ? `граница сравнения: вместо «${t.s}» стоит «${rel[0]}»` : `условие сравнения перевёрнуто: вместо «${t.s}» стоит «${rel[0]}»`;
        add(t.a, t.b, rel[0], rel[1], desc);
      }
      if (FLIP[t.s] && prev && next) add(t.a, t.b, FLIP[t.s], 'compare', `направление сравнения изменено: вместо «${t.s}» стоит «${FLIP[t.s]}»`);
      if ((t.s === '+' || t.s === '-') && valueEnd(prev) && next && prev!.t !== 'str' && next.t !== 'str') {
        const to = t.s === '+' ? '-' : '+';
        add(t.a, t.b, to, 'arith', `арифметический знак заменён: вместо «${t.s}» стоит «${to}»`);
      }
      if (t.s === '+=' || t.s === '-=') add(t.a, t.b, t.s === '+=' ? '-=' : '+=', 'arith', `арифметический знак заменён: вместо «${t.s}» стоит «${t.s === '+=' ? '-=' : '+='}»`);
      if (!py && (t.s === '++' || t.s === '--')) add(t.a, t.b, t.s === '++' ? '--' : '++', 'arith', `направление счётчика изменено: вместо «${t.s}» стоит «${t.s === '++' ? '--' : '++'}»`);
      if (!py && (t.s === '&&' || t.s === '||')) add(t.a, t.b, t.s === '&&' ? '||' : '&&', 'logic-op', `логический оператор заменён: вместо «${t.s}» стоит «${t.s === '&&' ? '||' : '&&'}»`);
      if (!py && t.s === '!' && next && !valueEnd(prev) && !(next.t === 'op' && next.s === '=')) add(t.a, t.b, '', 'negation', 'потеряно отрицание «!» в условии');
    }
    if (t.t === 'id') {
      if (py && (t.s === 'and' || t.s === 'or')) { const to = t.s === 'and' ? 'or' : 'and'; add(t.a, t.b, to, 'logic-op', `логический оператор заменён: вместо «${t.s}» стоит «${to}»`); }
      if (py && t.s === 'not' && next) {
        const after = toks[toks.indexOf(t) + 1];
        add(t.a, after && after.t === 'ws' ? after.b : t.b, '', 'negation', 'потеряно отрицание «not» в условии');
      }
      if (t.s === 'True' || t.s === 'False' || t.s === 'true' || t.s === 'false') {
        const to = t.s === 'True' ? 'False' : t.s === 'False' ? 'True' : t.s === 'true' ? 'false' : 'true';
        if (!(prev?.t === 'op' && prev.s === '.')) add(t.a, t.b, to, 'constant', `булева константа перевёрнута: вместо «${t.s}» стоит «${to}»`);
      }
      if (FN[t.s] && next?.s === '(') {
        const ok = py ? prev?.s !== '.' : (t.s === 'min' || t.s === 'max') && prev?.s === '.' && sig[k - 2]?.s === 'Math';
        if (ok) add(t.a, t.b, FN[t.s], 'func', `подменена функция: вместо «${t.s}» вызывается «${FN[t.s]}»`);
      }
      if (py && t.s === 'len' && next?.s === '(') {
        const close = match.get(k + 1);
        if (close !== undefined) {
          const end = sig[close].b, text = code.slice(t.a, end);
          const cls: MutationClass = inLoopHeader(k) ? 'loop-bound' : 'off-by-one';
          const word = cls === 'loop-bound' ? 'граница цикла' : 'длина';
          add(t.a, end, `(${text} - 1)`, cls, `${word} сдвинута на единицу: len(...) - 1`);
          add(t.a, end, `(${text} + 1)`, cls, `${word} сдвинута на единицу: len(...) + 1`);
        }
      }
      if (!py && t.s === 'length' && prev?.s === '.' && !(next?.t === 'op' && ['*', '/', '%', '**', '='].includes(next.s)) && !(next?.s === '(')) {
        const cls: MutationClass = inLoopHeader(k) ? 'loop-bound' : 'off-by-one';
        const word = cls === 'loop-bound' ? 'граница цикла' : 'длина';
        add(t.a, t.b, 'length - 1', cls, `${word} сдвинута на единицу: length - 1`);
        add(t.a, t.b, 'length + 1', cls, `${word} сдвинута на единицу: length + 1`);
      }
      if (t.s === 'return' && next && !isTrivia(next)) {
        // Replace the returned expression with None/undefined (single statement, brackets balanced).
        const ti = toks.indexOf(t);
        let depth = 0, endTok: Tok | undefined, startTok: Tok | undefined;
        for (let j = ti + 1; j < toks.length; j++) {
          const x = toks[j];
          if (x.t === 'com') break;
          if (x.t === 'nl' && depth === 0) break;
          if (x.t === 'op') {
            if (x.s === '(' || x.s === '[' || x.s === '{') depth++;
            else if (x.s === ')' || x.s === ']' || x.s === '}') depth--;
            else if (x.s === ';' && depth === 0) break;
          }
          if (!isTrivia(x)) { startTok ??= x; endTok = x; }
        }
        const nextLine = (() => { for (let j = toks.indexOf(endTok ?? t) + 1; j < toks.length; j++) if (!isTrivia(toks[j])) return toks[j]; return undefined; })();
        const empty = py ? 'None' : 'undefined';
        if (startTok && endTok && code.slice(startTok.a, endTok.b) !== empty && !(!py && nextLine?.t === 'op' && (nextLine.s === '.' || nextLine.s === '?.'))) {
          add(startTok.a, endTok.b, empty, 'return', `потерян результат: вместо значения возвращается ${empty}`);
        }
      }
    }
    if (t.t === 'num' && /^\d+$/.test(t.s)) {
      const v = Number(t.s);
      const innermost = ctx[k][ctx[k].length - 1];
      const cls: MutationClass = inLoopHeader(k) ? 'loop-bound' : innermost?.subscript ? 'index-shift' : 'off-by-one';
      const label = cls === 'loop-bound' ? 'граница цикла сдвинута на единицу' : cls === 'index-shift' ? 'индекс сдвинут на единицу' : 'число сдвинуто на единицу';
      add(t.a, t.b, String(v + 1), cls, `${label}: ${v} → ${v + 1}`);
      if (v > 0) add(t.a, t.b, String(v - 1), cls, `${label}: ${v} → ${v - 1}`);
    }
    if (t.t === 'id' && !KW.has(t.s) && prev?.s === '[' && next?.s === ']' && ctx[k][ctx[k].length - 1]?.subscript) {
      add(t.a, t.b, `${t.s} + 1`, 'index-shift', `индекс сдвинут: [${t.s}] → [${t.s} + 1]`);
      add(t.a, t.b, `${t.s} - 1`, 'index-shift', `индекс сдвинут: [${t.s}] → [${t.s} - 1]`);
    }
  });
  return sites;
}

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface MutateOptions { seed?: number; max?: number; /** Drop mutants that may not terminate. */ safe?: boolean }

/** Distinct mutants of `code`; shuffled by `seed` and, with `max`, spread across mutation classes. */
export function generateMutants(code: string, lang: MutLang, opts: MutateOptions = {}): Mutant[] {
  const rnd = mulberry32(opts.seed ?? 1);
  const seen = new Set<string>([code]);
  const all: Mutant[] = [];
  const loops = /\bwhile\b/.test(code);
  for (const s of mutationSites(code, lang)) {
    const out = code.slice(0, s.edit.a) + s.edit.text + code.slice(s.edit.b);
    if (seen.has(out)) continue;
    seen.add(out);
    const counter = ['++', '--', '+=', '-='].includes(code.slice(s.edit.a, s.edit.b));
    const risky = counter || (loops && s.cls !== 'return' && s.cls !== 'index-shift');
    if (risky && opts.safe) continue;
    all.push({ code: out, cls: s.cls, desc: s.desc, line: code.slice(0, s.edit.a).split('\n').length, before: code.slice(s.edit.a, s.edit.b), after: s.edit.text, risky });
  }
  for (let i = all.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [all[i], all[j]] = [all[j], all[i]]; }
  all.sort((x, y) => Number(x.risky) - Number(y.risky));
  if (opts.max === undefined || all.length <= opts.max) return all;
  const buckets = new Map<MutationClass, Mutant[]>();
  for (const m of all) buckets.set(m.cls, [...(buckets.get(m.cls) ?? []), m]);
  const picked: Mutant[] = [];
  while (picked.length < opts.max) {
    let progressed = false;
    for (const b of buckets.values()) { const m = b.shift(); if (m && picked.length < opts.max) { picked.push(m); progressed = true; } }
    if (!progressed) break;
  }
  return picked;
}

export type MutantVerdict = 'valid' | 'syntax' | 'equivalent' | 'timeout';
interface RunLike { results: { pass: boolean; error?: { type: string; message?: string } }[]; error?: { type: string; message?: string } | null }

/** A mutant is useful only if it parses, finishes in time and fails at least one test (else it is equivalent). */
export function judgeMutant(run: RunLike): MutantVerdict {
  const errs = [run.error, ...run.results.map((r) => r.error)].filter(Boolean) as { type: string; message?: string }[];
  if (errs.some((e) => /Syntax|Indentation|TabError/.test(e.type) || /syntax error|Unexpected token|Invalid or unexpected/i.test(e.message ?? ''))) return 'syntax';
  if (errs.some((e) => e.type === 'Timeout' || e.type === 'TimeoutError')) return 'timeout';
  if (!run.results.length) return 'syntax';
  return run.results.some((r) => !r.pass) ? 'valid' : 'equivalent';
}
