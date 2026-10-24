// Executable validation of a single exercise against the same engines the app uses.
// Shared by the content test-suite and the AI generation pipeline (scripts/ai/generate.ts).
import type { Exercise, Skill, TestCase } from '../../src/core/types';
import { runJs, testJs } from '../../src/runner/jsHarness';
import { runSql, testSql } from '../../src/runner/sqlHarness';
import { getSql, pyRun, pyTest } from './runtimes';

export const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n+$/, '');

const run = (lang: string, code: string) => (lang === 'python' ? pyRun(code) : runJs(code));
const test = (lang: string, code: string, tests: TestCase[]) => (lang === 'python' ? pyTest(code, tests) : testJs(code, tests));

function failing(res: { pass: boolean; label?: string; expr?: string; expected: string; actual?: string; error?: { message: string } }[]) {
  return res.filter((r) => !r.pass).map((r) => `${r.expr ?? r.label ?? 'stdout'}: expected ${r.expected}, got ${r.actual ?? r.error?.message}`);
}

/** Returns a list of problems; empty means the exercise is valid. */
export async function validateExercise(e: Exercise, skill: Skill): Promise<string[]> {
  const p: string[] = [];
  const need = (cond: unknown, msg: string) => { if (!cond) p.push(msg); };
  need(e.id.startsWith(`${skill.id}.`), `id must start with "${skill.id}."`);
  need(e.skill === skill.id, 'skill mismatch');
  need([1, 2, 3].includes(e.difficulty), 'difficulty must be 1..3');
  need(typeof e.prompt === 'string' && e.prompt.trim().length > 5, 'prompt too short');
  need(typeof e.explanation === 'string' && e.explanation.trim().length > 5, 'explanation too short');
  if (p.length) return p;
  const mids = new Set(skill.misconceptions.map((m) => m.id));
  try {
    switch (e.kind) {
      case 'mcq': {
        need(Array.isArray(e.options) && e.options.length >= 3, 'mcq needs ≥3 options');
        if (!Array.isArray(e.options)) break;
        need(e.options.filter((o) => o.correct).length === 1, 'mcq needs exactly one correct option');
        for (const o of e.options) {
          need(typeof o.why === 'string' && o.why.trim().length > 3, `option "${o.text}" needs "why"`);
          if (o.misconception) need(mids.has(o.misconception), `unknown misconception id "${o.misconception}"; allowed: ${[...mids].join(', ')}`);
        }
        need(new Set(e.options.map((o) => o.text)).size === e.options.length, 'duplicate option texts');
        break;
      }
      case 'predict': {
        need(e.lang === 'python' || e.lang === 'javascript', 'predict lang must be python|javascript');
        const r = await run(e.lang, e.code);
        need(r.error === null, `code raises ${r.error?.type}: ${r.error?.message}`);
        need(norm(r.stdout) === norm(e.answer), `answer mismatch: actual stdout is ${JSON.stringify(r.stdout)}`);
        break;
      }
      case 'code':
      case 'fix': {
        need(Array.isArray(e.hints) && e.hints.length >= 2, 'needs ≥2 hints');
        const attempt = e.kind === 'code' ? e.starter : e.buggy;
        need(typeof attempt === 'string', e.kind === 'code' ? 'starter missing' : 'buggy missing');
        if (e.lang === 'sql') {
          const SQL = await getSql();
          need(!!e.setup && !!e.hiddenSetup, 'sql needs setup and hiddenSetup');
          const sol = runSql(SQL, e.setup, e.solution + (e.check ? `;\n${e.check}` : ''));
          need(sol.error === null, `solution error: ${sol.error?.message}`);
          need((sol.tables.at(-1)?.rows.length ?? 0) > 0, 'solution returns no rows');
          if (p.length) break;
          const ok = testSql(SQL, e, e.solution);
          for (const f of failing(ok)) p.push(`solution fails: ${f}`);
          const bad = testSql(SQL, e, attempt);
          need(!bad.every((r) => r.pass), 'starter/buggy must fail at least one check');
          break;
        }
        need(e.lang === 'python' || e.lang === 'javascript', 'lang must be python|javascript|sql');
        const tests = e.tests ?? [];
        need(tests.length >= 3, 'needs ≥3 tests');
        const hidden = tests.filter((t) => t.hidden);
        need(hidden.length >= 1, 'needs ≥1 hidden test');
        for (const t of hidden) need(!!t.label, 'hidden tests need a Russian label');
        for (const t of tests) need((t.expr !== undefined && t.expect !== undefined) || t.stdout !== undefined, 'test needs expr+expect or stdout');
        if (p.length) break;
        for (const f of failing(await test(e.lang, e.solution, tests))) p.push(`solution fails: ${f}`);
        const bad = await test(e.lang, attempt, tests);
        need(!bad.every((r) => r.pass), 'starter/buggy must fail at least one test');
        break;
      }
      case 'parsons': {
        need(Array.isArray(e.lines) && e.lines.length >= 3, 'parsons needs ≥3 lines');
        if (!Array.isArray(e.lines)) break;
        for (const d of e.distractors ?? []) need(!e.lines.includes(d), `distractor "${d}" equals a real line`);
        const code = e.lines.join('\n');
        if (e.tests?.length) for (const f of failing(await test(e.lang, code, e.tests))) p.push(`lines fail: ${f}`);
        else need((await run(e.lang, code)).error === null, 'lines raise an error');
        break;
      }
      case 'explain':
        need(Array.isArray(e.keyPoints) && e.keyPoints.length >= 2, 'needs ≥2 keyPoints');
        need(typeof e.modelAnswer === 'string' && e.modelAnswer.trim().length > 20, 'modelAnswer too short');
        break;
      default:
        p.push(`unknown kind ${(e as { kind: string }).kind}`);
    }
  } catch (err) {
    p.push(`validator crashed: ${(err as Error).message}`);
  }
  return p;
}
