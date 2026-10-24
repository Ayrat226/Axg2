// Practice / verify / delayed check / spaced review / mistakes sessions. Items are picked adaptively one
// at a time, so each answer changes what comes next.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_EXERCISES, ALL_SKILLS, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { dueChecks, dueReviews, pickExercise, type PickMode } from '../../core/planner';
import { skillStatus, STATUS_INFO, type EvidenceSource } from '../../core/model';
import type { Exercise } from '../../core/types';
import { actions, useApp, useStore } from '../../state/store';
import { ExercisePlayer, type ExerciseOutcome } from '../components/ExercisePlayer';
import { Confetti } from '../components/Modal';
import { href } from '../router';

export type SessionMode = 'practice' | 'verify' | 'check' | 'review' | 'mistakes';

const TITLES: Record<SessionMode, string> = {
  practice: 'Практика', verify: 'Подтверждение знаний', check: 'Отсроченная проверка', review: 'Интервальное повторение', mistakes: 'Работа над ошибками',
};
const SOURCE: Record<SessionMode, EvidenceSource> = { practice: 'practice', verify: 'practice', check: 'check', review: 'review', mistakes: 'practice' };

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619);
  return h >>> 0;
}

export function Session({ mode, skill, route }: { mode: SessionMode; skill?: string; route?: string }) {
  const L = useApp((s) => s.settings.learning);
  const [startAt] = useState(Date.now());
  const initial = useRef(useStore.getState().s);
  const [done, setDone] = useState<{ ex: Exercise; o: ExerciseOutcome }[]>([]);
  const [pending, setPending] = useState<ExerciseOutcome | null>(null);
  const [finished, setFinished] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  useEffect(() => {
    if (!L.showTimer) return;
    const t = setInterval(() => setElapsed(Date.now() - startAt), 1000);
    return () => clearInterval(t);
  }, [L.showTimer, startAt]);

  // Skill queue for multi-skill sessions is fixed at start (interleaved when enabled).
  const queue = useMemo(() => {
    const s = initial.current;
    const now = Date.now();
    if (mode === 'review') {
      const skills = route ? ALL_SKILLS.filter((x) => x.route === route) : ALL_SKILLS;
      const due = [...dueChecks(s, skills, now), ...dueReviews(s, skills, now)];
      const list = [...new Set(due)];
      const ordered = L.interleave ? list.sort((a, b) => hash(a + now) - hash(b + now)) : list.sort((a, b) => a.localeCompare(b));
      return ordered.slice(0, L.sessionSize * 2);
    }
    if (mode === 'mistakes') {
      const open = s.mistakes.filter((m) => !m.resolvedAt).sort((a, b) => b.t - a.t);
      const bySkill = [...new Set(open.map((m) => m.skill))];
      const list = L.interleave ? bySkill : bySkill.sort();
      return list.slice(0, L.sessionSize);
    }
    return skill ? [skill] : [];
  }, [mode, route, skill, L.interleave, L.sessionSize]);

  const state = useApp((s) => s);
  const limit = mode === 'check' ? 1 : mode === 'verify' ? 2 : mode === 'practice' ? L.sessionSize : queue.length;

  const current = useMemo(() => {
    if (finished || done.length >= limit) return null;
    const now = Date.now();
    const exclude = new Set(done.map((d) => d.ex.id));
    if (mode === 'practice' || mode === 'verify' || mode === 'check') {
      if (!skill) return null;
      const st = state.skills[skill];
      const status = skillStatus(st, now);
      const wasMastered = !!initial.current.skills[skill]?.masteredAt;
      if (mode === 'verify' && done.length && (status === 'mastered' || done.some((d) => d.o.correct && !d.o.hints))) return null;
      if (mode === 'practice' && !wasMastered && st?.masteredAt && done.length >= 3) return null;
      const pm: PickMode = mode;
      return pickExercise(state, skill, ALL_EXERCISES, { mode: pm, now, exclude, goal: state.routes[SKILL_BY_ID.get(skill)?.route ?? '']?.goal ?? L.goal });
    }
    const target = queue[done.length];
    if (!target) return null;
    const isCheck = state.skills[target]?.checkDue !== undefined && state.skills[target]!.checkDue! <= now;
    const mis = mode === 'mistakes' ? state.mistakes.find((m) => m.skill === target && !m.resolvedAt)?.misconception : undefined;
    return pickExercise(state, target, ALL_EXERCISES, { mode: mode === 'mistakes' ? 'practice' : isCheck ? 'check' : 'review', now, exclude, misconception: mis });
    // `state` changes after each answer; recompute only when the step changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done.length, finished, queue, limit, mode, skill]);

  const record = (ex: Exercise, o: ExerciseOutcome) => {
    const now = Date.now();
    const st = useStore.getState().s.skills[ex.skill];
    const isCheck = mode === 'check' || (mode === 'review' && st?.checkDue !== undefined && st.checkDue <= now);
    actions().recordAnswer({ ex: ex.id, kind: ex.kind, correct: o.correct, hints: o.hints, revealed: o.revealed, confidence: o.confidence, ms: o.ms, source: isCheck ? 'check' : SOURCE[mode], mistake: o.mistake });
  };

  const title = TITLES[mode];
  const sk = skill ? SKILL_BY_ID.get(skill) : undefined;

  if (!current && !done.length) {
    return (
      <div className="page">
        <div className="card empty stack" data-testid="session-empty">
          <div className="big">{mode === 'review' ? '🌿' : mode === 'mistakes' ? '✨' : '📭'}</div>
          <h2 style={{ margin: 0 }}>{mode === 'review' ? 'Сейчас нечего повторять' : mode === 'mistakes' ? 'Открытых ошибок нет' : 'Нет заданий'}</h2>
          <p>{mode === 'review' ? 'Темы вернутся, когда вероятность их вспомнить приблизится к целевой. Это экономит время.' : 'Отличная работа.'}</p>
          <a className="btn primary" href={href('/')}>На главную</a>
        </div>
      </div>
    );
  }

  if (!current) return <Summary mode={mode} done={done} before={initial.current} skill={skill} />;

  const progress = (done.length + (pending ? 1 : 0)) / Math.max(1, limit);
  return (
    <div className="page wide" data-testid="session" data-mode={mode}>
      <div className="row spread">
        <div className="stack tight">
          <h2 style={{ margin: 0 }}>{title}{sk ? `: ${sk.icon} ${sk.title}` : ''}</h2>
          <span className="small muted">
            Задание {done.length + 1}{mode === 'practice' ? ` из ${limit}` : mode === 'review' || mode === 'mistakes' ? ` из ${queue.length}` : ''}
            {mode === 'review' && L.interleave && ' · темы перемешаны (интерливинг)'}
            {L.showTimer && ` · ${Math.floor(elapsed / 60000)}:${String(Math.floor(elapsed / 1000) % 60).padStart(2, '0')}`}
          </span>
        </div>
        <button className="btn ghost sm" onClick={() => setFinished(true)} data-testid="end-session">Завершить</button>
      </div>
      <div className="bar"><span style={{ width: `${progress * 100}%`, background: 'var(--accent)' }} /></div>
      <ExercisePlayer
        key={`${current.id}-${done.length}`}
        ex={current}
        mode={mode === 'mistakes' ? 'practice' : mode}
        onDone={(o) => { setPending(o); record(current, o); }}
        onNext={() => { if (pending) { setDone((d) => [...d, { ex: current, o: pending }]); setPending(null); } }}
      />
    </div>
  );
}

function Summary({ mode, done, before, skill }: { mode: SessionMode; done: { ex: Exercise; o: ExerciseOutcome }[]; before: import('../../core/state').AppState; skill?: string }) {
  const s = useApp((x) => x);
  const celebrate = s.settings.learning.celebrate;
  const now = Date.now();
  const skills = [...new Set(done.map((d) => d.ex.skill))];
  const correct = done.filter((d) => d.o.correct).length;
  const indep = done.filter((d) => d.o.correct && !d.o.hints && !d.o.revealed).length;
  const newlyMastered = skills.filter((id) => !before.skills[id]?.masteredAt && s.skills[id]?.masteredAt);
  const route = skill ? SKILL_BY_ID.get(skill)?.route : undefined;
  return (
    <div className="page" data-testid="summary">
      {celebrate === 'full' && newlyMastered.length > 0 && <Confetti />}
      <div className="card glow stack">
        <h1>{newlyMastered.length ? '🏆 Навык освоен!' : 'Сессия завершена'}</h1>
        <div className="grid cols-4">
          <div className="kpi"><span className="v">{done.length}</span><span className="l">заданий</span></div>
          <div className="kpi"><span className="v">{correct}</span><span className="l">верно</span></div>
          <div className="kpi"><span className="v">{indep}</span><span className="l">самостоятельно</span></div>
          <div className="kpi"><span className="v">{done.filter((d) => d.o.hints).length}</span><span className="l">с подсказками</span></div>
        </div>
      </div>
      <div className="card stack tight">
        <div className="card-title">Как изменилась оценка владения</div>
        {skills.map((id) => {
          const sk = SKILL_BY_ID.get(id)!;
          const p0 = before.skills[id]?.p ?? 0.15, p1 = s.skills[id]?.p ?? p0;
          const st = skillStatus(s.skills[id], now);
          return (
            <div key={id} className="stack tight">
              <div className="row spread small"><span>{sk.icon} {sk.title}</span><span className="badge-status" style={{ color: STATUS_INFO[st].color }}><span className="dot" style={{ background: STATUS_INFO[st].color }} />{STATUS_INFO[st].label} · {Math.round(p0 * 100)}% → {Math.round(p1 * 100)}%</span></div>
              <div className="bar" aria-hidden="true"><span style={{ width: `${Math.min(p0, p1) * 100}%`, background: 'var(--accent)' }} /><span style={{ width: `${Math.abs(p1 - p0) * 100}%`, background: p1 >= p0 ? 'var(--ok)' : 'var(--err)' }} /></div>
            </div>
          );
        })}
        <p className="tiny muted" style={{ margin: 0 }}>Освоение засчитывается только при нескольких самостоятельных решениях разных типов. Через 7 дней освоенную тему ждёт отсроченная проверка.</p>
      </div>
      <div className="row">
        {mode === 'practice' && skill && !s.skills[skill]?.masteredAt && <a className="btn primary" href={href(`/practice/${skill}?mode=practice&n=${now}`)}>Ещё сессия</a>}
        {route && <a className="btn primary" href={href(`/route/${route}`)}>К маршруту {ROUTE_BY_ID.get(route)?.icon}</a>}
        <a className="btn ghost" href={href('/')}>На главную</a>
        {s.mistakes.some((m) => !m.resolvedAt) && <a className="btn ghost" href={href('/mistakes')}>Журнал ошибок</a>}
      </div>
    </div>
  );
}
