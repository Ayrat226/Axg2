import { NAV, SETTINGS_NAV } from '../nav';
import { href, type Loc } from '../router';
import { actions, useApp } from '../../state/store';
import { dueAll } from '../../core/planner';
import { ALL_SKILLS, ROUTE_BY_ID } from '../../content';

export function useBadges(): Record<string, number> {
  const s = useApp((x) => x);
  const now = Date.now();
  return {
    review: dueAll(s, ALL_SKILLS, now).length,
    mistakes: s.mistakes.filter((m) => !m.resolvedAt).length,
  };
}

export function Sidebar({ loc, onPalette }: { loc: Loc; onPalette: () => void }) {
  const collapsed = useApp((s) => s.settings.appearance.sidebar === 'collapsed');
  const active = useApp((s) => s.profile.activeRoute);
  const badges = useBadges();
  const current = loc.parts[0] ?? '';
  const route = active ? ROUTE_BY_ID.get(active) : undefined;
  return (
    <nav className={`sidebar ${collapsed ? 'collapsed' : ''}`} aria-label="Основная навигация">
      <div className="brand">
        <span className="brand-logo" aria-hidden="true">LL</span>
        <span className="brand-name">LearnLab</span>
      </div>
      <button className="nav-item" onClick={onPalette} title="Команды и поиск (Ctrl+K)">
        <span className="nav-icon">⌘</span>
        <span className="nav-label grow">Поиск</span>
        <kbd className="nav-label" style={{ flex: 'none' }}>Ctrl K</kbd>
      </button>
      <div className="side-section">Обучение</div>
      {NAV.map((n) => (
        <a key={n.path} href={href(n.path)} className={`nav-item ${current === n.match || (n.match === 'routes' && ['route', 'skill', 'practice', 'diag'].includes(current)) ? 'active' : ''}`} title={n.label} aria-current={current === n.match ? 'page' : undefined}>
          <span className="nav-icon" aria-hidden="true">{n.icon}</span>
          <span className="nav-label">{n.label}</span>
          {badges[n.match] ? <span className="nav-badge" aria-label={`${badges[n.match]} ожидает`}>{badges[n.match]}</span> : null}
        </a>
      ))}
      {route && (
        <>
          <div className="side-section">Текущий маршрут</div>
          <a className="nav-item" href={href(`/route/${route.id}`)} title={route.title}>
            <span className="nav-icon" aria-hidden="true">{route.icon}</span>
            <span className="nav-label">{route.title}</span>
          </a>
        </>
      )}
      <div className="side-foot">
        <a href={href(SETTINGS_NAV.path)} className={`nav-item ${current === 'settings' ? 'active' : ''}`} title="Настройки">
          <span className="nav-icon" aria-hidden="true">{SETTINGS_NAV.icon}</span>
          <span className="nav-label">{SETTINGS_NAV.label}</span>
        </a>
        <button className="nav-item" onClick={() => actions().updateSettings({ appearance: { sidebar: collapsed ? 'expanded' : 'collapsed' } })} title={collapsed ? 'Развернуть меню' : 'Свернуть меню'} aria-label={collapsed ? 'Развернуть меню' : 'Свернуть меню'}>
          <span className="nav-icon" aria-hidden="true">{collapsed ? '»' : '«'}</span>
          <span className="nav-label">Свернуть</span>
        </button>
      </div>
    </nav>
  );
}

export function BottomNav({ loc }: { loc: Loc }) {
  const badges = useBadges();
  const items = [...['', 'routes', 'review', 'progress'].map((m) => NAV.find((n) => n.match === m)!), SETTINGS_NAV];
  const current = loc.parts[0] ?? '';
  return (
    <nav className="bottom-nav" aria-label="Навигация">
      {items.map((n) => (
        <a key={n.path} href={href(n.path)} className={`nav-item ${current === n.match ? 'active' : ''}`}>
          <span className="nav-icon" aria-hidden="true">{n.icon}</span>
          <span>{n.label.split(' ')[0]}</span>
          {badges[n.match] ? <span className="nav-badge">{badges[n.match]}</span> : null}
        </a>
      ))}
    </nav>
  );
}
