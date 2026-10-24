import { useStore } from '../../state/store';

export function Toasts() {
  const toasts = useStore((s) => s.toasts);
  const dismiss = useStore((s) => s.dismiss);
  return (
    <div className="toasts" role="status" aria-live="polite">
      {toasts.map((t) => (
        <div key={t.id} className={`toast ${t.tone}`}>
          <span className="grow">{t.text}</span>
          <button className="btn ghost sm" onClick={() => dismiss(t.id)} aria-label="Закрыть уведомление">✕</button>
        </div>
      ))}
    </div>
  );
}
