// Layered prerequisite graph (competency map). Nodes are keyboard-focusable; colour + label show status.
import { useMemo } from 'react';
import type { Skill } from '../../core/types';
import { buildGraph } from '../../core/graph';
import { skillStatus, STATUS_INFO, type SkillStatus } from '../../core/model';
import { useApp } from '../../state/store';

const NW = 196, NH = 54, GX = 70, GY = 18;

export function SkillGraph({ skills, onSelect, selected, highlight }: { skills: Skill[]; onSelect: (id: string) => void; selected?: string; highlight?: Record<string, SkillStatus> }) {
  const state = useApp((s) => s.skills);
  const now = Date.now();
  const layout = useMemo(() => {
    const g = buildGraph(skills);
    const cols = new Map<number, string[]>();
    for (const id of g.topo) {
      const d = g.depth.get(id)!;
      cols.set(d, [...(cols.get(d) ?? []), id]);
    }
    const maxRows = Math.max(1, ...[...cols.values()].map((c) => c.length));
    const pos = new Map<string, { x: number; y: number }>();
    for (const [d, ids] of cols) {
      const offset = ((maxRows - ids.length) * (NH + GY)) / 2;
      ids.forEach((id, i) => pos.set(id, { x: 12 + d * (NW + GX), y: 12 + offset + i * (NH + GY) }));
    }
    return { g, pos, w: 24 + cols.size * (NW + GX) - GX, h: 24 + maxRows * (NH + GY) - GY };
  }, [skills]);
  const status = (id: string) => highlight?.[id] ?? skillStatus(state[id], now);
  return (
    <div className="skillmap" data-testid="skill-graph">
      <svg viewBox={`0 0 ${layout.w} ${layout.h}`} width={layout.w} height={layout.h} role="group" aria-label="Карта навыков и их зависимостей">
        {skills.flatMap((s) => layout.g.parents.get(s.id)!.map((p) => {
          const a = layout.pos.get(p)!, b = layout.pos.get(s.id)!;
          const x1 = a.x + NW, y1 = a.y + NH / 2, x2 = b.x, y2 = b.y + NH / 2;
          const done = ['mastered', 'durable', 'probable'].includes(status(p));
          return <path key={`${p}-${s.id}`} className={`sm-edge ${done ? 'done' : ''}`} d={`M${x1},${y1} C${x1 + GX / 2},${y1} ${x2 - GX / 2},${y2} ${x2},${y2}`} />;
        }))}
        {skills.map((s) => {
          const p = layout.pos.get(s.id)!;
          const st = status(s.id);
          const info = STATUS_INFO[st];
          return (
            <g key={s.id} className="sm-node" transform={`translate(${p.x},${p.y})`} tabIndex={0} role="button"
              aria-label={`${s.title}: ${info.label}`} onClick={() => onSelect(s.id)} onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onSelect(s.id))}>
              <rect width={NW} height={NH} rx={12} fill="var(--surface-solid)" stroke={selected === s.id ? 'var(--accent)' : info.color} strokeWidth={selected === s.id ? 3 : 2} />
              <rect width={6} height={NH - 16} x={8} y={8} rx={3} fill={info.color} />
              <text x={22} y={23} style={{ fontWeight: 700 }}>{s.icon} {s.title.length > 20 ? s.title.slice(0, 19) + '…' : s.title}</text>
              <text x={22} y={42} style={{ fill: info.color, fontSize: 11 }}>{info.label}</text>
              <title>{s.title} — {info.label}. {s.summary}</title>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function StatusLegend() {
  return (
    <div className="row tight" aria-label="Обозначения статусов">
      {(Object.keys(STATUS_INFO) as SkillStatus[]).map((k) => (
        <span key={k} className="badge-status" title={STATUS_INFO[k].desc}><span className="dot" style={{ background: STATUS_INFO[k].color }} />{STATUS_INFO[k].label}</span>
      ))}
    </div>
  );
}
