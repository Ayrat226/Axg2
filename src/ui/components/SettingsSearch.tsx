// Search box over every setting of every tab; picking a result opens its tab and focuses the control.
import { useId, useMemo, useState } from 'react';
import { TAB_TITLE, searchSettings, type SettingEntry } from '../screens/settingsIndex';

export function SettingsSearch({ onPick }: { onPick: (e: SettingEntry) => void }) {
  const [q, setQ] = useState('');
  const id = useId();
  const results = useMemo(() => searchSettings(q), [q]);
  const pick = (e: SettingEntry) => { onPick(e); setQ(''); };
  return (
    <div role="search" className="settings-search" data-testid="settings-search">
      <label htmlFor={id} className="sr-only">Поиск по настройкам</label>
      <input
        id={id} type="search" value={q} placeholder="🔍 Найти настройку: шрифт, подсказки, тема, AI…" autoComplete="off" aria-label="Поиск по настройкам"
        aria-controls={`${id}-res`}
        onChange={(e) => setQ(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && results[0]) { e.preventDefault(); pick(results[0]); }
          if (e.key === 'Escape') setQ('');
        }}
      />
      <div id={`${id}-res`} aria-live="polite">
        {q.trim() && results.length === 0 && <div className="small muted" style={{ padding: '8px 4px' }} data-testid="settings-search-empty">Ничего не найдено. Попробуйте другое слово.</div>}
        {results.length > 0 && (
          <ul className="search-results" aria-label="Результаты поиска">
            {results.map((e) => (
              <li key={`${e.tab}/${e.label}`}>
                <button onClick={() => pick(e)} data-testid="settings-search-result">
                  <span><strong>{e.label}</strong> <span className="chip">{TAB_TITLE[e.tab]}</span></span>
                  <span className="small muted">{e.hint}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
