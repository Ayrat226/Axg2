import { expect, test } from '@playwright/test';
import { editorText, onboard, originalOfMutant, setEditor, solveCurrent, trackErrors } from './helpers';

test('launcher tiles navigate to every mode', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { name: 'Аня', route: 'python' });
  await page.goto('/#/');
  await expect(page.getByTestId('launcher')).toBeVisible();
  await expect(page.getByTestId('tip-card')).toBeVisible();
  await expect(page.getByTestId('orbits').locator('.orbit')).toHaveCount(4);
  const targets: [string, RegExp][] = [
    ['sandbox', /#\/playground$/], ['projects', /#\/projects$/], ['daily', /#\/daily$/], ['bughunt', /#\/bughunt$/],
    ['review', /#\/review$/], ['diag', /#\/diag\/python$/],
  ];
  for (const [id, url] of targets) {
    await page.goto('/#/');
    await page.getByTestId(`tile-${id}`).click();
    await expect(page).toHaveURL(url);
  }
  await page.goto('/#/');
  await page.getByTestId('tile-continue').click();
  await expect(page).not.toHaveURL(/#\/$/);
  expect(errors).toEqual([]);
});

test('launcher: number keys launch tiles, but not while typing', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { route: 'python' });
  await page.goto('/#/');
  await expect(page.getByTestId('launcher-hint')).toContainText('1');
  await page.getByTestId('tile-sandbox').focus();
  await page.keyboard.press('6');
  await expect(page).toHaveURL(/#\/playground$/);
  await page.goto('/#/');
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox', { name: 'Поиск команд' }).fill('3');
  await expect(page).toHaveURL(/#\/$/);
  await page.keyboard.press('Escape');
  await page.keyboard.press('3');
  await expect(page).toHaveURL(/#\/bughunt$/);
  expect(errors).toEqual([]);
});

test('daily challenge: three items, completion shown on home and persisted', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { route: 'python' });
  await page.goto('/#/');
  await expect(page.getByTestId('tile-daily-stat')).toContainText('0/3');
  await page.getByTestId('tile-daily').click();
  const seen: string[] = [];
  for (let i = 0; i < 3; i++) {
    await expect(page.getByTestId('exercise')).toBeVisible({ timeout: 60_000 });
    seen.push((await page.getByTestId('exercise').getAttribute('data-ex-id'))!);
    await solveCurrent(page);
    await expect(page.getByTestId('result')).toBeVisible({ timeout: 60_000 });
    await page.getByTestId('next').click();
  }
  expect(new Set(seen.map((id) => id.split('.').slice(0, 2).join('.'))).size).toBe(3);
  await expect(page.getByTestId('daily-summary')).toBeVisible();
  await expect(page.getByTestId('daily-item')).toHaveCount(3);
  await page.goto('/#/');
  await expect(page.getByTestId('tile-daily-stat')).toContainText('Выполнено');
  await page.reload();
  await expect(page.getByTestId('tile-daily-stat')).toContainText('Выполнено');
  await page.goto('/#/daily');
  await expect(page.getByTestId('daily-summary')).toBeVisible();
  const mastery = await page.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('learnlab:state')!).skills).length);
  expect(mastery).toBeGreaterThanOrEqual(3);
  expect(errors).toEqual([]);
});

test('bug hunt: a verified mutant is shown and the original solution fixes it', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { route: 'python' });
  await page.goto('/#/bughunt/python');
  const ex = page.getByTestId('exercise');
  await expect(ex).toBeVisible({ timeout: 90_000 });
  const { id, orig } = await originalOfMutant(page);
  expect(id).toMatch(/~m\d+$/);
  expect(id.startsWith(orig.skill + '.')).toBe(true);
  expect(await editorText(page, ex)).not.toBe(orig.solution);
  // The buggy program really fails the tests...
  await ex.getByTestId('check').click();
  await expect(page.getByTestId('tests').or(page.getByTestId('explanation')).first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('result')).toHaveCount(0);
  // ...and the reference solution passes.
  await setEditor(page, orig.solution, ex);
  await ex.getByTestId('check').click();
  await expect(page.getByTestId('result')).toHaveAttribute('data-correct', 'true', { timeout: 60_000 });
  await expect(page.getByTestId('result')).toContainText('Что было испорчено');
  await page.getByTestId('next').click();
  await page.getByTestId('end-hunt').click();
  await expect(page.getByTestId('bughunt-summary')).toBeVisible();
  await expect(page.getByTestId('hunt-class').first()).toBeVisible();
  const st = await page.evaluate(() => JSON.parse(localStorage.getItem('learnlab:state')!).skills);
  expect(Object.values(st as Record<string, { evidence: { kind: string; source: string }[] }>).some((s) => s.evidence.some((e) => e.kind === 'fix' && e.source === 'practice'))).toBe(true);
  expect(errors).toEqual([]);
});

test('mobile 390px: home has no horizontal overflow', async ({ browser }) => {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
  const page = await ctx.newPage();
  const errors = trackErrors(page);
  await onboard(page, { name: 'Аня', route: 'python' });
  await page.goto('/#/');
  await expect(page.getByTestId('launcher')).toBeVisible();
  const w = await page.evaluate(() => ({ doc: document.documentElement.scrollWidth, main: (document.querySelector('.main') as HTMLElement).scrollWidth, vw: innerWidth }));
  expect(w.doc).toBeLessThanOrEqual(w.vw);
  expect(w.main).toBeLessThanOrEqual(w.vw);
  for (const path of ['/#/daily', '/#/bughunt']) {
    await page.goto(path);
    const o = await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth);
    expect(o).toBe(true);
  }
  expect(errors).toEqual([]);
  await ctx.close();
});
