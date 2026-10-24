import { ROUTES } from '../../src/content';
import { readFileSync } from 'node:fs';
const B = readFileSync('/tmp/hoplite/.llm_base','utf8').trim().replace(/\/$/,''), K = readFileSync('/tmp/hoplite/.llm_key','utf8').trim();
const src = readFileSync('scripts/ai/review.ts','utf8');
const SYSTEM = /const SYSTEM = `([\s\S]*?)`;/.exec(src)![1];
const r = ROUTES[0], s = r.skills[3];
const exs = r.exercises.filter((e) => e.skill === s.id).slice(0, 3);
const user = 'Фрагмент темы курса:\n' + JSON.stringify({ skill: { id: s.id, title: s.title }, exercises: exs }, null, 1);
async function run(model: string, effort: string) {
  const t = Date.now();
  const res = await fetch(B + '/chat/completions', { method: 'POST', headers: { Authorization: 'Bearer ' + K, 'Content-Type': 'application/json' }, body: JSON.stringify({ model, messages: [{ role: 'system', content: SYSTEM }, { role: 'user', content: user }], max_tokens: 16000, reasoning_effort: effort }) });
  const j: any = await res.json();
  const c = j.choices?.[0];
  console.log(model, effort, res.status, ((Date.now() - t) / 1000).toFixed(0) + 's', c?.finish_reason, JSON.stringify(j.usage?.completion_tokens_details), 'content', (c?.message?.content ?? '').length, (c?.message?.content ?? '').slice(0, 300).replace(/\n/g, ' '));
}
await Promise.all([run('free-deepseek-4.1-flash', 'low'), run('free-deepseek-4.1-flash', 'medium'), run('minimax-m3.1-flash', 'low'), run('minimax-m3.1-flash', 'medium'), run('free-deepseek-4.1-flash', 'high')]);
