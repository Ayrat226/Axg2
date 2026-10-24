import { useState } from 'react';
import { ROUTES, ROUTE_BY_ID, SKILL_BY_ID } from '../../content';
import { skillStatus, STATUS_INFO, metricsOf } from '../../core/model';
import { retrievability } from '../../core/srs';
import { useApp } from '../../state/store';
import { SkillGraph, StatusLegend } from '../components/SkillGraph';
import { go, href } from '../router';

export function SkillMapScreen({ routeId }: { routeId?: string }) {
  const active = useApp((s) => s.profile.activeRoute);
  const skills = useApp((s) => s.skills);
  const id = routeId && ROUTE_BY_ID.has(routeId) ? routeId : active && ROUTE_BY_ID.has(active) ? active : ROUTES[0].id;
  const route = ROUTE_BY_ID.get(id)!;
  const [sel, setSel] = useState<string | undefined>();
  const sk = sel ? SKILL_BY_ID.get(sel) : undefined;
  const now = Date.now();
  const st = sk ? skills[sk.id] : undefined;
  const m = metricsOf(st);
  return (
    <div className="page wide" data-testid="skillmap">
      <div className="row spread">
        <h1>Карта навыков</h1>
        <div className="tabs" role="tablist">
          {ROUTES.map((r) => <button key={r.id} role="tab" aria-selected={r.id === id} onClick={() => { setSel(undefined); go(`/map/${r.id}`); }}>{r.icon} {r.title}</button>)}
        </div>
      </div>
      <StatusLegend />
      <div className="card"><SkillGraph skills={route.skills} onSelect={setSel} selected={sel} /></div>
      {sk && (
        <div className="card glow stack tight" aria-live="polite">
          <div className="row spread">
            <h2 style={{ margin: 0 }}>{sk.icon} {sk.title}</h2>
            <span className="badge-status" style={{ color: STATUS_INFO[skillStatus(st, now)].color }}><span className="dot" style={{ background: STATUS_INFO[skillStatus(st, now)].color }} />{STATUS_INFO[skillStatus(st, now)].label}</span>
          </div>
          <div className="muted">{sk.summary}</div>
          <div className="row tight small">
            <span className="chip">оценка владения {Math.round((st?.p ?? 0) * 100)}%</span>
            <span className="chip">попыток {m.attempts}</span>
            <span className="chip">самостоятельно {m.independent}</span>
            {st?.mem && <span className="chip">вспомню сейчас ≈ {Math.round(retrievability(st.mem, now) * 100)}%</span>}
            {st?.mem && <span className="chip">повторение {new Date(st.mem.due).toLocaleDateString('ru-RU')}</span>}
            {st?.checkDue && <span className="chip warn">проверка {new Date(st.checkDue).toLocaleDateString('ru-RU')}</span>}
          </div>
          {sk.prereqs.length > 0 && <div className="small">Опирается на: {sk.prereqs.map((p) => SKILL_BY_ID.get(p)?.title).join(', ')}</div>}
          <div className="row tight">
            <a className="btn primary" href={href(`/skill/${sk.id}`)}>Урок</a>
            <a className="btn" href={href(`/practice/${sk.id}`)}>Практика</a>
            <a className="btn ghost" href={href(`/practice/${sk.id}?mode=verify`)}>Подтвердить знание</a>
          </div>
        </div>
      )}
    </div>
  );
}
