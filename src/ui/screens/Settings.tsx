// Settings: every control writes immediately and the whole app (and the previews here) react live.
import { useEffect, useMemo, useRef, useState } from 'react';
import { version } from '../../../package.json';
import { exportState, parseImport, STORAGE_KEY, type ImportSummary } from '../../core/storage';
import { ALL_THEMES, GOALS, GOAL_INFO, PRESETS, THEME_INFO, analogyMode, WIDGETS, WIDGET_INFO, DEFAULT_SETTINGS, type Preset, type Settings, type SettingsPatch } from '../../core/settings';
import { intervalDays } from '../../core/srs';
import { dayKey, type AppState } from '../../core/state';
import { actions, useApp, useStore } from '../../state/store';
import { ACCENTS } from '../theme';
import { CodeBlock } from '../components/CodeBlock';
import { CodeEditor } from '../components/CodeEditor';
import { ErrorExplain } from '../components/ErrorExplain';
import { Modal } from '../components/Modal';
import { go } from '../router';
import { UserProfiles } from '../components/UserProfiles';
import { CustomThemeEditor } from '../components/CustomThemeEditor';
import { AiSettings } from '../components/AiSettings';
import { SettingsSearch } from '../components/SettingsSearch';
import type { SettingEntry } from './settingsIndex';
import { Section, SegSetting, SwitchSetting, RangeSetting, pct, onOff } from '../components/SettingControls';

const TABS = [
  { id: 'profiles', label: 'Профили', icon: '🎭' },
  { id: 'appearance', label: 'Внешний вид', icon: '🎨' },
  { id: 'learning', label: 'Обучение', icon: '🎓' },
  { id: 'feedback', label: 'Объяснения ошибок', icon: '💬' },
  { id: 'editor', label: 'Редактор', icon: '⌨️' },
  { id: 'ai', label: 'AI-помощник', icon: '🤖' },
  { id: 'home', label: 'Главная', icon: '🏠' },
  { id: 'data', label: 'Данные', icon: '💾' },
  { id: 'about', label: 'О приложении', icon: 'ℹ️' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const up = (p: SettingsPatch) => actions().updateSettings(p);

// ---------- screen ----------

export function SettingsScreen({ tab }: { tab?: string }) {
  const current: TabId = TABS.some((t) => t.id === tab) ? (tab as TabId) : 'profiles';
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [target, setTarget] = useState<SettingEntry | null>(null);

  // Jump from a search result: open its tab, then scroll to the row and focus its control.
  useEffect(() => {
    if (!target || target.tab !== current) return;
    const row = document.querySelector<HTMLElement>(`[data-setting="${CSS.escape(target.label)}"]`);
    if (!row) { setTarget(null); return; }
    row.scrollIntoView({ block: 'center', behavior: 'auto' });
    (row.querySelector<HTMLElement>('[aria-pressed="true"], input, select, textarea, button') ?? row).focus({ preventScroll: true });
    row.classList.add('flash');
    const t = setTimeout(() => row.classList.remove('flash'), 2200);
    setTarget(null);
    return () => clearTimeout(t);
  }, [target, current]);

  const onTabKey = (e: React.KeyboardEvent) => {
    const i = TABS.findIndex((t) => t.id === current);
    let n = -1;
    if (e.key === 'ArrowRight') n = (i + 1) % TABS.length;
    else if (e.key === 'ArrowLeft') n = (i - 1 + TABS.length) % TABS.length;
    else if (e.key === 'Home') n = 0;
    else if (e.key === 'End') n = TABS.length - 1;
    if (n < 0) return;
    e.preventDefault();
    go(`/settings/${TABS[n].id}`);
    tabRefs.current[TABS[n].id]?.focus();
  };

  return (
    <div className="page" data-testid="settings">
      <div className="stack tight">
        <h1>Настройки</h1>
        <span className="muted">Приложение подстраивается под вас: изменения применяются сразу и сохраняются на этом устройстве.</span>
      </div>
      <SettingsSearch onPick={(e) => { setTarget(e); go(`/settings/${e.tab}`); }} />
      <div className="tabs" role="tablist" aria-label="Разделы настроек" onKeyDown={onTabKey}>
        {TABS.map((t) => (
          <button
            key={t.id} role="tab" id={`tab-${t.id}`} aria-selected={t.id === current} aria-controls="settings-panel" tabIndex={t.id === current ? 0 : -1}
            ref={(el) => { tabRefs.current[t.id] = el; }} onClick={() => go(`/settings/${t.id}`)}
          >
            <span aria-hidden="true">{t.icon}</span> {t.label}
          </button>
        ))}
      </div>
      <div role="tabpanel" id="settings-panel" aria-labelledby={`tab-${current}`} className="stack">
        {current === 'profiles' && <ProfilesTab />}
        {current === 'appearance' && <AppearanceTab />}
        {current === 'learning' && <LearningTab />}
        {current === 'feedback' && <FeedbackTab />}
        {current === 'editor' && <EditorTab />}
        {current === 'ai' && <AiSettings />}
        {current === 'home' && <HomeTab />}
        {current === 'data' && <DataTab />}
        {current === 'about' && <AboutTab />}
      </div>
    </div>
  );
}

// ---------- profiles ----------

function countChanges(p: Preset, s: Settings): number {
  let n = 0;
  for (const [section, vals] of Object.entries(p.patch)) {
    const cur = s[section as keyof Settings] as unknown as Record<string, unknown>;
    for (const [k, v] of Object.entries(vals as Record<string, unknown>)) if (cur[k] !== v) n++;
  }
  return n;
}

function ProfilesTab() {
  const settings = useApp((s) => s.settings);
  const name = useApp((s) => s.profile.name);
  const [confirm, setConfirm] = useState(false);
  return (
    <>
      <Section title="Как вас называть">
        <label className="field">
          Имя в приветствиях и портфолио
          <input type="text" value={name} maxLength={40} placeholder="Необязательно" autoComplete="off" onChange={(e) => actions().setProfile({ name: e.target.value })} />
          <span className="hint">Хранится только на этом устройстве.</span>
        </label>
      </Section>
      <Section title="Готовые профили обучения" sub="можно применять по очереди и донастраивать вручную">
        <div className="grid cols-3">
          {PRESETS.map((p) => {
            const n = countChanges(p, settings);
            return (
              <div key={p.id} className="card flat stack tight" style={{ borderColor: n === 0 ? 'var(--accent)' : undefined }}>
                <div className="row tight"><span style={{ fontSize: '1.6rem' }} aria-hidden="true">{p.icon}</span><strong className="grow">{p.title}</strong></div>
                <div className="small muted grow">{p.desc}</div>
                <div className="row spread">
                  <span className={`chip ${n === 0 ? 'ok' : ''}`}>{n === 0 ? '✓ Применён' : `Изменит: ${n}`}</span>
                  <button className="btn sm primary" onClick={() => actions().applyPreset(p.id)} aria-label={`Применить профиль «${p.title}»`}>Применить</button>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
      <UserProfiles />
      <Section title="Сброс настроек">
        <div className="row spread">
          <span className="small muted grow">Вернёт оформление, режим обучения, объяснения и редактор к значениям по умолчанию. Прогресс не затрагивается.</span>
          <button className="btn danger" onClick={() => setConfirm(true)}>Сбросить все настройки</button>
        </div>
      </Section>
      {confirm && (
        <Modal
          title="Сбросить все настройки?"
          onClose={() => setConfirm(false)}
          actions={<>
            <button className="btn ghost" onClick={() => setConfirm(false)}>Отмена</button>
            <button className="btn danger" onClick={() => { const keep = settings.userPresets; actions().resetSettings(); actions().updateSettings({ userPresets: keep }); setConfirm(false); actions().toast('Настройки сброшены', 'success'); }}>Сбросить</button>
          </>}
        >
          <p style={{ margin: 0 }}>Все настройки вернутся к значениям по умолчанию. Ваш прогресс и имя сохранятся.</p>
        </Modal>
      )}
    </>
  );
}

// ---------- appearance ----------

const THEME_COLORS: Record<Exclude<(typeof ALL_THEMES)[number], 'custom'>, [string, string, string]> = {
  system: ['#0b0d15', '#f4f6fb', '#9aa1b8'],
  dark: ['#0b0d15', '#1b2033', '#e8eaf3'],
  light: ['#f4f6fb', '#ffffff', '#161a2a'],
  midnight: ['#050816', '#121b45', '#e6ecff'],
  paper: ['#f3ede2', '#fcf9f2', '#2c2418'],
  terminal: ['#020403', '#0a1a10', '#c9ffe1'],
  sakura: ['#fff4f7', '#ffffff', '#3b1d2a'],
  contrast: ['#000000', '#111111', '#ffffff'],
};

function AppearanceTab() {
  const a = useApp((s) => s.settings.appearance);
  const set = (p: Partial<Settings['appearance']>) => up({ appearance: p });
  return (
    <>
      <Section title="Тема">
        <div className="grid cols-4" role="group" aria-label="Тема оформления">
          {ALL_THEMES.map((t) => {
            const colors = t === 'custom' ? [a.customTheme.bg, a.customTheme.surface, a.customTheme.text] : THEME_COLORS[t];
            return (
            <button key={t} className="theme-tile" aria-pressed={a.theme === t} onClick={() => set({ theme: t })} aria-label={`Тема «${THEME_INFO[t]}»`}>
              <span className="prev" style={{ background: colors[0], display: 'flex' }} aria-hidden="true">
                <i style={{ background: colors[1], border: `1px solid ${colors[2]}55` }} />
                <i style={{ background: colors[2] }} />
                <i style={{ background: a.accent }} />
              </span>
              <span className="name" style={{ display: 'block' }}>{a.theme === t ? '✓ ' : ''}{THEME_INFO[t]}</span>
            </button>
            );
          })}
        </div>
      </Section>

      <CustomThemeEditor />

      <Section title="Акцентный цвет">
        <div className="row" role="group" aria-label="Акцентный цвет">
          {ACCENTS.map((c) => (
            <button key={c} className="swatch" style={{ background: c }} aria-pressed={a.accent.toLowerCase() === c} aria-label={`Акцент ${c}`} title={c} onClick={() => set({ accent: c })} />
          ))}
          <label className="row tight small" style={{ marginLeft: 8 }}>
            Свой цвет
            <input type="color" value={a.accent} aria-label="Свой акцентный цвет" onChange={(e) => set({ accent: e.target.value })} style={{ width: 44, height: 34, padding: 0, border: '1px solid var(--border)', borderRadius: 8, background: 'none' }} />
          </label>
          <span className="chip mono">{a.accent}</span>
        </div>
      </Section>

      <Section title="Текст и шрифты">
        <RangeSetting label="Размер текста" hint="Масштабирует весь интерфейс." value={a.fontScale} min={0.8} max={1.5} step={0.05} format={pct} onChange={(v) => set({ fontScale: v })} />
        <RangeSetting label="Межстрочный интервал" hint="Больше — легче читать длинные объяснения." value={a.lineHeight} min={1.3} max={2} step={0.05} format={(v) => v.toFixed(2)} onChange={(v) => set({ lineHeight: v })} />
        <SegSetting label="Шрифт интерфейса" hint="«Читаемый» — с увеличенными межбуквенными промежутками, удобен при дислексии." value={a.uiFont} onChange={(v) => set({ uiFont: v })}
          options={[['system', 'Системный'], ['rounded', 'Округлый'], ['serif', 'С засечками'], ['readable', 'Читаемый']]} />
        <SegSetting label="Шрифт кода" hint="Применяется в редакторе и примерах кода." value={a.codeFont} onChange={(v) => set({ codeFont: v })}
          options={[['system-mono', 'Системный'], ['consolas', 'Consolas'], ['courier', 'Courier']]} />
      </Section>

      <Section title="Компоновка и движение">
        <SegSetting label="Плотность" hint="Расстояния между элементами." value={a.density} onChange={(v) => set({ density: v })} options={[['compact', 'Компактно'], ['comfortable', 'Обычно'], ['spacious', 'Просторно']]} />
        <SegSetting label="Скругление углов" hint="Форма карточек и кнопок." value={a.radius} onChange={(v) => set({ radius: v })} options={[['sharp', 'Острые'], ['rounded', 'Скруглённые'], ['soft', 'Мягкие']]} />
        <SegSetting label="Анимации" hint="«Без анимаций» также отключает автовоспроизведение в пошаговом просмотре." value={a.motion} onChange={(v) => set({ motion: v })} options={[['full', 'Полные'], ['reduced', 'Сниженные'], ['none', 'Без анимаций']]} />
        <SegSetting label="Фон меню" hint="Декоративный фон за интерфейсом; «Однотонный» — самый спокойный." value={a.background} onChange={(v) => set({ background: v })} options={[['aurora', 'Аврора'], ['constellation', 'Созвездие'], ['grid', 'Сетка'], ['plain', 'Однотонный']]} />
        <SegSetting label="Боковое меню" hint="Свёрнутое меню оставляет только значки." value={a.sidebar} onChange={(v) => set({ sidebar: v })} options={[['expanded', 'Развёрнуто'], ['collapsed', 'Свёрнуто']]} />
        <SegSetting label="Раскладка задач" hint="Редактор и условие рядом или друг под другом." value={a.editorLayout} onChange={(v) => set({ editorLayout: v })} options={[['side', 'Рядом'], ['stacked', 'Друг под другом']]} />
      </Section>

      <Section title="Эффекты интерфейса">
        <RangeSetting label="Округлость углов" hint="Тонкая настройка поверх выбранной формы: от почти квадратных до очень круглых." value={a.cornerScale} min={0.5} max={1.6} step={0.1} format={pct} onChange={(v) => set({ cornerScale: v })} />
        <SegSetting label="Размытие стекла" hint="Матовое стекло под карточками и меню. «Нет» экономит ресурсы слабых устройств." value={a.glass} onChange={(v) => set({ glass: v })} options={[['theme', 'По теме'], ['off', 'Нет'], ['soft', 'Слабое'], ['strong', 'Сильное']]} />
        <SwitchSetting label="Тени карточек" hint="Выключите, чтобы интерфейс выглядел плоским." checked={a.cardShadow} onChange={(v) => set({ cardShadow: v })} />
      </Section>

      <Section title="Предпросмотр" sub="так выглядят текст, кнопки и код">
        <div className="stack tight">
          <strong>Заголовок раздела</strong>
          <span>Переменная — это имя, под которым хранится значение. Изменения настроек видны здесь сразу.</span>
          <div className="row tight"><button className="btn primary sm">Основная</button><button className="btn sm">Обычная</button><span className="chip accent">метка</span><span className="chip ok">✓ верно</span><span className="chip err">✗ ошибка</span></div>
          <CodeBlock code={'def hello(name):\n    return "Привет, " + name  # комментарий'} lang="python" lines />
        </div>
      </Section>
    </>
  );
}

// ---------- learning ----------

function LearningTab() {
  const L = useApp((s) => s.settings.learning);
  const set = (p: Partial<Settings['learning']>) => up({ learning: p });
  const stable = 10;
  const days = intervalDays(stable, L.targetRetention);
  return (
    <>
      <Section title="Цель обучения" sub="по умолчанию для новых маршрутов">
        <div className="grid cols-3" role="group" aria-label="Цель обучения">
          {GOALS.map((g) => (
            <button key={g} className="card flat stack tight" style={{ textAlign: 'left', cursor: 'pointer', borderColor: L.goal === g ? 'var(--accent)' : undefined, boxShadow: L.goal === g ? '0 0 0 3px color-mix(in srgb, var(--accent) 30%, transparent)' : undefined, color: 'inherit', font: 'inherit' }} aria-pressed={L.goal === g} onClick={() => set({ goal: g })}>
              <div className="row tight"><span style={{ fontSize: '1.4rem' }} aria-hidden="true">{GOAL_INFO[g].icon}</span><strong>{L.goal === g ? '✓ ' : ''}{GOAL_INFO[g].title}</strong></div>
              <span className="small muted">{GOAL_INFO[g].desc}</span>
            </button>
          ))}
        </div>
      </Section>

      <Section title="Подача материала">
        <SegSetting label="Глубина объяснений" hint="Сколько текста и деталей в уроках и разборах." value={L.explanationDepth} onChange={(v) => set({ explanationDepth: v })} options={[['brief', 'Кратко'], ['standard', 'Обычно'], ['deep', 'Подробно']]} />
        <SegSetting
          label="Стиль примеров и аналогий" hint="Как урок поясняет новое: бытовая аналогия, инженерный взгляд «под капотом», автоматическая визуализация выполнения или без аналогий."
          value={analogyMode(L)} onChange={(v) => set({ analogyStyle: v, showAnalogies: v !== 'none' })}
          options={[['everyday', 'Бытовые'], ['engineering', 'Инженерные'], ['visual', 'Визуально'], ['none', 'Без аналогий']]}
        />
        <SwitchSetting label="Пошаговые разборы примеров" hint="Пример показывается по шагам, а не готовым блоком." checked={L.stepByStepExamples} onChange={(v) => set({ stepByStepExamples: v })} />
      </Section>

      <Section title="Подсказки и самопроверка">
        <RangeSetting label="Максимум подсказок на задание" hint="Общий предел для подсказок лестницы и AI-подсказок: после него остаётся думать самому." value={L.maxHints} min={1} max={5} step={1} format={(v) => String(v)} onChange={(v) => set({ maxHints: v })} />
        <SegSetting label="Подсказки" hint="Когда доступны подсказки в задачах. Ответ с подсказкой весит меньше для оценки мастерства." value={L.hintMode} onChange={(v) => set({ hintMode: v })} options={[['on-request', 'По запросу'], ['after-fail', 'После ошибки'], ['off', 'Выключены']]} />
        {L.hintMode === 'after-fail' && (
          <RangeSetting label="Подсказка после ошибок" hint="Через сколько неверных попыток появится подсказка." value={L.hintAfterFails} min={1} max={5} step={1} format={(v) => String(v)} onChange={(v) => set({ hintAfterFails: v })} />
        )}
        <SwitchSetting label="Спрашивать уверенность" hint="Перед ответом просит оценить уверенность — по ней считается калибровка в «Прогрессе»." checked={L.askConfidence} onChange={(v) => set({ askConfidence: v })} />
        <SwitchSetting label="Предсказывать вывод перед запуском" hint="Сначала вы угадываете результат, потом запускаете: так виднее пробелы в модели кода." checked={L.predictBeforeRun} onChange={(v) => set({ predictBeforeRun: v })} />
        <SwitchSetting label="Чередовать темы" hint="Перемешивает повторение разных навыков в сессии — труднее, но запоминается лучше." checked={L.interleave} onChange={(v) => set({ interleave: v })} />
        <SwitchSetting label="Показывать таймер" hint="Таймер в задачах; отключите, если он отвлекает или тревожит." checked={L.showTimer} onChange={(v) => set({ showTimer: v })} />
      </Section>

      <Section title="Темп и нагрузка">
        <RangeSetting label="Заданий в сессии" hint="Длина одной учебной сессии." value={L.sessionSize} min={3} max={15} step={1} format={(v) => String(v)} onChange={(v) => set({ sessionSize: v })} />
        <RangeSetting label="Минут в день" hint="Цель дня на главной; не блокирует занятия сверх неё." value={L.dailyMinutes} min={5} max={180} step={5} format={(v) => `${v} мин`} onChange={(v) => set({ dailyMinutes: v })} />
        <RangeSetting label="Новых навыков в день" hint="Остальное время уходит на повторение уже изученного." value={L.newPerDay} min={1} max={6} step={1} format={(v) => String(v)} onChange={(v) => set({ newPerDay: v })} />
        <SegSetting label="Длина диагностики" hint="Вопросов в проверке стартовых знаний: чем больше, тем точнее оценка и длиннее тест." value={L.diagnosticLength} onChange={(v) => set({ diagnosticLength: v })} options={[['short', 'Короткая · 8'], ['standard', 'Стандартная · 12'], ['thorough', 'Тщательная · 18']]} />
      </Section>

      <Section title="Память и мастерство">
        <RangeSetting
          label="Целевое удержание" hint="Вероятность вспомнить навык к моменту повторения. Выше — повторения чаще; ниже — реже, но больше забывается."
          value={L.targetRetention} min={0.75} max={0.97} step={0.01} format={pct} onChange={(v) => set({ targetRetention: v })}
          extra={<div className="tiny muted" style={{ marginTop: 4 }}>Например, навык с запасом памяти {stable} дней повторится примерно через {days} дн.</div>}
        />
        <RangeSetting label="Порог мастерства" hint="Оценка модели, нужная для статуса «Освоено» (помимо самостоятельных решений разных типов). Выше — строже." value={L.masteryThreshold} min={0.85} max={0.98} step={0.01} format={pct} onChange={(v) => set({ masteryThreshold: v })} />
        <SegSetting label="Празднование успехов" hint="Реакция интерфейса на освоенный навык." value={L.celebrate} onChange={(v) => set({ celebrate: v })} options={[['full', 'Яркое'], ['subtle', 'Скромное'], ['off', 'Выключено']]} />
      </Section>
    </>
  );
}

// ---------- feedback ----------

const SAMPLE_CODE = 'age = 20\nprint("Мне " + age)';
const SAMPLE_ERROR = {
  type: 'TypeError',
  message: 'can only concatenate str (not "int") to str',
  line: 2,
  traceback: 'Traceback (most recent call last):\n  File "main.py", line 2, in <module>\n    print("Мне " + age)\nTypeError: can only concatenate str (not "int") to str',
};

function FeedbackTab() {
  const f = useApp((s) => s.settings.feedback);
  const set = (p: Partial<Settings['feedback']>) => up({ feedback: p });
  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <Section title="Как объяснять ошибки">
        <SegSetting label="Подробность" hint="Кратко — суть; подробно — причины, шаги и что происходит «под капотом»." value={f.depth} onChange={(v) => set({ depth: v })} options={[['brief', 'Кратко'], ['standard', 'Обычно'], ['deep', 'Подробно']]} />
        <SegSetting label="Тон" hint="Сократический — наводящие вопросы вместо готовых указаний." value={f.tone} onChange={(v) => set({ tone: v })} options={[['friendly', 'Дружелюбный'], ['neutral', 'Нейтральный'], ['socratic', 'Сократический']]} />
        <SwitchSetting label="Показывать оригинальное сообщение" hint={`Исходный текст ошибки интерпретатора под объяснением (${onOff(f.showTraceback)}).`} checked={f.showTraceback} onChange={(v) => set({ showTraceback: v })} />
        <SwitchSetting label="Показывать термины" hint="Русский термин и английский эквивалент — пригодится при чтении документации." checked={f.showTerms} onChange={(v) => set({ showTerms: v })} />
        {f.showTerms && (
          <SegSetting label="Язык терминов" hint="Как записывать термин: только по-русски, по-русски с английским в скобках или английский первым — для чтения документации." value={f.termsStyle} onChange={(v) => set({ termsStyle: v })} options={[['ru', 'Русский'], ['ru+en', 'Русский + English'], ['en-first', 'English первым']]} />
        )}
        <SwitchSetting label="Объяснять автоматически" hint="Разбор открывается сразу после ошибки. Выключено — показывается только заголовок и кнопка «Показать объяснение»." checked={f.autoExplain} onChange={(v) => set({ autoExplain: v })} />
        <SwitchSetting label="Сначала вопрос, потом объяснение" hint="После ошибки вы видите наводящие вопросы, а объяснение открывается по кнопке — так вы успеваете подумать сами." checked={f.socraticDelay} onChange={(v) => set({ socraticDelay: v })} />
      </Section>
      <Section title="Предпросмотр" sub="пример ошибки в Python">
        <div className="stack tight">
          <CodeBlock code={SAMPLE_CODE} lang="python" lines highlightLine={2} />
          <div className="card flat">
            <ErrorExplain key={`${f.depth}-${f.autoExplain}-${f.socraticDelay}-${f.showTerms}-${f.termsStyle}`} error={SAMPLE_ERROR} lang="python" code={SAMPLE_CODE} ai={false} />
          </div>
        </div>
      </Section>
    </div>
  );
}

// ---------- editor ----------

const EDITOR_SAMPLE = 'def greet(name):\n    if name:\n        return "Привет, " + name\n    return "Привет!"\n\nprint(greet("мир"))\n';

function EditorTab() {
  const e = useApp((s) => s.settings.editor);
  const set = (p: Partial<Settings['editor']>) => up({ editor: p });
  const [code, setCode] = useState(EDITOR_SAMPLE);
  return (
    <div className="grid cols-2" style={{ alignItems: 'start' }}>
      <Section title="Редактор кода">
        <RangeSetting label="Размер шрифта" hint="Размер текста в редакторе." value={e.fontSize} min={11} max={24} step={1} format={(v) => `${v} px`} onChange={(v) => set({ fontSize: v })} />
        <SegSetting label="Размер табуляции" hint="Ширина отступа (в Python отступ всегда 4 пробела)." value={e.tabSize} onChange={(v) => set({ tabSize: v })} options={[[2, '2 пробела'], [4, '4 пробела']]} />
        <SwitchSetting label="Номера строк" hint="Помогают сопоставлять код и сообщения об ошибках." checked={e.lineNumbers} onChange={(v) => set({ lineNumbers: v })} />
        <SwitchSetting label="Перенос длинных строк" hint="Вместо горизонтальной прокрутки." checked={e.wordWrap} onChange={(v) => set({ wordWrap: v })} />
        <SwitchSetting label="Автозакрытие скобок и кавычек" hint="Вставляет парную скобку или кавычку." checked={e.autoClose} onChange={(v) => set({ autoClose: v })} />
        <SwitchSetting label="Подсветка текущей строки" hint="Выделяет строку с курсором." checked={e.highlightLine} onChange={(v) => set({ highlightLine: v })} />
        <SegSetting label="Горячая клавиша запуска" hint="Запускает код из редактора." value={e.runShortcut} onChange={(v) => set({ runShortcut: v })} options={[['mod-enter', 'Ctrl/⌘ + Enter'], ['shift-enter', 'Shift + Enter']]} />
        <RangeSetting label="Тайм-аут выполнения" hint="Через сколько секунд программа прерывается — защита от бесконечных циклов." value={e.timeoutSec} min={2} max={20} step={1} format={(v) => `${v} с`} onChange={(v) => set({ timeoutSec: v })} />
      </Section>
      <Section title="Предпросмотр" sub="редактируйте — настройки применяются сразу">
        <CodeEditor value={code} onChange={setCode} lang="python" minHeight={220} onRun={() => actions().toast(`Горячая клавиша работает: в песочнице код выполнился бы сейчас`, 'info')} ariaLabel="Предпросмотр редактора" />
      </Section>
    </div>
  );
}

// ---------- home ----------

function HomeTab() {
  const widgets = useApp((s) => s.settings.dashboard.widgets);
  const set = (w: typeof widgets) => up({ dashboard: { widgets: w } });
  const move = (i: number, d: number) => {
    const n = [...widgets];
    const j = i + d;
    if (j < 0 || j >= n.length) return;
    [n[i], n[j]] = [n[j], n[i]];
    set(n);
  };
  const visible = widgets.filter((w) => w.visible).length;
  return (
    <Section title="Блоки главной страницы" sub={`показано ${visible} из ${WIDGETS.length}`}>
      <p className="small muted" style={{ marginTop: 0 }}>Включайте нужное и меняйте порядок — главная соберётся под ваш стиль занятий.</p>
      <ol style={{ listStyle: 'none', margin: 0, padding: 0 }}>
        {widgets.map((w, i) => (
          <li key={w.id} className="row" style={{ padding: '8px 0', borderBottom: '1px dashed var(--border)', opacity: w.visible ? 1 : 0.6 }}>
            <label className="row tight grow" style={{ cursor: 'pointer' }}>
              <input type="checkbox" role="switch" checked={w.visible} onChange={(e) => set(widgets.map((x) => (x.id === w.id ? { ...x, visible: e.target.checked } : x)))} />
              <span><span className="muted small">{i + 1}.</span> <strong>{WIDGET_INFO[w.id]}</strong> <span className="tiny muted">{w.visible ? '' : '(скрыт)'}</span></span>
            </label>
            <button className="btn sm icon" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Поднять «${WIDGET_INFO[w.id]}» выше`}>↑</button>
            <button className="btn sm icon" onClick={() => move(i, 1)} disabled={i === widgets.length - 1} aria-label={`Опустить «${WIDGET_INFO[w.id]}» ниже`}>↓</button>
          </li>
        ))}
      </ol>
      <div className="row" style={{ marginTop: 12 }}>
        <button className="btn" onClick={() => set(DEFAULT_SETTINGS.dashboard.widgets.map((w) => ({ ...w })))}>Сбросить порядок и показать всё</button>
      </div>
    </Section>
  );
}

// ---------- data ----------

const PRECACHE_URLS = ['./pyodide/pyodide.mjs', './pyodide/pyodide.asm.mjs', './pyodide/pyodide.asm.wasm', './pyodide/python_stdlib.zip', './pyodide/pyodide-lock.json', './sqljs/sql-wasm-browser.wasm', './sqljs/sql-wasm.wasm'];

function downloadFile(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function DataTab() {
  const s = useApp((x) => x);
  const [pending, setPending] = useState<{ state: AppState; summary: ImportSummary } | null>(null);
  const [importError, setImportError] = useState('');
  const [resetOpen, setResetOpen] = useState(false);
  const [phrase, setPhrase] = useState('');
  const [offline, setOffline] = useState<'idle' | 'working' | 'done' | 'no-controller'>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const kb = useMemo(() => {
    try {
      return (localStorage.getItem(STORAGE_KEY)?.length ?? 0) / 1024;
    } catch {
      return 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    const on = (e: MessageEvent) => { if (e.data?.type === 'precached') setOffline('done'); };
    navigator.serviceWorker.addEventListener('message', on);
    return () => navigator.serviceWorker.removeEventListener('message', on);
  }, []);

  const doExport = () => {
    downloadFile(`learnlab-${dayKey(Date.now())}.json`, exportState(useStore.getState().s), 'application/json');
    actions().toast('Резервная копия сохранена', 'success');
  };

  const onFile = async (file: File | undefined) => {
    setImportError('');
    if (!file) return;
    const r = parseImport(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (!r.ok) { setImportError(r.error); return; }
    setPending({ state: r.state, summary: r.summary });
  };

  const prepareOffline = () => {
    const ctl = 'serviceWorker' in navigator ? navigator.serviceWorker.controller : null;
    if (!ctl) { setOffline('no-controller'); return; }
    setOffline('working');
    ctl.postMessage({ type: 'precache', urls: PRECACHE_URLS });
  };

  return (
    <>
      <Section title="Резервная копия" sub={`занято в браузере: ≈ ${kb.toFixed(1)} КБ`}>
        <p className="small muted" style={{ marginTop: 0 }}>Прогресс хранится только в этом браузере. Очистка данных сайта его удалит — иногда сохраняйте копию в файл.</p>
        <div className="row">
          <button className="btn primary" onClick={doExport}>⬇ Экспорт в JSON</button>
          <label className="field" style={{ flex: '1 1 260px' }}>
            Импорт из файла
            <input ref={fileRef} type="file" accept="application/json,.json" onChange={(e) => void onFile(e.target.files?.[0])} />
          </label>
        </div>
        {importError && <div className="chip err" role="alert" style={{ marginTop: 10 }}>✗ {importError}</div>}
      </Section>

      <Section title="Офлайн-режим">
        <p className="small muted" style={{ marginTop: 0 }}>Скачает движки Python (~12 МБ) и SQL в кэш браузера, чтобы код запускался без интернета.</p>
        <div className="row">
          <button className="btn" onClick={prepareOffline} disabled={offline === 'working'}>{offline === 'working' ? 'Загрузка…' : 'Подготовить офлайн-режим'}</button>
          <span role="status" className="small">
            {offline === 'done' && <span className="chip ok">✓ Готово: движки сохранены в кэше</span>}
            {offline === 'working' && <span className="chip warn">Скачиваю файлы, это может занять минуту…</span>}
            {offline === 'no-controller' && <span className="muted">Фоновый сервис ещё не активен. Офлайн-режим работает в установленной (production) сборке приложения после первой загрузки страницы.</span>}
          </span>
        </div>
      </Section>

      <Section title="Опасная зона">
        <div className="row spread">
          <span className="small muted grow">Удалит весь прогресс, ошибки, черновики, настройки и имя. Перед этим сделайте экспорт.</span>
          <button className="btn danger" onClick={() => { setPhrase(''); setResetOpen(true); }}>Сбросить весь прогресс</button>
        </div>
      </Section>

      {pending && (
        <Modal
          title="Импортировать данные?"
          onClose={() => setPending(null)}
          actions={<>
            <button className="btn ghost" onClick={() => setPending(null)}>Отмена</button>
            <button className="btn primary" onClick={() => { actions().importState(pending.state); setPending(null); actions().toast('Данные импортированы', 'success'); }}>Заменить текущие данные</button>
          </>}
        >
          <ul style={{ margin: 0, paddingLeft: '1.2em' }}>
            <li>Навыков с данными: <strong>{pending.summary.skills}</strong></li>
            <li>Записей о решениях: <strong>{pending.summary.evidence}</strong></li>
            <li>Ошибок в журнале: <strong>{pending.summary.mistakes}</strong></li>
            <li>Экспортировано: <strong>{pending.summary.exportedAt ? new Date(pending.summary.exportedAt).toLocaleString('ru-RU') : 'неизвестно'}</strong></li>
          </ul>
          {!pending.summary.checksumOk && <div className="chip warn" role="alert">⚠ Контрольная сумма не совпала: файл мог быть изменён вручную или повреждён.</div>}
          <p className="small muted" style={{ margin: 0 }}>Текущие данные на этом устройстве будут заменены.</p>
        </Modal>
      )}

      {resetOpen && (
        <Modal
          title="Сбросить весь прогресс?"
          onClose={() => setResetOpen(false)}
          actions={<>
            <button className="btn ghost" onClick={() => setResetOpen(false)}>Отмена</button>
            <button className="btn danger" disabled={phrase.trim().toUpperCase() !== 'СБРОС'} onClick={() => { actions().resetAll(); setResetOpen(false); actions().toast('Все данные удалены', 'warn'); }}>Удалить всё</button>
          </>}
        >
          <p style={{ margin: 0 }}>Действие необратимо. Чтобы подтвердить, введите слово <strong>СБРОС</strong>.</p>
          <label className="field">
            Подтверждение
            <input type="text" value={phrase} onChange={(e) => setPhrase(e.target.value)} autoComplete="off" placeholder="СБРОС" />
          </label>
        </Modal>
      )}
    </>
  );
}

// ---------- about ----------

function AboutTab() {
  return (
    <>
      <Section title="LearnLab" sub={`версия ${version}`}>
        <p style={{ marginTop: 0 }}>Персональный тренажёр по программированию: Python, JavaScript, алгоритмы и SQL. Код запускается прямо в браузере, а план занятий подстраивается под ваши результаты.</p>
      </Section>
      <Section title="Приватность">
        <ul className="stack tight" style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li>Все данные (прогресс, настройки, черновики) хранятся только на вашем устройстве, в localStorage браузера.</li>
          <li>По умолчанию приложение не отправляет сетевых запросов с вашими данными и не использует аналитику.</li>
          <li>Исключение — необязательный AI-помощник (вкладка «AI-помощник»): если вы его включите, код и вопросы уходят напрямую выбранному провайдеру. Ключ хранится отдельно от прогресса и не попадает в файлы экспорта.</li>
          <li>Ваш код выполняется в изолированном Web Worker с ограничением по времени и без доступа к сети и хранилищу страницы.</li>
          <li>Интернет нужен лишь для первой загрузки приложения и движков (Python, SQL); дальше можно работать офлайн.</li>
        </ul>
      </Section>
      <Section title="Как устроено обучение">
        <ul className="stack tight" style={{ margin: 0, paddingLeft: '1.2em' }}>
          <li><strong>Оценка мастерства (BKT).</strong> Для каждого навыка вероятностная модель обновляет оценку «знаю / не знаю» по вашим ответам. Подсказки, показанное решение и угадывание весят меньше; нужны самостоятельные решения разных типов.</li>
          <li><strong>Интервальные повторения (FSRS).</strong> Модель памяти оценивает, когда вы начнёте забывать навык, и планирует повторение к этому моменту под выбранное целевое удержание.</li>
          <li><strong>Отсроченные проверки.</strong> Освоенный навык проверяется ещё раз через 7, 30 и 90 дней; пройденная проверка делает навык «закреплённым».</li>
        </ul>
        <p className="small muted" style={{ marginBottom: 0 }}>Это приближённые модели, а не гарантии. Мы не утверждаем, что приложение доказанно эффективнее других методов: оценки — подсказка для планирования, а не диплом.</p>
      </Section>
    </>
  );
}
