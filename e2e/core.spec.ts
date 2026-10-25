import { expect, test } from '@playwright/test';
import { onboard, solveCurrent, trackErrors } from './helpers';
import { ALL_SKILLS, ROUTES } from '../src/content';

test('onboarding → adaptive diagnostic → results → route plan', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { name: 'Тестер', route: 'python' });
  await expect(page.getByTestId('diag-intro')).toBeVisible();
  await page.getByRole('button', { name: /Короткий/ }).click();
  await page.getByTestId('diag-begin').click();
  // Answer: first two correctly, then "не знаю" — the test must adapt and finish within the cap.
  let n = 0;
  while (await page.getByTestId('diag-question').isVisible().catch(() => false)) {
    if (n < 2) await solveCurrent(page);
    else await page.getByTestId('dont-know').click();
    await page.getByTestId('next').click();
    n++;
    if (n > 9) break;
  }
  expect(n).toBeLessThanOrEqual(8);
  await expect(page.getByTestId('diag-results')).toBeVisible();
  expect(await page.getByTestId('diag-row').count()).toBeGreaterThanOrEqual(10);
  await page.getByTestId('diag-row').first().getByRole('button', { name: 'Хочу изучить' }).click();
  await page.getByTestId('diag-accept').click();
  await expect(page.getByTestId('skill-graph')).toBeVisible();
  await expect(page.getByText(/Диагностика пройдена/)).toBeVisible();
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /Тестер/ })).toBeVisible();
  await expect(page.getByTestId('continue')).toBeVisible();
  expect(errors).toEqual([]);
});

test('lesson: depth switch, step-by-step example, run in Pyodide, visualizer', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/skill/py.variables');
  await expect(page.getByTestId('lesson')).toBeVisible();
  await page.getByTestId('depth-deep').click();
  await expect(page.getByText(/ссылки на объекты/)).toBeVisible();
  await page.getByTestId('depth-brief').click();
  await page.getByTestId('next-step').click();
  await page.getByTestId('run-example').click();
  await expect(page.getByTestId('example-output')).toContainText('Итого: 360', { timeout: 60_000 });
  await page.getByTestId('viz-toggle').click();
  await expect(page.getByText(/Шаг 1 из/)).toBeVisible({ timeout: 30_000 });
  expect(errors).toEqual([]);
});

test('practice session: every exercise kind can be solved; mastery is reached and recorded', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/settings/learning');
  await page.goto('/#/practice/py.variables');
  const kinds = new Set<string>();
  for (let i = 0; i < 12; i++) {
    if (await page.getByTestId('summary').isVisible().catch(() => false)) break;
    await expect(page.getByTestId('exercise')).toBeVisible();
    const e = await solveCurrent(page);
    kinds.add(e.kind);
    await expect(page.getByTestId('result')).toHaveAttribute('data-correct', 'true', { timeout: 60_000 });
    await page.getByTestId('next').click();
  }
  await expect(page.getByTestId('summary')).toBeVisible();
  expect(kinds.size).toBeGreaterThanOrEqual(3);
  await page.goto('/#/progress');
  await expect(page.getByText('Переменные, вывод и ввод').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('wrong answers: explanations, misconceptions and the mistakes journal', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/practice/py.variables');
  await expect(page.getByTestId('exercise')).toBeVisible();
  const e = await solveCurrent(page, { wrong: true });
  const res = page.getByTestId('result');
  if (e.kind === 'code' || e.kind === 'fix') {
    // A failed run is explained but keeps the attempt open; the mistake is recorded once the attempt ends.
    await expect(page.getByTestId('explanation').first()).toBeVisible({ timeout: 60_000 });
    await expect(res).toHaveCount(0);
    await page.getByRole('button', { name: 'Показать решение' }).click();
    await page.getByRole('button', { name: 'Показать', exact: true }).click();
  }
  await expect(res).toHaveAttribute('data-correct', 'false');
  await page.goto('/#/mistakes');
  await expect(page.getByTestId('mistake-row').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('delayed check: wrong attempt is explained, no hints, then a correct retry is accepted', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/practice/py.loops?mode=check');
  const ex = page.getByTestId('exercise');
  await expect(ex).toBeVisible();
  const kind = await ex.getAttribute('data-kind');
  expect(['code', 'fix', 'predict']).toContain(kind);
  await expect(page.getByTestId('hint-btn')).toHaveCount(0);
  if (kind === 'code' || kind === 'fix') {
    await solveCurrent(page, { wrong: true });
    await expect(page.getByTestId('tests').or(page.getByTestId('explanation')).first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('explanation').first()).toBeVisible();
    await solveCurrent(page);
    await expect(page.getByTestId('result')).toHaveAttribute('data-correct', 'true', { timeout: 60_000 });
  } else {
    await solveCurrent(page);
    await expect(page.getByTestId('result')).toHaveAttribute('data-correct', 'true');
  }
  expect(errors).toEqual([]);
});

test('every route: diagnostic starts with an adaptive question of a supported kind', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  for (const r of ROUTES) {
    await page.goto(`/#/diag/${r.id}`);
    await page.getByTestId('diag-begin').click();
    await expect(page.getByTestId('exercise')).toBeVisible();
    expect(await page.getByTestId('exercise').getAttribute('data-kind')).not.toBe('explain');
    await page.getByRole('button', { name: 'Отменить диагностику' }).or(page.getByTestId('diag-end')).first().click();
    await page.getByRole('button', { name: 'Отменить диагностику' }).click();
  }
  expect(errors).toEqual([]);
});

test('smoke: every lesson and every screen renders without errors; buttons have accessible names', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await onboard(page);
  for (const sk of ALL_SKILLS) {
    await page.goto(`/#/skill/${sk.id}`);
    await expect(page.getByRole('heading', { name: sk.title, exact: true })).toBeVisible();
    for (const d of ['brief', 'deep'] as const) await page.getByTestId(`depth-${d}`).click();
  }
  const screens = ['/', '/routes', ...ROUTES.map((r) => `/route/${r.id}`), '/map', '/review', '/mistakes', '/projects', ...ROUTES.flatMap((r) => r.projects.map((p) => `/project/${p.id}`)), '/playground', '/progress',
    ...['profiles', 'appearance', 'learning', 'feedback', 'editor', 'home', 'data', 'about'].map((t) => `/settings/${t}`)];
  for (const path of screens) {
    await page.goto(`/#${path}`);
    await page.waitForTimeout(150);
    const unnamed = await page.locator('button:visible').evaluateAll((els) => els.filter((b) => !(b.getAttribute('aria-label') || b.textContent?.trim() || b.getAttribute('title'))).length);
    expect(unnamed, `unnamed buttons on ${path}`).toBe(0);
  }
  expect(errors).toEqual([]);
});
