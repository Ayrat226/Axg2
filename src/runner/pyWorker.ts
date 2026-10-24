/// <reference lib="webworker" />
// Python worker: Pyodide + harness. Network/storage APIs are removed after the runtime has loaded,
// and the main thread terminates this worker on timeout.
import harness from './harness.py?raw';

interface PyodideLike {
  runPython(code: string): unknown;
  globals: { get(name: string): ((arg: string) => string) & { destroy?: () => void } };
}

let py: PyodideLike | null = null;

function lockdown() {
  const g = self as unknown as Record<string, unknown>;
  for (const k of ['fetch', 'XMLHttpRequest', 'WebSocket', 'EventSource', 'indexedDB', 'caches', 'BroadcastChannel', 'importScripts']) {
    try { g[k] = undefined; } catch { /* non-writable */ }
  }
}

self.onmessage = async (ev: MessageEvent) => {
  const { id, type, payload } = ev.data as { id: number; type: string; payload: Record<string, unknown> };
  try {
    if (type === 'init') {
      if (!py) {
        const base = payload.base as string;
        const mod = (await import(/* @vite-ignore */ `${base}pyodide.mjs`)) as { loadPyodide: (o: object) => Promise<PyodideLike> };
        py = await mod.loadPyodide({ indexURL: base, stdout: () => {}, stderr: () => {} });
        py.runPython(harness);
        lockdown();
      }
      postMessage({ id, ok: true, result: null });
      return;
    }
    if (!py) throw new Error('Python не загружен');
    const fn = py.globals.get('__ll_main');
    const out = fn(JSON.stringify({ mode: type, ...payload }));
    fn.destroy?.();
    postMessage({ id, ok: true, result: JSON.parse(out) });
  } catch (e) {
    postMessage({ id, ok: false, error: e instanceof Error ? e.message : String(e) });
  }
};
