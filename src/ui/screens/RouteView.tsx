import { useMemo, useState, type CSSProperties } from 'react';
import { ALL_EXERCISES, ALL_PROJECTS, ALL_SKILLS, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { GOALS, GOAL_INFO } from '../../core/settings';
import { planDay, routeProgress, missingPrereqs } from '../../core/planner';
import { skillStatus, STATUS_INFO, metricsOf } from '../../core/model';
import { actions, useApp } from '../../state/store';
import { activityView } from '../activities';
import { go, href } from '../router';
import { SkillGraph, StatusLegend } from '../components/SkillGraph';
import { ProgressRing } from '../components/ProgressRing';

export function RouteView({ id }: { id: string }) {
  const r = ROUTE_BY_ID.get(id);
  const s = useApp((x) => x);
  const [view, setView] = useState<'map' | 'list'>('map');
  const content = useMemo(() => ({ skills: ALL_SKILLS, exercises: ALL_EXERCISES, projects: ALL_PROJECTS }), []);
  if (!r) return <div className="page"><div className="card empty">Маршрут не найден. <a href="#/routes">Все маршруты</a></div></div>;
  const now = Date.now();
  const rs = s.routes[id];
  const goal = rs?.goal ?? s.settings.learning.goal;
  const p = routeProgress(s, r.skills, now);
  const plan = rs ? planDay(s, id, content, now) : [];
  const tiers = [1, 2, 3, 4].map((t) => r.skills.filter((x) => x.tier === t)).filter((x) => x.length);
  const start = () => { actions().startRoute(id, goal); };

  return (
    <div className="page wide" style={{ '--rc': r.color } as CSSProperties}>
      <div className="card glow" style={{ borderColor: `color-mix(in srgb, ${r.color} 45%, var(--border))` }}>
        <div className="row" style={{ alignItems: 'flex-start' }}>
          <div className="route-icon" style={{ '--rc': r.color } as CSSProperties} aria-hidden="true">{r.icon}</div>
          <div className="grow stack tight">
            <h1>{r.title}</h1>
            <div className="muted">{r.tagline}</div>
            <p style={{ margin: 0 }}>{r.description}</p>
          </div>
          <ProgressRing value={p.total ? p.mastered / p.total : 0} size={96} stroke={9} color={r.color} sub="освоено" />
        </div>
        <div className="grid cols-2" style={{ marginTop: 12 }}>
          <div>
            <div className="small"><strong>Результаты маршрута:</strong></div>
            <ul className="small" style={{ margin: '4px 0', paddingLeft: '1.2em' }}>{r.outcomes.map((o, i) => <li key={i}>{o}</li>)}</ul>
          </div>
          <div className="stack tight">
            <div className="small"><strong>Цель обучения на этом маршруте</strong> <span className="muted">— меняет план и подбор заданий</span></div>
            <div className="segmented" role="group" aria-label="Цель обучения">
              {GOALS.map((g) => <button key={g} aria-pressed={goal === g} onClick={() => rs ? actions().setRouteGoal(id, g) : actions().startRoute(id, g)} title={GOAL_INFO[g].desc}>{GOAL_INFO[g].icon} {GOAL_INFO[g].title}</button>)}
            </div>
            <div className="tiny muted">{GOAL_INFO[goal].desc}</div>
          </div>
        </div>
      </div>

      <div className="grid cols-2">
        <div className="card stack tight" data-testid="diag-card">
          <div className="card-title">🩺 Умная проверка знаний</div>
          {rs?.diagnosticAt ? (
            <>
              <p className="small muted" style={{ margin: 0 }}>Диагностика пройдена {new Date(rs.diagnosticAt).toLocaleDateString('ru-RU')}. Темы со статусом «вероятно знаю» достаточно подтвердить одной задачей.</p>
              <div className="row tight"><a className="btn" href={href(`/diag/${id}`)}>Пройти заново</a></div>
            </>
          ) : (
            <>
              <p className="small" style={{ margin: 0 }}>Адаптивный тест на 8–18 вопросов: каждый ответ уточняет оценку по теме и по связанным темам графа. Можно отвечать «не знаю» — это честнее и точнее угадывания.</p>
              <div className="row tight">
                <a className="btn primary" href={href(`/diag/${id}`)} data-testid="start-diag" onClick={start}>Пройти диагностику</a>
                <button className="btn ghost" onClick={() => { start(); const first = r.skills[0]; go(`/skill/${first.id}`); }}>Начать с нуля</button>
              </div>
            </>
          )}
        </div>
        <div className="card stack tight">
          <div className="card-title">🗓️ План по маршруту</div>
          {!rs ? (
            <div className="stack tight"><p className="small muted" style={{ margin: 0 }}>Маршрут ещё не начат.</p><button className="btn primary" onClick={start} data-testid="start-route">Начать маршрут</button></div>
          ) : plan.length ? plan.slice(0, 4).map((a, i) => { const v = activityView(a); return (
            <button key={i} className="activity" onClick={() => go(v.link)}>
              <span className="a-icon" aria-hidden="true">{v.icon}</span>
              <span className="grow"><span className="a-title">{v.title}</span><br /><span className="a-why">{a.reason}</span></span>
            </button>
          ); }) : <div className="small muted">На сегодня план выполнен — выберите любую тему ниже.</div>}
        </div>
      </div>

      <div className="card">
        <div className="row spread" style={{ marginBottom: 10 }}>
          <div className="card-title" style={{ margin: 0 }}>🗺️ Навыки маршрута</div>
          <div className="segmented" role="group" aria-label="Вид">
            <button aria-pressed={view === 'map'} onClick={() => setView('map')}>Граф</button>
            <button aria-pressed={view === 'list'} onClick={() => setView('list')}>Список</button>
          </div>
        </div>
        <StatusLegend />
        <div style={{ marginTop: 10 }}>
          {view === 'map' ? <SkillGraph skills={r.skills} onSelect={(sid) => go(`/skill/${sid}`)} /> : (
            <div className="stack">
              {tiers.map((list, ti) => (
                <div key={ti} className="stack tight">
                  <div className="small muted">Уровень {list[0].tier}</div>
                  {list.map((sk) => {
                    const st = skillStatus(s.skills[sk.id], now);
                    const m = metricsOf(s.skills[sk.id]);
                    const miss = missingPrereqs(s, sk, SKILL_BY_ID, now);
                    return (
                      <div key={sk.id} className="activity" style={{ cursor: 'default' }}>
                        <span className="a-icon" aria-hidden="true">{sk.icon}</span>
                        <span className="grow">
                          <a className="a-title" href={href(`/skill/${sk.id}`)} style={{ color: 'var(--text)' }}>{sk.title}</a>
                          <span className="badge-status" style={{ marginLeft: 8, color: STATUS_INFO[st].color }}><span className="dot" style={{ background: STATUS_INFO[st].color }} />{STATUS_INFO[st].label}</span>
                          <br /><span className="a-why">{sk.summary}{miss.length ? ` · сначала: ${miss.map((x) => x.title).join(', ')}` : ''}{m.attempts ? ` · попыток: ${m.attempts}, самостоятельно: ${m.independent}` : ''}</span>
                        </span>
                        <span className="row tight">
                          <a className="btn sm" href={href(`/skill/${sk.id}`)}>Урок</a>
                          <a className="btn sm ghost" href={href(`/practice/${sk.id}`)}>Практика</a>
                        </span>
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {r.projects.length > 0 && (
        <div className="card">
          <div className="card-title">🛠️ Проекты</div>
          <div className="grid cols-2">
            {r.projects.map((pr) => {
              const ready = pr.prereqs.filter((x) => !['mastered', 'durable', 'probable', 'rusty'].includes(skillStatus(s.skills[x], now)));
              const ps = s.projects[pr.id];
              return (
                <a key={pr.id} className="activity" href={href(`/project/${pr.id}`)} style={{ textDecoration: 'none' }}>
                  <span className="a-icon" aria-hidden="true">🛠️</span>
                  <span className="grow"><span className="a-title">{pr.title}</span><br /><span className="a-why">{pr.summary}</span><br />
                    <span className="tiny">{ps?.completedAt ? '✅ Завершён' : ps ? `Шаг ${ps.step + 1} из ${pr.steps.length}` : ready.length ? `Рекомендуется освоить: ${ready.map((x) => SKILL_BY_ID.get(x)?.title).join(', ')}` : 'Готово к старту'}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
