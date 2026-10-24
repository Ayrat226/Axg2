// Content schema. Every field here is checked by tests/content/*.test.ts.

export type Lang = 'python' | 'javascript' | 'sql';
export type Difficulty = 1 | 2 | 3;

export interface Source {
  title: string;
  url: string;
}

/** A typical wrong mental model. MCQ distractors reference these by id. */
export interface Misconception {
  id: string;
  title: string;
  explanation: string;
  fix: string;
}

export interface WorkedExample {
  lang: Lang;
  code: string;
  /** Step-by-step explanation of the example (worked example effect). */
  steps: string[];
  /** Exact expected stdout (python/javascript); verified by content tests. */
  output?: string;
  /** SQL only: schema + data the example runs against. */
  setup?: string;
}

/**
 * Text fields use a small safe markdown subset: paragraphs, **bold**, *italic*,
 * `inline code`, fenced ``` code blocks (```python / ```js / ```sql), "- " lists, "1. " lists, "> " notes.
 */
export interface Lesson {
  /** Why this matters / where it is used (1–3 sentences). */
  why: string;
  /** TL;DR for the "brief" explanation depth. */
  brief: string;
  /** Main explanation for the "standard" depth. */
  standard: string;
  /** Under the hood, edge cases, performance — for the "deep" depth. */
  deep: string;
  analogy?: string;
  example: WorkedExample;
  counterexample?: { lang: Lang; code: string; explain: string };
  pitfalls: string[];
  sources?: Source[];
}

export interface TestCase {
  /** Python/JS: expression evaluated after the learner's code; compared to `expect` by strict deep equality. */
  expr?: string;
  /** Literal in the target language, e.g. "[1, 2]" or "{'a': 1}" or "None". */
  expect?: string;
  /** Program-level test: run the whole program with these input() lines and compare stdout. */
  stdin?: string[];
  stdout?: string;
  /** Hidden tests are not shown before submission; on failure only `label` is shown. */
  hidden?: boolean;
  /** Human description, e.g. "пустой список" — required for hidden tests. */
  label?: string;
}

export interface ExerciseBase {
  /** `${skillId}.${n}` */
  id: string;
  skill: string;
  difficulty: Difficulty;
  prompt: string;
  /** Short, discriminating item usable in the placement diagnostic. */
  diag?: boolean;
  /** Shown after answering: why the right answer is right. */
  explanation: string;
  tags?: string[];
}

export interface McqOption {
  text: string;
  correct?: boolean;
  /** Why this option is right/wrong — shown as feedback. */
  why: string;
  /** Misconception id (from the skill) this distractor reveals. */
  misconception?: string;
}

export interface McqExercise extends ExerciseBase {
  kind: 'mcq';
  code?: string;
  lang?: Lang;
  options: McqOption[];
}

export interface PredictExercise extends ExerciseBase {
  kind: 'predict';
  lang: 'python' | 'javascript';
  code: string;
  /** Exact stdout (verified by running the code). */
  answer: string;
}

interface CodeLike {
  lang: Lang;
  solution: string;
  /** python/javascript */
  tests?: TestCase[];
  /** Hint ladder: from a gentle nudge to almost the solution. At least 2. */
  hints: string[];
  /** SQL: schema+data for the visible dataset. */
  setup?: string;
  /** SQL: a second dataset to defeat hard-coded answers. */
  hiddenSetup?: string;
  /** SQL: compare row order. */
  ordered?: boolean;
  /** SQL for DML tasks: SELECT run after the learner's statements to compare resulting state. */
  check?: string;
}

export interface CodeExercise extends ExerciseBase, CodeLike {
  kind: 'code';
  starter: string;
}

export type BugType = 'syntax' | 'runtime' | 'logic' | 'edge';

export interface FixExercise extends ExerciseBase, CodeLike {
  kind: 'fix';
  buggy: string;
  bugType: BugType;
}

export interface ParsonsExercise extends ExerciseBase {
  kind: 'parsons';
  lang: 'python' | 'javascript';
  /** Correct program, one line per entry, indentation included. */
  lines: string[];
  distractors?: string[];
  tests?: TestCase[];
}

export interface ExplainExercise extends ExerciseBase {
  kind: 'explain';
  code?: string;
  lang?: Lang;
  keyPoints: string[];
  modelAnswer: string;
}

export type Exercise =
  | McqExercise
  | PredictExercise
  | CodeExercise
  | FixExercise
  | ParsonsExercise
  | ExplainExercise;

export type ExerciseKind = Exercise['kind'];

export interface Skill {
  /** `${routePrefix}.${slug}` e.g. "py.loops" */
  id: string;
  route: string;
  title: string;
  icon: string;
  summary: string;
  /** Skill ids (may reference other routes). */
  prereqs: string[];
  /** 1 basics … 4 advanced */
  tier: 1 | 2 | 3 | 4;
  /** "Умею …" statements. */
  outcomes: string[];
  estMinutes: number;
  /** Relevant for interview-prep mode. */
  interview?: boolean;
  lesson: Lesson;
  misconceptions: Misconception[];
}

export interface ProjectStep {
  title: string;
  prompt: string;
  tests: TestCase[];
  hints: string[];
  /** Full cumulative program that passes this step and all previous steps. */
  solution: string;
}

export interface Project {
  id: string;
  route: string;
  title: string;
  summary: string;
  lang: 'python' | 'javascript';
  prereqs: string[];
  starter: string;
  steps: ProjectStep[];
}

export interface Route {
  id: string;
  title: string;
  tagline: string;
  description: string;
  lang: Lang;
  icon: string;
  /** CSS color for the route accent. */
  color: string;
  outcomes: string[];
  skills: Skill[];
  exercises: Exercise[];
  projects: Project[];
}

/** One file per skill in src/content/<route>/ exports a SkillModule. */
export interface SkillModule {
  skill: Skill;
  exercises: Exercise[];
}

export function buildRoute(
  meta: Omit<Route, 'skills' | 'exercises' | 'projects'>,
  modules: SkillModule[],
  projects: Project[] = [],
): Route {
  return { ...meta, skills: modules.map((m) => m.skill), exercises: modules.flatMap((m) => m.exercises), projects };
}
