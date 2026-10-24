// Minimal OpenAI-compatible client for offline content tooling (never shipped in the app bundle).
// Config: LLM_BASE_URL / LLM_API_KEY env vars, or files given by LLM_BASE_FILE / LLM_KEY_FILE.
import { readFileSync, existsSync } from 'node:fs';

function conf(name: string, fileVar: string, fallbackFile: string): string {
  if (process.env[name]) return process.env[name]!;
  const f = process.env[fileVar] ?? fallbackFile;
  if (existsSync(f)) return readFileSync(f, 'utf8').trim();
  throw new Error(`${name} is not configured`);
}
const BASE = () => conf('LLM_BASE_URL', 'LLM_BASE_FILE', '/tmp/hoplite/.llm_base').replace(/\/$/, '');
const KEY = () => conf('LLM_API_KEY', 'LLM_KEY_FILE', '/tmp/hoplite/.llm_key');

export const MODELS = { deepseek: 'free-deepseek-4.1-flash', minimax: 'minimax-m3.1-flash' } as const;
export const otherModel = (m: string) => (m === MODELS.deepseek ? MODELS.minimax : MODELS.deepseek);

const MAX_PARALLEL = Number(process.env.LLM_PARALLEL ?? 4); // provider allows 6 concurrent requests per key
let active = 0;
const waiters: (() => void)[] = [];
async function acquire() {
  while (active >= MAX_PARALLEL) await new Promise<void>((r) => waiters.push(r));
  active++;
}
function release() {
  active--;
  waiters.shift()?.();
}

export const stats = { requests: 0, retries: 0, failures: 0, promptTokens: 0, completionTokens: 0 };

export interface ChatOpts {
  model: string;
  system?: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
  /** Without an explicit effort these reasoning models can spend the whole max_tokens budget thinking. */
  effort?: 'low' | 'medium' | 'high';
}

export async function chat(o: ChatOpts): Promise<string> {
  let effort = o.effort ?? (process.env.LLM_EFFORT as ChatOpts['effort']) ?? 'medium';
  const body = () => JSON.stringify({
    model: o.model,
    messages: [...(o.system ? [{ role: 'system', content: o.system }] : []), { role: 'user', content: o.user }],
    max_tokens: o.maxTokens ?? 8000,
    temperature: o.temperature ?? 0.3,
    reasoning_effort: effort,
  });
  let lastError = '';
  let throttled = 0;
  for (let attempt = 0; attempt < 5; attempt++) {
    await acquire();
    let status = 0;
    try {
      stats.requests++;
      const res = await fetch(`${BASE()}/chat/completions`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${KEY()}`, 'Content-Type': 'application/json' },
        body: body(),
        signal: AbortSignal.timeout(300_000),
      });
      status = res.status;
      if (!res.ok) lastError = `HTTP ${res.status}: ${(await res.text()).slice(0, 200)}`;
      if (res.ok) {
        const j = (await res.json()) as { choices?: { message?: { content?: string } }[]; usage?: { prompt_tokens?: number; completion_tokens?: number } };
        stats.promptTokens += j.usage?.prompt_tokens ?? 0;
        stats.completionTokens += j.usage?.completion_tokens ?? 0;
        const choice = (j.choices?.[0] ?? {}) as { message?: { content?: string }; finish_reason?: string };
        const text = choice.message?.content ?? '';
        if (text.trim()) return text.replace(/<think>[\s\S]*?<\/think>/g, '').trim();
        lastError = `empty content (finish_reason=${choice.finish_reason}, effort=${effort})`;
        if (choice.finish_reason === 'length') effort = 'low';
      }
    } catch (e) {
      lastError = `network: ${(e as Error).message}`;
    } finally {
      release();
    }
    // 429 = provider-side concurrency limit (6 per key, counted until upstream requests finish): wait, don't burn attempts.
    if (status === 429 && throttled++ < 200) {
      attempt--;
      await new Promise((r) => setTimeout(r, 3000 + Math.random() * 5000));
      continue;
    }
    stats.retries++;
    if (process.env.LLM_DEBUG) console.error(`[llm] ${o.model} attempt ${attempt + 1}: ${lastError}`);
    await new Promise((r) => setTimeout(r, 2000 * (attempt + 1)));
  }
  stats.failures++;
  throw new Error(`LLM request failed after retries (${o.model}): ${lastError}`);
}

/** Extract the first JSON value (object or array) from a model reply, tolerating ```json fences. */
export function extractJson<T>(text: string): T {
  const fence = /```(?:json)?\s*\n([\s\S]*?)```/.exec(text);
  const candidates = fence ? [fence[1], text] : [text];
  let lastErr: unknown = new Error('no JSON in reply');
  for (const src of candidates) {
    const start = src.search(/[[{]/);
    if (start < 0) continue;
    const open = src[start];
    const close = open === '[' ? ']' : '}';
    let depth = 0, inStr = false, esc = false;
    for (let i = start; i < src.length; i++) {
      const c = src[i];
      if (inStr) { if (esc) esc = false; else if (c === '\\') esc = true; else if (c === '"') inStr = false; continue; }
      if (c === '"') inStr = true;
      else if (c === open) depth++;
      else if (c === close && --depth === 0) {
        try { return JSON.parse(src.slice(start, i + 1)) as T; } catch (e) { lastErr = e; break; }
      }
    }
  }
  throw lastErr;
}

export async function chatJson<T>(o: ChatOpts, tries = 3): Promise<T> {
  let last: unknown;
  for (let i = 0; i < tries; i++) {
    const text = await chat({ ...o, user: i ? `${o.user}\n\nВажно: ответ должен быть строго валидным JSON без комментариев.` : o.user });
    try { return extractJson<T>(text); } catch (e) { last = e; }
  }
  throw last;
}
