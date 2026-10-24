// "My profiles": save the current settings under a name and emoji, apply, rename, delete, export and import.
import { useRef, useState } from 'react';
import {
  MAX_USER_PRESETS, PRESET_SECTIONS, SECTION_TITLE, countUserPresetChanges, createUserPreset, parseUserPreset, serializeUserPreset,
  userPresetPatch, userPresetSections, type PresetSection, type UserPreset,
} from '../../core/settings';
import { actions, useApp } from '../../state/store';
import { Section } from './SettingControls';

const EMOJIS = ['⭐', '🚀', '🎯', '📚', '🧠', '🌙', '☕', '🎧', '🔥', '🌿', '🦊', '🛠️'];

function download(name: string, text: string) {
  const url = URL.createObjectURL(new Blob([text], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

const slug = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, '-').replace(/^-|-$/g, '') || 'profile';

export function UserProfiles() {
  const settings = useApp((s) => s.settings);
  const list = settings.userPresets;
  const setList = (next: UserPreset[]) => actions().updateSettings({ userPresets: next });
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState(EMOJIS[0]);
  const [sections, setSections] = useState<PresetSection[]>([...PRESET_SECTIONS]);
  const [renaming, setRenaming] = useState<{ id: string; value: string } | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [importError, setImportError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const full = list.length >= MAX_USER_PRESETS;

  const save = () => {
    if (!title.trim() || !sections.length || full) return;
    const p = createUserPreset(settings, { title, icon, sections });
    setList([...list, p]);
    setTitle('');
    actions().toast(`Профиль «${p.title}» сохранён`, 'success');
  };

  const onImport = async (file: File | undefined) => {
    if (!file) return;
    const res = parseUserPreset(await file.text());
    if (fileRef.current) fileRef.current.value = '';
    if (!res.ok) { setImportError(res.error); return; }
    if (full) { setImportError(`Можно хранить не больше ${MAX_USER_PRESETS} профилей.`); return; }
    setImportError('');
    setList([...list, res.preset]);
    actions().toast(`Профиль «${res.preset.title}» импортирован`, 'success');
  };

  return (
    <Section title="Мои профили" sub="сохраните удачную комбинацию настроек и возвращайтесь к ней в один клик">
      <div className="stack">
        <form className="card flat stack tight" onSubmit={(e) => { e.preventDefault(); save(); }} aria-label="Сохранить текущие настройки как профиль">
          <strong>Сохранить текущие настройки как профиль</strong>
          <div className="row tight" style={{ alignItems: 'flex-end' }}>
            <label className="field grow" style={{ minWidth: 200 }}>
              Название
              <input type="text" value={title} maxLength={40} placeholder="Например, «Вечерний режим»" autoComplete="off" onChange={(e) => setTitle(e.target.value)} data-testid="profile-title" />
            </label>
            <button className="btn primary" type="submit" disabled={!title.trim() || !sections.length || full} data-testid="profile-save">Сохранить профиль</button>
          </div>
          <div className="row tight" role="group" aria-label="Значок профиля">
            <span className="small muted">Значок:</span>
            {EMOJIS.map((em) => (
              <button type="button" key={em} className="btn sm icon" aria-pressed={icon === em} aria-label={`Значок ${em}`} onClick={() => setIcon(em)} style={icon === em ? { outline: '2px solid var(--accent)' } : undefined}>{em}</button>
            ))}
          </div>
          <fieldset className="row tight" style={{ border: 0, padding: 0, margin: 0 }}>
            <legend className="small muted" style={{ padding: 0, marginBottom: 4 }}>Что сохранить:</legend>
            {PRESET_SECTIONS.map((sec) => (
              <label key={sec} className="row tight small" style={{ cursor: 'pointer' }}>
                <input
                  type="checkbox" checked={sections.includes(sec)}
                  onChange={(e) => setSections(e.target.checked ? PRESET_SECTIONS.filter((x) => x === sec || sections.includes(x)) : sections.filter((x) => x !== sec))}
                />
                {SECTION_TITLE[sec]}
              </label>
            ))}
          </fieldset>
          {full && <span className="small" style={{ color: 'var(--warn)' }}>⚠ Достигнут предел: {MAX_USER_PRESETS} профилей. Удалите ненужные.</span>}
        </form>

        {list.length === 0 ? (
          <div className="small muted" data-testid="profiles-empty">Своих профилей пока нет.</div>
        ) : (
          <ul className="stack tight" style={{ listStyle: 'none', margin: 0, padding: 0 }} aria-label="Мои профили">
            {list.map((p) => {
              const n = countUserPresetChanges(p, settings);
              const edit = renaming?.id === p.id ? renaming : null;
              return (
                <li key={p.id} className="card flat" data-testid="user-profile" data-title={p.title}>
                  <div className="row" style={{ alignItems: 'center' }}>
                    <span style={{ fontSize: '1.5rem' }} aria-hidden="true">{p.icon}</span>
                    <div className="grow stack tight" style={{ minWidth: 160 }}>
                      {edit ? (
                        <form className="row tight" onSubmit={(e) => { e.preventDefault(); if (edit.value.trim()) { setList(list.map((x) => (x.id === p.id ? { ...x, title: edit.value.trim().slice(0, 40) } : x))); setRenaming(null); } }}>
                          <input type="text" value={edit.value} maxLength={40} aria-label={`Новое название профиля «${p.title}»`} autoFocus onChange={(e) => setRenaming({ id: p.id, value: e.target.value })} />
                          <button className="btn sm primary" type="submit">Готово</button>
                          <button className="btn sm ghost" type="button" onClick={() => setRenaming(null)}>Отмена</button>
                        </form>
                      ) : <strong>{p.title}</strong>}
                      <span className="tiny muted">{userPresetSections(p).map((s) => SECTION_TITLE[s]).join(' · ')}</span>
                    </div>
                    <span className={`chip ${n === 0 ? 'ok' : ''}`}>{n === 0 ? '✓ Применён' : `Изменит: ${n}`}</span>
                    <button className="btn sm primary" onClick={() => { actions().updateSettings(userPresetPatch(p)); actions().toast(`Применён профиль «${p.title}»`, 'success'); }} aria-label={`Применить профиль «${p.title}»`}>Применить</button>
                    <button className="btn sm" onClick={() => setRenaming({ id: p.id, value: p.title })} aria-label={`Переименовать профиль «${p.title}»`}>Переименовать</button>
                    <button className="btn sm" onClick={() => download(`learnlab-profile-${slug(p.title)}.json`, serializeUserPreset(p))} aria-label={`Экспортировать профиль «${p.title}»`}>Экспорт</button>
                    {deleting === p.id ? (
                      <>
                        <button className="btn sm danger" onClick={() => { setList(list.filter((x) => x.id !== p.id)); setDeleting(null); }} aria-label={`Подтвердить удаление профиля «${p.title}»`}>Да, удалить</button>
                        <button className="btn sm ghost" onClick={() => setDeleting(null)}>Нет</button>
                      </>
                    ) : (
                      <button className="btn sm danger" onClick={() => setDeleting(p.id)} aria-label={`Удалить профиль «${p.title}»`}>Удалить</button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        <div className="row tight">
          <label className="btn sm" style={{ cursor: 'pointer', position: 'relative', overflow: 'hidden' }}>
            Импортировать профиль (JSON)
            <input ref={fileRef} type="file" accept="application/json,.json" data-testid="profile-import" style={{ position: 'absolute', width: 1, height: 1, opacity: 0 }} onChange={(e) => void onImport(e.target.files?.[0])} />
          </label>
          <span className="tiny muted">Файл проверяется: неизвестные настройки отбрасываются, недопустимые значения — отклоняются.</span>
        </div>
        {importError && <div className="card feedback bad small" role="alert" data-testid="profile-import-error">⚠ {importError}</div>}
      </div>
    </Section>
  );
}
