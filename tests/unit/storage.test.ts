import { describe, expect, it } from 'vitest';
import { initialState } from '../../src/core/state';
import { exportState, loadState, parseImport, saveState, STORAGE_KEY, BACKUP_KEY, validateState } from '../../src/core/storage';
import { normalizeSettings, DEFAULT_SETTINGS, mergeSettings, PRESETS, settingsSchema } from '../../src/core/settings';

class Mem implements Storage {
  m = new Map<string, string>();
  get length() { return this.m.size; }
  clear() { this.m.clear(); }
  getItem(k: string) { return this.m.get(k) ?? null; }
  key(i: number) { return [...this.m.keys()][i] ?? null; }
  removeItem(k: string) { this.m.delete(k); }
  setItem(k: string, v: string) { this.m.set(k, v); }
}

describe('storage', () => {
  it('round-trips state', () => {
    const st = new Mem();
    const s = initialState(5);
    s.profile.name = 'Аня';
    expect(saveState(st, s, 100_000).ok).toBe(true);
    expect(loadState(st).state.profile.name).toBe('Аня');
  });
  it('recovers from a corrupted save using the backup', () => {
    const st = new Mem();
    const s = initialState(5);
    s.profile.name = 'backup';
    st.setItem(BACKUP_KEY, JSON.stringify(s));
    st.setItem(STORAGE_KEY, '{"broken": tru');
    const r = loadState(st);
    expect(r.state.profile.name).toBe('backup');
    expect(r.notice).toMatch(/резервная/);
    expect([...st.m.keys()].some((k) => k.includes(':corrupt:'))).toBe(true);
  });
  it('starts fresh (keeping the corrupt copy) when nothing is recoverable', () => {
    const st = new Mem();
    st.setItem(STORAGE_KEY, 'null');
    const r = loadState(st);
    expect(r.state.profile.onboarded).toBe(false);
    expect(r.notice).toBeTruthy();
  });
  it('reports quota errors instead of throwing', () => {
    const st = new Mem();
    st.setItem = () => { throw new Error('QuotaExceededError'); };
    expect(saveState(st, initialState(), 0)).toEqual({ ok: false, error: 'QuotaExceededError' });
  });
  it('export → import round trip with checksum', () => {
    const s = initialState(5);
    s.mistakes.push({ id: '1', t: 1, ex: 'a.1', skill: 'a', category: 'logic', note: 'n' });
    const r = parseImport(exportState(s));
    expect(r.ok && r.summary.checksumOk && r.summary.mistakes).toBe(1);
  });
  it('rejects foreign, malformed and tampered files with a message', () => {
    expect(parseImport('not json').ok).toBe(false);
    expect(parseImport('{"a":1}').ok).toBe(false);
    const bad = JSON.parse(exportState(initialState()));
    bad.state.skills = { x: { p: 7 } };
    const r = parseImport(JSON.stringify(bad));
    expect(r.ok).toBe(false);
    const tampered = JSON.parse(exportState(initialState()));
    tampered.state.profile.name = 'hack';
    const t = parseImport(JSON.stringify(tampered));
    expect(t.ok && t.summary.checksumOk).toBe(false);
  });
  it('rejects data from a newer version', () => {
    expect(validateState({ ...initialState(), version: 99 }).ok).toBe(false);
  });
  it('migrates v0 payloads', () => {
    const old = initialState() as unknown as Record<string, unknown>;
    delete old.calibration; delete old.seen; old.version = 0;
    const r = validateState(old);
    expect(r.ok).toBe(true);
  });
});

describe('settings', () => {
  it('defaults and presets are valid', () => {
    expect(settingsSchema.safeParse(DEFAULT_SETTINGS).success).toBe(true);
    for (const p of PRESETS) expect(settingsSchema.safeParse(mergeSettings(DEFAULT_SETTINGS, p.patch)).success, p.id).toBe(true);
  });
  it('normalize fills missing keys and repairs invalid sections', () => {
    const n = normalizeSettings({ appearance: { theme: 'neon-nonexistent' }, learning: { sessionSize: 8 } });
    expect(n.appearance.theme).toBe(DEFAULT_SETTINGS.appearance.theme);
    expect(n.learning.sessionSize).toBe(8);
  });
  it('dashboard widgets are deduplicated and completed', () => {
    const n = normalizeSettings({ dashboard: { widgets: [{ id: 'plan', visible: false }, { id: 'plan', visible: true }] } });
    expect(n.dashboard.widgets[0]).toEqual({ id: 'plan', visible: false });
    expect(n.dashboard.widgets.length).toBe(DEFAULT_SETTINGS.dashboard.widgets.length);
  });
});
