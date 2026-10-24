// Node-side runtimes for tests: the same Pyodide build, harness and sql.js engine the browser uses.
import { readFileSync } from 'node:fs';
import { loadPyodide, type PyodideAPI } from 'pyodide';
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import type { TestCase } from '../../src/core/types';
import type { RunResult, TestResult, TraceResult } from '../../src/runner/types';

let py: Promise<PyodideAPI> | null = null;
let sql: Promise<SqlJsStatic> | null = null;

export function getPython() {
  py ??= (async () => {
    const p = await loadPyodide();
    p.runPython(readFileSync(new URL('../../src/runner/harness.py', import.meta.url), 'utf8'));
    return p;
  })();
  return py;
}

export function getSql() {
  sql ??= initSqlJs();
  return sql;
}

async function call<T>(req: object): Promise<T> {
  const p = await getPython();
  const fn = p.globals.get('__ll_main');
  try {
    return JSON.parse(fn(JSON.stringify(req)) as string) as T;
  } finally {
    fn.destroy();
  }
}

export const pyRun = (code: string, stdin: string[] = []) => call<RunResult>({ mode: 'run', code, stdin });
export const pyTest = async (code: string, tests: TestCase[]) => (await call<{ results: TestResult[] }>({ mode: 'test', code, tests })).results;
export const pyTrace = (code: string, stdin: string[] = []) => call<TraceResult>({ mode: 'trace', code, stdin });
