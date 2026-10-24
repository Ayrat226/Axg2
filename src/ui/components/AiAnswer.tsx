// Shared pieces of the optional AI tutor UI: the labelled answer with local 👍/👎 feedback and the request status line.
import { useState } from 'react';
import { recordAiFeedback, hostOf, type AiConfig } from '../../ai/config';
import type { AiRequestState } from '../../ai/useAiRequest';
import { Markdown } from './Markdown';

export function AiAnswer({ text, filtered, model, ms }: { text: string; filtered?: boolean; model?: string; ms?: number }) {
  const [vote, setVote] = useState<'up' | 'down' | null>(null);
  const send = (v: 'up' | 'down') => {
    if (vote) return;
    recordAiFeedback(v);
    setVote(v);
  };
  return (
    <div className="ai-answer stack tight" data-testid="ai-answer">
      <div className="row tight">
        <span className="chip warn" data-testid="ai-label">🤖 Ответ AI — может содержать ошибки</span>
        {filtered && <span className="chip" data-testid="ai-filtered">🔒 часть кода скрыта</span>}
        {model && <span className="tiny muted">{model}{ms ? ` · ${(ms / 1000).toFixed(1)} с` : ''}</span>}
      </div>
      <Markdown text={text} />
      <div className="row tight" role="group" aria-label="Оценка ответа AI">
        <span className="tiny muted">{vote ? 'Спасибо, оценка сохранена на устройстве.' : 'Ответ помог?'}</span>
        <button className="btn sm ghost" disabled={!!vote} aria-pressed={vote === 'up'} aria-label="Полезно" onClick={() => send('up')}>👍</button>
        <button className="btn sm ghost" disabled={!!vote} aria-pressed={vote === 'down'} aria-label="Не помогло" onClick={() => send('down')}>👎</button>
      </div>
    </div>
  );
}

export function AiStatus({ state, onCancel }: { state: AiRequestState; onCancel: () => void }) {
  if (state.status === 'loading') {
    return (
      <div className="row tight" role="status" aria-live="polite" data-testid="ai-loading">
        <span className="pulse" aria-hidden="true">🤖</span><span className="small">AI думает…</span>
        <button className="btn sm ghost" onClick={onCancel}>Отмена</button>
      </div>
    );
  }
  if (state.status === 'error') {
    return <div className="card feedback bad small" role="alert" data-testid="ai-error">⚠ {state.message}</div>;
  }
  return null;
}

export function AiPrivacyNote({ cfg }: { cfg: AiConfig }) {
  return <span className="tiny muted">Код и текст вопроса уйдут напрямую на {hostOf(cfg.baseUrl)}.</span>;
}
