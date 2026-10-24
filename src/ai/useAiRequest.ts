import { useCallback, useEffect, useRef, useState } from 'react';
import { chat, AiError, type ChatMessage } from './client';
import type { AiConfig } from './config';
import { guardReply, type GuardOptions } from './guardrails';

export type AiRequestState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'done'; text: string; filtered: boolean; model: string; ms: number };

/** One AI call with cancel, unmount-abort and the reply guard applied. Resolves to the guarded reply or null. */
export function useAiRequest() {
  const [state, setState] = useState<AiRequestState>({ status: 'idle' });
  const ctl = useRef<AbortController | null>(null);
  useEffect(() => () => ctl.current?.abort(), []);

  const run = useCallback(async (cfg: AiConfig, messages: ChatMessage[], guard?: GuardOptions) => {
    ctl.current?.abort();
    const c = new AbortController();
    ctl.current = c;
    setState({ status: 'loading' });
    try {
      const r = await chat(cfg, messages, { signal: c.signal });
      const g = guardReply(r.text, guard);
      const done = { status: 'done', text: g.text, filtered: g.filtered, model: r.model, ms: r.ms } as const;
      if (!c.signal.aborted) setState(done);
      return done;
    } catch (e) {
      if (e instanceof AiError && e.kind === 'aborted') {
        if (ctl.current === c) setState({ status: 'idle' });
        return null;
      }
      if (!c.signal.aborted) setState({ status: 'error', message: e instanceof AiError ? e.message : 'Не удалось получить ответ AI.' });
      return null;
    }
  }, []);

  const cancel = useCallback(() => ctl.current?.abort(), []);
  const reset = useCallback(() => setState({ status: 'idle' }), []);
  return { state, run, cancel, reset };
}
