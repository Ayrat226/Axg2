// Renders a personalised explanation of an error or a wrong result, following feedback settings.
import { useEffect, useState } from 'react';
import { explainError, explainWrongResult, shape, type Explanation } from '../../core/feedback';
import type { Lang } from '../../core/types';
import type { RunError, TestResult } from '../../runner/types';
import { useApp } from '../../state/store';
import { Inline } from './Markdown';
import { AiAskError, type AiErrorContext } from './AiAskError';

const CAT: Record<Explanation['category'], string> = {
  syntax: 'Синтаксис', runtime: 'Выполнение', logic: 'Логика', edge: 'Граничный случай', timeout: 'Таймаут', output: 'Вывод',
};

export interface AiAsk { errorType: string; errorMessage: string; code: string; ctx?: AiErrorContext }

export function ExplanationView({ e, raw, aiAsk }: { e: Explanation; raw?: string; aiAsk?: AiAsk }) {
  const fb = useApp((s) => s.settings.feedback);
  const [depth, setDepth] = useState(fb.depth);
  useEffect(() => setDepth(fb.depth), [fb.depth]);
  const [showSteps, setShowSteps] = useState(false);
  const x = shape(e, { ...fb, depth }, e.title.length);
  // Per-explanation state: a new error starts collapsed/gated again.
  const id = `${e.title}|${e.summary}`;
  const [openId, setOpenId] = useState<string | null>(null);
  const [revealId, setRevealId] = useState<string | null>(null);
  const opened = fb.autoExplain || openId === id;
  const revealed = !x.gated || revealId === id;
  const header = (
    <div className="row tight">
      <span className="chip err">{CAT[x.category]}</span>
      <strong className="grow">{x.title}</strong>
      {x.line ? <span className="chip">строка {x.line}</span> : null}
    </div>
  );
  const questionsBlock = x.questions.length > 0 && (
    <div>
      <div className="small"><strong>{fb.tone === 'socratic' || x.gated ? 'Подумайте:' : 'Вопрос себе:'}</strong></div>
      <ul className="small" style={{ margin: '4px 0', paddingLeft: '1.2em' }}>{x.questions.map((q, i) => <li key={i}><Inline text={q} /></li>)}</ul>
    </div>
  );
  if (!opened) {
    return (
      <div className="stack tight" data-testid="explanation" data-state="collapsed">
        {header}
        <div><button className="btn sm" onClick={() => setOpenId(id)} data-testid="explain-open">{x.gated ? '🤔 Подумать над вопросами' : '💬 Показать объяснение'}</button></div>
      </div>
    );
  }
  if (!revealed) {
    return (
      <div className="stack tight" data-testid="explanation" data-state="gated">
        {header}
        {questionsBlock}
        <div className="small muted">Сначала попробуйте ответить себе — потом откройте объяснение.</div>
        <div><button className="btn sm primary" onClick={() => setRevealId(id)} data-testid="explain-reveal">Показать объяснение</button></div>
      </div>
    );
  }
  return (
    <div className="stack tight" data-testid="explanation" data-state="open">
      {header}
      {x.opener && <div className="small muted">{x.opener}</div>}
      <div><Inline text={x.summary} /></div>
      {x.snippet && <pre className="code" style={{ margin: 0 }}>{x.snippet}</pre>}
      {questionsBlock}
      {x.causes.length > 0 && (!x.stepsCollapsed || showSteps) && (
        <div>
          <div className="small"><strong>Возможные причины:</strong></div>
          <ul className="small" style={{ margin: '4px 0', paddingLeft: '1.2em' }}>{x.causes.map((c, i) => <li key={i}><Inline text={c} /></li>)}</ul>
        </div>
      )}
      {(!x.stepsCollapsed || showSteps) && (
        <div>
          <div className="small"><strong>Как исправить самостоятельно:</strong></div>
          <ol className="small" style={{ margin: '4px 0', paddingLeft: '1.4em' }}>{x.steps.map((c, i) => <li key={i}><Inline text={c} /></li>)}</ol>
        </div>
      )}
      {x.stepsCollapsed && !showSteps && <button className="btn sm ghost" onClick={() => setShowSteps(true)}>Показать причины и шаги исправления</button>}
      {x.deep && <div className="small muted"><strong>Под капотом: </strong><Inline text={x.deep} /></div>}
      {x.termLabel && <div className="tiny muted">Термин: <strong>{x.termLabel}</strong></div>}
      <div className="row tight">
        <span className="tiny muted">Подробность:</span>
        <div className="segmented" role="group" aria-label="Подробность объяснения">
          {(['brief', 'standard', 'deep'] as const).map((d) => (
            <button key={d} aria-pressed={depth === d} onClick={() => setDepth(d)}>{d === 'brief' ? 'Кратко' : d === 'standard' ? 'Обычно' : 'Подробно'}</button>
          ))}
        </div>
      </div>
      {aiAsk && (
        <AiAskError
          errorType={aiAsk.errorType} errorMessage={aiAsk.errorMessage} line={x.line} code={aiAsk.code} ctx={aiAsk.ctx}
          ruleBased={`${x.title}. ${x.summary}`}
        />
      )}
      {raw && fb.showTraceback && (
        <details>
          <summary className="small muted">Оригинальное сообщение</summary>
          <pre className="output">{raw}</pre>
        </details>
      )}
    </div>
  );
}

/** `ai: false` switches the AI helper off for this explanation (diagnostics, settings preview). */
export function ErrorExplain({ error, lang, code, ai }: { error: RunError; lang: Lang; code: string; ai?: false | AiErrorContext }) {
  return (
    <ExplanationView
      e={explainError(error, lang, code)}
      raw={error.traceback || `${error.type}: ${error.message}`}
      aiAsk={ai === false ? undefined : { errorType: error.type, errorMessage: error.message, code, ctx: { lang, ...ai } }}
    />
  );
}

export function WrongResultExplain({ result, lang, code, ai }: { result: TestResult; lang: Lang; code: string; ai?: false | AiErrorContext }) {
  if (result.error) return <ErrorExplain error={result.error} lang={lang} code={code} ai={ai} />;
  return (
    <ExplanationView
      e={explainWrongResult(result, lang, code)}
      aiAsk={ai === false ? undefined : { errorType: 'Неверный результат', errorMessage: `ожидалось ${result.expected}, получено ${result.actual}${result.label ? ` (${result.label})` : ''}`, code, ctx: { lang, ...ai } }}
    />
  );
}
