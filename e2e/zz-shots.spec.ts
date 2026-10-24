import { test, expect } from '@playwright/test';
import { onboard } from './helpers';
const OUT = '/tmp/hoplite/workspace/.hoplite/artifacts/shots/';
async function seed(page) {
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('learnlab:state')!);
    const now = Date.now();
    const mk = (p: number, mastered: boolean, due = false) => ({ p, evidence: [{ t: now - 86400000, ex: 'x', kind: 'code', correct: true, hints: 0, revealed: false, source: 'practice' }], lessonAt: now - 2 * 86400000, masteredAt: mastered ? now - 86400000 : undefined, checkStage: 0, mem: due ? { s: 1, d: 5, last: now - 20 * 86400000, due: now - 86400000, reps: 2, lapses: 0 } : undefined });
    s.skills['py.variables'] = mk(0.92, true); s.skills['py.types'] = mk(0.9, true); s.skills['py.conditions'] = mk(0.85, true, true);
    s.skills['py.loops'] = mk(0.5, false); s.skills['py.lists'] = mk(0.4, false);
    s.skills['js.basics'] = mk(0.6, false);
    localStorage.setItem('learnlab:state', JSON.stringify(s));
  });
  await page.reload();
}
test('shots', async ({ browser }) => {
  test.setTimeout(300000);
  const page = await (await browser.newContext({ viewport: { width: 1400, height: 1000 } })).newPage();
  await onboard(page, { name: 'Аня', route: 'python' });
  await seed(page);
  await page.goto('/#/');
  await expect(page.getByTestId('launcher')).toBeVisible();
  await page.waitForTimeout(1500);
  await page.screenshot({ path: OUT + '20-home-launcher.png', fullPage: true });
  await page.goto('/#/daily'); await expect(page.getByTestId('exercise')).toBeVisible({ timeout: 60000 });
  await page.waitForTimeout(500);
  await page.screenshot({ path: OUT + '23-daily.png', fullPage: true });
  await page.goto('/#/bughunt'); await expect(page.getByTestId('exercise')).toBeVisible({ timeout: 90000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: OUT + '22-bughunt.png', fullPage: true });
  const m = await (await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })).newPage();
  await onboard(m, { name: 'Аня', route: 'python' });
  await seed(m);
  await m.goto('/#/');
  await expect(m.getByTestId('launcher')).toBeVisible();
  await m.waitForTimeout(1500);
  await m.screenshot({ path: OUT + '21-home-mobile.png', fullPage: true });
});
