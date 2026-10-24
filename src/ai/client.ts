// Minimal OpenAI-compatible client: non-streaming chat completions and model listing.
// Requests go straight from the device to the configured provider; one request at a time.
import { normalizeBaseUrl, type AiConfig } from './config';

export type AiErrorKind = 'config' | 'auth' | 'rate' | 'server' | 'network' | 'timeout' | 'aborted' | 'bad-response';

export class AiError extends Error {
  kind: AiErrorKind;
  status?: number;
  constructor(kind: AiErrorKind, message: string, status?: number) {
    super(message);
    this.name = 'AiError';
    this.kind = kind;
    this.status = status;
  }
}

export interface ChatMessage { role: 'system' | 'user' | 'assistant'; content: string }
export interface ChatOptions { signal?: AbortSignal; timeoutMs?: number; maxTokens?: number; temperature?: number }
export interface ChatResult { text: string; model: string; ms: number }

export const DEFAULT_TIMEOUT_MS = 60_000;

/** Human-readable (Russian) message for an HTTP failure; an API-provided message is appended when short. */
export function mapHttpError(status: number, body?: string): AiError {
  let detail = '';
  try {
    const j = JSON.parse(body ?? '') as { error?: { message?: unknown } | string };
    const m = typeof j.error === 'string' ? j.error : j.error?.message;
    if (typeof m === 'string') detail = m.replace(/\s+/g, ' ').trim().slice(0, 160);
  } catch {
    /* body is not JSON */
  }
  const tail = detail ? ` (${detail})` : '';
  if (status === 401 || status === 403) return new AiError('auth', `Ключ не принят провайдером (${status}). Проверьте API-ключ и права доступа.${tail}`, status);
  if (status === 429) return new AiError('rate', `Слишком много запросов (429). Подождите немного и повторите.${tail}`, status);
  if (status === 404) return new AiError('bad-response', `Адрес или модель не найдены (404). Проверьте базовый URL и название модели.${tail}`, status);
  if (status === 400 || status === 422) return new AiError('bad-response', `Провайдер отклонил запрос (${status}).${tail}`, status);
  if (status >= 500) return new AiError('server', `Ошибка на стороне провайдера (${status}). Попробуйте позже.${tail}`, status);
  return new AiError('bad-response', `Неожиданный ответ провайдера (${status}).${tail}`, status);
}

/** Drop reasoning: `<think>…</think>` blocks (also an unopened leading one) and leftover tags. */
export function stripThinking(text: string): string {
  let t = text.replace(/<think(?:ing)?>[\s\S]*?<\/think(?:ing)?>/gi, '');
  const open = /<think(?:ing)?>/i.exec(t);
  if (open) t = t.slice(0, open.index); // unterminated block: everything after it is reasoning
  const close = /<\/think(?:ing)?>/i.exec(t);
  if (close) t = t.slice(close.index + close[0].length); // provider omitted the opening tag
  return t.trim();
}

// ---- concurrency 1: requests run strictly one after another ----
let chain: Promise<unknown> = Promise.resolve();
function enqueue<T>(job: () => Promise<T>, signal?: AbortSignal): Promise<T> {
  const run = chain.then(() => {
    if (signal?.aborted) throw new AiError('aborted', 'Запрос отменён.');
    return job();
  });
  chain = run.catch(() => undefined);
  return run;
}

async function request(cfg: Pick<AiConfig, 'baseUrl' | 'apiKey'>, path: string, init: { body?: unknown; signal?: AbortSignal; timeoutMs?: number }): Promise<unknown> {
  const url = `${normalizeBaseUrl(cfg.baseUrl)}${path}`;
  const ctl = new AbortController();
  let timedOut = false;
  const timer = setTimeout(() => { timedOut = true; ctl.abort(); }, init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  const onAbort = () => ctl.abort();
  init.signal?.addEventListener('abort', onAbort);
  try {
    const headers: Record<string, string> = { Accept: 'application/json' };
    if (cfg.apiKey.trim()) headers.Authorization = `Bearer ${cfg.apiKey.trim()}`;
    if (init.body !== undefined) headers['Content-Type'] = 'application/json';
    let res: Response;
    try {
      res = await fetch(url, { method: init.body === undefined ? 'GET' : 'POST', headers, body: init.body === undefined ? undefined : JSON.stringify(init.body), signal: ctl.signal, credentials: 'omit', referrerPolicy: 'no-referrer' });
    } catch (e) {
      if (timedOut) throw new AiError('timeout', 'Провайдер не ответил вовремя. Попробуйте ещё раз или выберите более быструю модель.');
      if (init.signal?.aborted || (e as { name?: string })?.name === 'AbortError') throw new AiError('aborted', 'Запрос отменён.');
      throw new AiError('network', 'Нет связи с провайдером. Проверьте интернет, адрес API и разрешение CORS на стороне провайдера.');
    }
    const text = await res.text().catch(() => '');
    if (!res.ok) throw mapHttpError(res.status, text);
    try {
      return JSON.parse(text);
    } catch {
      throw new AiError('bad-response', 'Провайдер вернул не JSON — проверьте базовый URL (обычно он оканчивается на /v1).');
    }
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', onAbort);
  }
}

export function chat(cfg: AiConfig, messages: ChatMessage[], opts: ChatOptions = {}): Promise<ChatResult> {
  return enqueue(async () => {
    const t0 = Date.now();
    const json = (await request(cfg, '/chat/completions', {
      signal: opts.signal,
      timeoutMs: opts.timeoutMs,
      body: { model: cfg.model, messages, temperature: opts.temperature ?? 0.3, max_tokens: opts.maxTokens ?? 1800, stream: false },
    })) as { model?: unknown; choices?: { message?: { content?: unknown } }[] };
    const raw = json?.choices?.[0]?.message?.content;
    // Only `content` is read: `reasoning_content` is deliberately ignored.
    const text = typeof raw === 'string' ? stripThinking(raw) : '';
    if (!text) throw new AiError('bad-response', 'Модель вернула пустой ответ (возможно, ей не хватило длины на «размышления»). Попробуйте ещё раз или другую модель.');
    return { text, model: typeof json.model === 'string' ? json.model : cfg.model, ms: Date.now() - t0 };
  }, opts.signal);
}

export function listModels(cfg: Pick<AiConfig, 'baseUrl' | 'apiKey'>, opts: ChatOptions = {}): Promise<string[]> {
  return enqueue(async () => {
    const json = (await request(cfg, '/models', { signal: opts.signal, timeoutMs: opts.timeoutMs ?? 20_000 })) as { data?: { id?: unknown }[] } | { id?: unknown }[];
    const rows = Array.isArray(json) ? json : json?.data;
    if (!Array.isArray(rows)) throw new AiError('bad-response', 'Провайдер не вернул список моделей. Введите название модели вручную.');
    return rows.map((m) => m?.id).filter((id): id is string => typeof id === 'string').sort((a, b) => a.localeCompare(b));
  }, opts.signal);
}

/** Connection test: one tiny completion; reports latency and the model the provider answered with. */
export async function testConnection(cfg: AiConfig, signal?: AbortSignal): Promise<ChatResult> {
  return chat(cfg, [{ role: 'user', content: 'Ответь одним словом: ок' }], { signal, timeoutMs: 30_000, maxTokens: 400, temperature: 0 });
}
