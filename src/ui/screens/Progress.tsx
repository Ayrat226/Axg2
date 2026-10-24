// Learning metrics (not vanity metrics): mastery, durability, independence, calibration, portfolio.
import { useMemo } from 'react';
import { ROUTES, SKILL_BY_ID } from '../../content';
import { CHECK_DELAYS_DAYS, isIndependent, metricsOf, skillStatus, STATUS_INFO, type Confidence, type Evidence, type SkillStatus } from '../../core/model';
import { plural } from '../../core/planner';
import { retrievability } from '../../core/srs';
import { dayKey, type AppState } from '../../core/state';
import type { ExerciseKind } from '../../core/types';
import { actions, useApp } from '../../state/store';
import { StackBar } from '../components/ProgressRing';
import { href } from '../router';

const KIND_LABEL: Record<ExerciseKind, string> = {
  mcq: 'Выбор ответа',
  predict: 'Предсказание вывода',
  code: 'Написание кода',
  fix: 'Исправление ошибки',
  parsons: 'Сборка из блоков',
  explain: 'Объяснение (самооценка)',
};
const KIND_ORDER: ExerciseKind[] = ['code', 'fix', 'predict', 'parsons', 'mcq', 'explain'];
const CONF_LABEL: Record<Confidence, string> = { sure: 'Уверен', unsure: 'Сомневаюсь', guess: 'Наугад' };
const MIN_CAL = 5;
const WEEKS = 12;

const fmtDate = (t: number) => new Date(t).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: 'numeric' });
const pct = (a: number, b: number) => (b ? Math.round((a / b) * 100) : 0);

function Kpi({ v, l, sub }: { v: string | number; l: string; sub?: string }) {
  return (
    <div className="card kpi">
      <span className="v">{v}</span>
      <span className="l">{l}</span>
      {sub && <span className="tiny muted">{sub}</span>}
    </div>
  );
}

interface PortfolioRow {
  id: string;
  title: string;
  route: string;
  status: SkillStatus;
  masteredAt: number;
  independent: number;
  kinds: ExerciseKind[];
  durableAt?: number;
  checkDue?: number;
  checkStage: number;
  recall?: number;
}

function buildPortfolio(s: AppState, now: number): PortfolioRow[] {
  const rows: PortfolioRow[] = [];
  for (const [id, st] of Object.entries(s.skills)) {
    if (!st.masteredAt) continue;
    const skill = SKILL_BY_ID.get(id);
    const ind = st.evidence.filter(isIndependent);
    rows.push({
      id,
      title: skill?.title ?? id,
      route: skill ? ROUTES.find((r) => r.id === skill.route)?.title ?? skill.route : '—',
      status: skillStatus(st, now),
      masteredAt: st.masteredAt,
      independent: metricsOf(st).independent,
      kinds: KIND_ORDER.filter((k) => ind.some((e) => e.kind === k)),
      durableAt: st.durableAt,
      checkDue: st.checkDue,
      checkStage: st.checkStage,
      recall: st.mem ? retrievability(st.mem, now) : undefined,
    });
  }
  return rows.sort((a, b) => b.masteredAt - a.masteredAt);
}

function portfolioMarkdown(rows: PortfolioRow[], name: string, now: number): string {
  const esc = (t: string) => t.replace(/\|/g, '\\|');
  const lines = [
    `# Портфолио навыков${name ? ` — ${name}` : ''}`,
    '',
    `Сформировано в LearnLab: ${fmtDate(now)}. Данные хранятся только на устройстве автора.`,
    '',
    `Освоено навыков: **${rows.length}**, из них закреплено отсроченной проверкой: **${rows.filter((r) => r.durableAt).length}**.`,
    '',
    '| Навык | Маршрут | Освоено | Самостоятельных решений | Типы задач | Закреплено | Следующая проверка | Вероятность вспомнить |',
    '|---|---|---|---|---|---|---|---|',
    ...rows.map((r) =>
      `| ${esc(r.title)} | ${esc(r.route)} | ${fmtDate(r.masteredAt)} | ${r.independent} | ${r.kinds.map((k) => KIND_LABEL[k]).join(', ') || '—'} | ${r.durableAt ? fmtDate(r.durableAt) : 'нет'} | ${r.checkDue ? fmtDate(r.checkDue) : '—'} | ${r.recall !== undefined ? `${Math.round(r.recall * 100)}%` : '—'} |`),
    '',
    '_Мастерство засчитывается по самостоятельным решениям без подсказок разных типов; «закреплено» — после отсроченной проверки через 7/30/90 дней. Это оценка модели обучения, а не сертификат._',
    '',
  ];
  return lines.join('\n');
}

function download(name: string, text: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function calibrationText(cal: Record<Confidence, [number, number]>): { tone: 'ok' | 'warn' | 'err' | ''; text: string } {
  const [sc, st] = cal.sure;
  const [gc, gt] = cal.guess;
  const [uc, ut] = cal.unsure;
  if (st + ut + gt < MIN_CAL) return { tone: '', text: `Пока мало данных: отмечайте уверенность в ответах — после ${MIN_CAL} ответов появится интерпретация.` };
  if (st >= MIN_CAL && pct(sc, st) < 70) return { tone: 'err', text: `Признак самоуверенности: когда вы уверены, верно лишь ${pct(sc, st)}% ответов. Перед отправкой ответа проверьте его на граничном случае или предскажите вывод.` };
  if (gt >= MIN_CAL && pct(gc, gt) >= 70) return { tone: 'warn', text: `Вы знаете больше, чем думаете: «наугад» верно в ${pct(gc, gt)}% случаев. Доверяйте себе чуть больше.` };
  if (st >= MIN_CAL && ut >= MIN_CAL && pct(sc, st) - pct(uc, ut) < 5) return { tone: 'warn', text: 'Уверенность слабо связана с точностью: «уверен» и «сомневаюсь» дают почти одинаковый результат. Старайтесь отмечать её честнее.' };
  if (st >= MIN_CAL) return { tone: 'ok', text: `Хорошая калибровка: уверенные ответы верны в ${pct(sc, st)}% случаев.` };
  return { tone: '', text: `Данных по уровню «уверен» пока меньше ${MIN_CAL} — вывод сделать рано.` };
}

export function Progress() {
  const s = useApp((x) => x);
  const now = Date.now();
  const data = useMemo(() => {
    const entries = Object.values(s.skills);
    const evidence: Evidence[] = entries.flatMap((x) => x.evidence);
    const statuses = ROUTES.map((r) => {
      const counts: Record<SkillStatus, number> = { new: 0, learning: 0, probable: 0, mastered: 0, durable: 0, rusty: 0 };
      for (const sk of r.skills) counts[skillStatus(s.skills[sk.id], now)]++;
      return { route: r, counts };
    });
    const total = statuses.reduce((n, x) => n + x.route.skills.length, 0);
    const sum = (k: SkillStatus) => statuses.reduce((n, x) => n + x.counts[k], 0);
    const independent = evidence.filter(isIndependent).length;
    const revealed = evidence.filter((e) => e.revealed).length;
    const hinted = evidence.filter((e) => !e.revealed && e.hints > 0).length;
    const other = evidence.length - independent - revealed - hinted;
    const checksPassed = entries.reduce((n, x) => n + x.checkStage, 0);
    const checksPending = entries.filter((x) => x.checkDue).length;
    const checksDue = entries.filter((x) => x.checkDue && x.checkDue <= now).length;
    const byKind = KIND_ORDER.map((k) => {
      const ev = evidence.filter((e) => e.kind === k);
      return { k, n: ev.length, ok: ev.filter((e) => e.correct).length };
    }).filter((x) => x.n > 0);
    return { evidence, statuses, total, sum, independent, revealed, hinted, other, checksPassed, checksPending, checksDue, byKind, portfolio: buildPortfolio(s, now) };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [s.skills]);

  const heat = useMemo(() => {
    const today = new Date();
    const monday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - ((today.getDay() + 6) % 7));
    const todayKey = dayKey(today.getTime());
    const cells: { key: string; date: Date; items: number; correct: number; future: boolean }[] = [];
    for (let w = 0; w < WEEKS; w++) {
      for (let d = 0; d < 7; d++) {
        const date = new Date(monday.getFullYear(), monday.getMonth(), monday.getDate() - (WEEKS - 1 - w) * 7 + d);
        const key = dayKey(date.getTime());
        const log = s.days[key];
        cells.push({ key, date, items: log?.items ?? 0, correct: log?.correct ?? 0, future: key > todayKey });
      }
    }
    const max = Math.max(1, ...cells.map((c) => c.items));
    return { cells, max, todayKey, active: cells.filter((c) => c.items > 0).length, items: cells.reduce((n, c) => n + c.items, 0) };
  }, [s.days]);

  const empty = data.evidence.length === 0 && heat.items === 0;
  const cal = calibrationText(s.calibration);
  const exportPortfolio = () => {
    const iso = new Date().toISOString().slice(0, 10);
    download(`learnlab-portfolio-${iso}.md`, portfolioMarkdown(data.portfolio, s.profile.name, Date.now()), 'text/markdown;charset=utf-8');
    actions().toast('Портфолио сохранено в Markdown', 'success');
  };

  const level = (n: number) => (n === 0 ? 0 : Math.min(4, Math.ceil((n / heat.max) * 4)));
  const evTotal = data.evidence.length;

  return (
    <div className="page" data-testid="progress">
      <div className="stack tight">
        <h1>Прогресс</h1>
        <span className="muted">
          Здесь — показатели обучения, а не усердия. Затраченное время и «очки» не доказывают, что вы научились; доказывают самостоятельные решения, проверка спустя дни и точная самооценка.
        </span>
      </div>

      {empty && (
        <div className="card empty">
          <div className="big">📈</div>
          <p>Пока нечего показывать: решите несколько задач или пройдите диагностику.</p>
          <a className="btn primary" href={href('/routes')}>Выбрать маршрут</a>
        </div>
      )}

      <div className="grid cols-4">
        <Kpi v={data.sum('mastered') + data.sum('durable') + data.sum('rusty')} l="Навыков освоено" sub={`из ${data.total} в каталоге`} />
        <Kpi v={data.sum('durable')} l="Закреплено надолго" sub="прошли отсроченную проверку" />
        <Kpi v={data.sum('probable')} l="Вероятно знаю" sub="нужно подтвердить задачей" />
        <Kpi
          v={data.checksPassed}
          l={`Отсроченных проверок пройдено (${CHECK_DELAYS_DAYS.join('/')} дн.)`}
          sub={`${data.checksPending} ${plural(data.checksPending, 'запланирована', 'запланированы', 'запланировано')}${data.checksDue ? ` · ${data.checksDue} пора пройти` : ''}`}
        />
      </div>

      <div className="grid cols-2">
        <div className="card">
          <div className="card-title">Самостоятельность решений</div>
          {evTotal === 0 ? <div className="muted small">Данных пока нет.</div> : (
            <div className="stack tight">
              <div className="row spread">
                <span className="kpi"><span className="v">{pct(data.independent, evTotal)}%</span><span className="l">решено самостоятельно (без подсказок, не наугад)</span></span>
              </div>
              <StackBar
                parts={[
                  { value: data.independent, color: 'var(--ok)', label: 'Самостоятельно' },
                  { value: data.hinted, color: 'var(--warn)', label: 'С подсказкой' },
                  { value: data.revealed, color: 'var(--err)', label: 'Показано решение' },
                  { value: data.other, color: 'var(--st-new)', label: 'Прочее' },
                ]}
              />
              <ul className="small" style={{ margin: 0, paddingLeft: '1.2em' }}>
                <li><span className="dot" style={{ background: 'var(--ok)' }} /> Самостоятельно: <strong>{data.independent}</strong></li>
                <li><span className="dot" style={{ background: 'var(--warn)' }} /> С подсказкой: <strong>{data.hinted}</strong></li>
                <li><span className="dot" style={{ background: 'var(--err)' }} /> Показано решение: <strong>{data.revealed}</strong></li>
                <li><span className="dot" style={{ background: 'var(--st-new)' }} /> Прочее (ошибки, угадывание, самооценка): <strong>{data.other}</strong></li>
              </ul>
              <div className="tiny muted">Считаются сохранённые попытки (последние 40 по каждому навыку).</div>
            </div>
          )}
        </div>

        <div className="card">
          <div className="card-title">Точность по типам задач</div>
          {data.byKind.length === 0 ? <div className="muted small">Данных пока нет.</div> : (
            <div className="stack tight">
              {data.byKind.map(({ k, n, ok }) => (
                <div key={k} className="row tight small">
                  <span style={{ width: 190 }}>{KIND_LABEL[k]}</span>
                  <span className="bar grow" role="img" aria-label={`${KIND_LABEL[k]}: ${pct(ok, n)}% верно, ${ok} из ${n}`}>
                    <span style={{ width: `${pct(ok, n)}%`, background: 'var(--accent)' }} />
                  </span>
                  <span style={{ width: 92, textAlign: 'right' }}>{pct(ok, n)}% · {ok}/{n}</span>
                </div>
              ))}
              <div className="tiny muted">Выбор ответа легче угадать, чем написать код: смотрите на код, исправление и предсказание.</div>
            </div>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title">Калибровка уверенности</div>
        <div className="grid cols-3">
          {(['sure', 'unsure', 'guess'] as Confidence[]).map((c) => {
            const [ok, n] = s.calibration[c];
            return (
              <div key={c} className="kpi">
                <span className="v">{n ? `${pct(ok, n)}%` : '—'}</span>
                <span className="l">«{CONF_LABEL[c]}»: верно {ok} из {n}</span>
                <span className="bar" role="img" aria-label={`${CONF_LABEL[c]}: ${n ? pct(ok, n) : 0}% верно`}><span style={{ width: `${pct(ok, n)}%`, background: 'var(--accent)' }} /></span>
              </div>
            );
          })}
        </div>
        <p className="small" role="status" style={{ marginBottom: 0 }}>
          <span className={`chip ${cal.tone}`}>{cal.tone === 'err' ? '⚠ Самоуверенность' : cal.tone === 'warn' ? '△ Обратите внимание' : cal.tone === 'ok' ? '✓ Калибровка' : 'ℹ Данные'}</span> {cal.text}
        </p>
      </div>

      <div className="card">
        <div className="card-title">Активность за {WEEKS} недель <span className="sub">{heat.active} {plural(heat.active, 'день', 'дня', 'дней')} · {heat.items} {plural(heat.items, 'задание', 'задания', 'заданий')}</span></div>
        <div className="row" style={{ alignItems: 'flex-start', flexWrap: 'nowrap' }}>
          <div className="tiny muted" style={{ display: 'grid', gridTemplateRows: 'repeat(7, 1fr)', gap: 4, paddingTop: 0 }} aria-hidden="true">
            {['Пн', '', 'Ср', '', 'Пт', '', 'Вс'].map((d, i) => <span key={i} style={{ alignSelf: 'center' }}>{d}</span>)}
          </div>
          <div role="list" aria-label="Карта активности по дням" style={{ display: 'grid', gridTemplateRows: 'repeat(7, minmax(18px, 1fr))', gridAutoFlow: 'column', gridAutoColumns: 'minmax(18px, 1fr)', gap: 4, flex: 1 }}>
            {heat.cells.map((c) => {
              const lv = level(c.items);
              const label = `${c.date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' })}: ${c.future ? 'ещё не наступил' : c.items ? `${c.items} ${plural(c.items, 'задание', 'задания', 'заданий')}, верно ${c.correct}` : 'без занятий'}`;
              return (
                <div
                  key={c.key} role="listitem" aria-label={label} title={label}
                  style={{
                    borderRadius: 5, border: `1px solid ${c.key === heat.todayKey ? 'var(--text)' : 'var(--border)'}`, aspectRatio: '1', display: 'grid', placeItems: 'center',
                    fontSize: '0.62rem', fontWeight: 700, opacity: c.future ? 0.35 : 1, color: lv >= 3 ? '#fff' : 'var(--text-dim)',
                    background: lv === 0 ? 'var(--surface-2)' : `color-mix(in srgb, var(--accent) ${lv * 22 + 12}%, var(--surface-2))`,
                  }}
                >
                  {c.items > 0 ? c.items : ''}
                </div>
              );
            })}
          </div>
        </div>
        <div className="tiny muted" style={{ marginTop: 8 }}>Число в клетке — количество решённых заданий за день; чем ярче клетка, тем больше. Рамка — сегодня. Регулярность помогает памяти, но сама по себе не означает освоения.</div>
      </div>

      <div className="card">
        <div className="card-title">Маршруты</div>
        <div className="stack">
          {data.statuses.map(({ route, counts }) => (
            <div key={route.id} className="stack tight">
              <div className="row spread small">
                <a href={href(`/route/${route.id}`)}><strong>{route.icon} {route.title}</strong></a>
                <span className="muted">{route.skills.length - counts.new - counts.learning} из {route.skills.length} {plural(route.skills.length, 'навыка', 'навыков', 'навыков')} пройдено</span>
              </div>
              <StackBar parts={(['durable', 'mastered', 'rusty', 'probable', 'learning', 'new'] as SkillStatus[]).map((k) => ({ value: counts[k], color: STATUS_INFO[k].color, label: STATUS_INFO[k].label }))} />
              <div className="row tight tiny muted">
                {(['durable', 'mastered', 'rusty', 'probable', 'learning', 'new'] as SkillStatus[]).filter((k) => counts[k] > 0).map((k) => (
                  <span key={k}><span className="dot" style={{ background: STATUS_INFO[k].color }} /> {STATUS_INFO[k].label}: {counts[k]}</span>
                ))}
              </div>
            </div>
          ))}
          {ROUTES.length === 0 && <div className="muted small">Маршруты ещё загружаются.</div>}
        </div>
      </div>

      <div className="card">
        <div className="card-title">
          Портфолио навыков
          <span className="sub"><button className="btn sm" onClick={exportPortfolio} disabled={data.portfolio.length === 0}>⬇ Экспорт портфолио (Markdown)</button></span>
        </div>
        {data.portfolio.length === 0 ? (
          <div className="empty" style={{ padding: 20 }}>
            <p style={{ margin: 0 }}>Здесь появятся навыки, освоение которых подтверждено несколькими самостоятельными решениями разных типов.</p>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">Навык</th>
                  <th scope="col">Освоено</th>
                  <th scope="col">Самостоятельных решений</th>
                  <th scope="col">Типы задач</th>
                  <th scope="col">Закрепление</th>
                  <th scope="col">Вспомню сейчас</th>
                </tr>
              </thead>
              <tbody>
                {data.portfolio.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <a href={href(`/skill/${r.id}`)}><strong>{r.title}</strong></a>
                      <div className="tiny muted">{r.route} · {STATUS_INFO[r.status].label}</div>
                    </td>
                    <td>{fmtDate(r.masteredAt)}</td>
                    <td>{r.independent}</td>
                    <td className="small">{r.kinds.map((k) => KIND_LABEL[k]).join(', ') || '—'}</td>
                    <td className="small">
                      {r.durableAt ? `✓ с ${fmtDate(r.durableAt)}` : 'ещё не закреплено'}
                      <div className="tiny muted">
                        {r.checkDue ? `проверка ${fmtDate(r.checkDue)} (${r.checkStage}/${CHECK_DELAYS_DAYS.length})` : r.checkStage >= CHECK_DELAYS_DAYS.length ? 'все проверки пройдены' : 'проверка не запланирована'}
                      </div>
                    </td>
                    <td>{r.recall !== undefined ? `${Math.round(r.recall * 100)}%` : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="tiny muted" style={{ marginTop: 8 }}>«Вспомню сейчас» — оценка модели памяти (FSRS), а не результат теста.</div>
      </div>
    </div>
  );
}
