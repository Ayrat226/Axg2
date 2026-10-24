import type {
  BugType, CodeExercise, Difficulty, ExplainExercise, Exercise, FixExercise, McqExercise, McqOption,
  ParsonsExercise, PredictExercise, Skill, TestCase,
} from '../../core/types';

function dedent(raw: string): string {
  const lines = raw.replace(/^\n/, '').replace(/\s+$/, '').split('\n');
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)![0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

/** Python source: dedented, backslashes kept as typed, trailing newline added. */
export function py(s: TemplateStringsArray, ...v: unknown[]): string {
  return dedent(String.raw(s, ...v)) + '\n';
}

/** Markdown: dedented; § stands for a backtick so fences and inline code can live in a template literal. */
export function md(s: TemplateStringsArray, ...v: unknown[]): string {
  return dedent(String.raw(s, ...v)).replace(/§/g, '`');
}

/** Expression test. */
export const t = (expr: string, expect: string): TestCase => ({ expr, expect });
/** Hidden expression test (label is shown on failure). */
export const h = (label: string, expr: string, expect: string): TestCase => ({ expr, expect, hidden: true, label });
/** Program-level test. */
export const io = (stdin: string[], stdout: string, label?: string): TestCase =>
  label ? { stdin, stdout, hidden: true, label } : { stdin, stdout };

export const ok = (text: string, why: string): McqOption => ({ text, correct: true, why });
export const no = (text: string, why: string, misconception?: string): McqOption =>
  misconception ? { text, why, misconception } : { text, why };

type Base = { difficulty: Difficulty; prompt: string; explanation: string; diag?: boolean; tags?: string[] };
type NoId<T> = Omit<T, 'id' | 'skill'>;

export const mcq = (e: Base & { code?: string; options: McqOption[] }): NoId<McqExercise> =>
  ({ kind: 'mcq', lang: 'python', ...e });
export const predict = (e: Base & { code: string; answer: string }): NoId<PredictExercise> =>
  ({ kind: 'predict', lang: 'python', ...e });
export const code = (e: Base & { starter: string; solution: string; tests: TestCase[]; hints: string[] }): NoId<CodeExercise> =>
  ({ kind: 'code', lang: 'python', ...e });
export const fix = (e: Base & { bugType: BugType; buggy: string; solution: string; tests: TestCase[]; hints: string[] }): NoId<FixExercise> =>
  ({ kind: 'fix', lang: 'python', ...e });
export const parsons = (e: Base & { lines: string[]; distractors?: string[]; tests?: TestCase[] }): NoId<ParsonsExercise> =>
  ({ kind: 'parsons', lang: 'python', ...e });
export const explain = (e: Base & { code?: string; keyPoints: string[]; modelAnswer: string }): NoId<ExplainExercise> =>
  ({ kind: 'explain', lang: 'python', ...e });

export function numbered(skillId: string, items: NoId<Exercise>[]): Exercise[] {
  return items.map((e, i) => ({ ...e, id: `${skillId}.${i + 1}`, skill: skillId }) as Exercise);
}

export function defineSkill(s: Omit<Skill, 'route'>): Skill {
  return { route: 'algorithms', ...s };
}
