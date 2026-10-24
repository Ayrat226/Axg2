import type { Exercise, Skill } from '../../src/core/types';

const lesson = { why: 'w'.repeat(30), brief: 'b'.repeat(30), standard: 's'.repeat(30), deep: 'd'.repeat(30), example: { lang: 'python' as const, code: 'print(1)', steps: ['a', 'b'] }, pitfalls: ['p', 'q'] };
export function skill(id: string, prereqs: string[] = [], tier: 1 | 2 | 3 | 4 = 1): Skill {
  return { id, route: 't', title: id, icon: '•', summary: id, prereqs, tier, outcomes: ['a', 'b'], estMinutes: 10, lesson, misconceptions: [] };
}
export function mcq(id: string, skillId: string, diag = true): Exercise {
  return { id, skill: skillId, kind: 'mcq', difficulty: 1, prompt: 'q?', diag, explanation: 'e', options: [{ text: 'a', correct: true, why: 'y' }, { text: 'b', why: 'n' }, { text: 'c', why: 'n' }, { text: 'd', why: 'n' }] };
}
export function code(id: string, skillId: string, difficulty: 1 | 2 | 3 = 2, diag = true): Exercise {
  return { id, skill: skillId, kind: 'code', difficulty, prompt: 'write', diag, explanation: 'e', lang: 'python', starter: '', solution: '', tests: [], hints: ['h1', 'h2'] };
}
export function predict(id: string, skillId: string): Exercise {
  return { id, skill: skillId, kind: 'predict', difficulty: 1, prompt: 'p', explanation: 'e', lang: 'python', code: 'print(1)', answer: '1' };
}

// a → b → c → d (chain) plus e depending on a
export const CHAIN: Skill[] = [skill('t.a'), skill('t.b', ['t.a']), skill('t.c', ['t.b'], 2), skill('t.d', ['t.c'], 3), skill('t.e', ['t.a'], 2)];
export const POOL: Exercise[] = CHAIN.flatMap((s) => [mcq(`${s.id}.1`, s.id), code(`${s.id}.2`, s.id), predict(`${s.id}.3`, s.id)]);
