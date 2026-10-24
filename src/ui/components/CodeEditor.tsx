// CodeMirror 6 wrapper configured from learner settings.
import { useEffect, useRef } from 'react';
import { EditorState, Compartment, StateEffect, StateField, type Extension } from '@codemirror/state';
import { EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, Decoration, type DecorationSet } from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, indentOnInput, indentUnit, syntaxHighlighting, defaultHighlightStyle } from '@codemirror/language';
import { closeBrackets, closeBracketsKeymap } from '@codemirror/autocomplete';
import { python } from '@codemirror/lang-python';
import { javascript } from '@codemirror/lang-javascript';
import { sql, SQLite } from '@codemirror/lang-sql';
import { oneDark } from '@codemirror/theme-one-dark';
import type { Lang } from '../../core/types';
import { useApp } from '../../state/store';
import { isDarkTheme } from '../theme';

const setMarks = StateEffect.define<{ line: number; cls: string }[]>();
const marks = StateField.define<DecorationSet>({
  create: () => Decoration.none,
  update(value, tr) {
    value = value.map(tr.changes);
    for (const e of tr.effects) {
      if (e.is(setMarks)) {
        const doc = tr.state.doc;
        value = Decoration.set(
          e.value.filter((m) => m.line >= 1 && m.line <= doc.lines).map((m) => Decoration.line({ class: m.cls }).range(doc.line(m.line).from)),
          true,
        );
      }
    }
    return value;
  },
  provide: (f) => EditorView.decorations.from(f),
});

const langExt = (l: Lang) => (l === 'python' ? python() : l === 'javascript' ? javascript() : sql({ dialect: SQLite, upperCaseKeywords: true }));

interface Props {
  value: string;
  onChange?: (v: string) => void;
  lang: Lang;
  onRun?: () => void;
  readOnly?: boolean;
  errorLine?: number | null;
  traceLine?: number | null;
  minHeight?: number;
  ariaLabel?: string;
}

export function CodeEditor({ value, onChange, lang, onRun, readOnly, errorLine, traceLine, minHeight = 160, ariaLabel = 'Редактор кода' }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const view = useRef<EditorView | null>(null);
  const conf = useRef(new Compartment());
  const cbs = useRef({ onChange, onRun });
  cbs.current = { onChange, onRun };
  const ed = useApp((s) => s.settings.editor);
  const theme = useApp((s) => s.settings.appearance.theme);
  const dark = isDarkTheme(theme);

  const configure = (): Extension => [
    ed.lineNumbers ? [lineNumbers(), highlightActiveLineGutter()] : [],
    ed.highlightLine ? highlightActiveLine() : [],
    ed.wordWrap ? EditorView.lineWrapping : [],
    ed.autoClose ? closeBrackets() : [],
    indentUnit.of(' '.repeat(lang === 'python' ? 4 : ed.tabSize)),
    EditorState.tabSize.of(ed.tabSize),
    langExt(lang),
    dark ? oneDark : syntaxHighlighting(defaultHighlightStyle),
    EditorView.theme({
      '&': { fontSize: `${ed.fontSize}px`, backgroundColor: 'var(--code-bg)' },
      '.cm-content': { fontFamily: 'var(--font-code)', minHeight: `${minHeight}px` },
      '.cm-gutters': { backgroundColor: 'var(--code-bg)', borderRight: '1px solid var(--border)' },
      '.cm-scroller': { fontFamily: 'var(--font-code)' },
    }),
    EditorState.readOnly.of(!!readOnly),
    EditorView.editable.of(!readOnly),
  ];

  useEffect(() => {
    const runKey = ed.runShortcut === 'mod-enter' ? 'Mod-Enter' : 'Shift-Enter';
    const v = new EditorView({
      parent: host.current!,
      state: EditorState.create({
        doc: value,
        extensions: [
          history(),
          drawSelection(),
          indentOnInput(),
          bracketMatching(),
          marks,
          keymap.of([{ key: runKey, preventDefault: true, run: () => { cbs.current.onRun?.(); return true; } }, ...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, indentWithTab]),
          EditorView.updateListener.of((u) => { if (u.docChanged) cbs.current.onChange?.(u.state.doc.toString()); }),
          EditorView.contentAttributes.of({ 'aria-label': ariaLabel }),
          conf.current.of(configure()),
        ],
      }),
    });
    view.current = v;
    return () => v.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ed.runShortcut]);

  useEffect(() => {
    view.current?.dispatch({ effects: conf.current.reconfigure(configure()) });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ed, dark, lang, readOnly, minHeight]);

  useEffect(() => {
    const v = view.current;
    if (v && v.state.doc.toString() !== value) v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: value } });
  }, [value]);

  useEffect(() => {
    const m: { line: number; cls: string }[] = [];
    if (errorLine) m.push({ line: errorLine, cls: 'cm-errline' });
    if (traceLine) m.push({ line: traceLine, cls: 'cm-traceline' });
    view.current?.dispatch({ effects: setMarks.of(m) });
  }, [errorLine, traceLine, value]);

  return <div className="editor-wrap" ref={host} data-testid="code-editor" />;
}
