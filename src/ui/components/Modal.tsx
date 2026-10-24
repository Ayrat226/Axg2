import { useEffect, useRef, type ReactNode } from 'react';

export function Modal({ title, children, onClose, actions }: { title: string; children: ReactNode; onClose: () => void; actions?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    ref.current?.querySelector<HTMLElement>('button, input, select, textarea')?.focus();
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); prev?.focus(); };
  }, [onClose]);
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal stack" role="dialog" aria-modal="true" aria-label={title} ref={ref}>
        <h2 style={{ margin: 0 }}>{title}</h2>
        {children}
        {actions && <div className="row" style={{ justifyContent: 'flex-end' }}>{actions}</div>}
      </div>
    </div>
  );
}

export function Confetti() {
  const colors = ['var(--accent)', '#22d3ee', '#f472b6', '#facc15', '#22c55e'];
  return (
    <div className="celebrate" aria-hidden="true">
      {Array.from({ length: 60 }, (_, i) => (
        <span key={i} className="confetti" style={{ left: `${(i * 37) % 100}%`, background: colors[i % colors.length], animationDelay: `${(i % 12) * 40}ms`, transform: `rotate(${i * 23}deg)` }} />
      ))}
    </div>
  );
}
