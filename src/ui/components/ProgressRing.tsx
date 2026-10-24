export function ProgressRing({ value, size = 64, stroke = 7, color = 'var(--accent)', label, sub }: { value: number; size?: number; stroke?: number; color?: string; label?: string; sub?: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(1, value));
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={`${Math.round(v * 100)}%${sub ? ' ' + sub : ''}`}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--surface-2)" strokeWidth={stroke} />
      <circle
        cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={c} strokeDashoffset={c * (1 - v)} transform={`rotate(-90 ${size / 2} ${size / 2})`}
        style={{ transition: 'stroke-dashoffset 700ms var(--ease)' }}
      />
      <text x="50%" y={sub ? '47%' : '53%'} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.24}>{label ?? `${Math.round(v * 100)}%`}</text>
      {sub && <text x="50%" y="68%" textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.13} style={{ fill: 'var(--text-dim)', fontWeight: 500 }}>{sub}</text>}
    </svg>
  );
}

export function StackBar({ parts }: { parts: { value: number; color: string; label: string }[] }) {
  const total = parts.reduce((s, p) => s + p.value, 0) || 1;
  return (
    <div className="bar" role="img" aria-label={parts.map((p) => `${p.label}: ${p.value}`).join(', ')}>
      {parts.map((p) => <span key={p.label} style={{ width: `${(p.value / total) * 100}%`, background: p.color }} />)}
    </div>
  );
}
