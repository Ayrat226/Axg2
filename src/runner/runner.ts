// Main-thread client for the code workers: lazy start, per-call timeout, terminate-and-restart on hang.
import type { Lang, TestCase } from '../core/types';
import type { RunResult, SqlRunResult, TestResult, TraceResult } from './types';
import type { SqlTask } from './sqlHarness';

export type RuntimeStatus = 'idle' | 'loading' | 'ready' | 'error';
type Listener = (s: Record<'python' | 'js', RuntimeStatus>) => void;

const statuses: Record<'python' | 'js', RuntimeStatus> = { python: 'idle', js: 'idle' };
const listeners = new Set<Listener>();
export function onRuntimeStatus(l: Listener) {
  listeners.add(l);
  l({ ...statuses });
  return () => listeners.delete(l);
}
function setStatus(k: 'python' | 'js', s: RuntimeStatus) {
  statuses[k] = s;
  listeners.forEach((l) => l({ ...statuses }));
}

export class TimeoutError extends Error {}

class Host {
  private worker: Worker | null = null;
  private ready: Promise<void> | null = null;
  private seq = 0;
  private pending = new Map<number, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  constructor(
    private key: 'python' | 'js',
    private make: () => Worker,
    private base: string,
  ) {}

  private start(): Promise<void> {
    if (this.ready) return this.ready;
    setStatus(this.key, 'loading');
    const w = this.make();
    this.worker = w;
    w.onmessage = (ev) => {
      const { id, ok, result, error } = ev.data as { id: number; ok: boolean; result: unknown; error: string };
      const p = this.pending.get(id);
      if (!p) return; // ignore anything not answering a request we made
      this.pending.delete(id);
      if (ok) p.resolve(result);
      else p.reject(new Error(error));
    };
    w.onerror = (e) => {
      setStatus(this.key, 'error');
      this.pending.forEach((p) => p.reject(new Error(e.message || 'Сбой исполнителя кода')));
      this.pending.clear();
      this.kill();
    };
    this.ready = this.send('init', { base: this.base }, 120_000).then(
      () => setStatus(this.key, 'ready'),
      (e) => {
        setStatus(this.key, 'error');
        this.kill();
        throw e;
      },
    );
    return this.ready;
  }

  private send(type: string, payload: object, timeoutMs: number): Promise<unknown> {
    const id = ++this.seq;
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        if (!this.pending.has(id)) return;
        this.pending.delete(id);
        this.kill();
        setStatus(this.key, 'idle');
        reject(new TimeoutError(`Превышено время выполнения (${Math.round(timeoutMs / 1000)} с)`));
      }, timeoutMs);
      this.pending.set(id, {
        resolve: (v) => { clearTimeout(timer); resolve(v); },
        reject: (e) => { clearTimeout(timer); reject(e); },
      });
      this.worker!.postMessage({ id, type, payload });
    });
  }

  kill() {
    this.worker?.terminate();
    this.worker = null;
    this.ready = null;
    this.pending.forEach((p) => p.reject(new Error('Исполнитель перезапущен')));
    this.pending.clear();
  }

  async call<T>(type: string, payload: object, timeoutMs: number): Promise<T> {
    await this.start();
    return (await this.send(type, payload, timeoutMs)) as T;
  }

  warm() {
    return this.start();
  }
}

const baseUrl = (dir: string) => new URL(`./${dir}/`, document.baseURI).href;
let py: Host | null = null;
let js: Host | null = null;
const pyHost = () => (py ??= new Host('python', () => new Worker(new URL('./pyWorker.ts', import.meta.url), { type: 'module' }), baseUrl('pyodide')));
const jsHost = () => (js ??= new Host('js', () => new Worker(new URL('./jsWorker.ts', import.meta.url), { type: 'module' }), baseUrl('sqljs')));

export let timeoutMs = 6000;
export function setTimeoutSec(sec: number) {
  timeoutMs = sec * 1000;
}

function timeoutResult(e: unknown): RunResult {
  const timeout = e instanceof TimeoutError;
  return {
    stdout: '',
    error: { type: timeout ? 'Timeout' : 'RunnerError', message: e instanceof Error ? e.message : String(e), line: null, traceback: '' },
  };
}

export function warmup(lang: Lang) {
  return (lang === 'python' ? pyHost() : jsHost()).warm().catch(() => {});
}

export async function runCode(lang: Lang, code: string, stdin: string[] = [], setup?: string): Promise<RunResult & { tables?: SqlRunResult['tables'] }> {
  try {
    if (lang === 'python') return await pyHost().call<RunResult>('run', { code, stdin }, timeoutMs);
    if (lang === 'javascript') return await jsHost().call<RunResult>('run', { code, stdin }, timeoutMs);
    const r = await jsHost().call<SqlRunResult>('sql-run', { code, setup }, timeoutMs);
    return { stdout: '', error: r.error, tables: r.tables };
  } catch (e) {
    return timeoutResult(e);
  }
}

export async function testCode(lang: Lang, code: string, tests: TestCase[], sqlTask?: SqlTask): Promise<{ results: TestResult[]; error?: RunResult['error'] }> {
  try {
    if (lang === 'python') return await pyHost().call('test', { code, tests }, timeoutMs * 2);
    if (lang === 'javascript') return await jsHost().call('test', { code, tests }, timeoutMs * 2);
    return await jsHost().call('sql-test', { code, task: sqlTask }, timeoutMs);
  } catch (e) {
    return { results: [], error: timeoutResult(e).error };
  }
}

export async function traceCode(code: string, stdin: string[] = []): Promise<TraceResult> {
  try {
    return await pyHost().call<TraceResult>('trace', { code, stdin }, timeoutMs * 2);
  } catch (e) {
    return { steps: [], stdout: '', error: timeoutResult(e).error };
  }
}
