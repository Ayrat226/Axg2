// Lesson: purpose → explanation at the chosen depth → worked example revealed step by step
// (optionally predict-before-run) → counterexample, pitfalls, misconceptions → practice.
import { useEffect, useState } from 'react';
import { ROUTE_BY_ID, SKILL_BY_ID, exercisesForSkill } from '../../content';
import { missingPrereqs } from '../../core/planner';
import { skillStatus, STATUS_INFO, metricsOf } from '../../core/model';
import { retrievability } from '../../core/srs';
import { actions, useApp } from '../../state/store';
import { runCode } from '../../runner/runner';
import { Markdown, Inline } from '../components/Markdown';
import { CodeBlock } from '../components/CodeBlock';
import { ErrorExplain } from '../components/ErrorExplain';
import { Visualizer } from '../components/Visualizer';
import { href } from '../router';
import { KIND_ICON, KIND_LABEL } from '../components/ExercisePlayer';
import type { SqlTable } from '../../runner/types';
import { formatTable } from '../../runner/sqlHarness';

type Depth = 'brief' | 'standard' | 'deep';
const norm = (s: string) => s.split('\n').map((l) => l.trimEnd()).join('\n').trim();

export function Lesson({ id }: { id: string }) {
  const skill = SKILL_BY_ID.get(id);
  const s = useApp((x) => x);
  const L = s.settings.learning;
  // Expertise reversal: learners who already know a topic get the brief version first.
  const knownAlready = !!skill && ['probable', 'mastered', 'durable'].includes(skillStatus(s.skills[skill.id], Date.now()));
  const [depth, setDepth] = useState<Depth>(knownAlready && L.explanationDepth !== 'deep' ? 'brief' : L.explanationDepth);
  const [shown, setShown] = useState(L.stepByStepExamples ? 1 : 99);
  const [prediction, setPrediction] = useState('');
  const [run, setRun] = useState<{ stdout: string; error: import('../../runner/types').RunError | null; tables?: SqlTable[] } | null>(null);
  const [busy, setBusy] = useState(false);
  const [viz, setViz] = useState(false);
  const [ignoreReady, setIgnoreReady] = useState(false);
  useEffect(() => { if (skill) actions().markLesson(skill.id); }, [skill]);
  useEffect(() => { setShown(L.stepByStepExamples ? 1 : 99); setRun(null); setViz(false); setPrediction(''); }, [id, L.stepByStepExamples]);
  if (!skill) return <div className="page"><div className="card empty">Тема не найдена. <a href="#/routes">К маршрутам</a></div></div>;
  const route = ROUTE_BY_ID.get(skill.route)!;
  const now = Date.now();
  const st = s.skills[skill.id];
  const status = skillStatus(st, now);
  const missing = missingPrereqs(s, skill, SKILL_BY_ID, now);
  const ex = skill.lesson.example;
  const exs = exercisesForSkill(skill.id);
  const m = metricsOf(st);
  const needPredict = L.predictBeforeRun && ex.lang !== 'sql' && !run;
  const content = depth === 'brief' ? skill.lesson.brief : depth === 'standard' ? skill.lesson.standard : `${skill.lesson.standard}\n\n${skill.lesson.deep}`;

  const runExample = async () => {
    setBusy(true);
    setRun(await runCode(ex.lang, ex.code, [], ex.setup));
    setBusy(false);
  };

  return (
    <div className="page" data-testid="lesson">
      <div className="row tight small">
        <a href={href(`/route/${route.id}`)}>{route.icon} {route.title}</a><span className="muted">›</span><span className="muted">Уровень {skill.tier}</span>
      </div>
      <div className="card glow">
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <span style={{ fontSize: '2.4rem' }} aria-hidden="true">{skill.icon}</span>
          <div className="grow stack tight">
            <h1>{skill.title}</h1>
            <div className="muted">{skill.summary}</div>
            <div className="row tight">
              <span className="badge-status" style={{ color: STATUS_INFO[status].color }}><span className="dot" style={{ background: STATUS_INFO[status].color }} />{STATUS_INFO[status].label}</span>
              <span className="chip">~{skill.estMinutes} мин</span>
              <span className="chip">{exs.length} заданий</span>
              {m.attempts > 0 && <span className="chip">самостоятельно: {m.independent}/{m.attempts}</span>}
              {st?.mem && <span className="chip" title="Оценка вероятности вспомнить сейчас (FSRS)">память: {Math.round(retrievability(st.mem, now) * 100)}%</span>}
              {skill.interview && <span className="chip accent">🎯 частая тема собеседований</span>}
            </div>
          </div>
        </div>
        <div style={{ marginTop: 10 }}>
          <div className="small"><strong>После темы вы сможете:</strong></div>
          <ul className="small" style={{ margin: '4px 0', paddingLeft: '1.2em' }}>{skill.outcomes.map((o, i) => <li key={i}>{o}</li>)}</ul>
        </div>
      </div>

      {missing.length > 0 && !ignoreReady && (
        <div className="card feedback partial stack tight" role="note">
          <strong>Проверка готовности</strong>
          <span className="small">Эта тема опирается на: {missing.map((x, i) => <span key={x.id}>{i > 0 && ', '}<a href={href(`/skill/${x.id}`)}>{x.title}</a></span>)}. Их освоение ещё не подтверждено.</span>
          <div className="row tight">
            <a className="btn sm primary" href={href(`/practice/${missing[0].id}?mode=verify`)}>Быстро проверить «{missing[0].title}»</a>
            <button className="btn sm ghost" onClick={() => setIgnoreReady(true)}>Всё равно продолжить</button>
          </div>
        </div>
      )}

      <div className="card stack">
        <div className="row spread">
          <div className="card-title" style={{ margin: 0 }}>📘 Объяснение</div>
          <div className="segmented" role="group" aria-label="Глубина объяснения">
            {(['brief', 'standard', 'deep'] as const).map((d) => <button key={d} aria-pressed={depth === d} onClick={() => setDepth(d)} data-testid={`depth-${d}`}>{d === 'brief' ? 'Кратко' : d === 'standard' ? 'Обычно' : 'Углублённо'}</button>)}
          </div>
        </div>
        {knownAlready && depth === 'brief' && L.explanationDepth !== 'brief' && <div className="tiny muted">Показана краткая версия: тема вам, по-видимому, знакома. Полное объяснение — во вкладке «Обычно».</div>}
        <blockquote className="md" style={{ margin: 0 }}><strong>Зачем: </strong><Inline text={skill.lesson.why} /></blockquote>
        <Markdown text={content} />
        {L.showAnalogies && skill.lesson.analogy && (
          <div className="card flat"><strong>🧠 Аналогия. </strong><Inline text={skill.lesson.analogy} /></div>
        )}
        <div className="row tight">
          <span className="small muted">Не до конца понятно?</span>
          {depth !== 'brief' && <button className="btn sm ghost" onClick={() => setDepth('brief')}>Объясни проще</button>}
          {depth !== 'deep' && <button className="btn sm ghost" onClick={() => setDepth('deep')}>Подробнее, «под капотом»</button>}
          {!L.showAnalogies && skill.lesson.analogy && <button className="btn sm ghost" onClick={() => actions().updateSettings({ learning: { showAnalogies: true } })}>Показывать аналогии</button>}
          <a className="btn sm ghost" href="#counterexample">Ещё пример</a>
        </div>
      </div>

      <div className="card stack">
        <div className="card-title">🔍 Разбор примера</div>
        <CodeBlock code={ex.code} lang={ex.lang} lines />
        <div className="stack tight">
          {ex.steps.slice(0, shown).map((stp, i) => (
            <div key={i} className="lesson-step"><span className="n">{i + 1}</span><div className="grow"><Inline text={stp} /></div></div>
          ))}
          {shown < ex.steps.length && <div><button className="btn sm" onClick={() => setShown((n) => n + 1)} data-testid="next-step">Следующий шаг ({shown}/{ex.steps.length})</button> <button className="btn sm ghost" onClick={() => setShown(99)}>Показать все</button></div>}
        </div>
        {needPredict && (
          <label className="field">🔮 Сначала предскажите вывод (метод PRIMM)
            <textarea value={prediction} onChange={(e) => setPrediction(e.target.value)} rows={2} className="mono" />
          </label>
        )}
        <div className="row tight">
          <button className="btn primary" onClick={runExample} disabled={busy || (needPredict && !prediction.trim())} data-testid="run-example">{busy ? 'Выполняется…' : '▶ Запустить пример'}</button>
          {ex.lang === 'python' && <button className="btn" onClick={() => setViz((v) => !v)} data-testid="viz-toggle">👣 {viz ? 'Скрыть визуализацию' : 'Пошагово с переменными'}</button>}
          <a className="btn ghost" href={href(`/playground?from=${skill.id}`)} onClick={() => actions().setDraft(`playground:${ex.lang}`, ex.code)}>Изменить в песочнице</a>
        </div>
        {run && (
          <div className="stack tight">
            <div className="output" data-testid="example-output">{run.tables?.length ? run.tables.map((t, i) => <div key={i}>{formatTable(t, 20)}</div>) : run.stdout || '(нет вывода)'}{run.error && <div className="err">{run.error.type}: {run.error.message}</div>}</div>
            {prediction.trim() && L.predictBeforeRun && (
              <div className={`small ${norm(prediction) === norm(run.stdout) ? '' : ''}`} style={{ color: norm(prediction) === norm(run.stdout) ? 'var(--ok)' : 'var(--warn)' }}>
                {norm(prediction) === norm(run.stdout) ? '✔ Прогноз совпал!' : '✘ Прогноз не совпал — сравните и найдите шаг, где ваша модель выполнения разошлась с реальной.'}
              </div>
            )}
            {run.error && <ErrorExplain error={run.error} lang={ex.lang} code={ex.code} />}
          </div>
        )}
        {viz && ex.lang === 'python' && <Visualizer code={ex.code} />}
      </div>

      {skill.lesson.counterexample && (
        <div className="card" id="counterexample">
          <div className="card-title">⚠️ Контрпример</div>
          <CodeBlock code={skill.lesson.counterexample.code} lang={skill.lesson.counterexample.lang} lines />
          <Markdown text={skill.lesson.counterexample.explain} />
        </div>
      )}

      <div className="grid cols-2">
        <div className="card">
          <div className="card-title">🕳️ Подводные камни</div>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>{skill.lesson.pitfalls.map((p, i) => <li key={i}><Inline text={p} /></li>)}</ul>
        </div>
        <div className="card stack tight">
          <div className="card-title">💡 Типичные заблуждения</div>
          {skill.misconceptions.map((mc) => (
            <details key={mc.id}>
              <summary><strong>{mc.title}</strong></summary>
              <div className="small" style={{ marginTop: 6 }}><Markdown text={mc.explanation} /><strong>Как правильно: </strong><Inline text={mc.fix} /></div>
            </details>
          ))}
        </div>
      </div>

      {skill.lesson.sources?.length ? (
        <div className="card small">
          <div className="card-title">📚 Источники</div>
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>{skill.lesson.sources.map((src) => <li key={src.url}><a href={src.url} target="_blank" rel="noreferrer noopener">{src.title}</a></li>)}</ul>
        </div>
      ) : null}

      <div className="card glow row spread">
        <div className="stack tight">
          <strong>Готовы проверить себя?</strong>
          <span className="small muted">Задания: {[...new Set(exs.map((e) => e.kind))].map((k) => `${KIND_ICON[k]} ${KIND_LABEL[k]}`).join(' · ')}</span>
        </div>
        <div className="row tight">
          <a className="btn primary lg" href={href(`/practice/${skill.id}`)} data-testid="to-practice">Перейти к практике →</a>
          {status !== 'mastered' && status !== 'durable' && <a className="btn ghost" href={href(`/practice/${skill.id}?mode=verify`)}>Я это уже знаю</a>}
        </div>
      </div>
    </div>
  );
}
