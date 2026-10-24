// First-run setup: personalisation in 4 short steps, then route choice → diagnostic.
import { useState } from 'react';
import { ROUTES } from '../../content';
import { GOALS, GOAL_INFO, THEMES, THEME_INFO, type GoalMode } from '../../core/settings';
import { actions, useApp } from '../../state/store';
import { ACCENTS } from '../theme';
import { go } from '../router';

const PREVIEW: Record<string, string[]> = {
  system: ['#0b0d15', '#f4f6fb', '#7c5cff'], dark: ['#0b0d15', '#1b2033', '#e8eaf3'], light: ['#f4f6fb', '#ffffff', '#161a2a'],
  midnight: ['#050816', '#121b45', '#e6ecff'], paper: ['#f3ede2', '#fcf9f2', '#2c2418'], terminal: ['#020403', '#0a1a10', '#c9ffe1'],
  sakura: ['#fff4f7', '#ffffff', '#3b1d2a'], contrast: ['#000000', '#111111', '#ffffff'],
};
export { PREVIEW as THEME_PREVIEW };

export function Onboarding() {
  const s = useApp((x) => x);
  const [step, setStep] = useState(0);
  const [name, setName] = useState(s.profile.name);
  const L = s.settings.learning;
  const a = s.settings.appearance;
  const steps = ['Знакомство', 'Цель', 'Ритм', 'Оформление', 'Маршрут'];
  const finish = (route?: string, diag = true) => {
    actions().setProfile({ name: name.trim().slice(0, 40), onboarded: true });
    if (route) {
      actions().startRoute(route, L.goal);
      go(diag ? `/diag/${route}` : `/route/${route}`);
    } else go('/');
  };
  return (
    <div className="page" style={{ maxWidth: 820, justifyContent: 'center', minHeight: '100%' }}>
      <div className="card glow stack" data-testid="onboarding">
        <div className="row spread">
          <div className="brand" style={{ padding: 0 }}><span className="brand-logo">LL</span><span>LearnLab</span></div>
          <span className="small muted">Шаг {step + 1} из {steps.length}: {steps[step]}</span>
        </div>
        <div className="bar"><span style={{ width: `${((step + 1) / steps.length) * 100}%`, background: 'var(--accent)' }} /></div>

        {step === 0 && (
          <div className="stack">
            <h1>Учитесь программировать — доказуемо</h1>
            <p className="muted" style={{ margin: 0 }}>LearnLab подстраивается под вас: проверяет, что вы уже знаете, объясняет ошибки так, как удобно вам, и возвращает темы ровно тогда, когда их пора повторить. Все данные хранятся только на этом устройстве.</p>
            <label className="field">Как к вам обращаться? <span className="hint">Необязательно</span>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} maxLength={40} placeholder="Имя" autoFocus data-testid="name-input" />
            </label>
          </div>
        )}
        {step === 1 && (
          <div className="stack">
            <h2 style={{ margin: 0 }}>Зачем вы учитесь?</h2>
            <div className="grid cols-2">
              {GOALS.map((g: GoalMode) => (
                <button key={g} className={`option ${L.goal === g ? '' : ''}`} aria-checked={L.goal === g} role="radio" onClick={() => actions().updateSettings({ learning: { goal: g } })}>
                  <span style={{ fontSize: '1.6rem' }} aria-hidden="true">{GOAL_INFO[g].icon}</span>
                  <span className="grow"><strong>{GOAL_INFO[g].title}</strong><br /><span className="small muted">{GOAL_INFO[g].desc}</span></span>
                </button>
              ))}
            </div>
          </div>
        )}
        {step === 2 && (
          <div className="stack">
            <h2 style={{ margin: 0 }}>Комфортный ритм</h2>
            <label className="field">Минут в день: {L.dailyMinutes}
              <input type="range" min={5} max={120} step={5} value={L.dailyMinutes} onChange={(e) => actions().updateSettings({ learning: { dailyMinutes: Number(e.target.value) } })} />
              <span className="hint">План дня не превысит это время. Короткие регулярные занятия эффективнее редких длинных.</span>
            </label>
            <label className="field">Новых тем в день: {L.newPerDay}
              <input type="range" min={1} max={6} value={L.newPerDay} onChange={(e) => actions().updateSettings({ learning: { newPerDay: Number(e.target.value) } })} />
            </label>
            <div className="field">Подробность объяснений
              <div className="segmented" role="group" aria-label="Подробность объяснений">
                {(['brief', 'standard', 'deep'] as const).map((d) => <button key={d} aria-pressed={L.explanationDepth === d} onClick={() => actions().updateSettings({ learning: { explanationDepth: d }, feedback: { depth: d } })}>{d === 'brief' ? 'Кратко' : d === 'standard' ? 'Обычно' : 'Подробно'}</button>)}
              </div>
            </div>
            <div className="field">Подсказки
              <div className="segmented" role="group" aria-label="Режим подсказок">
                {([['on-request', 'По запросу'], ['after-fail', 'После ошибки'], ['off', 'Без подсказок']] as const).map(([k, l]) => <button key={k} aria-pressed={L.hintMode === k} onClick={() => actions().updateSettings({ learning: { hintMode: k } })}>{l}</button>)}
              </div>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="stack">
            <h2 style={{ margin: 0 }}>Оформление</h2>
            <div className="grid cols-4">
              {THEMES.map((t) => (
                <button key={t} className="theme-tile" aria-pressed={a.theme === t} onClick={() => actions().updateSettings({ appearance: { theme: t } })}>
                  <div className="prev" style={{ background: PREVIEW[t][0] }}><i style={{ background: PREVIEW[t][1] }} /><i style={{ background: a.accent }} /><i style={{ background: PREVIEW[t][2] }} /></div>
                  <div className="name">{THEME_INFO[t]}</div>
                </button>
              ))}
            </div>
            <div className="row tight" role="group" aria-label="Акцентный цвет">
              {ACCENTS.map((c) => <button key={c} className="swatch" style={{ background: c }} aria-pressed={a.accent === c} aria-label={`Цвет ${c}`} onClick={() => actions().updateSettings({ appearance: { accent: c } })} />)}
            </div>
            <p className="tiny muted" style={{ margin: 0 }}>Всё это и многое другое (шрифты, плотность, анимации, фон меню, редактор) — в настройках.</p>
          </div>
        )}
        {step === 4 && (
          <div className="stack">
            <h2 style={{ margin: 0 }}>С чего начнём?</h2>
            <p className="small muted" style={{ margin: 0 }}>После выбора — короткая умная диагностика, чтобы не тратить время на то, что вы уже знаете.</p>
            <div className="grid cols-2">
              {ROUTES.map((r) => (
                <button key={r.id} className="option" onClick={() => finish(r.id)} data-testid={`onb-route-${r.id}`}>
                  <span style={{ fontSize: '1.8rem' }} aria-hidden="true">{r.icon}</span>
                  <span className="grow"><strong>{r.title}</strong><br /><span className="small muted">{r.tagline}</span></span>
                </button>
              ))}
            </div>
            <button className="btn ghost" onClick={() => finish()}>Осмотрюсь сам(а)</button>
          </div>
        )}
        <div className="row spread">
          <button className="btn ghost" onClick={() => setStep((x) => Math.max(0, x - 1))} disabled={step === 0}>← Назад</button>
          {step < steps.length - 1 && <button className="btn primary" onClick={() => setStep((x) => x + 1)} data-testid="onb-next">Далее →</button>}
        </div>
      </div>
    </div>
  );
}
