// SQL harness on top of sql.js (SQLite compiled to WASM). Shared by the worker and content tests.
import type { Database, SqlJsStatic } from 'sql.js';
import type { RunError, SqlRunResult, SqlTable, TestResult } from './types';

export interface SqlTask {
  setup?: string;
  hiddenSetup?: string;
  solution: string;
  check?: string;
  ordered?: boolean;
}

function sqlError(e: unknown): RunError {
  const message = e instanceof Error ? e.message : String(e);
  return { type: 'SQLError', message, line: null, traceback: message };
}

function exec(db: Database, sql: string): SqlTable[] {
  return db.exec(sql).map((r) => ({ columns: r.columns, rows: r.values as unknown[][] }));
}

export function runSql(SQL: SqlJsStatic, setup: string | undefined, sql: string): SqlRunResult {
  const db = new SQL.Database();
  try {
    if (setup) db.exec(setup);
    return { tables: exec(db, sql), error: null };
  } catch (e) {
    return { tables: [], error: sqlError(e) };
  } finally {
    db.close();
  }
}

function canon(v: unknown): unknown {
  if (typeof v === 'number' && !Number.isInteger(v)) return Math.round(v * 1e6) / 1e6;
  return v;
}

function resultOf(SQL: SqlJsStatic, setup: string | undefined, sql: string, check?: string): SqlTable {
  const db = new SQL.Database();
  try {
    if (setup) db.exec(setup);
    const tables = exec(db, sql);
    if (check) return exec(db, check)[0] ?? { columns: [], rows: [] };
    return tables[tables.length - 1] ?? { columns: [], rows: [] };
  } finally {
    db.close();
  }
}

export function formatTable(t: SqlTable, max = 8): string {
  if (!t.columns.length) return '(пустой результат)';
  const head = t.columns.join(' | ');
  const rows = t.rows.slice(0, max).map((r) => r.map((v) => (v === null ? 'NULL' : String(v))).join(' | '));
  const more = t.rows.length > max ? `\n… ещё ${t.rows.length - max}` : '';
  return [head, ...rows].join('\n') + more;
}

export function sameResult(a: SqlTable, b: SqlTable, ordered: boolean): boolean {
  if (a.columns.length !== b.columns.length || a.rows.length !== b.rows.length) return false;
  const ra = a.rows.map((r) => JSON.stringify(r.map(canon)));
  const rb = b.rows.map((r) => JSON.stringify(r.map(canon)));
  if (!ordered) { ra.sort(); rb.sort(); }
  return ra.every((x, i) => x === rb[i]);
}

export function testSql(SQL: SqlJsStatic, task: SqlTask, userSql: string): TestResult[] {
  const datasets: { setup?: string; hidden: boolean; label: string }[] = [
    { setup: task.setup, hidden: false, label: 'основные данные' },
  ];
  if (task.hiddenSetup) datasets.push({ setup: task.hiddenSetup, hidden: true, label: 'другой набор данных (скрытый)' });
  return datasets.map(({ setup, hidden, label }) => {
    const expected = resultOf(SQL, setup, task.solution, task.check);
    const r: TestResult = { kind: 'sql', hidden, label, pass: false, expected: formatTable(expected) };
    try {
      const actual = resultOf(SQL, setup, userSql, task.check);
      r.actual = formatTable(actual);
      r.pass = sameResult(actual, expected, !!task.ordered);
    } catch (e) {
      r.error = sqlError(e);
    }
    return r;
  });
}
