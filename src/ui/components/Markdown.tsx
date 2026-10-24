// Safe markdown subset renderer: builds React elements, never injects HTML.
import { Fragment, type ReactNode } from 'react';
import { CodeBlock } from './CodeBlock';
import type { Lang } from '../../core/types';

function inline(text: string, key = 0): ReactNode[] {
  const out: ReactNode[] = [];
  const re = /(`[^`]+`|\*\*[^*]+\*\*|\*[^*\s][^*]*\*|\[[^\]]+\]\(https?:[^)\s]+\))/g;
  let last = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    const t = m[0];
    const k = `${key}-${i++}`;
    if (t.startsWith('`')) out.push(<code key={k}>{t.slice(1, -1)}</code>);
    else if (t.startsWith('**')) out.push(<strong key={k}>{inline(t.slice(2, -2), i)}</strong>);
    else if (t.startsWith('[')) {
      const mm = /\[([^\]]+)\]\(([^)]+)\)/.exec(t)!;
      out.push(<a key={k} href={mm[2]} target="_blank" rel="noreferrer noopener">{mm[1]}</a>);
    } else out.push(<em key={k}>{inline(t.slice(1, -1), i)}</em>);
    last = m.index + t.length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

export function Inline({ text }: { text: string }) {
  return <>{inline(text)}</>;
}

const LANGS: Record<string, Lang> = { python: 'python', py: 'python', js: 'javascript', javascript: 'javascript', sql: 'sql' };

export function Markdown({ text, className = '' }: { text: string; className?: string }) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const blocks: ReactNode[] = [];
  let i = 0;
  let k = 0;
  while (i < lines.length) {
    const line = lines[i];
    const fence = /^```(\w*)/.exec(line);
    if (fence) {
      const body: string[] = [];
      i++;
      while (i < lines.length && !/^```/.test(lines[i])) body.push(lines[i++]);
      i++;
      blocks.push(<CodeBlock key={k++} code={body.join('\n')} lang={LANGS[fence[1]] ?? 'python'} />);
      continue;
    }
    if (/^\s*[-*] /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*[-*] /.test(lines[i])) items.push(lines[i++].replace(/^\s*[-*] /, ''));
      blocks.push(<ul key={k++}>{items.map((t, j) => <li key={j}>{inline(t, j)}</li>)}</ul>);
      continue;
    }
    if (/^\s*\d+\. /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^\s*\d+\. /.test(lines[i])) items.push(lines[i++].replace(/^\s*\d+\. /, ''));
      blocks.push(<ol key={k++}>{items.map((t, j) => <li key={j}>{inline(t, j)}</li>)}</ol>);
      continue;
    }
    if (/^> /.test(line)) {
      const items: string[] = [];
      while (i < lines.length && /^> /.test(lines[i])) items.push(lines[i++].slice(2));
      blocks.push(<blockquote key={k++}>{inline(items.join(' '))}</blockquote>);
      continue;
    }
    if (/^#{1,4} /.test(line)) {
      blocks.push(<p key={k++}><strong>{inline(line.replace(/^#+ /, ''))}</strong></p>);
      i++;
      continue;
    }
    if (!line.trim()) { i++; continue; }
    const para: string[] = [];
    while (i < lines.length && lines[i].trim() && !/^(```|\s*[-*] |\s*\d+\. |> |#{1,4} )/.test(lines[i])) para.push(lines[i++]);
    blocks.push(<p key={k++}>{para.map((p, j) => <Fragment key={j}>{j > 0 && <br />}{inline(p, j)}</Fragment>)}</p>);
  }
  return <div className={`md ${className}`}>{blocks}</div>;
}
