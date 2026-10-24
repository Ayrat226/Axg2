import { useEffect, useState, type ReactNode } from 'react';
import { useLocation } from './router';
import { useApplyTheme } from './theme';
import { useApp } from '../state/store';
import { Sidebar, BottomNav } from './components/Sidebar';
import { Background } from './components/Background';
import { CommandPalette } from './components/CommandPalette';
import { Toasts } from './components/Toasts';
import { Home } from './screens/Home';
import { RoutesScreen } from './screens/Routes';
import { RouteView } from './screens/RouteView';
import { Diagnostic } from './screens/Diagnostic';
import { Lesson } from './screens/Lesson';
import { Session } from './screens/Session';
import { Mistakes } from './screens/Mistakes';
import { Projects, ProjectView } from './screens/Projects';
import { Playground } from './screens/Playground';
import { SkillMapScreen } from './screens/SkillMapScreen';
import { Progress } from './screens/Progress';
import { SettingsScreen } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';

export function App() {
  useApplyTheme();
  const loc = useLocation();
  const onboarded = useApp((s) => s.profile.onboarded);
  const [palette, setPalette] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); setPalette((p) => !p); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  useEffect(() => {
    document.querySelector('.main')?.scrollTo({ top: 0 });
  }, [loc.parts.join('/')]);

  const [a, b] = loc.parts;
  let screen: ReactNode;
  if (!onboarded) screen = <Onboarding />;
  else switch (a) {
    case undefined: screen = <Home />; break;
    case 'routes': screen = <RoutesScreen />; break;
    case 'route': screen = <RouteView id={b} />; break;
    case 'diag': screen = <Diagnostic routeId={b} />; break;
    case 'skill': screen = <Lesson id={b} />; break;
    case 'practice': screen = <Session key={loc.raw} mode={(loc.query.get('mode') as 'practice') ?? 'practice'} skill={b} />; break;
    case 'review': screen = <Session key={loc.raw} mode="review" route={loc.query.get('route') ?? undefined} />; break;
    case 'mistakes': screen = b === 'practice' ? <Session key={loc.raw} mode="mistakes" /> : <Mistakes />; break;
    case 'projects': screen = <Projects />; break;
    case 'project': screen = <ProjectView id={b} />; break;
    case 'playground': screen = <Playground />; break;
    case 'map': screen = <SkillMapScreen routeId={b} />; break;
    case 'progress': screen = <Progress />; break;
    case 'settings': screen = <SettingsScreen tab={b} />; break;
    default: screen = <div className="page"><div className="card empty"><div className="big">🧭</div><p>Страница не найдена.</p><a className="btn" href="#/">На главную</a></div></div>;
  }

  return (
    <div className="app">
      <a href="#main" className="sr-only">Перейти к содержимому</a>
      <Background />
      {onboarded && <Sidebar loc={loc} onPalette={() => setPalette(true)} />}
      <main className="main" id="main" style={onboarded ? undefined : { gridColumn: '1 / -1' }}>{screen}</main>
      {onboarded && <BottomNav loc={loc} />}
      {palette && <CommandPalette onClose={() => setPalette(false)} />}
      <Toasts />
    </div>
  );
}
