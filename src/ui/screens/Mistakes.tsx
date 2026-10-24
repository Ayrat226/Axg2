// Mistake journal: every error is classified (syntax, runtime, logic, edge case, misconception, output)
// and linked to targeted practice. A mistake resolves after an independent success on the same skill.
import { useState } from 'react';
import { EXERCISE_BY_ID, SKILL_BY_ID } from '../../content';
import { MISTAKE_INFO, type MistakeCategory } from '../../core/state';
import { actions, useApp } from '../../state/store';
import { href } from '../router';
import { Inline } from '../components/Markdown';

export function Mistakes() {
  const mistakes = useApp((s) => s.mistakes);
  const [filter, setFilter] = useState<'open' | 'all'>('open');
  const [cat, setCat] = useState<MistakeCategory | 'any'>('any');
  const list = mistakes.filter((m) => (filter === 'all' || !m.resolvedAt) && (cat === 'any' || m.category === cat)).sort((a, b) => b.t - a.t);
  const counts = (Object.keys(MISTAKE_INFO) as MistakeCategory[]).map((c) => ({ c, n: mistakes.filter((m) => m.category === c && !m.resolvedAt).length }));
  const max = Math.max(1, ...counts.map((x) => x.n));
  const misCounts = new Map<string, number>();
  for (const m of mistakes) if (m.misconception && !m.resolvedAt) misCounts.set(`${m.skill}|${m.misconception}`, (misCounts.get(`${m.skill}|${m.misconception}`) ?? 0) + 1);
  const topMis = [...misCounts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
  return (
    <div className="page" data-testid="mistakes">
      <div className="row spread">
        <div className="stack tight"><h1>Работа над ошибками</h1><span className="muted">Ошибки — это данные о том, что именно стоит потренировать.</span></div>
        <a className="btn primary" href={href('/mistakes/practice')}>🎯 Целевая практика</a>
      </div>
      <div className="grid cols-2">
        <div className="card">
          <div className="card-title">По типам (открытые)</div>
          <div className="stack tight">
            {counts.map(({ c, n }) => (
              <button key={c} className="row tight small" style={{ background: 'none', border: 0, cursor: 'pointer', padding: 0, textAlign: 'left' }} onClick={() => setCat(cat === c ? 'any' : c)} aria-pressed={cat === c}>
                <span style={{ width: 170 }}>{MISTAKE_INFO[c].icon} {MISTAKE_INFO[c].label}</span>
                <span className="bar grow"><span style={{ width: `${(n / max) * 100}%`, background: cat === c ? 'var(--accent)' : 'var(--warn)' }} /></span>
                <span style={{ width: 24, textAlign: 'right' }}>{n}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="card">
          <div className="card-title">Повторяющиеся заблуждения</div>
          {topMis.length ? topMis.map(([key, n]) => {
            const [skillId, misId] = key.split('|');
            const sk = SKILL_BY_ID.get(skillId);
            const mc = sk?.misconceptions.find((x) => x.id === misId);
            return mc ? (
              <div key={key} className="stack tight" style={{ marginBottom: 10 }}>
                <strong>{mc.title} <span className="chip">×{n}</span></strong>
                <span className="small"><Inline text={mc.fix} /></span>
                <a className="btn sm" href={href(`/practice/${skillId}`)}>Потренировать «{sk!.title}»</a>
              </div>
            ) : null;
          }) : <div className="small muted">Пока не выявлено. Заблуждения определяются по выбранным неверным вариантам.</div>}
        </div>
      </div>
      <div className="row spread">
        <div className="segmented" role="group" aria-label="Фильтр">
          <button aria-pressed={filter === 'open'} onClick={() => setFilter('open')}>Открытые</button>
          <button aria-pressed={filter === 'all'} onClick={() => setFilter('all')}>Все</button>
        </div>
        {cat !== 'any' && <button className="btn sm ghost" onClick={() => setCat('any')}>Сбросить тип: {MISTAKE_INFO[cat].label} ✕</button>}
      </div>
      {list.length ? (
        <div className="stack tight">
          {list.slice(0, 100).map((m) => {
            const sk = SKILL_BY_ID.get(m.skill);
            const ex = EXERCISE_BY_ID.get(m.ex);
            return (
              <div key={m.id} className="activity" style={{ cursor: 'default', opacity: m.resolvedAt ? 0.6 : 1 }} data-testid="mistake-row">
                <span className="a-icon" aria-hidden="true">{MISTAKE_INFO[m.category].icon}</span>
                <span className="grow">
                  <span className="a-title">{MISTAKE_INFO[m.category].label}{m.errType ? ` · ${m.errType}` : ''}</span> <span className="tiny muted">{new Date(m.t).toLocaleString('ru-RU')}</span>
                  <br /><span className="a-why">{sk?.icon} {sk?.title} — {ex ? ex.prompt.replace(/[`*]/g, '').slice(0, 110) : m.ex}</span>
                  <br /><span className="small">{m.note}</span>
                </span>
                <span className="stack tight">
                  {m.resolvedAt ? <span className="chip ok">разобрано</span> : <>
                    <a className="btn sm" href={href(`/practice/${m.skill}`)}>Потренировать</a>
                    <button className="btn sm ghost" onClick={() => actions().resolveMistake(m.id)}>Разобрано</button>
                  </>}
                </span>
              </div>
            );
          })}
        </div>
      ) : <div className="card empty"><div className="big">✨</div>Здесь пусто.</div>}
    </div>
  );
}
