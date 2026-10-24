// AI tutor configuration. Stored ONLY under its own localStorage key — never inside AppState/settings,
// so the API key can't leak through export files.
import { useSyncExternalStore } from 'react';

export const AI_KEY = 'learnlab:ai';

export interface AiConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  model: string;
}
export interface AiStore {
  config: AiConfig;
  feedback: { up: number; down: number };
}

export const DEFAULT_AI: AiStore = { config: { enabled: false, baseUrl: '', apiKey: '', model: '' }, feedback: { up: 0, down: 0 } };

/** `https://x.com/v1/` and `https://x.com/v1/chat/completions` both become `https://x.com/v1`. */
export function normalizeBaseUrl(raw: string): string {
  return raw.trim().replace(/\/+$/, '').replace(/\/(chat\/completions|models)$/, '').replace(/\/+$/, '');
}

export function isLocalHost(host: string): boolean {
  return host === 'localhost' || host === '127.0.0.1' || host === '[::1]' || host.endsWith('.localhost');
}

/** Returns an error text for an unusable URL, or null. */
export function validateBaseUrl(raw: string): string | null {
  const u = normalizeBaseUrl(raw);
  if (!u) return 'Укажите адрес API.';
  let url: URL;
  try {
    url = new URL(u);
  } catch {
    return 'Адрес должен выглядеть как https://example.com/v1';
  }
  if (url.protocol === 'https:') return null;
  if (url.protocol === 'http:' && isLocalHost(url.hostname)) return null;
  return 'Разрешены только https:// (или http://localhost для локальных моделей).';
}

export function hostOf(baseUrl: string): string {
  try {
    return new URL(normalizeBaseUrl(baseUrl)).host;
  } catch {
    return '';
  }
}

/** Enabled and complete: an address, a model and (for non-local providers) a key. */
export function isConfigured(c: AiConfig): boolean {
  if (!c.enabled || !c.model.trim() || validateBaseUrl(c.baseUrl)) return false;
  return !!c.apiKey.trim() || isLocalHost(new URL(normalizeBaseUrl(c.baseUrl)).hostname);
}

function parse(raw: string | null): AiStore {
  try {
    const j = JSON.parse(raw ?? '{}') as Partial<AiStore>;
    const c = (j.config ?? {}) as Partial<AiConfig>;
    const f = (j.feedback ?? {}) as Partial<AiStore['feedback']>;
    return {
      config: {
        enabled: c.enabled === true,
        baseUrl: typeof c.baseUrl === 'string' ? c.baseUrl : '',
        apiKey: typeof c.apiKey === 'string' ? c.apiKey : '',
        model: typeof c.model === 'string' ? c.model : '',
      },
      feedback: { up: Math.max(0, Number(f.up) || 0), down: Math.max(0, Number(f.down) || 0) },
    };
  } catch {
    return structuredClone(DEFAULT_AI);
  }
}

let cache: AiStore | null = null;
const listeners = new Set<() => void>();

function read(): AiStore {
  if (!cache) {
    try {
      cache = parse(localStorage.getItem(AI_KEY));
    } catch {
      cache = structuredClone(DEFAULT_AI);
    }
  }
  return cache;
}

function write(next: AiStore) {
  cache = next;
  try {
    localStorage.setItem(AI_KEY, JSON.stringify(next));
  } catch {
    /* private mode or full storage: keep the in-memory copy for this session */
  }
  listeners.forEach((l) => l());
}

export const getAiStore = (): AiStore => read();
export const getAiConfig = (): AiConfig => read().config;

export function saveAiConfig(patch: Partial<AiConfig>) {
  const cur = read();
  const config = { ...cur.config, ...patch };
  if (patch.baseUrl !== undefined) config.baseUrl = patch.baseUrl.trim();
  write({ ...cur, config });
}

export function recordAiFeedback(kind: 'up' | 'down') {
  const cur = read();
  write({ ...cur, feedback: { ...cur.feedback, [kind]: cur.feedback[kind] + 1 } });
}

/** Wipe the key and settings (feedback counters stay). */
export function clearAiConfig() {
  write({ ...read(), config: { ...DEFAULT_AI.config } });
}

function subscribe(l: () => void) {
  listeners.add(l);
  const onStorage = (e: StorageEvent) => {
    if (e.key === AI_KEY) {
      cache = null;
      l();
    }
  };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(l);
    window.removeEventListener('storage', onStorage);
  };
}

export function useAiStore(): AiStore {
  return useSyncExternalStore(subscribe, read, () => DEFAULT_AI);
}
export const useAiConfig = (): AiConfig => useAiStore().config;
/** The config when AI helpers should be offered, otherwise null. */
export function useAiReady(): AiConfig | null {
  const c = useAiConfig();
  return isConfigured(c) ? c : null;
}

/** Test hook: drop the in-memory cache so the next read hits localStorage. */
export function resetAiCache() {
  cache = null;
}
