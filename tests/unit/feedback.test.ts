import { describe, expect, it } from 'vitest';
import { explainError, explainWrongResult, shape } from '../../src/core/feedback';

const err = (type: string, message: string, line: number | null = 2) => ({ type, message, line, traceback: '' });

describe('error explanations', () => {
  it('maps common Python errors to specific causes', () => {
    expect(explainError(err('TypeError', 'can only concatenate str (not "int") to str'), 'python', 'a\nprint("x" + 1)').causes.join(' ')).toMatch(/input\(\)/);
    expect(explainError(err('NameError', "name 'totl' is not defined. Did you mean: 'total'?"), 'python', 'total = 1\nprint(totl)').causes[0]).toMatch(/total/);
    expect(explainError(err('AttributeError', "'list' object has no attribute 'push'"), 'python', '').causes.join(' ')).toMatch(/append/);
    expect(explainError(err('TypeError', "'NoneType' object is not subscriptable"), 'python', '').causes.join(' ')).toMatch(/None/);
    expect(explainError(err('IndexError', 'list index out of range'), 'python', '').category).toBe('edge');
    expect(explainError(err('SyntaxError', "expected ':'"), 'python', '').title).toMatch(/двоеточие/);
  });
  it('maps JavaScript and SQL errors', () => {
    expect(explainError(err('TypeError', "Cannot read properties of undefined (reading 'name')"), 'javascript', '').category).toBe('edge');
    expect(explainError(err('TypeError', 'arr.append is not a function'), 'javascript', '').causes.join(' ')).toMatch(/push/);
    expect(explainError(err('ReferenceError', "Cannot access 'x' before initialization"), 'javascript', '').title).toMatch(/TDZ/);
    expect(explainError(err('SQLError', 'misuse of aggregate: COUNT()'), 'sql', '').steps.join(' ')).toMatch(/HAVING/);
    expect(explainError(err('SQLError', 'no such column: totl'), 'sql', '').title).toMatch(/totl/);
  });
  it('explains timeouts and unknown errors without crashing', () => {
    expect(explainError(err('Timeout', 'x'), 'python', '').category).toBe('timeout');
    expect(explainError(err('WeirdError', 'boom'), 'python', 'a\nb').snippet).toBe('b');
  });
  it('diagnoses wrong results', () => {
    const base = { kind: 'expr' as const, hidden: false, pass: false, expr: 'f(3)' };
    expect(explainWrongResult({ ...base, expected: '6', actual: 'None' }, 'python', 'def f(x):\n    print(x*2)').title).toMatch(/не возвращает/);
    expect(explainWrongResult({ ...base, expected: '6', actual: '5' }, 'python', '').title).toMatch(/единицу/);
    expect(explainWrongResult({ ...base, expected: '5', actual: "'5'" }, 'python', '').title).toMatch(/тип/);
    expect(explainWrongResult({ ...base, expected: '[1, 2, 3]', actual: '[3, 2, 1]' }, 'python', '').title).toMatch(/порядок/);
    expect(explainWrongResult({ ...base, hidden: true, label: 'пустой список', expected: '0', actual: '1' }, 'python', '').category).toBe('edge');
    expect(explainWrongResult({ kind: 'stdout', hidden: false, pass: false, expected: 'a b', actual: 'a  b' }, 'python', '').title).toMatch(/пробелы/);
    expect(explainWrongResult({ kind: 'sql', hidden: false, pass: false, expected: 'a\n1\n2', actual: 'a\n1\n2\n3' }, 'sql', '').causes.join(' ')).toMatch(/Лишние/);
  });
  it('shapes output by depth and tone', () => {
    const e = explainError(err('IndexError', 'list index out of range'), 'python', '');
    const brief = shape(e, { depth: 'brief', tone: 'neutral', showTerms: false });
    const deep = shape(e, { depth: 'deep', tone: 'socratic', showTerms: true });
    expect(brief.steps.length).toBe(1);
    expect(brief.term).toBeUndefined();
    expect(deep.steps.length).toBeGreaterThan(1);
    expect(deep.questions.length).toBeGreaterThan(0);
    expect(deep.stepsCollapsed).toBe(true);
    expect(deep.term).toBeTruthy();
  });
});
