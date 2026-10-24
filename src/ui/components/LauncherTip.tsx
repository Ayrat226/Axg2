// "Знаете ли вы?" card: a common misconception from the content, deterministic per day (shuffle for more).
import { useMemo, useState } from 'react';
import { ALL_SKILLS } from '../../content';
import { hashStr } from '../../core/daily';
import { dayKey } from '../../core/state';
import { useApp } from '../../state/store';
import { href } from '../router';

export function TipCard() {
  const active = useApp((s) => s.profile.activeRoute);
  const [shift, setShift] = useState(0);
  const key = dayKey(Date.now());
  const tips = useMemo(() => {
    const all = ALL_SKILLS.flatMap((skill) => skill.misconceptions.map((m) => ({ skill, m })));
    const mine = all.filter((x) => x.skill.route === active);
    return mine.length >= 3 ? mine : all;
  }, [active]);
  if (!tips.length) return null;
  const { skill, m } = tips[(hashStr(`tip:${key}`) + shift) % tips.length];
  return (
    <section className="card tip-card stack tight fade-in" aria-label="Знаете ли вы?" data-testid="tip-card">
      <div className="card-title">💡 Знаете ли вы? <span className="sub">{skill.icon} {skill.title}</span></div>
      <div className="tip-claim"><span className="tiny muted">Частое заблуждение</span><strong data-testid="tip-title">{m.title}</strong></div>
      <p className="small" style={{ margin: 0 }}>{m.explanation}</p>
      <p className="small" style={{ margin: 0 }}><strong>Как правильно:</strong> {m.fix}</p>
      <div className="row tight">
        <a className="btn sm" href={href(`/skill/${skill.id}`)}>Открыть тему</a>
        <button className="btn sm ghost" onClick={() => setShift((n) => n + 1)} data-testid="tip-next">Ещё совет ↻</button>
      </div>
    </section>
  );
}
