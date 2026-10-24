// Renders a personalised explanation of an error or a wrong result, following feedback settings.
import { useState } from 'react';
import { explainError, explainWrongResult, shape, type Explanation } from '../../core/feedback';
import type { Lang } from '../../core/types';
import type { RunError, TestResult } from '../../runner/types';
import { useApp } from '../../state/store';
import { Inline } from './Markdown';

const CAT: Record<Explanation['category'], string> = {
  syntax: 'Синтаксис', runtime: 'Выполнение', logic: 'Логика', edge: 'Граничный случай', timeout: 'Таймаут', output: 'Вывод',
};

export function ExplanationView({ e, raw }: { e: Explanation; raw?: string }) {
  const fb = useApp((s) => s.settings.feedback);
  const [depth, setDepth] = useState(fb.depth);
  const [showSteps, setShowSteps] = useState(false);
  const x = shape(e, { ...fb, depth }, e.title.length);
  return (
    <div className="stack tight" data-testid="explanation">
      <div className="row tight">
        <span className="chip err">{CAT[x.category]}</span>
        <strong className="grow">{x.title}</strong>
        {x.line ? <span className="chip">строка {x.line}</span> : null}
      </div>
      {x.opener && <div className="small muted">{x.opener}</div>}
      <div><Inline text={x.summary} /></div>
      {x.snippet && <pre className="code" style={{ margin: 0 }}>{x.snippet}</pre>}
      {x.questions.length > 0 && (
        <div>
          <div className="small"><strong>{fb.tone === 'socratic' ? 'Подумайте:' : 'Вопрос себе:'}</strong></div>
          <ul className="small" style={{ margin: '4px 0', paddingLeft: '1.2em' }}>{x.questions.map((q, i) => <li key={i}><Inline text={q} /></li>)}</ul>
        </div>
      )}
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
      {x.term && <div className="tiny muted">Термин: <strong>{x.term.ru}</strong> — <em>{x.term.en}</em></div>}
      <div className="row tight">
        <span className="tiny muted">Подробность:</span>
        <div className="segmented" role="group" aria-label="Подробность объяснения">
          {(['brief', 'standard', 'deep'] as const).map((d) => (
            <button key={d} aria-pressed={depth === d} onClick={() => setDepth(d)}>{d === 'brief' ? 'Кратко' : d === 'standard' ? 'Обычно' : 'Подробно'}</button>
          ))}
        </div>
      </div>
      {raw && fb.showTraceback && (
        <details>
          <summary className="small muted">Оригинальное сообщение</summary>
          <pre className="output">{raw}</pre>
        </details>
      )}
    </div>
  );
}

export function ErrorExplain({ error, lang, code }: { error: RunError; lang: Lang; code: string }) {
  return <ExplanationView e={explainError(error, lang, code)} raw={error.traceback || `${error.type}: ${error.message}`} />;
}

export function WrongResultExplain({ result, lang, code }: { result: TestResult; lang: Lang; code: string }) {
  if (result.error) return <ErrorExplain error={result.error} lang={lang} code={code} />;
  return <ExplanationView e={explainWrongResult(result, lang, code)} />;
}
