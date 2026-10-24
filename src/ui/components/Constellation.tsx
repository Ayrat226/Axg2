// "Созвездие навыков": every skill of every route is a star on a spiral arm; brightness = status.
import { useMemo, useState } from 'react';
import { ROUTES } from '../../content';
import { skillStatus, STATUS_INFO } from '../../core/model';
import { useApp } from '../../state/store';
import { go } from '../router';

const BRIGHT: Record<string, number> = { new: 0.25, learning: 0.55, probable: 0.7, mastered: 0.95, durable: 1, rusty: 0.6 };

export function Constellation({ height = 300 }: { height?: number }) {
  const skills = useApp((s) => s.skills);
  const [hover, setHover] = useState<string | null>(null);
  const now = Date.now();
  const W = 640, H = height;
  const stars = useMemo(() => ROUTES.flatMap((r, ri) => r.skills.map((s, i) => {
    const arm = (ri / ROUTES.length) * Math.PI * 2;
    const t = (i + 1) / (r.skills.length + 1);
    const ang = arm + t * 2.4;
    const rad = 26 + t * (Math.min(W, H * 2) / 2 - 40);
    return { s, r, x: W / 2 + Math.cos(ang) * rad, y: H / 2 + Math.sin(ang) * rad * (H / W) * 1.6 };
  })), [H]);
  const hs = stars.find((x) => x.s.id === hover);
  return (
    <div className="constellation" data-testid="constellation">
      <svg viewBox={`0 0 ${W} ${H}`} role="group" aria-label="Созвездие навыков всех маршрутов">
        <defs>
          <radialGradient id="core"><stop offset="0" stopColor="var(--accent)" stopOpacity="0.5" /><stop offset="1" stopColor="var(--accent)" stopOpacity="0" /></radialGradient>
        </defs>
        <circle cx={W / 2} cy={H / 2} r={70} fill="url(#core)" />
        {ROUTES.map((r) => {
          const pts = stars.filter((x) => x.r.id === r.id);
          return <polyline key={r.id} points={pts.map((p) => `${p.x},${p.y}`).join(' ')} fill="none" stroke={r.color} strokeOpacity={0.25} strokeWidth={1.2} />;
        })}
        {stars.map(({ s, r, x, y }) => {
          const st = skillStatus(skills[s.id], now);
          const b = BRIGHT[st];
          return (
            <g key={s.id} tabIndex={0} role="button" aria-label={`${s.title} (${r.title}): ${STATUS_INFO[st].label}`}
              onMouseEnter={() => setHover(s.id)} onMouseLeave={() => setHover(null)} onFocus={() => setHover(s.id)} onBlur={() => setHover(null)}
              onClick={() => go(`/skill/${s.id}`)} onKeyDown={(e) => e.key === 'Enter' && go(`/skill/${s.id}`)} style={{ cursor: 'pointer' }}>
              {b > 0.9 && <circle cx={x} cy={y} r={11} fill={r.color} opacity={0.18} />}
              <circle className="star" cx={x} cy={y} r={hover === s.id ? 7 : 3 + b * 3} fill={st === 'new' ? 'var(--text-dim)' : r.color} opacity={0.35 + b * 0.65} />
            </g>
          );
        })}
        {hs && (
          <g pointerEvents="none">
            <rect x={Math.min(W - 190, hs.x + 10)} y={Math.max(4, hs.y - 34)} width={180} height={30} rx={8} fill="var(--surface-solid)" stroke="var(--border)" />
            <text x={Math.min(W - 190, hs.x + 10) + 10} y={Math.max(4, hs.y - 34) + 19} style={{ fill: 'var(--text)', fontSize: 12 }}>{hs.s.icon} {hs.s.title.slice(0, 24)}</text>
          </g>
        )}
      </svg>
      <div className="row tight small" style={{ justifyContent: 'center' }}>
        {ROUTES.map((r) => <span key={r.id} className="badge-status"><span className="dot" style={{ background: r.color }} />{r.title}</span>)}
      </div>
    </div>
  );
}
