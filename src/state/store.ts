import { create } from 'zustand';
import { applyEvidence, newSkillState, type Confidence, type EvidenceSource } from '../core/model';
import { initialState, dayKey, type AppState, type MistakeCategory, type ProjectState } from '../core/state';
import { mergeSettings, normalizeSettings, PRESETS, DEFAULT_SETTINGS, type GoalMode, type SettingsPatch } from '../core/settings';
import { loadState, saveState } from '../core/storage';
import { answerQuestion, startDiagnostic, type DiagAnswer, type DiagLength, type SelfLevel } from '../core/diagnostic';
import type { ExerciseKind } from '../core/types';
import { ALL_SKILLS, EXERCISE_BY_ID, SKILL_BY_ID } from '../content';

export interface AnswerInput {
  ex: string;
  kind: ExerciseKind;
  correct: boolean;
  hints: number;
  revealed: boolean;
  confidence?: Confidence;
  ms?: number;
  source: EvidenceSource;
  mistake?: { category: MistakeCategory; errType?: string; misconception?: string; note: string };
}

interface Toast {
  id: number;
  text: string;
  tone: 'info' | 'success' | 'warn' | 'error';
}

interface Store {
  s: AppState;
  toasts: Toast[];
  saveError?: string;
  toast(text: string, tone?: Toast['tone']): void;
  dismiss(id: number): void;
  update(fn: (s: AppState) => AppState): void;
  updateSettings(patch: SettingsPatch): void;
  applyPreset(id: string): void;
  resetSettings(): void;
  setProfile(p: Partial<AppState['profile']>): void;
  startRoute(route: string, goal?: GoalMode): void;
  setRouteGoal(route: string, goal: GoalMode): void;
  markLesson(skill: string): void;
  recordAnswer(a: AnswerInput): void;
  setClaimed(skill: string, known: boolean): void;
  setDraft(ex: string, code: string): void;
  resolveMistake(id: string): void;
  diagStart(route: string, level: SelfLevel, length: DiagLength): void;
  diagAnswer(a: DiagAnswer): void;
  diagFinish(overrides: Record<string, boolean>): void;
  diagCancel(): void;
  projectSave(id: string, patch: Partial<ProjectState>): void;
  importState(s: AppState): void;
  resetAll(): void;
}

const storage = typeof localStorage !== 'undefined' ? localStorage : undefined;
const loaded = storage ? loadState(storage) : { state: initialState() };
let toastSeq = 0;

export const useStore = create<Store>((set, get) => ({
  s: loaded.state,
  toasts: loaded.notice ? [{ id: ++toastSeq, text: loaded.notice, tone: 'warn' }] : [],
  toast(text, tone = 'info') {
    const id = ++toastSeq;
    set((st) => ({ toasts: [...st.toasts.slice(-3), { id, text, tone }] }));
    setTimeout(() => get().dismiss(id), tone === 'error' ? 9000 : 4500);
  },
  dismiss(id) {
    set((st) => ({ toasts: st.toasts.filter((t) => t.id !== id) }));
  },
  update(fn) {
    set((st) => ({ s: fn(st.s) }));
  },
  updateSettings(patch) {
    get().update((s) => ({ ...s, settings: normalizeSettings(mergeSettings(s.settings, patch)) }));
  },
  applyPreset(id) {
    const p = PRESETS.find((x) => x.id === id);
    if (!p) return;
    get().updateSettings(p.patch);
    get().toast(`Применён профиль «${p.title}»`, 'success');
  },
  resetSettings() {
    get().update((s) => ({ ...s, settings: structuredClone(DEFAULT_SETTINGS) }));
  },
  setProfile(p) {
    get().update((s) => ({ ...s, profile: { ...s.profile, ...p } }));
  },
  startRoute(route, goal) {
    get().update((s) => ({
      ...s,
      profile: { ...s.profile, activeRoute: route },
      routes: { ...s.routes, [route]: s.routes[route] ? { ...s.routes[route], goal: goal ?? s.routes[route].goal } : { startedAt: Date.now(), goal: goal ?? s.settings.learning.goal } },
    }));
  },
  setRouteGoal(route, goal) {
    get().update((s) => ({ ...s, routes: { ...s.routes, [route]: { ...(s.routes[route] ?? { startedAt: Date.now() }), goal } } }));
  },
  markLesson(skill) {
    get().update((s) => {
      const st = s.skills[skill] ?? newSkillState();
      return st.lessonAt ? s : { ...s, skills: { ...s.skills, [skill]: { ...st, lessonAt: Date.now() } } };
    });
  },
  recordAnswer(a) {
    const ex = EXERCISE_BY_ID.get(a.ex);
    if (!ex) return;
    const now = Date.now();
    get().update((s) => {
      const L = s.settings.learning;
      const prev = s.skills[ex.skill] ?? newSkillState();
      const wasMastered = !!prev.masteredAt;
      const next = applyEvidence(prev, { ex: a.ex, kind: a.kind, correct: a.correct, hints: a.hints, revealed: a.revealed, confidence: a.confidence, source: a.source, ms: a.ms }, { now, masteryThreshold: L.masteryThreshold, retention: L.targetRetention });
      const day = dayKey(now);
      const d = s.days[day] ?? { ms: 0, items: 0, correct: 0 };
      const cal = { ...s.calibration };
      if (a.confidence) {
        const [c, t] = cal[a.confidence];
        cal[a.confidence] = [c + (a.correct ? 1 : 0), t + 1];
      }
      let mistakes = s.mistakes;
      if (!a.correct && a.mistake) {
        mistakes = [...mistakes, { id: `${now}-${a.ex}`, t: now, ex: a.ex, skill: ex.skill, ...a.mistake }].slice(-300);
      } else if (a.correct && a.hints === 0 && !a.revealed) {
        // An independent success on the same skill resolves open mistakes of that skill.
        mistakes = mistakes.map((m) => (m.skill === ex.skill && !m.resolvedAt && m.t < now ? { ...m, resolvedAt: now } : m));
      }
      if (!wasMastered && next.masteredAt) setTimeout(() => get().toast(`Навык освоен: ${SKILL_BY_ID.get(ex.skill)?.title}. Через 7 дней — отсроченная проверка.`, 'success'));
      return {
        ...s,
        skills: { ...s.skills, [ex.skill]: next },
        days: { ...s.days, [day]: { ms: d.ms + Math.min(a.ms ?? 60_000, 10 * 60_000), items: d.items + 1, correct: d.correct + (a.correct ? 1 : 0) } },
        seen: { ...s.seen, [a.ex]: { n: (s.seen[a.ex]?.n ?? 0) + 1, last: now, ok: a.correct } },
        calibration: cal,
        mistakes,
      };
    });
  },
  setClaimed(skill, known) {
    get().update((s) => ({ ...s, skills: { ...s.skills, [skill]: { ...(s.skills[skill] ?? newSkillState()), claimedKnown: known } } }));
  },
  setDraft(ex, code) {
    get().update((s) => ({ ...s, drafts: { ...s.drafts, [ex]: code } }));
  },
  resolveMistake(id) {
    get().update((s) => ({ ...s, mistakes: s.mistakes.map((m) => (m.id === id ? { ...m, resolvedAt: Date.now() } : m)) }));
  },
  diagStart(route, level, length) {
    const skills = ALL_SKILLS.filter((x) => x.route === route);
    get().update((s) => ({ ...s, diag: startDiagnostic(route, skills, level, length, Date.now()) }));
  },
  diagAnswer(a) {
    get().update((s) => {
      if (!s.diag) return s;
      const skills = ALL_SKILLS.filter((x) => x.route === s.diag!.route);
      return { ...s, diag: answerQuestion(s.diag, skills, a) };
    });
  },
  diagFinish(overrides) {
    const now = Date.now();
    get().update((s) => {
      const d = s.diag;
      if (!d) return s;
      const skills = { ...s.skills };
      for (const [id, p] of Object.entries(d.p)) {
        const st = skills[id] ?? newSkillState();
        const claimed = overrides[id];
        // Learner overrides win: "хочу изучить" caps the estimate, "я знаю" marks it as a claim to verify.
        const diagP = claimed === false ? Math.min(p, 0.4) : p;
        skills[id] = { ...st, p: claimed === false ? Math.min(st.p, 0.4) : Math.max(st.p, Math.min(diagP, 0.9)), diagP, diagAt: now, claimedKnown: claimed ?? st.claimedKnown };
      }
      // Diagnostic answers are kept as (weak) evidence so mastery can build on them.
      for (const a of d.answers) {
        const st = skills[a.skill];
        skills[a.skill] = { ...st, evidence: [...st.evidence, { t: now, ex: a.ex, kind: a.kind, correct: a.correct && !a.dontKnow, hints: 0, revealed: false, confidence: a.confidence, source: 'diagnostic' as const, ms: a.ms }].slice(-40) };
      }
      const r = s.routes[d.route] ?? { startedAt: now, goal: s.settings.learning.goal };
      return { ...s, skills, diag: undefined, routes: { ...s.routes, [d.route]: { ...r, diagnosticAt: now, selfLevel: d.selfLevel } }, profile: { ...s.profile, activeRoute: d.route } };
    });
  },
  diagCancel() {
    get().update((s) => ({ ...s, diag: undefined }));
  },
  projectSave(id, patch) {
    get().update((s) => ({ ...s, projects: { ...s.projects, [id]: { ...(s.projects[id] ?? { step: 0, code: '', startedAt: Date.now(), hints: 0 }), ...patch } } }));
  },
  importState(next) {
    set({ s: next });
  },
  resetAll() {
    set({ s: initialState() });
  },
}));

// Persist: debounced writes plus an immediate flush when the page is hidden.
let timer: ReturnType<typeof setTimeout> | null = null;
function flush() {
  if (!storage) return;
  timer = null;
  const r = saveState(storage, useStore.getState().s);
  if (!r.ok && useStore.getState().saveError !== r.error) {
    useStore.setState({ saveError: r.error });
    useStore.getState().toast(`Не удалось сохранить прогресс: ${r.error}. Экспортируйте данные в настройках.`, 'error');
  }
}
if (storage) {
  useStore.subscribe((st, prev) => {
    if (st.s === prev.s) return;
    if (timer) clearTimeout(timer);
    timer = setTimeout(flush, 300);
  });
  if (typeof window !== 'undefined') {
    window.addEventListener('pagehide', flush);
    document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && flush());
  }
}

export const useApp = <T,>(sel: (s: AppState) => T) => useStore((st) => sel(st.s));
export const actions = () => useStore.getState();
