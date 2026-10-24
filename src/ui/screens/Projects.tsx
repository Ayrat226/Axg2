// Multi-step projects: each step extends the same program; checks rerun every previous step's tests
// (regression testing), so learners integrate skills instead of solving isolated snippets.
import { useState } from 'react';
import { ALL_PROJECTS, ROUTES, SKILL_BY_ID } from '../../content';
import { isDone, skillStatus } from '../../core/model';
import { actions, useApp } from '../../state/store';
import { testCode, runCode } from '../../runner/runner';
import type { RunError, TestResult } from '../../runner/types';
import { CodeEditor } from '../components/CodeEditor';
import { Markdown, Inline } from '../components/Markdown';
import { WrongResultExplain, ErrorExplain } from '../components/ErrorExplain';
import { Confetti, Modal } from '../components/Modal';
import { href } from '../router';

export function Projects() {
  const s = useApp((x) => x);
  const now = Date.now();
  return (
    <div className="page">
      <div className="stack tight"><h1>Проекты</h1><p className="muted" style={{ margin: 0 }}>Пошаговые проекты, где каждый шаг расширяет одну программу. Проверка каждого шага заново прогоняет тесты всех предыдущих — как в настоящей разработке.</p></div>
      {ROUTES.filter((r) => r.projects.length).map((r) => (
        <div key={r.id} className="card">
          <div className="card-title">{r.icon} {r.title}</div>
          <div className="grid cols-2">
            {r.projects.map((p) => {
              const ps = s.projects[p.id];
              const missing = p.prereqs.filter((x) => !isDone(skillStatus(s.skills[x], now)));
              return (
                <a key={p.id} className="activity" href={href(`/project/${p.id}`)} style={{ textDecoration: 'none' }} data-testid="project-card">
                  <span className="a-icon" aria-hidden="true">{ps?.completedAt ? '🏁' : '🛠️'}</span>
                  <span className="grow">
                    <span className="a-title">{p.title}</span><br /><span className="a-why">{p.summary}</span><br />
                    <span className="tiny">{ps?.completedAt ? 'Завершён' : ps ? `Шаг ${ps.step + 1} из ${p.steps.length}` : `${p.steps.length} шагов`}{missing.length ? ` · рекомендуется сначала: ${missing.map((x) => SKILL_BY_ID.get(x)?.title).join(', ')}` : ''}</span>
                  </span>
                </a>
              );
            })}
          </div>
        </div>
      ))}
      {!ROUTES.some((r) => r.projects.length) && <div className="card empty">Проекты появятся вместе с контентом маршрутов.</div>}
    </div>
  );
}

export function ProjectView({ id }: { id: string }) {
  const project = ALL_PROJECTS.find((p) => p.id === id);
  const ps = useApp((s) => s.projects[id]);
  const celebrate = useApp((s) => s.settings.learning.celebrate);
  const [hints, setHints] = useState(0);
  const [busy, setBusy] = useState(false);
  const [results, setResults] = useState<{ step: number; r: TestResult }[] | null>(null);
  const [err, setErr] = useState<RunError | null>(null);
  const [out, setOut] = useState<string | null>(null);
  const [reveal, setReveal] = useState(false);
  const [party, setParty] = useState(false);
  if (!project) return <div className="page"><div className="card empty">Проект не найден. <a href="#/projects">Все проекты</a></div></div>;
  const step = Math.min(ps?.step ?? 0, project.steps.length - 1);
  const completed = !!ps?.completedAt;
  const code = ps?.code || project.starter;
  const cur = project.steps[step];
  const save = (patch: Parameters<ReturnType<typeof actions>['projectSave']>[1]) => actions().projectSave(id, { startedAt: ps?.startedAt ?? Date.now(), ...patch });

  const check = async () => {
    setBusy(true); setErr(null); setOut(null);
    const tests = project.steps.slice(0, step + 1).flatMap((st, i) => st.tests.map((t) => ({ ...t, label: t.label ?? `шаг ${i + 1}`, __step: i })));
    const r = await testCode(project.lang, code, tests);
    setBusy(false);
    if (r.error) { setErr(r.error); setResults(null); return; }
    setResults(r.results.map((x, i) => ({ step: (tests[i] as { __step: number }).__step, r: x })));
    if (r.results.length && r.results.every((x) => x.pass)) {
      if (step === project.steps.length - 1) {
        save({ completedAt: Date.now(), step, code });
        if (celebrate !== 'off') setParty(true);
        actions().toast(`Проект «${project.title}» завершён! Он добавлен в портфолио.`, 'success');
      } else {
        save({ step: step + 1, code });
        setHints(0);
        actions().toast(`Шаг ${step + 1} пройден`, 'success');
      }
    }
  };
  const failing = results?.filter((x) => !x.r.pass) ?? [];
  const regression = failing.filter((x) => x.step < step);

  return (
    <div className="page wide" data-testid="project">
      {party && <Confetti />}
      <div className="row tight small"><a href={href('/projects')}>Проекты</a><span className="muted">›</span><span>{project.title}</span></div>
      <div className="grid" style={{ gridTemplateColumns: 'minmax(220px, 280px) 1fr' }}>
        <div className="card stack tight" style={{ alignSelf: 'start' }}>
          <h2 style={{ margin: 0 }}>{project.title}</h2>
          <span className="small muted">{project.summary}</span>
          <ol className="stack tight" style={{ paddingLeft: '1.2em', margin: 0 }}>
            {project.steps.map((st, i) => (
              <li key={i} className="small" style={{ fontWeight: i === step ? 700 : 400, color: i < step || completed ? 'var(--ok)' : i === step ? 'var(--text)' : 'var(--text-dim)' }}>
                {i < step || completed ? '✔ ' : ''}{st.title}
              </li>
            ))}
          </ol>
          {completed && <span className="chip ok">Проект завершён</span>}
        </div>
        <div className="stack">
          <div className="card stack tight">
            <div className="card-title">Шаг {step + 1}: {cur.title}</div>
            <Markdown text={cur.prompt} />
            <div className="hint-ladder">
              {cur.hints.slice(0, hints).map((h, i) => <div key={i} className="hint"><Inline text={h} /></div>)}
              {hints < cur.hints.length && <button className="btn sm ghost" onClick={() => { setHints((n) => n + 1); save({ hints: (ps?.hints ?? 0) + 1 }); }}>💡 Подсказка</button>}
            </div>
          </div>
          <CodeEditor value={code} onChange={(v) => save({ code: v, step })} lang={project.lang} onRun={check} errorLine={err?.line ?? failing[0]?.r.error?.line ?? null} minHeight={260} />
          <div className="row tight">
            <button className="btn" disabled={busy} onClick={async () => { setBusy(true); const r = await runCode(project.lang, code); setBusy(false); setOut(r.stdout + (r.error ? `\n${r.error.type}: ${r.error.message}` : '')); setErr(r.error); }}>▶ Запустить</button>
            <button className="btn primary" disabled={busy} onClick={check} data-testid="check">{busy ? 'Проверка…' : `✓ Проверить шаг ${step + 1}`}</button>
            <button className="btn ghost sm" onClick={() => setReveal(true)}>Показать решение шага</button>
          </div>
          {out !== null && <pre className="output">{out || '(нет вывода)'}</pre>}
          {err && <ErrorExplain error={err} lang={project.lang} code={code} />}
          {results && (
            <div className="card stack tight">
              <div className="card-title">Проверка: {results.filter((x) => x.r.pass).length}/{results.length} {regression.length > 0 && <span className="chip err">регрессия в шаге {regression[0].step + 1}</span>}</div>
              {regression.length > 0 && <p className="small" style={{ margin: 0 }}>Новые изменения сломали то, что работало раньше. Это частая ситуация в реальных проектах — проверьте, что старые функции по-прежнему ведут себя как прежде.</p>}
              <div className="tests">
                {results.map((x, i) => (
                  <div key={i} className="test-row">
                    <span>{x.r.pass ? '✅' : '❌'}</span>
                    <div><span className="tiny muted">шаг {x.step + 1} · </span>{x.r.hidden ? `скрытый: ${x.r.label}` : <span className="mono">{x.r.expr ?? `ввод: ${(x.r.stdin ?? []).join(' ⏎ ') || '—'}`}</span>}
                      {!x.r.pass && !x.r.hidden && <pre className="mono">{`ожидалось: ${x.r.expected}\nполучено:  ${x.r.error ? x.r.error.message : x.r.actual}`}</pre>}
                    </div>
                  </div>
                ))}
              </div>
              {failing[0] && <WrongResultExplain result={failing[0].r} lang={project.lang} code={code} />}
            </div>
          )}
        </div>
      </div>
      {reveal && (
        <Modal title="Показать решение шага?" onClose={() => setReveal(false)} actions={<>
          <button className="btn ghost" onClick={() => setReveal(false)}>Отмена</button>
          <button className="btn primary" onClick={() => { save({ code: cur.solution, hints: (ps?.hints ?? 0) + 3 }); setReveal(false); }}>Вставить решение</button>
        </>}>
          <p className="muted">Ваш код будет заменён эталонным решением этого шага. Лучше сначала воспользоваться подсказками.</p>
        </Modal>
      )}
    </div>
  );
}
