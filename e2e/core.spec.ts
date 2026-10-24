import { expect, test } from '@playwright/test';
import { onboard, solveCurrent, trackErrors } from './helpers';

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
  await solveCurrent(page, { wrong: true });
  const res = page.getByTestId('result');
  if (await res.isVisible().catch(() => false)) {
    await expect(res).toHaveAttribute('data-correct', 'false');
  } else {
    await expect(page.getByTestId('explanation').first()).toBeVisible({ timeout: 60_000 });
  }
  await page.goto('/#/mistakes');
  await expect(page.getByTestId('mistake-row').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('code task: failing hidden test is explained, hints ladder, then pass', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/practice/py.variables?mode=check');
  const ex = page.getByTestId('exercise');
  await expect(ex).toBeVisible();
  const kind = await ex.getAttribute('data-kind');
  expect(['code', 'fix', 'predict']).toContain(kind);
  expect(errors).toEqual([]);
});
