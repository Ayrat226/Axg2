import { ValidatorPool } from '/tmp/hoplite/workspace/scripts/ai/validatorPool.ts';
import { ALL_EXERCISES } from '/tmp/hoplite/workspace/src/content/index.ts';
const pool = new ValidatorPool(2, 15000);
const t = Date.now();
const ex = ALL_EXERCISES.find((e) => e.kind === 'code' && e.lang === 'python')!;
const hang = { ...ex, solution: 'while True:\n    pass' };
const r = await Promise.all([pool.validate(ex), pool.validate(hang as never), pool.validate(ALL_EXERCISES.find((e) => e.lang === 'sql' && e.kind === 'code')!), pool.validate(ex)]);
console.log(JSON.stringify(r), Date.now() - t, 'ms');
pool.close();
