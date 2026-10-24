// Shared building blocks of the settings screens. Every row carries data-setting=<label> so the search can jump to it.
import { useId, type ReactNode } from 'react';


export function Setting({ labelId, label, hint, children }: { labelId?: string; label: string; hint: string; children: ReactNode }) {
  return (
    <div className="row spread setting-row" data-setting={label} style={{ padding: '10px 0', borderBottom: '1px dashed var(--border)', alignItems: 'flex-start' }}>
      <div className="grow" style={{ minWidth: 220 }}>
        <div id={labelId} style={{ fontWeight: 600 }}>{label}</div>
        <div className="small muted">{hint}</div>
      </div>
      <div style={{ maxWidth: '100%' }}>{children}</div>
    </div>
  );
}

export function SegSetting<T extends string | number>({ label, hint, value, options, onChange }: { label: string; hint: string; value: T; options: readonly (readonly [T, string])[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <Setting labelId={id} label={label} hint={hint}>
      <div className="segmented" role="group" aria-labelledby={id}>
        {options.map(([v, l]) => (
          <button key={String(v)} aria-pressed={v === value} onClick={() => onChange(v)}>{l}</button>
        ))}
      </div>
    </Setting>
  );
}

export function SwitchSetting({ label, hint, checked, onChange }: { label: string; hint: string; checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  const inputId = `${id}-in`;
  return (
    <label className="toggle setting-row" htmlFor={inputId} data-setting={label}>
      <span style={{ display: 'block' }}>
        <span id={id} style={{ display: 'block', fontWeight: 600 }}>{label}</span>
        <span className="small muted" style={{ display: 'block' }}>{hint}</span>
      </span>
      <input id={inputId} type="checkbox" role="switch" aria-labelledby={id} checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
}

export function RangeSetting({ label, hint, value, min, max, step, format, onChange, extra }: { label: string; hint: string; value: number; min: number; max: number; step: number; format: (v: number) => string; onChange: (v: number) => void; extra?: ReactNode }) {
  const id = useId();
  return (
    <Setting labelId={id} label={label} hint={hint}>
      <div style={{ width: 250, maxWidth: '100%' }}>
        <input type="range" min={min} max={max} step={step} value={value} aria-labelledby={id} aria-valuetext={format(value)} onChange={(e) => onChange(Number(e.target.value))} />
        <div className="row spread tiny muted"><span>{format(min)}</span><strong style={{ color: 'var(--text)', fontSize: '0.9rem' }}>{format(value)}</strong><span>{format(max)}</span></div>
        {extra}
      </div>
    </Setting>
  );
}

export function Section({ title, sub, children }: { title: string; sub?: string; children: ReactNode }) {
  return (
    <div className="card setting-row" data-setting={title}>
      <div className="card-title">{title}{sub && <span className="sub">{sub}</span>}</div>
      {children}
    </div>
  );
}

export const pct = (v: number) => `${Math.round(v * 100)}%`;
export const onOff = (v: boolean) => (v ? 'включено' : 'выключено');

