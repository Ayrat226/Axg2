// Daily challenge: three interleaved retrieval-practice items, pinned for the day, recorded as reviews.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_EXERCISES, ALL_SKILLS, EXERCISE_BY_ID, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { buildDaily, dailyDraftKey, readDaily, serializeDaily, DAILY_SIZE, type DailyProgress } from '../../core/daily';
import { dayKey } from '../../core/state';
import { actions, useApp, useStore } from '../../state/store';
import { ExercisePlayer, type ExerciseOutcome } from '../components/ExercisePlayer';
import { Confetti } from '../components/Modal';
import { href } from '../router';

export function Daily() {
  const now = useRef(Date.now()).current;
  const key = dayKey(now);
  const initial = useRef(useStore.getState().s);
  const celebrate = useApp((s) => s.settings.learning.celebrate);
  const raw = useApp((s) => s.drafts[dailyDraftKey(key)]);

  const planned = useMemo<DailyProgress>(() => {
    const s = initial.current;
    const stored = readDaily(s, key);
    if (stored && stored.ids.length && stored.ids.every((id) => EXERCISE_BY_ID.has(id))) return stored;
    return { key, ids: buildDaily(s, now, { skills: ALL_SKILLS, exercises: ALL_EXERCISES }, s.profile.activeRoute), results: [] };
  }, [key, now]);
  const live = useMemo(() => (raw ? readDaily({ drafts: { [dailyDraftKey(key)]: raw } }, key) : null), [raw, key]);
  const results = (live && live.ids.join() === planned.ids.join() ? live.results : planned.results).slice(0, planned.ids.length);
  const [idx, setIdx] = useState(Math.min(planned.results.length, planned.ids.length));
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!raw || !readDaily({ drafts: { [dailyDraftKey(key)]: raw } }, key)) actions().setDraft(dailyDraftKey(key), serializeDaily(planned));
    // Pin once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const date = new Date(now).toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
  const total = planned.ids.length;
  const record = (id: string, o: ExerciseOutcome) => {
    const ex = EXERCISE_BY_ID.get(id)!;
    actions().recordAnswer({ ex: id, kind: ex.kind, correct: o.correct, hints: o.hints, revealed: o.revealed, confidence: o.confidence, ms: o.ms, source: 'review', mistake: o.mistake });
    actions().setDraft(dailyDraftKey(key), serializeDaily({ key, ids: planned.ids, results: [...results.slice(0, idx), o.correct] }));
    setPending(true);
  };

  if (idx >= total) {
    const correct = results.filter(Boolean).length;
    return (
      <div className="page" data-testid="daily-summary">
        {celebrate === 'full' && correct === total && <Confetti />}
        <div className="card glow stack">
          <span className="eyebrow">{date}</span>
          <h1>🎯 Вызов дня выполнен</h1>
          <p className="muted" style={{ margin: 0 }}>Вы вспоминали темы без подсказки из урока — это и есть тренировка памяти. Завтра будет новый набор; пропуски ничем не штрафуются.</p>
          <div className="grid cols-3">
            <div className="kpi"><span className="v">{total}</span><span className="l">заданий</span></div>
            <div className="kpi"><span className="v">{correct}</span><span className="l">верно</span></div>
            <div className="kpi"><span className="v">{new Set(planned.ids.map((id) => EXERCISE_BY_ID.get(id)?.skill)).size}</span><span className="l">разных тем</span></div>
          </div>
        </div>
        <div className="card stack tight">
          <div className="card-title">Что было в наборе</div>
          {planned.ids.map((id, i) => {
            const ex = EXERCISE_BY_ID.get(id)!;
            const sk = SKILL_BY_ID.get(ex.skill)!;
            return (
              <div key={id} className="activity" style={{ cursor: 'default' }} data-testid="daily-item">
                <span className="a-icon" aria-hidden="true">{sk.icon}</span>
                <span className="grow"><span className="a-title">{sk.title}</span><br /><span className="a-why">{ROUTE_BY_ID.get(sk.route)?.title}</span></span>
                <span className={`chip ${results[i] ? 'ok' : 'warn'}`}>{results[i] ? '✓ верно' : '✗ есть что повторить'}</span>
                {!results[i] && <a className="btn sm" href={href(`/practice/${sk.id}`)}>Потренировать</a>}
              </div>
            );
          })}
        </div>
        <div className="row">
          <a className="btn primary" href={href('/')}>На главную</a>
          <a className="btn ghost" href={href('/bughunt')}>🐞 Охота на баги</a>
          <a className="btn ghost" href={href('/review')}>🔁 Повторение</a>
        </div>
      </div>
    );
  }

  const ex = EXERCISE_BY_ID.get(planned.ids[idx])!;
  const sk = SKILL_BY_ID.get(ex.skill)!;
  return (
    <div className="page wide" data-testid="daily" data-ex-id={ex.id}>
      <div className="row spread">
        <div className="stack tight">
          <span className="eyebrow">{date}</span>
          <h2 style={{ margin: 0 }}>🎯 Вызов дня: {sk.icon} {sk.title}</h2>
          <span className="small muted">Задание {idx + 1} из {total} · темы перемешаны (интерливинг) · сложность подстроена под вашу оценку</span>
        </div>
        <a className="btn ghost sm" href={href('/')} data-testid="daily-exit">Выйти (прогресс сохранится)</a>
      </div>
      <div className="bar" role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={idx + (pending ? 1 : 0)} aria-label="Прогресс вызова дня">
        <span style={{ width: `${((idx + (pending ? 1 : 0)) / total) * 100}%`, background: 'var(--accent)' }} />
      </div>
      <ExercisePlayer
        key={`${ex.id}-${idx}`}
        ex={ex}
        mode="review"
        nextLabel={idx + 1 >= DAILY_SIZE ? 'Итоги →' : 'Дальше →'}
        onDone={(o) => record(ex.id, o)}
        onNext={() => { setPending(false); setIdx((i) => i + 1); }}
      />
    </div>
  );
}
