import { beforeAll, describe, expect, it } from 'vitest';
import { getPython, getSql, pyRun, pyTest, pyTrace } from '../helpers/runtimes';
import { inspect, runJs, testJs, deepEqual } from '../../src/runner/jsHarness';
import { runSql, testSql } from '../../src/runner/sqlHarness';

beforeAll(async () => { await Promise.all([getPython(), getSql()]); }, 120_000);

describe('python harness', () => {
  it('captures stdout, stdin and errors with user line numbers', async () => {
    expect((await pyRun('print(input() * 2)', ['ab'])).stdout).toBe('abab\n');
    const r = await pyRun('x = 1\ny = [1]\nprint(y[5])');
    expect(r.error?.type).toBe('IndexError');
    expect(r.error?.line).toBe(3);
    const s = await pyRun('if True\n  print(1)');
    expect(s.error?.type).toBe('SyntaxError');
    expect(s.error?.line).toBe(1);
  });
  it('strict equality: types matter, floats are tolerant', async () => {
    const res = await pyTest('def f():\n    return 1', [{ expr: 'f()', expect: 'True' }, { expr: 'f()', expect: '1.0' }, { expr: '0.1 + 0.2', expect: '0.3' }, { expr: '[1]', expect: '(1,)' }]);
    expect(res.map((r) => r.pass)).toEqual([false, true, true, false]);
  });
  it('tests are isolated: learner state does not leak between tests', async () => {
    const res = await pyTest('items = []\ndef add(x):\n    items.append(x)\n    return len(items)', [{ expr: 'add(1)', expect: '1' }, { expr: 'add(1)', expect: '1' }]);
    expect(res.every((r) => r.pass)).toBe(true);
  });
  it('SystemExit and exceptions in tests are reported, not fatal', async () => {
    expect((await pyRun('import sys\nprint(1)\nsys.exit()')).error).toBeNull();
    const res = await pyTest('def f(x):\n    return 1 / x', [{ expr: 'f(0)', expect: '0' }]);
    expect(res[0].error?.type).toBe('ZeroDivisionError');
  });
  it('trace records lines, locals and return values', async () => {
    const t = await pyTrace('def sq(n):\n    return n * n\nx = sq(3)\nprint(x)');
    expect(t.error).toBeNull();
    expect(t.steps.some((s) => s.func === 'sq' && s.event === 'return' && s.ret === '9')).toBe(true);
    expect(t.steps.at(-1)?.locals.x).toBe('9');
    expect(t.stdout).toBe('9\n');
  });
  it('trace stops runaway loops at the step limit', async () => {
    const t = await pyTrace('i = 0\nwhile True:\n    i += 1');
    expect(t.error?.message).toMatch(/лимит/);
  });
});

describe('javascript harness', () => {
  it('formats values like Node', () => {
    expect(inspect([1, 'a', { b: [2] }])).toBe("[ 1, 'a', { b: [ 2 ] } ]");
    expect(inspect(new Map([['a', 1]]))).toBe("Map(1) { 'a' => 1 }");
    class P { x = 1; }
    expect(inspect(new P())).toBe('P { x: 1 }');
    expect(inspect('top')).toBe('top');
  });
  it('runs in strict mode with shadowed globals and stdin', async () => {
    expect((await runJs('x = 5')).error?.type).toBe('ReferenceError');
    expect((await runJs('console.log(typeof fetch, typeof document)')).stdout).toBe('undefined undefined\n');
    expect((await runJs('console.log(prompt() + "!")', ['hi'])).stdout).toBe('hi!\n');
  });
  it('reports the learner line of runtime errors', async () => {
    const r = await runJs('const a = 1;\nconst b = null;\nb.x;');
    expect(r.error?.line).toBe(3);
  });
  it('supports async code and timers', async () => {
    const r = await runJs('setTimeout(() => console.log("b"), 5);\nconsole.log("a");\nawait new Promise((r) => setTimeout(r, 1));');
    expect(r.stdout).toBe('a\nb\n');
  });
  it('tests compare deeply and await promises', async () => {
    const res = await testJs('function f(){ return [1, {a: 2}]; }\nasync function g(){ return 3; }', [{ expr: 'f()', expect: '[1, {a: 2}]' }, { expr: 'g()', expect: '3' }, { expr: 'f()', expect: '[1]' }]);
    expect(res.map((r) => r.pass)).toEqual([true, true, false]);
    expect(deepEqual(NaN, NaN)).toBe(true);
    expect(deepEqual(1, '1')).toBe(false);
  });
});

describe('sql harness', () => {
  const setup = 'CREATE TABLE t(a INT, b TEXT); INSERT INTO t VALUES (1,"x"),(2,"y"),(3,NULL);';
  const hidden = 'CREATE TABLE t(a INT, b TEXT); INSERT INTO t VALUES (5,"z");';
  it('runs queries and reports errors', async () => {
    const SQL = await getSql();
    expect(runSql(SQL, setup, 'SELECT COUNT(*) FROM t').tables[0].rows).toEqual([[3]]);
    expect(runSql(SQL, setup, 'SELEC 1').error?.message).toMatch(/syntax error/);
  });
  it('compares results on visible and hidden datasets', async () => {
    const SQL = await getSql();
    const task = { setup, hiddenSetup: hidden, solution: 'SELECT a FROM t WHERE b IS NOT NULL' };
    expect(testSql(SQL, task, 'SELECT a FROM t WHERE b IS NOT NULL ORDER BY a DESC').every((r) => r.pass)).toBe(true);
    const hard = testSql(SQL, task, 'SELECT a FROM t WHERE a IN (1, 2)');
    expect(hard.map((r) => r.pass)).toEqual([true, false]);
    expect(testSql(SQL, { ...task, ordered: true }, 'SELECT a FROM t WHERE b IS NOT NULL ORDER BY a DESC')[0].pass).toBe(false);
  });
  it('checks DML through a follow-up query', async () => {
    const SQL = await getSql();
    const task = { setup, hiddenSetup: hidden, solution: 'UPDATE t SET b = "q" WHERE a > 1', check: 'SELECT a, b FROM t' };
    expect(testSql(SQL, task, 'UPDATE t SET b = "q" WHERE a >= 2').every((r) => r.pass)).toBe(true);
    expect(testSql(SQL, task, 'UPDATE t SET b = "q"').every((r) => r.pass)).toBe(false);
  });
});
