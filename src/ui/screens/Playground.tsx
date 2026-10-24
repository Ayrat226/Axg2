// Free-form sandbox: run Python / JavaScript / SQL, see explained errors, trace Python step by step.
import { useEffect, useRef, useState } from 'react';
import { plural } from '../../core/planner';
import type { Lang } from '../../core/types';
import { onRuntimeStatus, runCode, warmup, type RuntimeStatus } from '../../runner/runner';
import type { RunError, SqlTable } from '../../runner/types';
import { actions, useApp } from '../../state/store';
import { CodeEditor } from '../components/CodeEditor';
import { ErrorExplain } from '../components/ErrorExplain';
import { Visualizer } from '../components/Visualizer';

interface Example { title: string; code: string; stdin?: string }

const LANGS: { id: Lang; label: string }[] = [
  { id: 'python', label: 'Python' },
  { id: 'javascript', label: 'JavaScript' },
  { id: 'sql', label: 'SQL' },
];

const EXAMPLES: Record<Lang, Example[]> = {
  python: [
    { title: 'Привет, ввод', code: 'name = input("Как вас зовут? ")\nage = int(input("Сколько вам лет? "))\nprint("Привет,", name)\nprint("Через 5 лет вам будет", age + 5)\n', stdin: 'Аня\n20' },
    { title: 'Рекурсия: факториал', code: 'def fact(n):\n    if n <= 1:\n        return 1\n    return n * fact(n - 1)\n\nprint(fact(4))\n' },
    { title: 'Цикл и накопление', code: 'total = 0\nfor i in range(1, 6):\n    total += i * i\n    print(i, total)\nprint("Сумма квадратов:", total)\n' },
    { title: 'Ошибка TypeError', code: 'age = 20\nprint("Мне " + age)\n' },
  ],
  javascript: [
    { title: 'Замыкание-счётчик', code: 'function makeCounter() {\n  let n = 0;\n  return () => ++n;\n}\nconst next = makeCounter();\nconsole.log(next(), next(), next());\n' },
    { title: 'Методы массивов', code: 'const nums = [5, 3, 8, 1, 9];\nconst evens = nums.filter((x) => x % 2 === 0);\nconst doubled = nums.map((x) => x * 2);\nconsole.log(evens, doubled);\nconsole.log(nums.reduce((a, b) => a + b, 0));\n' },
    { title: 'Ввод через prompt', code: 'const name = prompt("Ваше имя?");\nconsole.log(`Привет, ${name}!`);\n', stdin: 'Борис' },
    { title: 'Ошибка ReferenceError', code: 'const price = 100;\nconsole.log(prise * 2);\n' },
  ],
  sql: [
    { title: 'Все товары', code: 'SELECT * FROM products;\n' },
    { title: 'Фильтр и сортировка', code: 'SELECT name, price\nFROM products\nWHERE price > 100\nORDER BY price DESC;\n' },
    { title: 'JOIN + GROUP BY', code: 'SELECT p.name, COUNT(o.id) AS orders, SUM(o.qty) AS total_qty\nFROM products p\nLEFT JOIN orders o ON o.product_id = p.id\nGROUP BY p.id\nORDER BY total_qty DESC;\n' },
    { title: 'Опечатка в запросе', code: 'SELEC name FROM products;\n' },
  ],
};

const DEFAULT_SETUP = `CREATE TABLE products (id INTEGER PRIMARY KEY, name TEXT, price REAL);
CREATE TABLE orders (id INTEGER PRIMARY KEY, product_id INTEGER, qty INTEGER);
INSERT INTO products VALUES (1, 'Клавиатура', 120), (2, 'Мышь', 45), (3, 'Монитор', 310), (4, 'Кабель', 9.5);
INSERT INTO orders VALUES (1, 1, 2), (2, 2, 5), (3, 1, 1), (4, 3, 1), (5, 2, 3);
`;

const keyOf = (lang: Lang) => `playground:${lang}`;

function runtimeNote(lang: Lang, st: Record<'python' | 'js', RuntimeStatus>): { text: string; tone: string } {
  const s = lang === 'python' ? st.python : st.js;
  const name = lang === 'python' ? 'Python' : lang === 'javascript' ? 'JavaScript' : 'SQL';
  if (s === 'loading') return { text: lang === 'python' ? 'Загрузка Python (~12 МБ, только в первый раз)…' : `Загрузка движка ${name}…`, tone: 'warn' };
  if (s === 'ready') return { text: `${name} готов`, tone: 'ok' };
  if (s === 'error') return { text: `Не удалось запустить ${name}. Проверьте соединение при первом запуске.`, tone: 'err' };
  return { text: lang === 'python' ? 'Python загрузится при первом запуске (~12 МБ, только в первый раз)' : `${name} загрузится при первом запуске`, tone: '' };
}

export function Playground() {
  const [lang, setLang] = useState<Lang>('python');
  const draft = useApp((s) => s.drafts[keyOf(lang)]);
  const stdinDraft = useApp((s) => s.drafts[`playground:stdin:${lang}`]);
  const setupDraft = useApp((s) => s.drafts['playground:sql:setup']);
  const layout = useApp((s) => s.settings.appearance.editorLayout);
  const runShortcut = useApp((s) => s.settings.editor.runShortcut);
  const code = draft ?? EXAMPLES[lang][0].code;
  const stdinText = stdinDraft ?? EXAMPLES[lang][0].stdin ?? '';
  const setup = setupDraft ?? DEFAULT_SETUP;

  const [status, setStatus] = useState<Record<'python' | 'js', RuntimeStatus>>({ python: 'idle', js: 'idle' });
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<{ lang: Lang; code: string; stdout: string; error: RunError | null; tables?: SqlTable[]; ms: number } | null>(null);
  const [vizCode, setVizCode] = useState<string | null>(null);
  const runId = useRef(0);

  useEffect(() => {
    const off = onRuntimeStatus(setStatus);
    return () => { off(); };
  }, []);
  useEffect(() => {
    if (lang !== 'python') void warmup(lang);
  }, [lang]);

  const switchLang = (l: Lang) => {
    runId.current++;
    setRunning(false);
    setLang(l);
    setResult(null);
    setVizCode(null);
  };

  const setCode = (v: string) => actions().setDraft(keyOf(lang), v);

  const run = async () => {
    if (running) return;
    const id = ++runId.current;
    const snapshot = code;
    setRunning(true);
    const t0 = performance.now();
    const stdin = lang === 'sql' || !stdinText ? [] : stdinText.split('\n');
    const r = await runCode(lang, snapshot, stdin, lang === 'sql' ? setup : undefined);
    if (id !== runId.current) return;
    setResult({ lang, code: snapshot, stdout: r.stdout, error: r.error, tables: r.tables, ms: Math.round(performance.now() - t0) });
    setRunning(false);
  };

  const load = (ex: Example) => {
    setCode(ex.code);
    actions().setDraft(`playground:stdin:${lang}`, ex.stdin ?? '');
    setResult(null);
    setVizCode(null);
  };

  const fresh = result && result.lang === lang ? result : null;
  const errorLine = fresh && fresh.code === code ? fresh.error?.line ?? null : null;
  const note = runtimeNote(lang, status);
  const stacked = layout === 'stacked';

  return (
    <div className="page wide" data-testid="playground">
      <div className="row spread">
        <div className="stack tight">
          <h1>Песочница</h1>
          <span className="muted">Пишите и запускайте код без оценок и последствий. Код выполняется на вашем устройстве.</span>
        </div>
        <div className="segmented" role="group" aria-label="Язык">
          {LANGS.map((l) => (
            <button key={l.id} aria-pressed={lang === l.id} onClick={() => switchLang(l.id)}>{l.label}</button>
          ))}
        </div>
      </div>

      <div className="row tight" role="group" aria-label="Примеры">
        <span className="small muted">Примеры:</span>
        {EXAMPLES[lang].map((ex) => (
          <button key={ex.title} className="btn sm ghost" onClick={() => load(ex)}>{ex.title}</button>
        ))}
        <button className="btn sm ghost" onClick={() => load({ title: '', code: '' })}>Очистить</button>
      </div>

      <div className={`ex-layout ${stacked ? 'stacked' : ''}`}>
        <div className="stack tight">
          <CodeEditor value={code} onChange={setCode} lang={lang} onRun={run} errorLine={errorLine} minHeight={260} ariaLabel={`Редактор: ${lang}`} />
          {lang === 'sql' ? (
            <label className="field">
              Схема и данные (выполняются перед запросом)
              <textarea
                className="mono" rows={7} spellCheck={false} value={setup}
                onChange={(e) => actions().setDraft('playground:sql:setup', e.target.value)}
              />
              <span className="hint">Создайте свои таблицы командами CREATE TABLE / INSERT. База создаётся заново при каждом запуске.</span>
            </label>
          ) : (
            <label className="field">
              Ввод программы (одна строка — один вызов {lang === 'python' ? 'input()' : 'prompt()'})
              <textarea
                className="mono" rows={3} spellCheck={false} value={stdinText} placeholder="Оставьте пустым, если ввод не нужен"
                onChange={(e) => actions().setDraft(`playground:stdin:${lang}`, e.target.value)}
              />
            </label>
          )}
          <div className="row">
            <button className="btn primary" onClick={run} disabled={running}>{running ? 'Выполняется…' : '▶ Запустить'}</button>
            {lang === 'python' && (
              <button className="btn" onClick={() => setVizCode(code)} disabled={!code.trim()}>🔍 Пошагово</button>
            )}
            <span className="tiny muted"><kbd>{runShortcut === 'mod-enter' ? 'Ctrl/⌘ + Enter' : 'Shift + Enter'}</kbd> — запуск</span>
            <span className={`chip ${note.tone}`} role="status">{note.text}</span>
          </div>
        </div>

        <div className="stack tight" aria-live="polite">
          <div className="card-title">Результат{fresh && <span className="sub">{fresh.ms} мс</span>}</div>
          {!fresh && !running && <div className="card flat empty"><div className="big">▶</div><p>Нажмите «Запустить» — вывод появится здесь.</p></div>}
          {running && <div className="card flat empty" role="status">Выполняется…</div>}
          {fresh && !running && (
            <>
              {fresh.lang !== 'sql' && (
                <pre className="output" aria-label="Вывод программы">
                  {fresh.stdout || (fresh.error ? <span className="muted">(до ошибки ничего не выведено)</span> : <span className="muted">(программа ничего не вывела)</span>)}
                </pre>
              )}
              {fresh.lang === 'sql' && !fresh.error && (fresh.tables?.length ? fresh.tables.map((t, i) => <SqlResult key={i} t={t} n={i + 1} total={fresh.tables!.length} />) : <div className="card flat muted">Запрос выполнен, но таблиц результата нет.</div>)}
              {fresh.error && (
                <div className="card flat">
                  <ErrorExplain error={fresh.error} lang={fresh.lang} code={fresh.code} />
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {vizCode !== null && lang === 'python' && (
        <div className="card">
          <div className="card-title">
            Пошаговое выполнение
            <span className="sub"><button className="btn sm ghost" onClick={() => setVizCode(null)}>Закрыть</button></span>
          </div>
          <Visualizer code={vizCode} stdin={stdinText ? stdinText.split('\n') : []} />
        </div>
      )}
    </div>
  );
}

function SqlResult({ t, n, total }: { t: SqlTable; n: number; total: number }) {
  const rows = t.rows.slice(0, 200);
  return (
    <div className="card flat" style={{ overflowX: 'auto' }}>
      <div className="small muted" style={{ marginBottom: 6 }}>
        {total > 1 ? `Результат ${n} из ${total}: ` : ''}{t.rows.length} {plural(t.rows.length, 'строка', 'строки', 'строк')}{t.rows.length > rows.length ? ` (показаны первые ${rows.length})` : ''}
      </div>
      <table className="table">
        <thead><tr>{t.columns.map((c, i) => <th key={i} scope="col">{c}</th>)}</tr></thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>{r.map((v, j) => <td key={j}>{v === null ? <span className="muted">NULL</span> : String(v)}</td>)}</tr>
          ))}
          {rows.length === 0 && <tr><td colSpan={Math.max(1, t.columns.length)} className="muted">Нет строк</td></tr>}
        </tbody>
      </table>
    </div>
  );
}
