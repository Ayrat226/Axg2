// Main menu / hub: greeting, "continue" hero with the explained recommendation, and customizable widgets.
import { useMemo, type CSSProperties, type MouseEvent, type ReactNode } from 'react';
import { ALL_SKILLS, ROUTES, ROUTE_BY_ID, SKILL_BY_ID, ALL_EXERCISES, ALL_PROJECTS } from '../../content';
import { planDay, routeProgress, dueReviews, plural } from '../../core/planner';
import { dayKey } from '../../core/state';
import { isIndependent, skillStatus } from '../../core/model';
import { WIDGET_INFO, GOAL_INFO, type WidgetId } from '../../core/settings';
import { useApp } from '../../state/store';
import { activityView } from '../activities';
import { go, href } from '../router';
import { ProgressRing, StackBar } from '../components/ProgressRing';
import { Constellation } from '../components/Constellation';
import { motionAllowed } from '../theme';

function greeting(h: number) {
  return h < 5 ? 'Доброй ночи' : h < 12 ? 'Доброе утро' : h < 18 ? 'Добрый день' : 'Добрый вечер';
}

export function tilt(e: MouseEvent<HTMLElement>, enabled: boolean) {
  const el = e.currentTarget;
  const r = el.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
  el.style.setProperty('--mx', `${x * 100}%`);
  el.style.setProperty('--my', `${y * 100}%`);
  if (enabled) el.style.transform = `perspective(900px) rotateX(${(0.5 - y) * 5}deg) rotateY(${(x - 0.5) * 7}deg) translateY(-2px)`;
}

export function RouteCard({ id }: { id: string }) {
  const r = ROUTE_BY_ID.get(id)!;
  const s = useApp((x) => x);
  const motion = motionAllowed(s.settings.appearance.motion);
  const p = routeProgress(s, r.skills, Date.now());
  const started = !!s.routes[id];
  return (
    <button className="card route-card" style={{ '--rc': r.color } as CSSProperties} onMouseMove={(e) => tilt(e, motion)} onMouseLeave={(e) => { e.currentTarget.style.transform = ''; }}
      onClick={() => go(`/route/${id}`)} data-testid={`route-card-${id}`}>
      <div className="row" style={{ alignItems: 'flex-start' }}>
        <div className="route-icon" aria-hidden="true">{r.icon}</div>
        <div className="grow">
          <div style={{ fontWeight: 800, fontSize: '1.15rem' }}>{r.title}</div>
          <div className="small muted">{r.tagline}</div>
        </div>
        <ProgressRing value={p.total ? p.mastered / p.total : 0} size={54} stroke={6} color={r.color} />
      </div>
      <div className="row tight" style={{ marginTop: 12 }}>
        <span className="chip">{r.skills.length} {plural(r.skills.length, 'тема', 'темы', 'тем')}</span>
        <span className="chip">{r.exercises.length} заданий</span>
        {r.projects.length > 0 && <span className="chip">{r.projects.length} {plural(r.projects.length, 'проект', 'проекта', 'проектов')}</span>}
        {started ? <span className="chip accent">{GOAL_INFO[s.routes[id].goal].icon} {GOAL_INFO[s.routes[id].goal].title}</span> : <span className="chip">Не начат</span>}
      </div>
      <div style={{ marginTop: 10 }}>
        <StackBar parts={[
          { value: p.durable, color: 'var(--st-durable)', label: 'закреплено' },
          { value: p.mastered - p.durable, color: 'var(--st-mastered)', label: 'освоено' },
          { value: p.probable, color: 'var(--st-probable)', label: 'вероятно знаю' },
          { value: p.learning, color: 'var(--st-learning)', label: 'изучаю' },
          { value: p.total - p.mastered - p.probable - p.learning, color: 'transparent', label: 'не начато' },
        ]} />
      </div>
    </button>
  );
}

function Widget({ id, children, wide }: { id: WidgetId; children: ReactNode; wide?: boolean }) {
  return (
    <section className="card fade-in" style={wide ? { gridColumn: '1 / -1' } : undefined} aria-label={WIDGET_INFO[id]} data-testid={`widget-${id}`}>
      {children}
    </section>
  );
}

export function Home() {
  const s = useApp((x) => x);
  const now = Date.now();
  const active = s.profile.activeRoute && ROUTE_BY_ID.has(s.profile.activeRoute) ? s.profile.activeRoute : undefined;
  const content = useMemo(() => ({ skills: ALL_SKILLS, exercises: ALL_EXERCISES, projects: ALL_PROJECTS }), []);
  const plan = active ? planDay(s, active, content, now) : [];
  const reviews = dueReviews(s, ALL_SKILLS, now);
  const unresolved = s.mistakes.filter((m) => !m.resolvedAt);
  const week = Array.from({ length: 7 }, (_, i) => {
    const t = now - (6 - i) * 86_400_000;
    const d = new Date(t);
    return { key: dayKey(t), label: d.toLocaleDateString('ru-RU', { weekday: 'short' }), log: s.days[dayKey(t)] };
  });
  const weekMin = week.reduce((n, d) => n + (d.log?.ms ?? 0), 0) / 60000;
  const weekGoal = s.settings.learning.dailyMinutes * 5;
  const allEv = Object.values(s.skills).flatMap((x) => x.evidence.filter((e) => e.source !== 'diagnostic'));
  const indep = allEv.filter(isIndependent).length;
  const statuses = ALL_SKILLS.map((x) => skillStatus(s.skills[x.id], now));
  const first = plan[0];
  const fv = first && activityView(first);

  const widgets: Record<WidgetId, ReactNode> = {
    continue: null,
    plan: (
      <Widget id="plan" key="plan">
        <div className="card-title">🗓️ План на сегодня {active && <span className="sub">{ROUTE_BY_ID.get(active)!.title} · ~{plan.reduce((n, a) => n + a.minutes, 0)} мин</span>}</div>
        {plan.length ? (
          <div className="timeline">
            {plan.map((a, i) => { const v = activityView(a); return (
              <button key={i} className="activity" onClick={() => go(v.link)}>
                <span className="a-icon" aria-hidden="true">{v.icon}</span>
                <span className="grow"><span className="a-title">{v.title}</span><br /><span className="a-why">{a.reason}</span></span>
                <span className="chip">{a.minutes} мин</span>
              </button>
            ); })}
          </div>
        ) : <div className="empty small">{active ? 'На сегодня всё! Можно отдохнуть или выбрать любую тему самостоятельно.' : 'Выберите маршрут, чтобы получить персональный план.'}</div>}
      </Widget>
    ),
    routes: (
      <Widget id="routes" key="routes" wide>
        <div className="card-title">🧭 Маршруты <a className="sub" href={href('/routes')}>все маршруты →</a></div>
        <div className="grid cols-2">{ROUTES.map((r) => <RouteCard key={r.id} id={r.id} />)}</div>
      </Widget>
    ),
    constellation: (
      <Widget id="constellation" key="constellation">
        <div className="card-title">✨ Созвездие навыков <a className="sub" href={href('/map')}>карта →</a></div>
        <Constellation />
      </Widget>
    ),
    reviews: (
      <Widget id="reviews" key="reviews">
        <div className="card-title">🔁 Повторение</div>
        {reviews.length ? (
          <div className="stack tight">
            <p className="small muted" style={{ margin: 0 }}>{reviews.length} {plural(reviews.length, 'тема', 'темы', 'тем')} на грани забывания. Каждое повторение — новая задача на применение, а не та же карточка.</p>
            <div className="row tight">{reviews.slice(0, 6).map((id) => <span key={id} className="chip">{SKILL_BY_ID.get(id)?.icon} {SKILL_BY_ID.get(id)?.title}</span>)}</div>
            <a className="btn primary" href={href('/review')}>Начать повторение</a>
          </div>
        ) : <div className="empty small">Сейчас нечего повторять — интервалы подбираются автоматически.</div>}
      </Widget>
    ),
    mistakes: (
      <Widget id="mistakes" key="mistakes">
        <div className="card-title">🩹 Работа над ошибками</div>
        {unresolved.length ? (
          <div className="stack tight">
            <p className="small muted" style={{ margin: 0 }}>{unresolved.length} неразобранных {plural(unresolved.length, 'ошибка', 'ошибки', 'ошибок')}. Ошибка считается разобранной после самостоятельного решения по той же теме.</p>
            <div className="row tight"><a className="btn primary" href={href('/mistakes/practice')}>Потренироваться</a><a className="btn ghost" href={href('/mistakes')}>Журнал</a></div>
          </div>
        ) : <div className="empty small">Открытых ошибок нет.</div>}
      </Widget>
    ),
    metrics: (
      <Widget id="metrics" key="metrics">
        <div className="card-title">📈 Показатели обучения <a className="sub" href={href('/progress')}>подробно →</a></div>
        <div className="grid cols-3">
          <div className="kpi"><span className="v">{statuses.filter((x) => x === 'mastered' || x === 'durable').length}</span><span className="l">навыков освоено</span></div>
          <div className="kpi"><span className="v">{statuses.filter((x) => x === 'durable').length}</span><span className="l">закреплено проверкой</span></div>
          <div className="kpi"><span className="v">{allEv.length ? Math.round((indep / allEv.length) * 100) : 0}%</span><span className="l">решено самостоятельно</span></div>
        </div>
      </Widget>
    ),
    week: (
      <Widget id="week" key="week">
        <div className="card-title">📅 Неделя <span className="sub">{Math.round(weekMin)} из {weekGoal} мин</span></div>
        <div className="week">
          {week.map((d) => {
            const v = Math.min(1, (d.log?.ms ?? 0) / 60000 / s.settings.learning.dailyMinutes);
            return (
              <div key={d.key} className="day" title={`${d.key}: ${d.log?.items ?? 0} заданий`}>
                <div className="cell" style={{ background: v ? `color-mix(in srgb, var(--accent) ${15 + v * 75}%, transparent)` : undefined }} />
                <span>{d.label}</span>
              </div>
            );
          })}
        </div>
        <p className="tiny muted" style={{ marginBottom: 0 }}>Без «серий» и штрафов за пропуски: важен регулярный ритм, а не непрерывность.</p>
      </Widget>
    ),
  };

  const order = s.settings.dashboard.widgets.filter((w) => w.visible && w.id !== 'continue').map((w) => widgets[w.id]);
  const showContinue = s.settings.dashboard.widgets.find((w) => w.id === 'continue')?.visible !== false;

  return (
    <div className="page wide">
      <div className="hero">
        <div className="card glow continue-card stack">
          <div className="greeting">
            <span className="eyebrow">{new Date().toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
            <h1>{greeting(new Date().getHours())}{s.profile.name ? `, ${s.profile.name}` : ''}!</h1>
          </div>
          {showContinue && (fv ? (
            <div className="stack tight" data-testid="continue">
              <div className="small muted">Рекомендуем сейчас</div>
              <div className="row" style={{ alignItems: 'flex-start' }}>
                <span className="a-icon" style={{ fontSize: '2rem' }} aria-hidden="true">{fv.icon}</span>
                <div className="grow">
                  <div style={{ fontWeight: 800, fontSize: '1.2rem' }}>{fv.title}</div>
                  <div className="small muted">Почему: {first.reason}</div>
                </div>
              </div>
              <div className="row tight">
                <button className="btn primary lg" onClick={() => go(fv.link)} data-testid="continue-btn">Продолжить →</button>
                {plan.slice(1, 3).map((a, i) => { const v = activityView(a); return <button key={i} className="btn ghost" onClick={() => go(v.link)}>{v.icon} {v.title.length > 34 ? v.title.slice(0, 33) + '…' : v.title}</button>; })}
              </div>
            </div>
          ) : (
            <div className="stack tight">
              <p className="muted" style={{ margin: 0 }}>{active ? 'План на сегодня выполнен. Выберите тему сами или загляните в песочницу.' : 'Выберите маршрут — короткая диагностика покажет, с чего начать.'}</p>
              <div className="row tight"><a className="btn primary" href={href(active ? `/route/${active}` : '/routes')}>{active ? 'Открыть маршрут' : 'Выбрать маршрут'}</a><a className="btn ghost" href={href('/playground')}>🧪 Песочница</a></div>
            </div>
          ))}
          <div className="row tight">
            <button className="btn sm ghost" onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', ctrlKey: true }))}>⌘ Поиск <kbd>Ctrl K</kbd></button>
            <a className="btn sm ghost" href={href('/settings/home')}>🧩 Настроить главную</a>
          </div>
        </div>
        <div className="card stack" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <ProgressRing value={weekGoal ? weekMin / weekGoal : 0} size={150} stroke={12} label={`${Math.round(weekMin)}`} sub={`мин за неделю из ${weekGoal}`} />
          <div className="row tight" style={{ justifyContent: 'center' }}>
            <span className="chip">🔁 {reviews.length} к повторению</span>
            <span className="chip">🩹 {unresolved.length} ошибок</span>
            <span className="chip">🎯 {GOAL_INFO[active ? s.routes[active]?.goal ?? s.settings.learning.goal : s.settings.learning.goal].title}</span>
          </div>
        </div>
      </div>
      <div className="grid cols-2">{order}</div>
    </div>
  );
}
