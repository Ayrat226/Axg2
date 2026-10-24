import { describe, expect, it } from 'vitest';
import { generateMutants, judgeMutant, mutationSites, tokenize, bugTypeOf, bugCandidates, isMutable, mutantExercise, MUTATION_INFO, type MutationClass } from '../../src/core/mutate';
import { initialState } from '../../src/core/state';
import { newSkillState } from '../../src/core/model';
import { ALL_EXERCISES, ALL_SKILLS } from '../../src/content';
import { testJs } from '../../src/runner/jsHarness';
import { pyTest } from '../helpers/runtimes';
import type { CodeExercise, FixExercise } from '../../src/core/types';

const py = (code: string) => generateMutants(code, 'python');
const js = (code: string) => generateMutants(code, 'javascript');
const has = (ms: ReturnType<typeof py>, cls: MutationClass, before: string, after: string) => ms.some((m) => m.cls === cls && m.before === before && m.after === after);

describe('tokenizer', () => {
  it('keeps strings, comments and triple quotes as single tokens', () => {
    const t = tokenize(`x = "a < b" # c < d\ny = '''z\n< 1'''`, 'python').filter((k) => k.t === 'str' || k.t === 'com').map((k) => k.s);
    expect(t).toEqual(['"a < b"', '# c < d', "'''z\n< 1'''"]);
  });
  it('handles JS comments, templates and regexes', () => {
    const t = tokenize('const r = /a<b/g; // x<y\nconst s = `a ${1 < 2} b`; /* 1 < 2 */', 'javascript').filter((k) => k.t === 'str' || k.t === 'com').map((k) => k.s);
    expect(t).toEqual(['/a<b/g', '// x<y', '`a ${1 < 2} b`', '/* 1 < 2 */']);
  });
  it('treats division as an operator, not a regex', () => {
    const t = tokenize('a = b / c / d', 'javascript').filter((k) => k.t === 'str');
    expect(t).toHaveLength(0);
  });
  it('recognises prefixed python strings', () => {
    expect(tokenize(`f"{a}<{b}"`, 'python').map((k) => k.t)).toEqual(['str']);
  });
});

describe('operators (python)', () => {
  const src = 'def f(a, xs):\n    total = 0\n    for i in range(len(xs)):\n        if xs[i] < a and not a == 3:\n            total += xs[i] + 1\n    return total\n';
  const ms = py(src);
  it('swaps relational operators', () => {
    expect(has(ms, 'boundary', '<', '<=')).toBe(true);
    expect(has(ms, 'compare', '==', '!=')).toBe(true);
  });
  it('shifts loop bounds, numbers and indices', () => {
    expect(ms.some((m) => m.cls === 'loop-bound' && m.after === '(len(xs) - 1)')).toBe(true);
    expect(ms.some((m) => m.cls === 'off-by-one' && m.before === '0' && m.after === '1')).toBe(true);
    expect(has(ms, 'index-shift', 'i', 'i + 1')).toBe(true);
    expect(has(ms, 'index-shift', 'i', 'i - 1')).toBe(true);
  });
  it('swaps arithmetic, boolean operators and drops negation', () => {
    expect(has(ms, 'arith', '+', '-')).toBe(true);
    expect(has(ms, 'arith', '+=', '-=')).toBe(true);
    expect(has(ms, 'logic-op', 'and', 'or')).toBe(true);
    expect(ms.some((m) => m.cls === 'negation' && m.code.includes('and a == 3'))).toBe(true);
  });
  it('replaces the returned expression with None', () => {
    expect(ms.some((m) => m.cls === 'return' && m.code.trimEnd().endsWith('return None'))).toBe(true);
  });
  it('never emits the original program or duplicates', () => {
    expect(ms.some((m) => m.code === src)).toBe(false);
    expect(new Set(ms.map((m) => m.code)).size).toBe(ms.length);
  });
  it('describes each mutant in Russian', () => {
    for (const m of ms) { expect(m.desc).toMatch(/[а-я]/i); expect(MUTATION_INFO[m.cls].label).toBeTruthy(); }
  });
  it('leaves strings and comments untouched', () => {
    const code = 'msg = "if a < b and 1 == 2"  # x < y, 5 + 3\nprint(msg)\n';
    const out = py(code);
    expect(out.length).toBe(0);
    expect(mutationSites('s = "a < b"\n# 1 < 2\n', 'python')).toHaveLength(0);
  });
  it('does not treat unary minus or string concatenation as arithmetic', () => {
    const ms2 = py('x = -5\ns = "a" + "b"\ny = x * -1\n');
    expect(ms2.some((m) => m.cls === 'arith')).toBe(false);
  });
  it('skips return None and bare return', () => {
    expect(py('def f():\n    return None\n').some((m) => m.cls === 'return')).toBe(false);
    expect(py('def f():\n    return\n').some((m) => m.cls === 'return')).toBe(false);
  });
  it('handles multi-line return expressions', () => {
    const ms3 = py('def f(a):\n    return (a +\n            1)\n');
    expect(ms3.some((m) => m.cls === 'return' && m.code === 'def f(a):\n    return None\n')).toBe(true);
  });
  it('flips booleans and min/max', () => {
    const ms4 = py('ok = True\nm = min(1, 2)\n');
    expect(has(ms4, 'constant', 'True', 'False')).toBe(true);
    expect(has(ms4, 'func', 'min', 'max')).toBe(true);
  });
});

describe('operators (javascript)', () => {
  const src = 'function f(a) {\n  let t = 0;\n  for (let i = 0; i < a.length; i++) {\n    if (a[i] >= 2 && !a[i].skip) { t += a[i] * 2; }\n  }\n  return t; // done < 5\n}\n';
  const ms = js(src);
  it('covers relational, logical and negation operators', () => {
    expect(has(ms, 'boundary', '<', '<=')).toBe(true);
    expect(has(ms, 'boundary', '>=', '>')).toBe(true);
    expect(has(ms, 'logic-op', '&&', '||')).toBe(true);
    expect(ms.some((m) => m.cls === 'negation' && m.code.includes('&& a[i].skip'))).toBe(true);
  });
  it('shifts .length and counter direction', () => {
    expect(ms.some((m) => m.cls === 'loop-bound' && m.after === 'length - 1')).toBe(true);
    expect(has(ms, 'arith', '++', '--')).toBe(true);
  });
  it('replaces return value with undefined and ignores comments', () => {
    expect(ms.some((m) => m.cls === 'return' && m.code.includes('return undefined; // done < 5'))).toBe(true);
    expect(ms.every((m) => m.code.includes('// done < 5'))).toBe(true);
  });
  it('does not mutate inside template literals or regexes', () => {
    expect(js('const s = `a ${1 < 2}`; const r = /a+b/;\n')).toHaveLength(0);
  });
  it('supports === / !==', () => {
    expect(has(js('if (a === b) {}\n'), 'compare', '===', '!==')).toBe(true);
  });
  it('swaps Math.min/Math.max but not other min methods', () => {
    expect(has(js('const m = Math.min(a, b);\n'), 'func', 'min', 'max')).toBe(true);
    expect(js('const m = obj.min(a);\n').some((x) => x.cls === 'func')).toBe(false);
  });
});

describe('determinism and selection', () => {
  const src = 'def f(a, b):\n    if a < b and b > 0:\n        return a + b - 1\n    return a * 2\n';
  it('is deterministic for a seed and differs across seeds', () => {
    expect(py(src).map((m) => m.code)).toEqual(py(src).map((m) => m.code));
    const a = generateMutants(src, 'python', { seed: 1 }).map((m) => m.code);
    const b = generateMutants(src, 'python', { seed: 2 }).map((m) => m.code);
    expect(a).not.toEqual(b);
    expect([...a].sort()).toEqual([...b].sort());
  });
  it('max spreads picks across mutation classes', () => {
    const picked = generateMutants(src, 'python', { seed: 3, max: 4 });
    expect(picked).toHaveLength(4);
    expect(new Set(picked.map((m) => m.cls)).size).toBeGreaterThanOrEqual(3);
  });
  it('marks counter and while-loop mutants as risky and can drop them', () => {
    const loop = 'i = 0\nwhile i < 3:\n    i += 1\n';
    expect(py(loop).every((m) => m.risky)).toBe(true);
    expect(generateMutants(loop, 'python', { safe: true })).toHaveLength(0);
    expect(py(src).some((m) => m.risky)).toBe(false);
  });
  it('maps classes to bug types', () => {
    expect(bugTypeOf('loop-bound')).toBe('edge');
    expect(bugTypeOf('logic-op')).toBe('logic');
  });
});

describe('judgeMutant', () => {
  const t = (pass: boolean, error?: { type: string; message?: string }) => ({ pass, error });
  it('classifies verdicts', () => {
    expect(judgeMutant({ results: [t(true), t(false)] })).toBe('valid');
    expect(judgeMutant({ results: [t(true), t(true)] })).toBe('equivalent');
    expect(judgeMutant({ results: [t(false, { type: 'SyntaxError', message: 'x' })] })).toBe('syntax');
    expect(judgeMutant({ results: [t(false, { type: 'Error', message: 'Unexpected token }' })] })).toBe('syntax');
    expect(judgeMutant({ results: [t(false, { type: 'Timeout' })] })).toBe('timeout');
    expect(judgeMutant({ results: [], error: { type: 'IndentationError' } })).toBe('syntax');
    expect(judgeMutant({ results: [t(false, { type: 'TypeError' })] })).toBe('valid');
  });
});

describe('against the real runners', () => {
  const pool = ALL_EXERCISES.filter((e): e is CodeExercise | FixExercise => (e.kind === 'code' || e.kind === 'fix') && (e.lang === 'python' || e.lang === 'javascript') && !!e.tests?.length);
  const pick = (lang: string, n: number) => pool.filter((e) => e.lang === lang).filter((_, i) => i % 7 === 0).slice(0, n);

  it.each(['python', 'javascript'] as const)('real %s exercises yield at least one mutant that fails the tests', async (lang) => {
    const sample = pick(lang, 6);
    expect(sample.length).toBeGreaterThan(3);
    let withValid = 0;
    for (const ex of sample) {
      const run = (code: string) => (lang === 'python' ? pyTest(code, ex.tests!) : testJs(code, ex.tests!));
      const baseline = await run(ex.solution);
      expect(baseline.every((r) => r.pass), `${ex.id} solution passes`).toBe(true);
      let valid = false;
      for (const m of generateMutants(ex.solution, lang, { seed: 7, max: 12, safe: true })) {
        const results = await run(m.code);
        const v = judgeMutant({ results });
        if (v === 'valid') { valid = true; break; }
      }
      if (valid) withValid++;
    }
    expect(withValid).toBeGreaterThanOrEqual(Math.ceil(sample.length * 0.7));
  }, 240_000);
});

describe('synthetic exercises and candidates', () => {
  const content = { skills: ALL_SKILLS, exercises: ALL_EXERCISES };
  it('builds a valid FixExercise from a mutant', () => {
    const orig = ALL_EXERCISES.find(isMutable)!;
    const [m] = generateMutants(orig.solution, orig.lang, { seed: 1, max: 1 });
    const fx = mutantExercise(orig, m, 2);
    expect(fx.kind).toBe('fix');
    expect(fx.id).toBe(`${orig.id}~m2`);
    expect(fx.id.startsWith(fx.skill + '.')).toBe(true);
    expect(fx.buggy).toBe(m.code);
    expect(fx.solution).toBe(orig.solution);
    expect(fx.tests).toBe(orig.tests);
    expect(fx.hints.length).toBeGreaterThanOrEqual(2);
    expect(fx.explanation).toContain(m.desc);
  });
  it('prefers started skills and distinct skills, deterministically', () => {
    const s = initialState(0);
    for (const id of ['py.loops', 'py.lists', 'py.functions', 'py.strings', 'py.dicts', 'py.conditions']) s.skills[id] = { ...newSkillState(0.5), lessonAt: 1 };
    const a = bugCandidates(s, content, { seed: 5 });
    expect(a.map((e) => e.id)).toEqual(bugCandidates(s, content, { seed: 5 }).map((e) => e.id));
    expect(a.length).toBeGreaterThanOrEqual(5);
    expect(a.every((e) => e.skill.startsWith('py.'))).toBe(true);
    expect(new Set(a.slice(0, 5).map((e) => e.skill)).size).toBe(5);
  });
  it('falls back to tier-1 skills for a brand-new learner and honours a route filter', () => {
    const fresh = bugCandidates(initialState(0), content, { seed: 1, activeRoute: 'javascript' });
    expect(fresh.length).toBeGreaterThanOrEqual(5);
    const routeOnly = bugCandidates(initialState(0), content, { seed: 1, route: 'javascript' });
    expect(routeOnly.every((e) => e.skill.startsWith('js.'))).toBe(true);
  });
});
