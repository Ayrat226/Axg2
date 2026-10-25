// Mode launcher: large animated tiles with live stats; keys 1–7 launch them while no input is focused.
import { useEffect, type CSSProperties, type PointerEvent } from 'react';
import { go } from '../router';

export interface LauncherTile {
  id: string;
  icon: string;
  title: string;
  stat: string;
  sub?: string;
  link: string;
  color: string;
  badge?: number;
  done?: boolean;
}

function typing(t: EventTarget | null) {
  const el = t as HTMLElement | null;
  if (!el || !el.tagName) return false;
  return /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName) || el.isContentEditable || !!el.closest?.('.cm-editor');
}

export function useLauncherKeys(tiles: LauncherTile[]) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || e.repeat) return;
      if (typing(e.target) || document.querySelector('.overlay, [role="dialog"]')) return;
      const i = Number(e.key) - 1;
      if (Number.isInteger(i) && i >= 0 && i < tiles.length) { e.preventDefault(); go(tiles[i].link); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [tiles]);
}

const spot = (e: PointerEvent<HTMLElement>) => {
  const r = e.currentTarget.getBoundingClientRect();
  e.currentTarget.style.setProperty('--mx', `${((e.clientX - r.left) / r.width) * 100}%`);
  e.currentTarget.style.setProperty('--my', `${((e.clientY - r.top) / r.height) * 100}%`);
};

export function LauncherTiles({ tiles, animated }: { tiles: LauncherTile[]; animated: boolean }) {
  useLauncherKeys(tiles);
  return (
    <section className={`launcher ${animated ? 'lt-anim' : ''}`} aria-label="Режимы обучения" data-testid="launcher">
      <div className="launcher-head">
        <h2>Что делаем сегодня?</h2>
        <span className="tiny muted" data-testid="launcher-hint">Клавиши <kbd>1</kbd>–<kbd>{tiles.length}</kbd> запускают режимы</span>
      </div>
      <div className="launcher-grid">
        {tiles.map((t, i) => (
          <button
            key={t.id} className={`lt ${t.done ? 'is-done' : ''}`} style={{ '--tc': t.color, '--i': i } as CSSProperties}
            onClick={() => go(t.link)} onPointerMove={spot} aria-keyshortcuts={String(i + 1)} data-testid={`tile-${t.id}`}
          >
            <span className="lt-top">
              <span className="lt-icon" aria-hidden="true">{t.icon}</span>
              {t.badge ? <span className="lt-badge" aria-label={`${t.badge} ожидает`}>{t.badge}</span> : null}
              <kbd className="lt-key" aria-hidden="true">{i + 1}</kbd>
            </span>
            <span className="lt-title">{t.title}</span>
            <span className="lt-stat" data-testid={`tile-${t.id}-stat`}>{t.done ? '✓ ' : ''}{t.stat}</span>
            {t.sub && <span className="lt-sub">{t.sub}</span>}
          </button>
        ))}
      </div>
    </section>
  );
}
