// Child process: validates exercises sent as JSON lines on stdin. The parent kills it on timeout
// (e.g. an infinite loop in generated code blocks Pyodide synchronously) and starts a fresh one.
import { createInterface } from 'node:readline';
import { SKILL_BY_ID } from '../../src/content';
import { validateExercise } from '../../tests/helpers/validateExercise';
import type { Exercise, Skill } from '../../src/core/types';

const rl = createInterface({ input: process.stdin });
process.stdout.write(JSON.stringify({ ready: true }) + '\n');
for await (const line of rl) {
  const { id, exercise, skill } = JSON.parse(line) as { id: number; exercise: Exercise; skill?: Skill };
  const sk = skill ?? SKILL_BY_ID.get(exercise.skill);
  const problems = sk ? await validateExercise(exercise, sk) : [`unknown skill ${exercise.skill}`];
  process.stdout.write(JSON.stringify({ id, problems }) + '\n');
}
