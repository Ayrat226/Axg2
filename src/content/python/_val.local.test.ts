// Content pipeline: every lesson example, prediction, reference solution and hidden test is executed
// with the same engines the app uses. A route cannot ship content that contradicts itself.
import { beforeAll, describe, expect, it } from 'vitest';
import { pythonRoute } from './index';
const ROUTES = [pythonRoute];
const ALL_SKILLS = pythonRoute.skills;
const ALL_EXERCISES = pythonRoute.exercises;
import type { Exercise, Route, Skill, TestCase } from '../../core/types';
import { runJs, testJs } from '../../runner/jsHarness';
import { runSql, testSql } from '../../runner/sqlHarness';
import { getPython, getSql, pyRun, pyTest } from '../../../tests/helpers/runtimes';

const norm = (s: string) => s.replace(/\r\n/g, '\n').split('\n').map((l) => l.trimEnd()).join('\n').replace(/\n+$/, '');
const ONLY = process.env.ROUTE; // e.g. ROUTE=py pnpm test:content

beforeAll(async () => { await Promise.all([getPython(), getSql()]); }, 120_000);

async function run(lang: string, code: string) {
  return lang === 'python' ? pyRun(code) : runJs(code);
}
async function test(lang: string, code: string, tests: TestCase[]) {
  return lang === 'python' ? pyTest(code, tests) : testJs(code, tests);
}
function failing(res: { pass: boolean; label?: string; expr?: string; expected: string; actual?: string; error?: { message: string } }[]) {
  return res.filter((r) => !r.pass).map((r) => `${r.expr ?? r.label}: expected ${r.expected}, got ${r.actual ?? r.error?.message}`);
}

describe('content graph', () => {
  it('has unique ids and valid references', () => {
    const skillIds = new Set<string>();
    for (const s of ALL_SKILLS) { expect(skillIds.has(s.id), `dup skill ${s.id}`).toBe(false); skillIds.add(s.id); }
    for (const s of ALL_SKILLS) for (const p of s.prereqs) expect(skillIds.has(p), `${s.id} prereq ${p}`).toBe(true);
    const exIds = new Set<string>();
    for (const e of ALL_EXERCISES) {
      expect(exIds.has(e.id), `dup exercise ${e.id}`).toBe(false);
      exIds.add(e.id);
      expect(skillIds.has(e.skill), `${e.id} skill`).toBe(true);
      expect(e.id.startsWith(e.skill + '.'), `${e.id} prefix`).toBe(true);
    }
  });
  it('prerequisite graph is acyclic', () => {
    const byId = new Map(ALL_SKILLS.map((s) => [s.id, s]));
    const state = new Map<string, number>();
    const visit = (id: string, path: string[]) => {
      if (state.get(id) === 2) return;
      expect(state.get(id), `cycle ${[...path, id].join(' -> ')}`).not.toBe(1);
      state.set(id, 1);
      for (const p of byId.get(id)!.prereqs) visit(p, [...path, id]);
      state.set(id, 2);
    };
    for (const s of ALL_SKILLS) visit(s.id, []);
  });
});

for (const route of ROUTES as Route[]) {
  const prefix = route.skills[0]?.id.split('.')[0];
  describe.skipIf(ONLY && ONLY !== prefix)(`route ${route.id}`, () => {
    it('has enough skills and outcomes', () => {
      expect(route.skills.length).toBeGreaterThanOrEqual(8);
      expect(route.outcomes.length).toBeGreaterThanOrEqual(3);
    });
    for (const skill of route.skills as Skill[]) {
      describe(skill.id, () => {
        const exs = route.exercises.filter((e) => e.skill === skill.id);
        it('is well-formed', () => {
          expect(skill.route).toBe(route.id);
          expect(skill.outcomes.length).toBeGreaterThanOrEqual(2);
          for (const f of ['why', 'brief', 'standard', 'deep'] as const) expect(skill.lesson[f].trim().length, f).toBeGreaterThan(20);
          expect(skill.lesson.example.steps.length).toBeGreaterThanOrEqual(2);
          expect(skill.lesson.pitfalls.length).toBeGreaterThanOrEqual(2);
          expect(skill.misconceptions.length).toBeGreaterThanOrEqual(2);
          expect(exs.length, 'exercises').toBeGreaterThanOrEqual(5);
          const diag = exs.filter((e) => e.diag);
          expect(diag.length, 'diag items').toBeGreaterThanOrEqual(2);
          expect(new Set(diag.map((e) => e.kind)).size, 'diag kinds').toBeGreaterThanOrEqual(2);
          expect(exs.some((e) => e.kind === 'code' || e.kind === 'fix'), 'needs code/fix').toBe(true);
          expect(new Set(exs.map((e) => e.kind)).size, 'kinds').toBeGreaterThanOrEqual(3);
        });
        it('worked example runs as documented', async () => {
          const ex = skill.lesson.example;
          if (ex.lang === 'sql') {
            const r = runSql(await getSql(), ex.setup, ex.code);
            expect(r.error, r.error?.message).toBeNull();
            return;
          }
          const r = await run(ex.lang, ex.code);
          expect(r.error, r.error?.message).toBeNull();
          if (ex.output !== undefined) expect(norm(r.stdout)).toBe(norm(ex.output));
        });
        for (const e of exs as Exercise[]) {
          it(`${e.id} (${e.kind})`, async () => {
            expect(e.prompt.trim().length).toBeGreaterThan(5);
            expect(e.explanation.trim().length).toBeGreaterThan(5);
            const mids = new Set(skill.misconceptions.map((m) => m.id));
            switch (e.kind) {
              case 'mcq': {
                expect(e.options.length).toBeGreaterThanOrEqual(3);
                expect(e.options.filter((o) => o.correct).length).toBe(1);
                for (const o of e.options) {
                  expect(o.why.trim().length).toBeGreaterThan(3);
                  if (o.misconception) expect(mids.has(o.misconception), o.misconception).toBe(true);
                }
                expect(new Set(e.options.map((o) => o.text)).size).toBe(e.options.length);
                break;
              }
              case 'predict': {
                const r = await run(e.lang, e.code);
                expect(r.error, r.error?.message).toBeNull();
                expect(norm(r.stdout)).toBe(norm(e.answer));
                break;
              }
              case 'code':
              case 'fix': {
                expect(e.hints.length).toBeGreaterThanOrEqual(2);
                const attempt = e.kind === 'code' ? e.starter : e.buggy;
                if (e.lang === 'sql') {
                  const SQL = await getSql();
                  const sol = runSql(SQL, e.setup, e.solution + (e.check ? `;\n${e.check}` : ''));
                  expect(sol.error, sol.error?.message).toBeNull();
                  expect(sol.tables.at(-1)?.rows.length ?? 0, 'solution returns rows').toBeGreaterThan(0);
                  expect(e.hiddenSetup, 'hiddenSetup').toBeTruthy();
                  const ok = testSql(SQL, e, e.solution);
                  expect(failing(ok)).toEqual([]);
                  const bad = testSql(SQL, e, attempt);
                  expect(bad.every((r) => r.pass), 'starter/buggy must fail').toBe(false);
                  break;
                }
                const tests = e.tests ?? [];
                expect(tests.length).toBeGreaterThanOrEqual(3);
                const hidden = tests.filter((t) => t.hidden);
                expect(hidden.length, 'hidden tests').toBeGreaterThanOrEqual(1);
                for (const t of hidden) expect(t.label, 'hidden test label').toBeTruthy();
                const ok = await test(e.lang, e.solution, tests);
                expect(failing(ok)).toEqual([]);
                const bad = await test(e.lang, attempt, tests);
                expect(bad.every((r) => r.pass), 'starter/buggy must fail').toBe(false);
                break;
              }
              case 'parsons': {
                expect(e.lines.length).toBeGreaterThanOrEqual(3);
                for (const d of e.distractors ?? []) expect(e.lines).not.toContain(d);
                const code = e.lines.join('\n');
                if (e.tests?.length) expect(failing(await test(e.lang, code, e.tests))).toEqual([]);
                else expect((await run(e.lang, code)).error).toBeNull();
                break;
              }
              case 'explain':
                expect(e.keyPoints.length).toBeGreaterThanOrEqual(2);
                expect(e.modelAnswer.trim().length).toBeGreaterThan(20);
                break;
            }
          });
        }
      });
    }
    for (const project of route.projects) {
      it(`project ${project.id}: every step passes cumulative tests`, async () => {
        expect(project.steps.length).toBeGreaterThanOrEqual(3);
        const all: TestCase[] = [];
        for (const step of project.steps) {
          all.push(...step.tests);
          expect(step.hints.length).toBeGreaterThanOrEqual(1);
          expect(failing(await test(project.lang, step.solution, all)), step.title).toEqual([]);
        }
        const first = await test(project.lang, project.starter, project.steps[0].tests);
        expect(first.every((r) => r.pass)).toBe(false);
      });
    }
  });
}
