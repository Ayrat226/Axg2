import { test, expect } from '@playwright/test';
import { onboard, solveCurrent } from './helpers';
test('debug wrong', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/practice/py.variables');
  await expect(page.getByTestId('exercise')).toBeVisible();
  const id = await page.getByTestId('exercise').getAttribute('data-ex-id');
  const e = await solveCurrent(page, { wrong: true });
  console.log('EX', id, e.kind);
  await page.waitForTimeout(3000);
  console.log('RESULT', await page.getByTestId('result').count(), await page.getByTestId('result').first().getAttribute('data-correct').catch(() => 'n/a'));
  const ls = await page.evaluate(() => Object.fromEntries(Object.keys(localStorage).map((k) => [k, localStorage.getItem(k)!.length])));
  console.log('LS', JSON.stringify(ls));
  const st = await page.evaluate(() => { const k = Object.keys(localStorage).find((k) => k.includes('state') || k.includes('learnlab'))!; const s = JSON.parse(localStorage.getItem(k)!); return JSON.stringify({ k, mistakes: s.mistakes ?? s.state?.mistakes, seen: s.seen ?? s.state?.seen }).slice(0, 800); });
  console.log('ST', st);
  await page.screenshot({ path: '/tmp/dbg.png' });
});
