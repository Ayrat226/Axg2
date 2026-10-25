// Ctrl+K command palette: jump to any screen, route, skill, or toggle common settings.
import { useEffect, useMemo, useRef, useState } from 'react';
import { ALL_SKILLS, ROUTES } from '../../content';
import { NAV, SETTINGS_NAV } from '../nav';
import { go } from '../router';
import { actions } from '../../state/store';
import { PRESETS, THEMES, THEME_INFO } from '../../core/settings';

interface Cmd {
  id: string;
  icon: string;
  title: string;
  hint: string;
  run: () => void;
}

export function CommandPalette({ onClose }: { onClose: () => void }) {
  const [q, setQ] = useState('');
  const [sel, setSel] = useState(0);
  const input = useRef<HTMLInputElement>(null);
  const cmds = useMemo<Cmd[]>(() => [
    ...[...NAV, SETTINGS_NAV].map((n) => ({ id: n.path, icon: n.icon, title: n.label, hint: 'Перейти', run: () => go(n.path) })),
    ...ROUTES.map((r) => ({ id: `r-${r.id}`, icon: r.icon, title: `Маршрут: ${r.title}`, hint: 'Маршрут', run: () => go(`/route/${r.id}`) })),
    ...ROUTES.map((r) => ({ id: `b-${r.id}`, icon: '🐞', title: `Охота на баги: ${r.title}`, hint: 'Найти ошибку в коде', run: () => go(`/bughunt/${r.id}`) })),
    ...ROUTES.map((r) => ({ id: `d-${r.id}`, icon: '🩺', title: `Диагностика: ${r.title}`, hint: 'Проверить знания', run: () => go(`/diag/${r.id}`) })),
    ...ALL_SKILLS.map((s) => ({ id: `s-${s.id}`, icon: s.icon, title: s.title, hint: `Урок · ${ROUTES.find((r) => r.id === s.route)?.title}`, run: () => go(`/skill/${s.id}`) })),
    ...THEMES.map((t) => ({ id: `t-${t}`, icon: '🎨', title: `Тема: ${THEME_INFO[t]}`, hint: 'Оформление', run: () => actions().updateSettings({ appearance: { theme: t } }) })),
    ...PRESETS.map((p) => ({ id: `p-${p.id}`, icon: p.icon, title: `Профиль обучения: ${p.title}`, hint: 'Настройки', run: () => actions().applyPreset(p.id) })),
    { id: 'motion', icon: '🌀', title: 'Отключить анимации', hint: 'Доступность', run: () => actions().updateSettings({ appearance: { motion: 'none' } }) },
    { id: 'export', icon: '💾', title: 'Экспорт данных', hint: 'Данные', run: () => go('/settings/data') },
  ], []);
  const norm = q.trim().toLowerCase();
  const list = (norm ? cmds.filter((c) => `${c.title} ${c.hint}`.toLowerCase().includes(norm)) : cmds.slice(0, 12)).slice(0, 40);
  useEffect(() => input.current?.focus(), []);
  useEffect(() => setSel(0), [q]);
  const exec = (c?: Cmd) => { if (!c) return; onClose(); c.run(); };
  return (
    <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="palette" role="dialog" aria-modal="true" aria-label="Команды и поиск">
        <input
          ref={input} type="search" placeholder="Найти тему, экран, настройку…" value={q} aria-label="Поиск команд"
          role="combobox" aria-expanded="true" aria-controls="palette-list" aria-activedescendant={list[sel] ? `cmd-${sel}` : undefined}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'ArrowDown') { e.preventDefault(); setSel((s) => Math.min(list.length - 1, s + 1)); }
            else if (e.key === 'ArrowUp') { e.preventDefault(); setSel((s) => Math.max(0, s - 1)); }
            else if (e.key === 'Enter') exec(list[sel]);
            else if (e.key === 'Escape') onClose();
          }}
        />
        <ul id="palette-list" role="listbox">
          {list.map((c, i) => (
            <li key={c.id}>
              <button id={`cmd-${i}`} role="option" aria-selected={i === sel} onMouseEnter={() => setSel(i)} onClick={() => exec(c)}>
                <span aria-hidden="true">{c.icon}</span>
                <span className="grow">{c.title}</span>
                <span className="tiny muted">{c.hint}</span>
              </button>
            </li>
          ))}
          {!list.length && <li className="empty small">Ничего не найдено</li>}
        </ul>
      </div>
    </div>
  );
}
