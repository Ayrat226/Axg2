// Lightweight read-only highlighter (keywords, strings, numbers, comments) for lessons and feedback.
import type { ReactNode } from 'react';
import type { Lang } from '../../core/types';

const KW: Record<Lang, string[]> = {
  python: ['def', 'return', 'if', 'elif', 'else', 'for', 'while', 'in', 'not', 'and', 'or', 'import', 'from', 'as', 'class', 'try', 'except', 'finally', 'raise', 'with', 'lambda', 'yield', 'None', 'True', 'False', 'pass', 'break', 'continue', 'global', 'nonlocal', 'is', 'del', 'assert', 'async', 'await'],
  javascript: ['const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while', 'of', 'in', 'new', 'class', 'extends', 'super', 'this', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'null', 'undefined', 'true', 'false', 'typeof', 'instanceof', 'switch', 'case', 'default', 'break', 'continue', 'static', 'get', 'set', 'yield', 'do'],
  sql: ['SELECT', 'FROM', 'WHERE', 'AND', 'OR', 'NOT', 'IN', 'IS', 'NULL', 'AS', 'JOIN', 'LEFT', 'INNER', 'ON', 'GROUP', 'BY', 'HAVING', 'ORDER', 'ASC', 'DESC', 'LIMIT', 'OFFSET', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MIN', 'MAX', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET', 'DELETE', 'CREATE', 'TABLE', 'PRIMARY', 'KEY', 'WITH', 'CASE', 'WHEN', 'THEN', 'ELSE', 'END', 'BETWEEN', 'LIKE', 'EXISTS', 'OVER', 'PARTITION', 'UNION', 'ALL', 'INDEX', 'REFERENCES', 'FOREIGN', 'UNIQUE', 'DEFAULT', 'CHECK', 'COALESCE'],
};

export function highlight(code: string, lang: Lang): ReactNode[] {
  const kw = new Set(lang === 'sql' ? KW.sql : KW[lang]);
  const comment = lang === 'python' ? '#[^\\n]*' : lang === 'sql' ? '--[^\\n]*' : '//[^\\n]*|/\\*[\\s\\S]*?\\*/';
  const re = new RegExp(`(${comment})|("""[\\s\\S]*?"""|'''[\\s\\S]*?'''|"(?:\\\\.|[^"\\\\\\n])*"|'(?:\\\\.|[^'\\\\\\n])*'|\`(?:\\\\.|[^\`\\\\])*\`)|(\\b\\d+(?:\\.\\d+)?\\b)|([A-Za-z_][\\w]*)(?=\\s*\\()|([A-Za-z_]\\w*)`, 'g');
  const out: ReactNode[] = [];
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    if (m[1]) out.push(<span key={i++} className="tok-com">{m[1]}</span>);
    else if (m[2]) out.push(<span key={i++} className="tok-str">{m[2]}</span>);
    else if (m[3]) out.push(<span key={i++} className="tok-num">{m[3]}</span>);
    else if (m[4]) out.push(kw.has(lang === 'sql' ? m[4].toUpperCase() : m[4]) ? <span key={i++} className="tok-kw">{m[4]}</span> : <span key={i++} className="tok-fn">{m[4]}</span>);
    else if (m[5]) out.push(kw.has(lang === 'sql' ? m[5].toUpperCase() : m[5]) ? <span key={i++} className="tok-kw">{m[5]}</span> : m[5]);
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
}

export function CodeBlock({ code, lang, lines = false, highlightLine }: { code: string; lang: Lang; lines?: boolean; highlightLine?: number }) {
  if (!lines && !highlightLine) return <pre className="code" tabIndex={0}>{highlight(code, lang)}</pre>;
  return (
    <pre className="code" tabIndex={0}>
      {code.split('\n').map((l, i) => (
        <span key={i} className={highlightLine === i + 1 ? 'hl' : undefined}>
          {lines && <span className="ln">{i + 1}</span>}
          {highlight(l, lang)}
          {'\n'}
        </span>
      ))}
    </pre>
  );
}
