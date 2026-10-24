// JavaScript harness: runs learner code inside an async function with dangerous globals shadowed.
// Shared by the browser worker and the content tests (Node). The real isolation boundary is the
// dedicated Web Worker (no DOM, no localStorage) that is terminated on timeout.
import type { TestCase } from '../core/types';
import type { RunError, RunResult, TestResult } from './types';

const SHADOWED = [
  'fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'importScripts', 'indexedDB', 'caches',
  'BroadcastChannel', 'Worker', 'SharedWorker', 'localStorage', 'sessionStorage', 'document',
  'window', 'self', 'globalThis', 'postMessage', 'close', 'navigator', 'process', 'require',
];

// eslint-disable-next-line @typescript-eslint/no-empty-function
const AsyncFunction = Object.getPrototypeOf(async function () {}).constructor as new (
  ...args: string[]
) => (...a: unknown[]) => Promise<unknown>;

const MAX_OUT = 20000;

// ---------- Node-like value formatting (deterministic, used for console.log and test output) ----------
export function inspect(v: unknown, depth = 0, nested = false): string {
  if (typeof v === 'string') return nested ? `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\n/g, '\\n')}'` : v;
  if (typeof v === 'number') return Object.is(v, -0) ? '-0' : String(v);
  if (typeof v === 'bigint') return `${v}n`;
  if (v === undefined || v === null || typeof v === 'boolean') return String(v);
  if (typeof v === 'symbol') return v.toString();
  if (typeof v === 'function') {
    if (/^class\s/.test(Function.prototype.toString.call(v))) return `[class ${v.name || '(anonymous)'}]`;
    return v.name ? `[Function: ${v.name}]` : '[Function (anonymous)]';
  }
  if (v instanceof Error) return `${v.name}: ${v.message}`;
  if (depth > 2) return Array.isArray(v) ? '[Array]' : '[Object]';
  if (Array.isArray(v)) {
    if (v.length === 0) return '[]';
    const items: string[] = [];
    let holes = 0;
    for (let i = 0; i < v.length; i++) {
      if (!(i in v)) { holes++; continue; }
      if (holes) { items.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`); holes = 0; }
      items.push(inspect(v[i], depth + 1, true));
    }
    if (holes) items.push(`<${holes} empty item${holes > 1 ? 's' : ''}>`);
    return `[ ${items.join(', ')} ]`;
  }
  if (v instanceof Map) {
    if (v.size === 0) return 'Map(0) {}';
    return `Map(${v.size}) { ${[...v].map(([k, val]) => `${inspect(k, depth + 1, true)} => ${inspect(val, depth + 1, true)}`).join(', ')} }`;
  }
  if (v instanceof Set) {
    if (v.size === 0) return 'Set(0) {}';
    return `Set(${v.size}) { ${[...v].map((x) => inspect(x, depth + 1, true)).join(', ')} }`;
  }
  if (v instanceof Promise) return 'Promise { <pending> }';
  if (v instanceof Date) return v.toISOString();
  const obj = v as Record<string, unknown>;
  const proto = Object.getPrototypeOf(obj);
  const ctor = proto && proto !== Object.prototype && proto.constructor?.name ? `${proto.constructor.name} ` : proto === null ? '[Object: null prototype] ' : '';
  const keys = Object.keys(obj);
  if (keys.length === 0) return `${ctor}{}`;
  const body = keys
    .map((k) => `${/^[A-Za-z_$][\w$]*$/.test(k) ? k : `'${k}'`}: ${inspect(obj[k], depth + 1, true)}`)
    .join(', ');
  return `${ctor}{ ${body} }`;
}

// ---------- strict deep equality for tests ----------
export function deepEqual(a: unknown, b: unknown): boolean {
  if (typeof a === 'number' && typeof b === 'number') {
    if (Number.isNaN(a) && Number.isNaN(b)) return true;
    if (Number.isInteger(a) && Number.isInteger(b)) return a === b;
    return Math.abs(a - b) <= 1e-9 * Math.max(1, Math.abs(a), Math.abs(b));
  }
  if (typeof a !== typeof b) return false;
  if (a === b) return true;
  if (a === null || b === null || typeof a !== 'object') return false;
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (Array.isArray(a) && Array.isArray(b)) return a.length === b.length && a.every((x, i) => deepEqual(x, b[i]));
  if (a instanceof Map && b instanceof Map) {
    if (a.size !== b.size) return false;
    for (const [k, v] of a) if (!b.has(k) || !deepEqual(v, b.get(k))) return false;
    return true;
  }
  if (a instanceof Set && b instanceof Set) {
    if (a.size !== b.size) return false;
    for (const v of a) if (!b.has(v)) return false;
    return true;
  }
  const ka = Object.keys(a as object), kb = Object.keys(b as object);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k]));
}

let lineOffset: number | null = null;
function calibrate(): number {
  if (lineOffset !== null) return lineOffset;
  try {
    // body line 1 is "use strict", the throw is on body line 2
    new Function(...SHADOWED, '"use strict";\nthrow new Error("x")')();
  } catch (e) {
    const m = /(?:<anonymous>|Function):(\d+):\d+/.exec(String((e as Error).stack));
    lineOffset = m ? Number(m[1]) - 2 : 2;
  }
  return lineOffset ?? 2;
}

function toRunError(e: unknown): RunError {
  if (e instanceof Error) {
    const off = calibrate();
    const m = /(?:<anonymous>|Function):(\d+):\d+/.exec(String(e.stack));
    const line = m ? Number(m[1]) - off - 1 : null; // -1 for the "use strict" line
    return { type: e.name, message: e.message, line: line && line > 0 ? line : null, traceback: `${e.name}: ${e.message}` };
  }
  return { type: 'Uncaught', message: inspect(e, 0, true), line: null, traceback: `Uncaught ${inspect(e, 0, true)}` };
}

interface Sandbox {
  stdout: () => string;
  run: () => Promise<((expr: string) => unknown) | undefined>;
}

function makeSandbox(code: string, stdin: string[]): Sandbox {
  let out = '';
  const write = (s: string) => { if (out.length < MAX_OUT) out += s; };
  const log = (...args: unknown[]) => write(args.map((a) => inspect(a)).join(' ') + '\n');
  const consoleShim = { log, info: log, warn: log, error: log, debug: log, table: log };
  const queue = [...stdin];
  const prompt = (msg?: string) => {
    if (msg) write(String(msg));
    const line = queue.shift();
    if (line === undefined) throw new Error('prompt(): данные для ввода закончились');
    return line;
  };
  const timers = new Set<ReturnType<typeof setTimeout>>();
  const st = (fn: () => void, ms = 0) => {
    const id = setTimeout(() => { timers.delete(id); fn(); }, Math.min(Number(ms) || 0, 2000));
    timers.add(id);
    return id;
  };
  const ct = (id: ReturnType<typeof setTimeout>) => { clearTimeout(id); timers.delete(id); };
  const params = ['console', 'prompt', 'setTimeout', 'clearTimeout', ...SHADOWED];
  const body = `"use strict";\n${code}\n;return (__llExpr) => eval(__llExpr);`;
  return {
    stdout: () => out,
    run: async () => {
      const fn = new AsyncFunction(...params, body);
      const evaluator = (await fn(consoleShim, prompt, st, ct, ...SHADOWED.map(() => undefined))) as (e: string) => unknown;
      const started = Date.now();
      while (timers.size && Date.now() - started < 3000) await new Promise((r) => setTimeout(r, 5));
      return evaluator;
    },
  };
}

export async function runJs(code: string, stdin: string[] = []): Promise<RunResult> {
  const sb = makeSandbox(code, stdin);
  try {
    await sb.run();
    return { stdout: sb.stdout(), error: null };
  } catch (e) {
    return { stdout: sb.stdout(), error: toRunError(e) };
  }
}

const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n+$/, '');

export async function testJs(code: string, tests: TestCase[]): Promise<TestResult[]> {
  const results: TestResult[] = [];
  for (const t of tests) {
    const base = { hidden: !!t.hidden, label: t.label, pass: false };
    const sb = makeSandbox(code, t.stdin ?? []);
    if (t.stdout !== undefined) {
      let error: RunError | undefined;
      try { await sb.run(); } catch (e) { error = toRunError(e); }
      results.push({ ...base, kind: 'stdout', stdin: t.stdin ?? [], expected: t.stdout, actual: sb.stdout(), error, pass: !error && norm(sb.stdout()) === norm(t.stdout) });
      continue;
    }
    const r: TestResult = { ...base, kind: 'expr', expr: t.expr, expected: t.expect ?? '' };
    try {
      const evaluate = await sb.run();
      // eslint-disable-next-line no-new-func
      const expected = new Function(`"use strict"; return (${t.expect});`)();
      let actual = evaluate!(t.expr!);
      if (actual instanceof Promise) actual = await actual;
      r.actual = inspect(actual, 0, true);
      r.pass = deepEqual(actual, expected);
    } catch (e) {
      r.error = toRunError(e);
    }
    results.push(r);
  }
  return results;
}
