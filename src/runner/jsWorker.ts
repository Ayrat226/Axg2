/// <reference lib="webworker" />
// JavaScript + SQL worker. sql.js is initialised before user code runs, then network APIs are removed.
import initSqlJs, { type SqlJsStatic } from 'sql.js';
import { runJs, testJs } from './jsHarness';
import { runSql, testSql, type SqlTask } from './sqlHarness';
import type { TestCase } from '../core/types';

let SQL: SqlJsStatic | null = null;

function lockdown() {
  const g = self as unknown as Record<string, unknown>;
  for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'BroadcastChannel', 'importScripts']) {
    try { g[k] = undefined; } catch { /* non-writable */ }
  }
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, payload } = ev.data as { id: number; type: string; payload: Record<string, unknown> };
  try {
    let result: unknown = null;
    switch (type) {
      case 'init':
        if (!SQL) {
          const base = payload.base as string;
          SQL = await initSqlJs({ locateFile: (f: string) => `${base}${f}` });
          lockdown();
        }
        break;
      case 'run':
        result = await runJs(payload.code as string, (payload.stdin as string[]) ?? []);
        break;
      case 'test':
        result = { results: await testJs(payload.code as string, payload.tests as TestCase[]) };
        break;
      case 'sql-run':
        result = runSql(SQL!, payload.setup as string | undefined, payload.code as string);
        break;
      case 'sql-test':
        result = { results: testSql(SQL!, payload.task as SqlTask, payload.code as string) };
        break;
      default:
        throw new Error(`unknown request ${type}`);
    }
    postMessage({ id, ok: true, result });
  } catch (e) {
    postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
