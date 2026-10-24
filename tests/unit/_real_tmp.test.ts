import { readFileSync } from 'node:fs';
import { it } from 'vitest';
import { chat, listModels } from '../../src/ai/client';
import { hintMessages } from '../../src/ai/prompts';
import { guardReply } from '../../src/ai/guardrails';

const baseUrl = readFileSync('/tmp/hoplite/.llm_base', 'utf8').trim();
const apiKey = readFileSync('/tmp/hoplite/.llm_key', 'utf8').trim();
it('real', async () => {
  const out: string[] = [];
  for (const model of ['free-deepseek-4.1-flash', 'minimax-m3.1-flash']) {
    try {
      const r = await chat({ enabled: true, baseUrl, apiKey, model }, hintMessages({ prompt: 'Напишите функцию total(items), возвращающую сумму списка.', lang: 'python', code: 'def total(items):\n    pass', used: 0, shownHints: [] }), { timeoutMs: 120000 });
      const g = guardReply(r.text, { reference: ['def total(items):\n    return sum(items)'] });
      out.push(`${model}: ok ${r.ms}ms model=${r.model} len=${r.text.length} think=${/<think/i.test(r.text)} filtered=${g.filtered}\n---\n${r.text.slice(0, 500)}`);
    } catch (e) { out.push(`${model}: ERR ${(e as Error).message}`); }
  }
  try { const m = await listModels({ baseUrl, apiKey }); out.push(`models: ${m.length} e.g. ${m.slice(0, 6).join(', ')}`); } catch (e) { out.push(`models ERR ${(e as Error).message}`); }
  console.log(out.join('\n\n'));
}, 300000);
