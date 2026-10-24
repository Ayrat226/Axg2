// Per-route "orbit" strip: progress ring with a satellite, mastered/total and the next skill to learn.
import type { CSSProperties } from 'react';
import { ROUTES } from '../../content';
import { nextSkill, routeProgress } from '../../core/planner';
import { useApp } from '../../state/store';
import { href } from '../router';
import { ProgressRing } from './ProgressRing';

export function RouteOrbits({ animated }: { animated: boolean }) {
  const s = useApp((x) => x);
  const active = s.profile.activeRoute;
  const now = Date.now();
  return (
    <section className={`orbits ${animated ? 'lt-anim' : ''}`} aria-label="Орбиты маршрутов" data-testid="orbits">
      {ROUTES.map((r) => {
        const p = routeProgress(s, r.skills, now);
        const next = nextSkill(s, r.skills, now, s.routes[r.id]?.goal ?? s.settings.learning.goal);
        const frac = p.total ? p.mastered / p.total : 0;
        return (
          <div key={r.id} className={`card orbit ${active === r.id ? 'is-active' : ''}`} style={{ '--rc': r.color } as CSSProperties} data-testid={`orbit-${r.id}`}>
            <a className="orbit-main" href={href(`/route/${r.id}`)} aria-label={`${r.title}: освоено ${p.mastered} из ${p.total}`}>
              <span className="orbit-ring">
                <ProgressRing value={frac} size={64} stroke={6} color={r.color} label={`${Math.round(frac * 100)}%`} />
                <span className="orbit-sat" aria-hidden="true"><i /></span>
              </span>
              <span className="grow">
                <strong>{r.icon} {r.title}</strong>
                <span className="small muted" style={{ display: 'block' }}>освоено {p.mastered} из {p.total}{p.learning ? ` · в процессе ${p.learning}` : ''}</span>
              </span>
            </a>
            {next
              ? <a className="orbit-next small" href={href(`/skill/${next.id}`)}>Дальше: {next.icon} {next.title} →</a>
              : <span className="orbit-next small muted">Маршрут пройден 🎉</span>}
          </div>
        );
      })}
    </section>
  );
}
