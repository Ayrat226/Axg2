// Step-by-step Python execution viewer: code with the current line, call stack with locals, output so far.
import { useEffect, useMemo, useRef, useState } from 'react';
import { traceCode } from '../../runner/runner';
import type { TraceResult, TraceStep } from '../../runner/types';
import { useApp } from '../../state/store';
import { motionAllowed } from '../theme';
import { CodeBlock } from './CodeBlock';
import { ErrorExplain } from './ErrorExplain';

const EVENT_LABEL: Record<TraceStep['event'], string> = { line: 'выполняется строка', return: 'возврат из функции', exception: 'исключение' };

/** The step before `idx` that belongs to the same activation of the frame at `depth`. */
function previousInFrame(steps: TraceStep[], idx: number, depth: number): TraceStep | undefined {
  for (let j = idx - 1; j >= 0; j--) {
    if (steps[j].depth < depth) return undefined;
    if (steps[j].depth === depth) return steps[j];
  }
  return undefined;
}

function stackAt(steps: TraceStep[], idx: number): { step: TraceStep; at: number }[] {
  const cur = steps[idx];
  const frames: { step: TraceStep; at: number }[] = [];
  for (let d = 0; d <= cur.depth; d++) {
    for (let j = idx; j >= 0; j--) {
      if (steps[j].depth === d) { frames.push({ step: steps[j], at: j }); break; }
    }
  }
  return frames;
}

export function Visualizer({ code, stdin }: { code: string; stdin?: string[] }) {
  const motion = useApp((s) => s.settings.appearance.motion);
  const [res, setRes] = useState<TraceResult | null>(null);
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(false);
  const host = useRef<HTMLDivElement>(null);
  const stdinKey = (stdin ?? []).join('\n');

  useEffect(() => {
    let alive = true;
    setRes(null);
    setIdx(0);
    setPlaying(false);
    traceCode(code, stdinKey ? stdinKey.split('\n') : []).then((r) => alive && setRes(r));
    return () => { alive = false; };
  }, [code, stdinKey]);

  const steps = res?.steps ?? [];
  const last = steps.length - 1;
  const canPlay = motion !== 'none';
  const delay = motion === 'full' && motionAllowed(motion) ? 600 : 1300;

  useEffect(() => {
    if (!playing) return;
    if (idx >= last) { setPlaying(false); return; }
    const t = setTimeout(() => setIdx((i) => Math.min(last, i + 1)), delay);
    return () => clearTimeout(t);
  }, [playing, idx, last, delay]);

  useEffect(() => {
    host.current?.querySelector('.hl')?.scrollIntoView({ block: 'nearest' });
  }, [idx, res]);

  const step = steps[idx];
  const frames = useMemo(() => (step ? stackAt(steps, idx) : []), [steps, idx, step]);

  const onKey = (e: React.KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); setIdx((i) => Math.min(last, i + 1)); }
    else if (e.key === 'ArrowLeft') { e.preventDefault(); setIdx((i) => Math.max(0, i - 1)); }
  };

  if (!res) return <div className="card flat empty" role="status">Строю трассу выполнения… (Python загрузится при первом запуске)</div>;
  if (!steps.length) {
    return (
      <div className="stack tight" data-testid="visualizer">
        <div className="card flat muted">Нет шагов для показа{res.error ? ' — программа завершилась с ошибкой до первой строки.' : '.'}</div>
        {res.error && <ErrorExplain error={res.error} lang="python" code={code} />}
      </div>
    );
  }

  const shownOut = res.stdout.slice(0, step.out);
  const atEnd = idx === last;
  return (
    <div className="stack" data-testid="visualizer" ref={host} tabIndex={-1} onKeyDown={onKey}>
      <div className="row" role="group" aria-label="Управление шагами">
        <button className="btn sm" onClick={() => { setPlaying(false); setIdx(0); }} disabled={idx === 0} aria-label="В начало">⏮</button>
        <button className="btn sm" onClick={() => { setPlaying(false); setIdx((i) => Math.max(0, i - 1)); }} disabled={idx === 0}>← Назад</button>
        <button
          className="btn sm primary"
          onClick={() => { if (atEnd) setIdx(0); setPlaying((p) => !p); }}
          disabled={!canPlay}
          aria-pressed={playing}
          title={canPlay ? undefined : 'Автовоспроизведение выключено настройкой «Анимации: нет»'}
        >
          {playing ? '⏸ Пауза' : '▶ Играть'}
        </button>
        <button className="btn sm" onClick={() => { setPlaying(false); setIdx((i) => Math.min(last, i + 1)); }} disabled={atEnd}>Вперёд →</button>
        <span className="chip accent" aria-live="polite">Шаг {idx + 1} из {steps.length}</span>
        <span className="tiny muted">Клавиши ← → переключают шаги</span>
      </div>
      <input
        type="range" min={0} max={last} value={idx} aria-label="Шаг выполнения"
        aria-valuetext={`Шаг ${idx + 1} из ${steps.length}, строка ${step.line}`}
        onChange={(e) => { setPlaying(false); setIdx(Number(e.target.value)); }}
      />
      {!canPlay && <div className="tiny muted">Автовоспроизведение отключено настройкой анимаций («нет»). Листайте шаги кнопками или клавишами.</div>}
      <div className="viz">
        <div className="stack tight">
          <div className="small muted">
            Строка {step.line} — {EVENT_LABEL[step.event]}{step.func && step.func !== '<module>' ? ` · ${step.func}()` : ''}
          </div>
          <CodeBlock code={code} lang="python" lines highlightLine={step.line} />
        </div>
        <div className="stack tight">
          <div className="small"><strong>Стек вызовов</strong> <span className="muted">(внизу — текущий кадр)</span></div>
          <div className="frames" aria-label="Стек вызовов">
            {frames.map(({ step: f, at }) => {
              const prev = previousInFrame(steps, at, f.depth);
              const keys = Object.keys(f.locals);
              const current = at === idx;
              return (
                <div className="frame" key={f.depth} style={current ? { borderColor: 'var(--accent)' } : undefined} aria-current={current ? 'step' : undefined}>
                  <div className="small"><strong>{f.func === '<module>' ? 'Глобальная область' : `${f.func}()`}</strong> <span className="tiny muted">· уровень {f.depth}{current ? ' · сейчас здесь' : ''}</span></div>
                  {keys.length === 0 ? (
                    <div className="tiny muted">Переменных пока нет</div>
                  ) : (
                    <table>
                      <tbody>
                        {keys.map((k) => {
                          const changed = !!prev && prev.locals[k] !== f.locals[k];
                          return (
                            <tr key={k}>
                              <td>{k}</td>
                              <td className={changed ? 'changed' : undefined}>
                                {f.locals[k]}
                                {changed && <span className="tiny muted"> ← {k in prev.locals ? 'изменилась' : 'новая'}</span>}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </div>
          {step.event === 'return' && step.ret !== undefined && (
            <div className="chip ok" role="status">Возвращает: <span className="mono">{step.ret}</span></div>
          )}
          <div className="small"><strong>Вывод к этому шагу</strong></div>
          <pre className="output" aria-label="Вывод программы к текущему шагу">{shownOut || <span className="muted">пока ничего не выведено</span>}</pre>
        </div>
      </div>
      {atEnd && res.error && <ErrorExplain error={res.error} lang="python" code={code} />}
    </div>
  );
}
