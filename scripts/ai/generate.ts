// AI exercise generation with executable verification:
//   1. both models draft new exercises per skill (transfer, edge cases, debugging, code reading);
//   2. every draft is executed by the same validator as the content test-suite (solution passes all tests,
//      starter/buggy fails, predicted output matches, MCQ has one correct answer…); failures go back to the
//      author model for repair (up to 2 rounds);
//   3. the *other* model reviews clarity/correctness/ambiguity; only drafts that pass both gates are kept.
// Output: src/content/generated/<route>.json (merged into routes by src/content/index.ts).
// Usage: npx tsx scripts/ai/generate.ts   [ROUTE=python] [PER_MODEL=3] [SKILL=py.loops]
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { ROUTES } from '../../src/content';
import type { Exercise, Route, Skill } from '../../src/core/types';
import { MODELS, chatJson, otherModel, stats } from './llm';
import { ValidatorPool } from './validatorPool';

const PER_MODEL = Number(process.env.PER_MODEL ?? 3);
const OUT_DIR = 'src/content/generated';
mkdirSync(OUT_DIR, { recursive: true });
mkdirSync('reports/ai-generate', { recursive: true });

const SCHEMA = `type TestCase = { expr?: string; expect?: string; stdin?: string[]; stdout?: string; hidden?: boolean; label?: string };
// mcq:     { kind:"mcq", difficulty:1|2|3, prompt, code?, lang?, options:[{text, correct?:true, why, misconception?:"<id из списка>"}], explanation }
// predict: { kind:"predict", difficulty, lang:"python"|"javascript", prompt, code, answer:"<точный stdout>", explanation }
// code:    { kind:"code", difficulty, lang, prompt, starter, solution, tests:TestCase[], hints:string[], explanation }
// fix:     { kind:"fix", difficulty, lang, prompt, buggy, solution, bugType:"syntax"|"runtime"|"logic"|"edge", tests:TestCase[], hints:string[], explanation }
// parsons: { kind:"parsons", difficulty, lang:"python"|"javascript", prompt, lines:string[], distractors?:string[], tests?:TestCase[], explanation }
// SQL code/fix: вместо tests — "setupRef": "<id существующего SQL-задания, чьи setup/hiddenSetup использовать>", solution (эталонный запрос),
//               starter/buggy, ordered?: true (только если задание требует порядок), check?: "SELECT ..." (для INSERT/UPDATE/DELETE)`;

const LANG_RULES: Record<string, string> = {
  python: `Python 3.14 (Pyodide). Тест expr вычисляется после кода ученика в его пространстве имён; expect — литерал Python (eval); сравнение строгое по типам
(tuple≠list, bool≠int, float — с допуском). stdin/stdout-тест запускает всю программу с этими строками input() (input НЕ печатает введённое).
Без файлов, сети, потоков, случайности без seed, бесконечных циклов. Не печатать множества (порядок не гарантирован).`,
  javascript: `JavaScript ES2023 в strict mode внутри async-функции (top-level await работает). Нет DOM, fetch, process, require, import.
console.log форматирует как Node: [ 1, 2 ], { a: 1, b: 'x' }, вложенные строки в одинарных кавычках, строки верхнего уровня без кавычек,
Map(1) { 'a' => 1 }, Set(2) { 1, 2 }, экземпляр класса P { x: 1 }. Тест expr вычисляется через eval в области кода ученика; expect — литерал JS;
строгое глубокое сравнение. prompt() читает следующую строку stdin. Без Math.random/Date.now в ответах.`,
  sql: `SQLite (sql.js). Результат сравнивается по значениям строк (имена столбцов не важны, число столбцов важно), без учёта порядка,
если не указан ordered. Задание должно явно перечислять, какие столбцы и в каком порядке вернуть. Решение обязано работать и на скрытом наборе данных.`,
};

const SYSTEM = `Ты — автор заданий для адаптивного курса программирования на русском языке. Пиши точные, однозначные задания,
которые проверяют перенос навыка на новую ситуацию, граничные случаи, отладку и чтение кода — не повторяй существующие задания.
Каждое задание самодостаточно. Подсказки — лестница от наводящего вопроса до почти-решения (без полного решения).
Скрытые тесты (hidden:true) обязательны для code/fix и проверяют граничные случаи; у них label на русском.
Стартовый код (starter) / код с ошибкой (buggy) обязан НЕ проходить хотя бы один тест. Объяснение говорит ПОЧЕМУ.
Ответ — только JSON-массив заданий по схеме, без комментариев.`;

function brief(skill: Skill) {
  return { id: skill.id, title: skill.title, summary: skill.summary, outcomes: skill.outcomes, brief: skill.lesson.brief, misconceptions: skill.misconceptions.map((m) => ({ id: m.id, title: m.title })) };
}

function examplesOf(route: Route, skill: Skill) {
  const exs = route.exercises.filter((e) => e.skill === skill.id && !e.id.includes('.g'));
  const kinds = new Set<string>();
  const picked: Exercise[] = [];
  for (const e of exs) if (!kinds.has(e.kind) && (e.kind === 'code' || e.kind === 'fix' || e.kind === 'predict' || e.kind === 'mcq')) { kinds.add(e.kind); picked.push(e); }
  return picked.map((e) => (route.lang === 'sql' && 'setup' in e ? { ...e, setup: '<см. setupRef>', hiddenSetup: '<…>', setupRef: e.id } : e));
}

function sqlDatasets(route: Route, skill: Skill) {
  const seen = new Set<string>();
  const list: { id: string; schema: string }[] = [];
  for (const e of route.exercises) {
    if ((e.kind === 'code' || e.kind === 'fix') && e.setup && e.hiddenSetup && !seen.has(e.setup)) {
      seen.add(e.setup);
      const schema = e.setup.split(/;\s*/).filter((s) => /^\s*CREATE/i.test(s)).join(';\n');
      list.push({ id: e.id, schema: `${schema};\n-- пример данных: ${e.setup.slice(e.setup.search(/INSERT/i), e.setup.search(/INSERT/i) + 300)}…` });
    }
  }
  // Prefer datasets already used by this skill.
  return list.sort((a, b) => Number(b.id.startsWith(skill.id)) - Number(a.id.startsWith(skill.id))).slice(0, 4);
}

type Draft = Exercise & { setupRef?: string };

function prepare(d: Draft, route: Route, skill: Skill, id: string): Exercise {
  const e = { ...d, id, skill: skill.id, tags: [...(d.tags ?? []), 'ai'] } as Draft;
  if (route.lang === 'sql' && (e.kind === 'code' || e.kind === 'fix')) {
    e.lang = 'sql';
    const ref = route.exercises.find((x) => x.id === e.setupRef) as (Exercise & { setup?: string; hiddenSetup?: string }) | undefined;
    if (ref?.setup) { e.setup = ref.setup; e.hiddenSetup = ref.hiddenSetup; }
    delete e.setupRef;
    delete (e as { tests?: unknown }).tests;
  }
  delete (e as { diag?: unknown }).diag; // generated items never enter the placement test
  return e;
}

function promptText(e: Exercise) {
  return `${e.prompt} ${'code' in e ? e.code ?? '' : ''}`.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, ' ');
}
function similar(a: string, b: string) {
  const A = new Set(a.split(' ')), B = new Set(b.split(' '));
  const inter = [...A].filter((x) => B.has(x)).length;
  return inter / Math.max(1, Math.min(A.size, B.size));
}

const REVIEW = `Ты — независимый рецензент учебных заданий. Задание уже прошло автоматическую проверку исполнением (эталонное решение проходит тесты,
стартовый код — нет, вывод predict совпадает). Оцени остальное: однозначна ли формулировка (может ли ученик разумно понять иначе и быть прав),
соответствует ли теме и уровню, верно ли объяснение и подсказки, не выдают ли подсказки решение целиком, корректны ли пояснения why у вариантов,
хороши ли скрытые тесты, нет ли фактических ошибок, грамотный ли русский. Ответ — только JSON:
{"accept": true|false, "score": 1-5, "issues": ["..."]}. accept=true только при score ≥ 4 и отсутствии существенных проблем.`;

async function generateFor(route: Route, skill: Skill, pool: ValidatorPool, existing: Exercise[], startIdx: number) {
  const log: unknown[] = [];
  const accepted: Exercise[] = [];
  let idx = startIdx;
  const kindsHint = route.lang === 'sql' ? 'mcq, code, fix' : 'code, fix, predict, mcq, parsons';
  const ctx = {
    skill: brief(skill),
    existingPrompts: existing.filter((e) => e.skill === skill.id).map((e) => e.prompt.slice(0, 140)),
    formatExamples: examplesOf(route, skill),
    ...(route.lang === 'sql' ? { datasets: sqlDatasets(route, skill) } : {}),
  };
  await Promise.all([MODELS.deepseek, MODELS.minimax].map(async (model) => {
    let drafts: Draft[] = [];
    try {
      drafts = await chatJson<Draft[]>({
        model, system: SYSTEM, maxTokens: 16000, temperature: 0.7,
        user: `Схема:\n${SCHEMA}\n\nПравила среды:\n${LANG_RULES[route.lang]}\n\nТема и контекст:\n${JSON.stringify(ctx, null, 1)}\n\n` +
          `Создай ${PER_MODEL} НОВЫХ задания по этой теме (виды на выбор: ${kindsHint}; сложность 2–3; хотя бы одно code или fix; ` +
          `разнообразь контексты — реальные мини-сценарии). Поле id не нужно.`,
      });
    } catch (e) {
      log.push({ model, error: (e as Error).message });
      return;
    }
    for (const draft of (Array.isArray(drafts) ? drafts : []).slice(0, PER_MODEL + 1)) {
      let cur = draft;
      const id = `${skill.id}.g${idx++}`;
      let problems: string[] = [];
      let rounds = 0;
      for (; rounds < 3; rounds++) {
        const ex = prepare(cur, route, skill, id);
        problems = await pool.validate(ex);
        if (!problems.length) break;
        if (rounds === 2) break;
        try {
          cur = await chatJson<Draft>({
            model, system: SYSTEM, maxTokens: 12000, temperature: 0.2,
            user: `Задание не прошло автоматическую проверку исполнением.\nПроблемы:\n- ${problems.join('\n- ')}\n\nПравила среды:\n${LANG_RULES[route.lang]}\n\n` +
              `Задание:\n${JSON.stringify(cur)}\n\nИсправь задание (а не тесты под неверное решение) и верни ОДИН JSON-объект задания.` +
              (route.lang === 'sql' ? ` Доступные setupRef: ${ctx.datasets?.map((d) => d.id).join(', ')}` : ''),
          });
        } catch {
          break;
        }
      }
      const ex = prepare(cur, route, skill, id);
      if (problems.length) { log.push({ id, model, stage: 'validate', problems, rounds }); continue; }
      const dup = [...existing, ...accepted].find((o) => o.skill === skill.id && similar(promptText(o), promptText(ex)) > 0.8);
      if (dup) { log.push({ id, model, stage: 'duplicate', of: dup.id }); continue; }
      try {
        const verdict = await chatJson<{ accept: boolean; score: number; issues: string[] }>({
          model: otherModel(model), system: REVIEW, maxTokens: 8000, temperature: 0,
          user: `Тема: ${skill.title} (${skill.id}). Уровень сложности задания: ${ex.difficulty}.\nЗадание:\n${JSON.stringify(ex, null, 1)}`,
        });
        if (verdict.accept && verdict.score >= 4) { accepted.push(ex); log.push({ id, model, stage: 'accepted', rounds, score: verdict.score }); }
        else log.push({ id, model, stage: 'review-rejected', score: verdict.score, issues: verdict.issues });
      } catch (e) {
        log.push({ id, model, stage: 'review-error', error: (e as Error).message });
      }
    }
  }));
  return { accepted, log };
}

const pool = new ValidatorPool(Number(process.env.VALIDATORS ?? 3));
const started = Date.now();
const routes = ROUTES.filter((r) => !process.env.ROUTE || r.id === process.env.ROUTE);
const summary: Record<string, { accepted: number; drafted: number }> = {};
await Promise.all(routes.map(async (route) => {
  const file = `${OUT_DIR}/${route.id}.json`;
  const prev: Exercise[] = existsSync(file) ? JSON.parse(readFileSync(file, 'utf8')) : [];
  const skills = route.skills.filter((s) => !process.env.SKILL || s.id === process.env.SKILL);
  const results = await Promise.all(skills.map(async (s) => {
    const used = [...route.exercises, ...prev].filter((e) => e.skill === s.id).map((e) => Number(/\.g(\d+)$/.exec(e.id)?.[1] ?? 0));
    const r = await generateFor(route, s, pool, [...route.exercises, ...prev], Math.max(0, ...used) + 1);
    writeFileSync(`reports/ai-generate/${s.id}.json`, JSON.stringify(r.log, null, 2));
    console.log(`${s.id}: +${r.accepted.length} (${r.log.length} drafts)`);
    return r;
  }));
  const merged = [...prev, ...results.flatMap((r) => r.accepted)];
  writeFileSync(file, JSON.stringify(merged, null, 1) + '\n');
  summary[route.id] = { accepted: results.reduce((n, r) => n + r.accepted.length, 0), drafted: results.reduce((n, r) => n + r.log.length, 0) };
}));
pool.close();
console.log(JSON.stringify({ summary, minutes: ((Date.now() - started) / 60000).toFixed(1), ...stats }));
