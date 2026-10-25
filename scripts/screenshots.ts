import { chromium } from '@playwright/test';
import { spawn } from 'node:child_process';

const out = process.env.SHOTS_DIR ?? 'screenshots';
import { mkdirSync } from 'node:fs';
mkdirSync(out, { recursive: true });
const server = spawn('npx', ['vite', 'preview', '--port', '4174', '--strictPort'], { stdio: 'ignore' });
await new Promise((r) => setTimeout(r, 2500));
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
const base = 'http://localhost:4174/';
await page.goto(base);
await page.screenshot({ path: `${out}/01-onboarding.png` });
await page.evaluate(() => {
  const now = Date.now(), d = 86400000;
  const ev = (ex: string, kind: string, correct = true) => ({ t: now - d, ex, kind, correct, hints: 0, revealed: false, source: 'practice' });
  const s = {
    version: 1, profile: { name: 'Гармед', onboarded: true, activeRoute: 'python', createdAt: now - 10 * d },
    settings: {}, routes: { python: { startedAt: now - 9 * d, goal: 'systematic', diagnosticAt: now - 9 * d } },
    skills: {
      'py.variables': { p: 0.98, evidence: [ev('py.variables.1', 'predict'), ev('py.variables.3', 'code'), ev('py.variables.2', 'mcq')], checkStage: 1, masteredAt: now - 8 * d, durableAt: now - d, mem: { s: 20, d: 4, last: now - d, due: now + 15 * d, reps: 4, lapses: 0 } },
      'py.types': { p: 0.97, evidence: [ev('py.types.1', 'predict'), ev('py.types.2', 'code')], checkStage: 0, masteredAt: now - 3 * d, checkDue: now + 4 * d, mem: { s: 3, d: 5, last: now - 4 * d, due: now - 1000, reps: 2, lapses: 0 } },
      'py.strings': { p: 0.6, evidence: [ev('py.strings.1', 'mcq', false)], checkStage: 0, lessonAt: now - d },
      'py.conditions': { p: 0.85, evidence: [], checkStage: 0, diagP: 0.86, diagAt: now - 9 * d },
    },
    mistakes: [{ id: '1', t: now - d, ex: 'py.strings.1', skill: 'py.strings', category: 'concept', note: 'Выбран неверный ответ', misconception: undefined }],
    projects: {}, drafts: {}, days: Object.fromEntries(Array.from({ length: 6 }, (_, i) => { const t = new Date(now - i * d); return [`${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`, { ms: (10 + i * 4) * 60000, items: 6 + i, correct: 4 + i }]; })),
    seen: {}, calibration: { sure: [8, 10], unsure: [3, 6], guess: [1, 4] },
  };
  localStorage.setItem('learnlab:state', JSON.stringify(s));
});
const shot = async (hash: string, name: string, act?: () => Promise<void>) => {
  await page.goto(base + '#' + hash);
  await page.waitForTimeout(600);
  if (act) await act();
  await page.screenshot({ path: `${out}/${name}.png` });
};
await page.reload();
await shot('/', '02-home');
await shot('/route/python', '03-route');
await shot('/diag/javascript', '04-diag-intro');
await shot('/diag/javascript', '05-diag-question', async () => { await page.getByTestId('diag-begin').click(); await page.waitForTimeout(500); });
await page.getByTestId('diag-end').click();
await shot('/diag/javascript', '06-diag-results');
await page.getByRole('button', { name: 'Отменить диагностику' }).click();
await shot('/skill/py.loops', '07-lesson');
await shot('/practice/py.lists', '08-practice', async () => {
  await page.getByTestId('exercise').waitFor();
});
await shot('/playground', '09-playground', async () => {
  await page.getByRole('button', { name: 'Python', exact: true }).click();
  await page.locator('[data-testid="code-editor"]').first().evaluate((el) => { const v = (el as any).cmView; v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: 'age = 20\nprint("Мне " + age)' } }); });
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await page.getByTestId('explanation').first().waitFor({ timeout: 60000 });
});
await shot('/settings/appearance', '10-settings');
await shot('/progress', '11-progress');
await shot('/settings/appearance', '12-theme-paper', async () => { await page.getByRole('button', { name: /Бумага/ }).first().click(); await page.goto(base + '#/'); await page.waitForTimeout(500); });
await page.setViewportSize({ width: 390, height: 844 });
await shot('/', '13-mobile');
await browser.close();
server.kill();
