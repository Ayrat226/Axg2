// Cross-model content review: both models review each skill, the *other* model independently verifies every
// serious claim. Only confirmed issues are actionable; each still gets checked by execution/docs before fixing.
// Usage: npx tsx scripts/ai/review.ts            (ROUTE=python|javascript|algorithms|sql to limit)
import { mkdirSync, writeFileSync } from 'node:fs';
import { ROUTES } from '../../src/content';
import type { Skill, Exercise } from '../../src/core/types';
import { MODELS, chatJson, otherModel, stats } from './llm';

const OUT = 'reports/ai-review';
mkdirSync(OUT, { recursive: true });

export interface Issue {
  target: string;
  severity: 'critical' | 'major' | 'minor';
  type: string;
  quote: string;
  problem: string;
  fix: string;
  reviewer?: string;
  verdict?: string;
  verifyReason?: string;
}

const SYSTEM = `Ты — строгий технический редактор учебных курсов по программированию (Python 3.14, JavaScript ES2023, SQLite 3.5x).
Проверяешь урок и задания одной темы на русском языке. ВАЖНО: вывод программ, ответы «predict», эталонные решения и тесты уже
автоматически проверены исполнением кода — НЕ сообщай, что они неверны, если не можешь показать точную причину.
Ищи: фактические/технические ошибки в тексте объяснений, неточные утверждения, MCQ с двумя верными вариантами или неверным "why",
двусмысленные формулировки заданий (ученик может понять иначе и будет прав), объяснения, противоречащие коду, устаревшие сведения,
пропущенные важные граничные случаи, ошибки русского языка, вводящие в заблуждение аналогии. Не придирайся к стилю.
Ответ — только JSON-массив (может быть пустым): [{"target": "lesson" | "<id задания>" | "misconception:<id>", "severity": "critical"|"major"|"minor",
"type": "factual"|"ambiguous"|"multiple_correct"|"wrong_explanation"|"outdated"|"missing_edge_case"|"language"|"pedagogy",
"quote": "точная цитата проблемного места", "problem": "в чём ошибка и почему", "fix": "конкретная исправленная формулировка"}]`;

async function reviewSkill(skill: Skill, exercises: Exercise[], model: string): Promise<Issue[]> {
  const payload = JSON.stringify({ skill: { id: skill.id, title: skill.title, outcomes: skill.outcomes, lesson: skill.lesson, misconceptions: skill.misconceptions }, exercises }, null, 1);
  const issues = await chatJson<Issue[]>({ model, system: SYSTEM, user: `Тема курса:\n${payload}`, maxTokens: 16000, temperature: 0.2 });
  return (Array.isArray(issues) ? issues : []).filter((i) => i && i.problem).map((i) => ({ ...i, reviewer: model }));
}

const VERIFY = `Ты — независимый эксперт. Другой рецензент утверждает, что в учебном материале есть ошибка. Проверь утверждение по существу
(Python 3.14 / JavaScript ES2023 / SQLite). Ответ — только JSON: {"verdict": "confirmed"|"rejected"|"unsure", "reason": "кратко, по существу"}.
"confirmed" — только если ошибка реальна и предложенное исправление делает материал точнее/понятнее.`;

async function verify(skill: Skill, exercises: Exercise[], issue: Issue): Promise<Issue> {
  const ex = exercises.find((e) => e.id === issue.target);
  const ctx = ex ? JSON.stringify(ex) : JSON.stringify({ lesson: skill.lesson, misconceptions: skill.misconceptions });
  const r = await chatJson<{ verdict: string; reason: string }>({
    model: otherModel(issue.reviewer!), system: VERIFY, maxTokens: 8000, temperature: 0,
    user: `Материал:\n${ctx}\n\nУтверждение рецензента:\n${JSON.stringify({ quote: issue.quote, problem: issue.problem, fix: issue.fix })}`,
  });
  return { ...issue, verdict: r.verdict, verifyReason: r.reason };
}

const only = process.env.ROUTE;
const routes = ROUTES.filter((r) => !only || r.id === only);
const started = Date.now();
const all: Record<string, Issue[]> = {};
await Promise.all(routes.flatMap((r) => r.skills.map(async (s) => {
  const exs = r.exercises.filter((e) => e.skill === s.id);
  try {
    const found = (await Promise.all([reviewSkill(s, exs, MODELS.deepseek), reviewSkill(s, exs, MODELS.minimax)])).flat();
    const serious = found.filter((i) => i.severity !== 'minor');
    const checked = await Promise.all(serious.map((i) => verify(s, exs, i).catch(() => ({ ...i, verdict: 'error' }))));
    all[s.id] = [...checked, ...found.filter((i) => i.severity === 'minor')];
    writeFileSync(`${OUT}/${s.id}.json`, JSON.stringify(all[s.id], null, 2));
    console.log(`${s.id}: ${found.length} found, ${checked.filter((i) => i.verdict === 'confirmed').length} confirmed`);
  } catch (e) {
    console.log(`${s.id}: FAILED ${(e as Error).message}`);
  }
})));
const flat = Object.values(all).flat();
console.log(JSON.stringify({ skills: Object.keys(all).length, issues: flat.length, confirmed: flat.filter((i) => i.verdict === 'confirmed').length, rejected: flat.filter((i) => i.verdict === 'rejected').length, minutes: ((Date.now() - started) / 60000).toFixed(1), ...stats }));
