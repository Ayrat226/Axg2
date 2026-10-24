// "Охота на баги": mutation-based debugging practice. A reference solution is broken by one small mutation,
// verified with the real runner (parses, finishes, fails at least one test), then fixed by the learner.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_EXERCISES, ALL_SKILLS, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { bugCandidates, generateMutants, judgeMutant, mutantExercise, MUTATION_INFO, type MutableExercise, type Mutant, type MutationClass } from '../../core/mutate';
import type { FixExercise } from '../../core/types';
import { testCode } from '../../runner/runner';
import { actions, useStore } from '../../state/store';
import { ExercisePlayer, type ExerciseOutcome } from '../components/ExercisePlayer';
import { href } from '../router';

const SESSION = 5;
const MAX_TRIES = 8;

interface Verified { orig: MutableExercise; mutant: Mutant; exercise: FixExercise }
interface Result { cls: MutationClass; desc: string; skill: string; caught: boolean; hints: number; revealed: boolean }

// Verified mutants are cached for the page's lifetime so revisits and re-renders never re-run the tests.
const cache = new Map<string, Promise<Verified | null>>();

export function verifyMutant(orig: MutableExercise, seed: number): Promise<Verified | null> {
  const key = `${seed}:${orig.id}`;
  let p = cache.get(key);
  if (!p) {
    p = (async () => {
      const list = generateMutants(orig.solution, orig.lang, { seed, max: MAX_TRIES });
      let risky = 0;
      for (let n = 0; n < list.length; n++) {
        const m = list[n];
        if (m.risky && ++risky > 2) break;
        const run = await testCode(orig.lang, m.code, orig.tests!);
        if (judgeMutant(run) === 'valid') return { orig, mutant: m, exercise: mutantExercise(orig, m, n) };
      }
      return null;
    })();
    cache.set(key, p);
  }
  return p;
}

export function BugHunt({ route, nonce }: { route?: string; nonce?: string }) {
  const startedAt = useRef(Date.now()).current;
  const seed = useMemo(() => (Number(nonce) || startedAt) % 1_000_000_007, [nonce, startedAt]);
  const snapshot = useRef(useStore.getState().s);
  const candidates = useMemo(
    () => bugCandidates(snapshot.current, { skills: ALL_SKILLS, exercises: ALL_EXERCISES }, { route, activeRoute: snapshot.current.profile.activeRoute, seed }),
    [route, seed],
  );
  const [items, setItems] = useState<Verified[]>([]);
  const [exhausted, setExhausted] = useState(false);
  const [idx, setIdx] = useState(0);
  const [results, setResults] = useState<Result[]>([]);
  const [pending, setPending] = useState(false);
  const [ended, setEnded] = useState(false);

  // Verify candidates one after another in the background; the next bug is ready while the learner solves.
  useEffect(() => {
    let dead = false;
    setItems([]); setExhausted(false);
    (async () => {
      let found = 0;
      for (const c of candidates) {
        if (dead || found >= SESSION) break;
        const v = await verifyMutant(c, seed);
        if (dead) return;
        if (v) { found++; setItems((l) => [...l, v]); }
      }
      if (!dead) setExhausted(true);
    })();
    return () => { dead = true; };
  }, [candidates, seed]);

  const total = Math.min(SESSION, items.length || SESSION);
  const rname = route ? ROUTE_BY_ID.get(route)?.title : undefined;
  const finished = ended || (idx >= items.length && (exhausted || idx >= SESSION));

  if (finished) return <Summary results={results} route={route} />;

  const cur = items[idx];
  if (!cur) {
    return (
      <div className="page" data-testid="bughunt-loading">
        <div className="card empty stack" role="status" aria-live="polite">
          <div className="big pulse" aria-hidden="true">🐞</div>
          <h2 style={{ margin: 0 }}>Подбираем баг…</h2>
          <p className="muted">Мы портим эталонное решение и проверяем запуском, что тесты действительно ловят ошибку — это занимает несколько секунд.</p>
        </div>
      </div>
    );
  }

  const record = (o: ExerciseOutcome) => {
    const { exercise, orig, mutant } = cur;
    actions().recordAnswer({ ex: exercise.id, skill: orig.skill, kind: 'fix', correct: o.correct, hints: o.hints, revealed: o.revealed, confidence: o.confidence, ms: o.ms, source: 'practice', mistake: o.mistake });
    setResults((r) => [...r, { cls: mutant.cls, desc: mutant.desc, skill: orig.skill, caught: o.correct && !o.revealed && o.hints === 0, hints: o.hints, revealed: o.revealed }]);
    setPending(true);
  };
  const sk = SKILL_BY_ID.get(cur.orig.skill);
  return (
    <div className="page wide" data-testid="bughunt" data-ex-id={cur.exercise.id}>
      <div className="row spread">
        <div className="stack tight">
          <h2 style={{ margin: 0 }}>🐞 Охота на баги{rname ? `: ${rname}` : ''}</h2>
          <span className="small muted">Баг {idx + 1} из {total} · тема: {sk?.icon} {sk?.title} · мутация проверена запуском: тесты её ловят</span>
        </div>
        <button className="btn ghost sm" onClick={() => setEnded(true)} data-testid="end-hunt">Завершить</button>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idx + (pending ? 1 : 0)} aria-label="Прогресс охоты">
        <span style={{ width: `${((idx + (pending ? 1 : 0)) / total) * 100}%`, background: 'var(--accent)' }} />
      </div>
      <ExercisePlayer
        key={cur.exercise.id}
        ex={cur.exercise}
        mode="practice"
        nextLabel={idx + 1 >= total ? 'Итоги →' : 'Следующий баг →'}
        onDone={record}
        onNext={() => { setPending(false); setIdx((i) => i + 1); }}
      />
    </div>
  );
}

function Summary({ results, route }: { results: Result[]; route?: string }) {
  const caught = results.filter((r) => r.caught).length;
  const classes = [...new Set(results.map((r) => r.cls))];
  const missed = classes.filter((c) => results.some((r) => r.cls === c && !r.caught));
  if (!results.length) {
    return (
      <div className="page"><div className="card empty stack" data-testid="bughunt-empty">
        <div className="big">🔍</div>
        <h2 style={{ margin: 0 }}>Охота не состоялась</h2>
        <p className="muted">Не удалось подобрать задание с проверяемым багом. Пройдите несколько тем на Python или JavaScript и возвращайтесь.</p>
        <a className="btn primary" href={href('/')}>На главную</a>
      </div></div>
    );
  }
  return (
    <div className="page" data-testid="bughunt-summary">
      <div className="card glow stack">
        <h1>{caught === results.length ? '🏆 Все баги пойманы!' : 'Охота завершена'}</h1>
        <div className="grid cols-3">
          <div className="kpi"><span className="v">{results.length}</span><span className="l">багов</span></div>
          <div className="kpi"><span className="v">{caught}</span><span className="l">найдено без подсказок</span></div>
          <div className="kpi"><span className="v">{classes.length}</span><span className="l">классов ошибок</span></div>
        </div>
      </div>
      <div className="card stack tight">
        <div className="card-title">Какие виды багов вы ловили</div>
        {classes.map((c) => {
          const rs = results.filter((r) => r.cls === c);
          const ok = rs.filter((r) => r.caught).length;
          const info = MUTATION_INFO[c];
          return (
            <div key={c} className="stack tight" data-testid="hunt-class">
              <div className="row spread small"><span>{info.icon} {info.label}</span><span className={`chip ${ok === rs.length ? 'ok' : 'warn'}`}>{ok === rs.length ? '✓' : '✗'} {ok} из {rs.length}</span></div>
              <div className="bar" aria-hidden="true"><span style={{ width: `${(ok / rs.length) * 100}%`, background: 'var(--ok)' }} /></div>
              <div className="tiny muted">{rs.map((r) => r.desc).join(' · ')}</div>
            </div>
          );
        })}
      </div>
      {missed.length > 0 && (
        <div className="card stack tight">
          <div className="card-title">На что смотреть в следующий раз</div>
          <ul style={{ margin: 0, paddingLeft: 18 }}>{missed.map((c) => <li key={c} className="small"><strong>{MUTATION_INFO[c].label}.</strong> {MUTATION_INFO[c].tip}</li>)}</ul>
        </div>
      )}
      <div className="row">
        <a className="btn primary" href={href(`${route ? `/bughunt/${route}` : '/bughunt'}?n=${Date.now()}`)}>Ещё охота</a>
        <a className="btn ghost" href={href('/')}>На главную</a>
        <a className="btn ghost" href={href('/mistakes')}>Журнал ошибок</a>
      </div>
    </div>
  );
}
