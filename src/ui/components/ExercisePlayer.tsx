// Exercise player for all exercise kinds. Grades answers, runs tests in the sandbox, manages the hint
// ladder and confidence rating, and reports a single result per exercise to the caller.
import { useEffect, useMemo, useRef, useState } from 'react';
import type { Exercise, McqExercise, ParsonsExercise, Skill } from '../../core/types';
import type { Confidence } from '../../core/model';
import type { MistakeCategory } from '../../core/state';
import type { RunError, TestResult } from '../../runner/types';
import { runCode, testCode, warmup } from '../../runner/runner';
import { actions, useApp } from '../../state/store';
import { SKILL_BY_ID } from '../../content';
import { Markdown, Inline } from './Markdown';
import { CodeBlock } from './CodeBlock';
import { CodeEditor } from './CodeEditor';
import { ErrorExplain, WrongResultExplain } from './ErrorExplain';
import { Modal } from './Modal';
import { formatTable } from '../../runner/sqlHarness';

export type PlayerMode = 'practice' | 'diagnostic' | 'review' | 'check' | 'verify' | 'mistakes';

export interface ExerciseOutcome {
  correct: boolean;
  hints: number;
  revealed: boolean;
  confidence?: Confidence;
  dontKnow?: boolean;
  ms: number;
  mistake?: { category: MistakeCategory; errType?: string; misconception?: string; note: string };
}

const KIND_LABEL: Record<Exercise['kind'], string> = {
  mcq: 'Выбор ответа', predict: 'Предскажи вывод', code: 'Напиши код', fix: 'Найди и исправь ошибку', parsons: 'Собери программу', explain: 'Объясни своими словами',
};
const KIND_ICON: Record<Exercise['kind'], string> = { mcq: '☑️', predict: '🔮', code: '⌨️', fix: '🐞', parsons: '🧩', explain: '💬' };
export { KIND_LABEL, KIND_ICON };

const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').replace(/^\n+|\n+$/g, '');

function categorize(err: RunError | undefined, failed: TestResult | undefined, bugType?: string): { category: MistakeCategory; errType?: string } {
  if (err) {
    if (/Syntax|Indentation|TabError/.test(err.type) || /syntax error|incomplete input/.test(err.message)) return { category: 'syntax', errType: err.type };
    if (err.type === 'Timeout') return { category: 'logic', errType: 'Timeout' };
    if (/IndexError|KeyError|ZeroDivision|EOFError/.test(err.type)) return { category: 'edge', errType: err.type };
    return { category: 'runtime', errType: err.type };
  }
  if (failed?.hidden) return { category: 'edge' };
  return { category: bugType === 'edge' ? 'edge' : 'logic' };
}

interface Props {
  ex: Exercise;
  mode: PlayerMode;
  onDone: (o: ExerciseOutcome) => void;
  onNext: () => void;
  nextLabel?: string;
}

export function ExercisePlayer({ ex, mode, onDone, onNext, nextLabel = 'Дальше →' }: Props) {
  const L = useApp((s) => s.settings.learning);
  const layout = useApp((s) => s.settings.appearance.editorLayout);
  const skill = SKILL_BY_ID.get(ex.skill)!;
  const start = useRef(Date.now());
  const [confidence, setConfidence] = useState<Confidence | undefined>();
  const [hintsShown, setHintsShown] = useState(0);
  const [fails, setFails] = useState(0);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const [revealAsk, setRevealAsk] = useState(false);
  const firstMistake = useRef<ExerciseOutcome['mistake']>(undefined);
  const diag = mode === 'diagnostic';
  const strict = diag || mode === 'check';
  const hints = 'hints' in ex ? ex.hints : [];
  const hintsAllowed = !strict && L.hintMode !== 'off' && (L.hintMode === 'on-request' || fails >= L.hintAfterFails);
  const revealAllowed = !strict && (L.hintMode !== 'off' || fails >= 3);

  useEffect(() => {
    if ('lang' in ex && ex.lang && (ex.kind === 'code' || ex.kind === 'fix' || ex.kind === 'parsons')) void warmup(ex.lang);
  }, [ex]);

  const finish = (o: Omit<ExerciseOutcome, 'ms' | 'hints' | 'confidence'> & { hints?: number }) => {
    if (outcome) return;
    const full: ExerciseOutcome = { hints: hintsShown, ...o, confidence, ms: Date.now() - start.current };
    if (!full.correct && !full.mistake && firstMistake.current) full.mistake = firstMistake.current;
    setOutcome(full);
    onDone(full);
  };

  const confidenceUI = L.askConfidence && !outcome && ex.kind !== 'explain' && (
    <div className="row tight" role="group" aria-label="Уверенность в ответе">
      <span className="small muted">Насколько вы уверены?</span>
      <div className="segmented">
        {([['sure', 'Уверен(а)'], ['unsure', 'Сомневаюсь'], ['guess', 'Наугад']] as const).map(([k, l]) => (
          <button key={k} aria-pressed={confidence === k} onClick={() => setConfidence(confidence === k ? undefined : k)}>{l}</button>
        ))}
      </div>
    </div>
  );

  const hintUI = !outcome && hints.length > 0 && (hintsAllowed || hintsShown > 0) && (
    <div className="hint-ladder" aria-live="polite">
      {hints.slice(0, hintsShown).map((h, i) => (
        <div key={i} className="hint"><strong className="small">Подсказка {i + 1}/{hints.length}: </strong><Inline text={h} /></div>
      ))}
      {hintsAllowed && hintsShown < hints.length && (
        <button className="btn sm ghost" onClick={() => setHintsShown((n) => n + 1)} data-testid="hint-btn">
          💡 {hintsShown === 0 ? 'Подсказка' : 'Следующая подсказка'} <span className="tiny muted">(снижает вес решения)</span>
        </button>
      )}
    </div>
  );

  const body = (() => {
    switch (ex.kind) {
      case 'mcq': return <Mcq ex={ex} skill={skill} done={!!outcome} onAnswer={(correct, idx) => finish({ correct, revealed: false, mistake: correct ? undefined : { category: 'concept', misconception: ex.options[idx].misconception, note: `Выбран ответ: ${ex.options[idx].text}` } })} />;
      case 'predict': return <Predict ex={ex} done={!!outcome} onAnswer={(correct, given) => finish({ correct, revealed: false, mistake: correct ? undefined : { category: 'output', note: `Ваш прогноз: ${given.slice(0, 80)}` } })} />;
      case 'code':
      case 'fix': return (
        <CodeTask
          ex={ex} done={!!outcome} layout={diag ? 'stacked' : layout}
          onFail={(err, failed) => {
            setFails((f) => f + 1);
            firstMistake.current ??= { ...categorize(err, failed, ex.kind === 'fix' ? ex.bugType : undefined), note: err ? `${err.type}: ${err.message}`.slice(0, 160) : failed?.hidden ? `Скрытый тест: ${failed.label}` : `Неверный результат${failed?.expr ? ` для ${failed.expr}` : ''}` };
            // Diagnostic/check items allow one retry (e.g. a typo) before counting as incorrect.
            if (strict && fails >= 1) finish({ correct: false, revealed: false });
          }}
          onPass={(attempts) => finish({ correct: true, revealed: false, hints: hintsShown + (attempts > 3 ? 1 : 0) })}
        />
      );
      case 'parsons': return <Parsons ex={ex} done={!!outcome} onAnswer={(correct) => {
        if (!correct) { setFails((f) => f + 1); firstMistake.current ??= { category: 'logic', note: 'Неверный порядок строк' }; }
        // A retry that succeeds counts like a hinted success; three failures end the item.
        if (correct || strict || fails >= 2) finish({ correct, revealed: false, hints: hintsShown + (fails > 0 ? 1 : 0) });
      }} />;
      case 'explain': return <Explain ex={ex} done={!!outcome} onAnswer={(correct) => finish({ correct, revealed: false })} />;
    }
  })();

  return (
    <div className="stack" data-testid="exercise" data-kind={ex.kind} data-ex-id={ex.id}>
      <div className="card">
        <div className="row tight" style={{ marginBottom: 8 }}>
          <span className="chip accent">{KIND_ICON[ex.kind]} {KIND_LABEL[ex.kind]}</span>
          <span className="chip">{skill.icon} {skill.title}</span>
          <span className="chip" title="Сложность">{'●'.repeat(ex.difficulty)}{'○'.repeat(3 - ex.difficulty)}</span>
          {mode === 'check' && <span className="chip warn">Отсроченная проверка — без подсказок</span>}
        </div>
        <div style={{ fontSize: '1.05rem' }}><Markdown text={ex.prompt} /></div>
        {body}
        <div className="stack tight" style={{ marginTop: 12 }}>
          {confidenceUI}
          {hintUI}
          {!outcome && (
            <div className="row tight">
              {diag && <button className="btn ghost" data-testid="dont-know" onClick={() => finish({ correct: false, revealed: false, dontKnow: true })}>🤷 Не знаю</button>}
              {revealAllowed && (ex.kind === 'code' || ex.kind === 'fix') && <button className="btn ghost sm" onClick={() => setRevealAsk(true)}>Показать решение</button>}
              {!diag && !revealAllowed && L.hintMode === 'off' && <span className="tiny muted">Режим «без подсказок»: решение откроется после 3 попыток.</span>}
            </div>
          )}
        </div>
      </div>
      {outcome && <ResultCard ex={ex} outcome={outcome} skill={skill} diag={diag} onNext={onNext} nextLabel={nextLabel} />}
      {revealAsk && (
        <Modal title="Показать решение?" onClose={() => setRevealAsk(false)} actions={<>
          <button className="btn ghost" onClick={() => setRevealAsk(false)}>Ещё попробую</button>
          <button className="btn primary" onClick={() => { setRevealAsk(false); finish({ correct: false, revealed: true, mistake: firstMistake.current ?? { category: 'logic', note: 'Решение открыто' } }); }}>Показать</button>
        </>}>
          <p className="muted">Попытка не засчитается как самостоятельное решение. Тема вернётся в повторение раньше — это нормально и полезно.</p>
        </Modal>
      )}
    </div>
  );
}

function ResultCard({ ex, outcome, skill, diag, onNext, nextLabel }: { ex: Exercise; outcome: ExerciseOutcome; skill: Skill; diag: boolean; onNext: () => void; nextLabel: string }) {
  const celebrate = useApp((s) => s.settings.learning.celebrate);
  const btn = useRef<HTMLButtonElement>(null);
  useEffect(() => btn.current?.focus(), []);
  const mis = outcome.mistake?.misconception ? skill.misconceptions.find((m) => m.id === outcome.mistake!.misconception) : undefined;
  const tone = outcome.correct ? (outcome.hints ? 'partial' : 'ok') : 'bad';
  const title = outcome.dontKnow ? 'Отмечено «не знаю» — эта тема попадёт в план' : outcome.revealed ? 'Решение открыто' : outcome.correct ? (outcome.hints ? 'Верно, с подсказками' : celebrate === 'off' ? 'Верно' : 'Верно! 🎉') : 'Пока неверно';
  const solution = ex.kind === 'code' || ex.kind === 'fix' ? ex.solution : ex.kind === 'parsons' ? ex.lines.join('\n') : ex.kind === 'predict' ? ex.answer : undefined;
  const lang = 'lang' in ex && ex.lang ? ex.lang : 'python';
  return (
    <div className={`card feedback ${tone}`} role="status" data-testid="result" data-correct={outcome.correct}>
      <div className="row spread">
        <h3 style={{ margin: 0 }}>{title}</h3>
        {outcome.confidence && <span className="chip">{outcome.confidence === 'sure' ? 'вы были уверены' : outcome.confidence === 'unsure' ? 'вы сомневались' : 'наугад'}</span>}
      </div>
      {!outcome.correct && outcome.confidence === 'sure' && !diag && (
        <p className="small" style={{ color: 'var(--warn)' }}>Вы были уверены, но ответ неверный — такие ошибки запоминаются лучше всего, если разобрать их сейчас.</p>
      )}
      {mis && (
        <div className="card flat" style={{ margin: '10px 0' }}>
          <div className="card-title">💡 Типичное заблуждение: {mis.title}</div>
          <Markdown text={mis.explanation} />
          <div className="small"><strong>Как думать правильно: </strong><Inline text={mis.fix} /></div>
        </div>
      )}
      {(!diag || !outcome.correct) && <Markdown text={ex.explanation} />}
      {solution !== undefined && (outcome.revealed || (!outcome.correct && ex.kind === 'predict') || (outcome.correct && !diag && (ex.kind === 'code' || ex.kind === 'fix'))) && (
        <details open={outcome.revealed || ex.kind === 'predict'}>
          <summary className="small">{ex.kind === 'predict' ? 'Правильный вывод' : outcome.revealed ? 'Решение' : 'Эталонное решение (сравните с вашим)'}</summary>
          {ex.kind === 'predict' ? <pre className="output">{solution}</pre> : <CodeBlock code={solution} lang={lang} lines />}
        </details>
      )}
      <div className="row" style={{ marginTop: 10 }}>
        <button ref={btn} className="btn primary" onClick={onNext} data-testid="next">{nextLabel}</button>
        {!diag && !outcome.correct && <a className="btn ghost" href={`#/skill/${skill.id}`}>Перечитать урок</a>}
      </div>
    </div>
  );
}

function Mcq({ ex, skill, done, onAnswer }: { ex: McqExercise; skill: Skill; done: boolean; onAnswer: (correct: boolean, idx: number) => void }) {
  // Shuffle options once per exercise so position does not give the answer away.
  const order = useMemo(() => ex.options.map((_, i) => i).sort((a, b) => hash(ex.id + a) - hash(ex.id + b)), [ex]);
  const [sel, setSel] = useState<number | null>(null);
  useEffect(() => {
    if (done) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.closest('input, textarea, .cm-editor')) return;
      const n = Number(e.key);
      if (n >= 1 && n <= order.length) setSel(order[n - 1]);
      if (e.key === 'Enter' && sel !== null) onAnswer(!!ex.options[sel].correct, sel);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [done, sel, order, ex, onAnswer]);
  void skill;
  return (
    <div className="stack tight">
      {ex.code && <CodeBlock code={ex.code} lang={ex.lang ?? 'python'} lines />}
      <div className="stack tight" role="radiogroup" aria-label="Варианты ответа">
        {order.map((i, pos) => {
          const o = ex.options[i];
          const cls = done ? (o.correct ? 'correct' : sel === i ? 'wrong' : '') : '';
          return (
            <button key={i} role="radio" aria-checked={sel === i} className={`option ${cls}`} disabled={done} onClick={() => setSel(i)} data-testid="option" data-correct={done ? undefined : undefined}>
              <span className="key">{pos + 1}</span>
              <span className="grow">
                <Inline text={o.text} />
                {done && (o.correct || sel === i) && <div className="small muted" style={{ marginTop: 4 }}>{o.correct ? '✔ ' : '✘ '}<Inline text={o.why} /></div>}
              </span>
            </button>
          );
        })}
      </div>
      {!done && <div><button className="btn primary" disabled={sel === null} onClick={() => sel !== null && onAnswer(!!ex.options[sel].correct, sel)} data-testid="check">Проверить</button> <span className="tiny muted">Клавиши 1–{order.length}, Enter</span></div>}
    </div>
  );
}

function Predict({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: 'predict' }>; done: boolean; onAnswer: (correct: boolean, given: string) => void }) {
  const [val, setVal] = useState('');
  return (
    <div className="stack tight">
      <CodeBlock code={ex.code} lang={ex.lang} lines />
      <label className="field">Что выведет программа? <span className="hint">Каждая строка вывода — с новой строки.</span>
        <textarea value={val} onChange={(e) => setVal(e.target.value)} disabled={done} rows={3} className="mono" data-testid="predict-input" />
      </label>
      {!done && <div><button className="btn primary" disabled={!val.trim()} onClick={() => onAnswer(norm(val) === norm(ex.answer), val)} data-testid="check">Проверить</button></div>}
    </div>
  );
}

function CodeTask({ ex, done, layout, onFail, onPass }: {
  ex: Extract<Exercise, { kind: 'code' | 'fix' }>; done: boolean; layout: 'side' | 'stacked';
  onFail: (err: RunError | undefined, failed: TestResult | undefined) => void; onPass: (attempts: number) => void;
}) {
  const draftKey = ex.id;
  const draft = useApp((s) => s.drafts[draftKey]);
  const initial = ex.kind === 'code' ? ex.starter : ex.buggy;
  const [code, setCode] = useState(draft ?? initial);
  const [busy, setBusy] = useState<'run' | 'test' | null>(null);
  const [out, setOut] = useState<{ stdout: string; error: RunError | null; tables?: { columns: string[]; rows: unknown[][] }[] } | null>(null);
  const [results, setResults] = useState<TestResult[] | null>(null);
  const [testError, setTestError] = useState<RunError | null>(null);
  const attempts = useRef(0);
  const visible = (ex.tests ?? []).filter((t) => !t.hidden);
  const save = (v: string) => { setCode(v); actions().setDraft(draftKey, v); };

  const run = async () => {
    setBusy('run');
    const r = await runCode(ex.lang, code, [], ex.setup);
    setOut(r);
    setBusy(null);
  };
  const check = async () => {
    setBusy('test');
    attempts.current++;
    const r = await testCode(ex.lang, code, ex.tests ?? [], ex.lang === 'sql' ? { setup: ex.setup, hiddenSetup: ex.hiddenSetup, solution: ex.solution, ordered: ex.ordered, check: ex.check } : undefined);
    setBusy(null);
    setResults(r.results);
    setTestError(r.error ?? null);
    const failed = r.results.find((x) => !x.pass);
    if (r.error || failed || !r.results.length) onFail(r.error ?? failed?.error, failed);
    else onPass(attempts.current);
  };
  const firstFail = results?.find((r) => !r.pass);
  const errLine = (testError ?? firstFail?.error ?? out?.error)?.line ?? null;

  return (
    <div className={`ex-layout ${layout === 'stacked' ? 'stacked' : ''}`} style={{ marginTop: 10 }}>
      <div className="stack tight">
        {ex.lang === 'sql' && ex.setup && (
          <details>
            <summary className="small">Схема и данные</summary>
            <CodeBlock code={ex.setup} lang="sql" />
          </details>
        )}
        {visible.length > 0 && (
          <div className="small">
            <strong>Примеры проверок:</strong>
            <ul style={{ margin: '4px 0', paddingLeft: '1.2em' }}>
              {visible.slice(0, 4).map((t, i) => (
                <li key={i} className="mono">{t.expr ? `${t.expr} → ${t.expect}` : `ввод: ${(t.stdin ?? []).join(' ⏎ ') || '—'} → вывод: ${t.stdout}`}</li>
              ))}
            </ul>
            {(ex.tests ?? []).some((t) => t.hidden) && <span className="tiny muted">+ скрытые тесты на граничные случаи</span>}
          </div>
        )}
        {ex.lang === 'sql' && ex.hiddenSetup && <span className="tiny muted">Запрос проверяется и на скрытом наборе данных.</span>}
      </div>
      <div className="stack tight">
        <CodeEditor value={code} onChange={save} lang={ex.lang} onRun={check} errorLine={errLine} readOnly={done} />
        <div className="row tight">
          <button className="btn" onClick={run} disabled={!!busy} data-testid="run">{busy === 'run' ? 'Выполняется…' : '▶ Запустить'}</button>
          <button className="btn primary" onClick={check} disabled={!!busy || done} data-testid="check">{busy === 'test' ? 'Проверка…' : '✓ Проверить'}</button>
          {!done && code !== initial && <button className="btn ghost sm" onClick={() => save(initial)}>Сбросить код</button>}
        </div>
        {out && (
          <div className="output" aria-live="polite" data-testid="output">
            {out.tables?.length ? out.tables.map((t, i) => <div key={i}>{formatTable(t, 20)}</div>) : out.stdout || (!out.error && <span className="muted">(нет вывода)</span>)}
            {out.error && <div className="err">{out.error.type}: {out.error.message}</div>}
          </div>
        )}
        {out?.error && !results && <ErrorExplain error={out.error} lang={ex.lang} code={code} />}
        {(results || testError) && (
          <div className="stack tight" aria-live="polite">
            {testError && <ErrorExplain error={testError} lang={ex.lang} code={code} />}
            {results && results.length > 0 && (
              <div className="tests" data-testid="tests">
                {results.map((r, i) => (
                  <div key={i} className="test-row">
                    <span aria-label={r.pass ? 'пройден' : 'не пройден'}>{r.pass ? '✅' : '❌'}</span>
                    <div>
                      {r.hidden ? <span>Скрытый тест{r.label ? `: ${r.label}` : ''}</span> : r.kind === 'sql' ? <span>Проверка: {r.label}</span> : <span className="mono">{r.expr ?? `ввод: ${(r.stdin ?? []).join(' ⏎ ') || '—'}`}</span>}
                      {!r.pass && !r.hidden && (
                        <pre className="mono">{`ожидалось: ${r.expected}\nполучено:  ${r.error ? `${r.error.type}: ${r.error.message}` : r.actual}`}</pre>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
            {firstFail && !testError && <WrongResultExplain result={firstFail} lang={ex.lang} code={code} />}
          </div>
        )}
      </div>
    </div>
  );
}

function hash(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

function Parsons({ ex, done, onAnswer }: { ex: ParsonsExercise; done: boolean; onAnswer: (correct: boolean) => void }) {
  const all = useMemo(() => [...ex.lines.map((t, i) => ({ id: `l${i}`, t })), ...(ex.distractors ?? []).map((t, i) => ({ id: `d${i}`, t }))].sort((a, b) => hash(ex.id + a.id) - hash(ex.id + b.id)), [ex]);
  const [placed, setPlaced] = useState<string[]>([]);
  const [drag, setDrag] = useState<string | null>(null);
  const [verdict, setVerdict] = useState<{ ok: boolean; firstWrong: number } | null>(null);
  const [busy, setBusy] = useState(false);
  const byId = new Map(all.map((x) => [x.id, x]));
  const pool = all.filter((x) => !placed.includes(x.id));
  const move = (id: string, to: number) => setPlaced((p) => { const n = p.filter((x) => x !== id); n.splice(Math.max(0, Math.min(to, n.length)), 0, id); return n; });
  const check = async () => {
    const lines = placed.map((id) => byId.get(id)!.t);
    let ok = lines.length === ex.lines.length && lines.every((l, i) => l === ex.lines[i]);
    if (!ok && ex.tests?.length && !placed.some((id) => id.startsWith('d'))) {
      setBusy(true);
      const r = await testCode(ex.lang, lines.join('\n'), ex.tests);
      setBusy(false);
      ok = !r.error && r.results.length > 0 && r.results.every((x) => x.pass);
    }
    const firstWrong = lines.findIndex((l, i) => l !== ex.lines[i]);
    setVerdict({ ok, firstWrong });
    onAnswer(ok);
  };
  return (
    <div className="grid cols-2" style={{ marginTop: 10 }}>
      <div className="stack tight">
        <div className="small muted">Строки (нажмите, чтобы добавить; есть лишние)</div>
        <div className="parsons" aria-label="Доступные строки" onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag) setPlaced((p) => p.filter((x) => x !== drag)); setDrag(null); }}>
          {pool.map((x) => (
            <button key={x.id} className="parsons-line" draggable={!done} onDragStart={() => setDrag(x.id)} onClick={() => !done && move(x.id, placed.length)} disabled={done}>{x.t}</button>
          ))}
          {!pool.length && <span className="tiny muted">Все строки использованы</span>}
        </div>
      </div>
      <div className="stack tight">
        <div className="small muted">Ваша программа (порядок и отступы важны)</div>
        <ol className="parsons" aria-label="Собранная программа" style={{ listStyle: 'none', margin: 0 }} onDragOver={(e) => e.preventDefault()} onDrop={() => { if (drag && !placed.includes(drag)) move(drag, placed.length); setDrag(null); }}>
          {placed.map((id, i) => (
            <li key={id} className={`parsons-line ${drag === id ? 'dragging' : ''}`} draggable={!done} onDragStart={() => setDrag(id)} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.stopPropagation(); if (drag) move(drag, i); setDrag(null); }}
              style={verdict && !verdict.ok && i === verdict.firstWrong ? { borderColor: 'var(--err)' } : undefined}>
              <span className="grow">{byId.get(id)!.t}</span>
              {!done && (
                <span className="pl-btns">
                  <button className="btn sm ghost" aria-label="Выше" onClick={() => move(id, i - 1)} disabled={i === 0}>↑</button>
                  <button className="btn sm ghost" aria-label="Ниже" onClick={() => move(id, i + 1)} disabled={i === placed.length - 1}>↓</button>
                  <button className="btn sm ghost" aria-label="Убрать" onClick={() => setPlaced((p) => p.filter((x) => x !== id))}>✕</button>
                </span>
              )}
            </li>
          ))}
          {!placed.length && <li className="tiny muted">Перетащите или нажмите строки слева</li>}
        </ol>
        {!done && (
          <div className="row tight">
            <button className="btn primary" onClick={check} disabled={!placed.length || busy} data-testid="check">{busy ? 'Проверка…' : 'Проверить'}</button>
            {verdict && !verdict.ok && <span className="small" style={{ color: 'var(--err)' }}>Не совсем: проверьте строку {verdict.firstWrong + 1}. Можно исправить и проверить снова.</span>}
          </div>
        )}
      </div>
    </div>
  );
}

function Explain({ ex, done, onAnswer }: { ex: Extract<Exercise, { kind: 'explain' }>; done: boolean; onAnswer: (correct: boolean) => void }) {
  const [text, setText] = useState('');
  const [compare, setCompare] = useState(false);
  const [ticked, setTicked] = useState<boolean[]>(ex.keyPoints.map(() => false));
  const need = Math.ceil((ex.keyPoints.length * 2) / 3);
  return (
    <div className="stack tight" style={{ marginTop: 8 }}>
      {ex.code && <CodeBlock code={ex.code} lang={ex.lang ?? 'python'} lines />}
      <label className="field">Ваше объяснение
        <textarea value={text} onChange={(e) => setText(e.target.value)} disabled={compare} rows={4} placeholder="Объясните так, как объяснили бы другу…" data-testid="explain-input" />
      </label>
      {!compare && <div><button className="btn primary" disabled={text.trim().length < 15} onClick={() => setCompare(true)} data-testid="check">Сравнить с эталоном</button> <span className="tiny muted">Минимум 15 символов — объяснение помогает запомнить.</span></div>}
      {compare && (
        <div className="card flat stack tight">
          <div><strong>Эталонное объяснение:</strong></div>
          <Markdown text={ex.modelAnswer} />
          <div className="small"><strong>Отметьте ключевые идеи, которые есть в вашем объяснении:</strong></div>
          {ex.keyPoints.map((k, i) => (
            <label key={i} className="row tight small" style={{ alignItems: 'flex-start' }}>
              <input type="checkbox" checked={ticked[i]} disabled={done} onChange={(e) => setTicked((t) => t.map((v, j) => (j === i ? e.target.checked : v)))} />
              <span className="grow"><Inline text={k} /></span>
            </label>
          ))}
          {!done && <div><button className="btn primary" onClick={() => onAnswer(ticked.filter(Boolean).length >= need)} data-testid="self-assess">Готово ({ticked.filter(Boolean).length}/{ex.keyPoints.length})</button> <span className="tiny muted">Засчитывается при {need}+ идеях; самооценка учитывается с малым весом.</span></div>}
        </div>
      )}
    </div>
  );
}
