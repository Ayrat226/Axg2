export interface RunError {
  type: string;
  message: string;
  line: number | null;
  traceback: string;
}

export interface RunResult {
  stdout: string;
  error: RunError | null;
}

export interface TestResult {
  kind: 'expr' | 'stdout' | 'sql';
  hidden: boolean;
  label?: string;
  pass: boolean;
  expr?: string;
  stdin?: string[];
  expected: string;
  actual?: string;
  error?: RunError;
}

export interface TraceStep {
  line: number;
  event: 'line' | 'return' | 'exception';
  func: string;
  depth: number;
  locals: Record<string, string>;
  /** length of stdout produced so far */
  out: number;
  ret?: string;
}

export interface TraceResult {
  steps: TraceStep[];
  stdout: string;
  error: RunError | null;
}

export interface SqlTable {
  columns: string[];
  rows: unknown[][];
}

export interface SqlRunResult {
  tables: SqlTable[];
  error: RunError | null;
}
