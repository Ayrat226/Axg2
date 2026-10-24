// Smart placement test: adaptive item selection over the skill graph, "не знаю", confidence,
// transparent live estimates, explainable results with learner overrides.
import { useMemo, useState } from 'react';
import { ALL_EXERCISES, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { diagnosticResult, nextQuestion, remainingEstimate, SELF_LEVELS, DIAG_MAX, type DiagLength, type SelfLevel } from '../../core/diagnostic';
import { actions, useApp } from '../../state/store';
import { ExercisePlayer, type ExerciseOutcome } from '../components/ExercisePlayer';
import { SkillGraph } from '../components/SkillGraph';
import { go, href } from '../router';
import type { SkillStatus } from '../../core/model';

export function Diagnostic({ routeId }: { routeId: string }) {
  const route = ROUTE_BY_ID.get(routeId);
  const diag = useApp((s) => s.diag);
  const L = useApp((s) => s.settings.learning);
  const [level, setLevel] = useState<SelfLevel>(1);
  const [length, setLength] = useState<DiagLength>(L.diagnosticLength);
  const [outcome, setOutcome] = useState<ExerciseOutcome | null>(null);
  const [showLive, setShowLive] = useState(false);
  const [manual, setManual] = useState(false);
  const [claimed, setClaimed] = useState<Record<string, boolean>>({});
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [ended, setEnded] = useState(false);
  const pool = useMemo(() => ALL_EXERCISES.filter((e) => e.skill.startsWith(route?.skills[0]?.id.split('.')[0] + '.')), [route]);
  if (!route) return <div className="page"><div className="card empty">Маршрут не найден.</div></div>;
  const active = diag && diag.route === routeId ? diag : undefined;
  const question = active && !ended ? nextQuestion(active, route.skills, pool) : null;

  if (!active) {
    return (
      <div className="page" style={{ maxWidth: 900 }}>
        <div className="card glow stack" data-testid="diag-intro">
          <div className="row"><span style={{ fontSize: '2.2rem' }} aria-hidden="true">🩺</span><div className="grow"><h1>Умная проверка: {route.title}</h1><div className="muted">Адаптивная диагностика по графу навыков</div></div></div>
          <div className="grid cols-3 small">
            <div className="card flat"><strong>Адаптивно.</strong> Следующий вопрос выбирается там, где он даст больше всего информации — с учётом зависимостей между темами.</div>
            <div className="card flat"><strong>Честно.</strong> Кнопка «Не знаю» лучше угадывания: угаданные ответы засчитываются с меньшим весом.</div>
            <div className="card flat"><strong>Прозрачно.</strong> В результатах видно, почему тема отмечена как известная, и любую оценку можно изменить.</div>
          </div>
          <div className="field">Ваш опыт в «{route.title}»
            <div className="grid cols-4" role="radiogroup" aria-label="Уровень опыта">
              {SELF_LEVELS.map((l) => (
                <button key={l.level} role="radio" aria-checked={level === l.level} className="option" onClick={() => setLevel(l.level)}>
                  <span className="grow"><strong>{l.title}</strong><br /><span className="tiny muted">{l.desc}</span></span>
                </button>
              ))}
            </div>
          </div>
          <div className="field">Длина теста
            <div className="segmented" role="group" aria-label="Длина теста">
              {(['short', 'standard', 'thorough'] as const).map((d) => <button key={d} aria-pressed={length === d} onClick={() => setLength(d)}>{d === 'short' ? 'Короткий' : d === 'standard' ? 'Стандартный' : 'Подробный'} · до {DIAG_MAX[d]}</button>)}
            </div>
          </div>
          <div className="row">
            <button className="btn primary lg" onClick={() => { actions().startRoute(routeId); actions().diagStart(routeId, level, length); setEnded(false); }} data-testid="diag-begin">Начать проверку</button>
            <button className="btn ghost" onClick={() => setManual((m) => !m)}>Отметить знакомые темы вручную</button>
            <a className="btn ghost" href={href(`/route/${routeId}`)}>Пропустить</a>
          </div>
          {manual && (
            <div className="card flat stack tight">
              <div className="small">Отмеченные темы получат статус «вероятно знаю» — их нужно будет подтвердить одной задачей.</div>
              {route.skills.map((sk) => (
                <label key={sk.id} className="row tight small"><input type="checkbox" checked={!!claimed[sk.id]} onChange={(e) => setClaimed((c) => ({ ...c, [sk.id]: e.target.checked }))} />{sk.icon} {sk.title}</label>
              ))}
              <div><button className="btn primary" onClick={() => { actions().startRoute(routeId); Object.entries(claimed).forEach(([k, v]) => actions().setClaimed(k, v)); actions().toast('Отметки сохранены', 'success'); go(`/route/${routeId}`); }}>Сохранить</button></div>
            </div>
          )}
        </div>
      </div>
    );
  }

  if (question) {
    const n = active.answers.length + 1;
    const left = remainingEstimate(active, route.skills);
    return (
      <div className="page wide" data-testid="diag-question">
        <div className="row spread">
          <div className="stack tight">
            <h2 style={{ margin: 0 }}>🩺 Диагностика · вопрос {n}</h2>
            <span className="small muted">Осталось примерно {Math.max(1, left)} · максимум {active.maxQuestions}</span>
          </div>
          <div className="row tight">
            <label className="row tight small"><input type="checkbox" checked={showLive} onChange={(e) => setShowLive(e.target.checked)} />Показывать оценку</label>
            <button className="btn ghost sm" onClick={() => setEnded(true)} data-testid="diag-end">Завершить досрочно</button>
          </div>
        </div>
        <div className="bar"><span style={{ width: `${(active.answers.length / Math.max(active.answers.length + left, 1)) * 100}%`, background: 'var(--accent)' }} /></div>
        <ExercisePlayer
          key={question.id}
          ex={question}
          mode="diagnostic"
          onDone={(o) => setOutcome(o)}
          onNext={() => {
            if (!outcome) return;
            actions().diagAnswer({ ex: question.id, skill: question.skill, kind: question.kind, correct: outcome.correct, dontKnow: !!outcome.dontKnow, confidence: outcome.confidence, ms: outcome.ms });
            setOutcome(null);
          }}
        />
        {showLive && (
          <div className="card">
            <div className="card-title">Текущая оценка по темам</div>
            <div className="grid cols-3">
              {route.skills.map((sk) => (
                <div key={sk.id} className="small">
                  <div className="row spread"><span>{sk.icon} {sk.title}</span><span className="muted">{Math.round(active.p[sk.id] * 100)}%</span></div>
                  <div className="bar"><span style={{ width: `${active.p[sk.id] * 100}%`, background: 'var(--accent)' }} /></div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  const res = diagnosticResult(active, route.skills);
  const verdictLabel = { known: 'Знаю', partial: 'Частично', gap: 'Пробел' } as const;
  const verdictChip = { known: 'ok', partial: 'warn', gap: 'err' } as const;
  const effective = (id: string, v: string) => (overrides[id] !== undefined ? (overrides[id] ? 'known' : 'gap') : v);
  const highlight: Record<string, SkillStatus> = Object.fromEntries(res.skills.map((r) => {
    const v = effective(r.skill, r.verdict);
    return [r.skill, v === 'known' ? 'probable' : v === 'partial' ? 'learning' : 'new'];
  }));
  const correct = active.answers.filter((a) => a.correct && !a.dontKnow).length;
  const startSkill = res.skills.find((r) => effective(r.skill, r.verdict) !== 'known')?.skill;
  return (
    <div className="page wide" data-testid="diag-results">
      <div className="card glow stack">
        <h1>Результаты диагностики</h1>
        <p className="muted" style={{ margin: 0 }}>
          Вопросов: {active.answers.length}, верно: {correct}. Оценки — вероятностные: «Знаю» значит, что тема, скорее всего, знакома, но мастерство будет засчитано только после самостоятельной задачи.
        </p>
        {startSkill && <div>Рекомендуемая точка старта: <strong>{SKILL_BY_ID.get(startSkill)?.icon} {SKILL_BY_ID.get(startSkill)?.title}</strong></div>}
      </div>
      <div className="card">
        <div className="card-title">Карта ваших знаний</div>
        <SkillGraph skills={route.skills} onSelect={() => {}} highlight={highlight} />
      </div>
      <div className="card stack tight">
        <div className="card-title">По темам <span className="sub">можно изменить любую оценку</span></div>
        {res.skills.map((r) => {
          const sk = SKILL_BY_ID.get(r.skill)!;
          const v = effective(r.skill, r.verdict) as keyof typeof verdictLabel;
          return (
            <div key={r.skill} className="activity" style={{ cursor: 'default' }} data-testid="diag-row">
              <span className="a-icon" aria-hidden="true">{sk.icon}</span>
              <span className="grow">
                <span className="a-title">{sk.title}</span> <span className={`chip ${verdictChip[v]}`}>{verdictLabel[v]}</span> <span className="tiny muted">оценка {Math.round(r.p * 100)}%</span>
                <br /><span className="a-why">{r.reasons.join(' ')}</span>
              </span>
              <span className="segmented" role="group" aria-label={`Оценка темы ${sk.title}`}>
                <button aria-pressed={overrides[r.skill] === true} onClick={() => setOverrides((o) => ({ ...o, [r.skill]: true }))}>Я знаю</button>
                <button aria-pressed={overrides[r.skill] === false} onClick={() => setOverrides((o) => ({ ...o, [r.skill]: false }))}>Хочу изучить</button>
              </span>
            </div>
          );
        })}
      </div>
      <div className="row">
        <button className="btn primary lg" data-testid="diag-accept" onClick={() => {
          const final: Record<string, boolean> = {};
          for (const r of res.skills) {
            if (overrides[r.skill] !== undefined) final[r.skill] = overrides[r.skill];
          }
          actions().diagFinish(final);
          actions().toast('План составлен по результатам диагностики', 'success');
          go(`/route/${routeId}`);
        }}>Принять и составить план</button>
        <button className="btn ghost" onClick={() => { actions().diagCancel(); setEnded(false); }}>Отменить диагностику</button>
      </div>
    </div>
  );
}
