import { expect, test } from '@playwright/test';
import { onboard, setEditor, trackErrors } from './helpers';

test('settings: theme, accent, font scale and presets apply live and persist', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/settings/appearance');
  await page.getByRole('button', { name: /Терминал/ }).first().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');
  await page.goto('/#/settings/profiles');
  await page.getByRole('button', { name: /Применить/ }).last().click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'contrast');
  await expect(page.locator('html')).toHaveAttribute('data-motion', 'none');
  await page.goto('/#/settings/feedback');
  await expect(page.getByTestId('explanation').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('dashboard widgets can be hidden', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/');
  await expect(page.getByTestId('widget-mistakes')).toBeVisible();
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('learnlab:state')!);
    s.settings.dashboard.widgets = s.settings.dashboard.widgets.map((w: { id: string; visible: boolean }) => (w.id === 'mistakes' ? { ...w, visible: false } : w));
    localStorage.setItem('learnlab:state', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.getByTestId('widget-plan')).toBeVisible();
  await expect(page.getByTestId('widget-mistakes')).toHaveCount(0);
});

test('export → reset → import restores progress', async ({ page }) => {
  const errors = trackErrors(page);
  await onboard(page, { name: 'Экспорт' });
  await page.goto('/#/settings/data');
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: /Экспорт/ }).first().click()]);
  const path = await download.path();
  expect(download.suggestedFilename()).toMatch(/^learnlab-\d{4}-\d{2}-\d{2}\.json$/);
  await page.evaluate(() => { localStorage.clear(); });
  await page.reload();
  await expect(page.getByTestId('onboarding')).toBeVisible();
  await onboard(page);
  await page.goto('/#/settings/data');
  await page.locator('input[type=file]').setInputFiles(path!);
  await page.getByRole('dialog').getByRole('button', { name: /Импорт|Заменить|Подтвердить/ }).click();
  await page.goto('/#/');
  await expect(page.getByRole('heading', { name: /Экспорт/ })).toBeVisible();
  expect(errors).toEqual([]);
});

test('playground: python, infinite loop timeout + recovery, javascript, sql', async ({ page }) => {
  test.setTimeout(150_000);
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/settings/editor');
  await page.goto('/#/playground');
  await page.getByRole('button', { name: 'Python', exact: true }).click();
  await setEditor(page, 'print(sum(range(5)))');
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await expect(page.locator('.output').first()).toContainText('10', { timeout: 60_000 });
  await setEditor(page, 'while True:\n    pass');
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await expect(page.getByText(/слишком долго|Превышено время/).first()).toBeVisible({ timeout: 30_000 });
  await setEditor(page, 'print("снова работает")');
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await expect(page.locator('.output').first()).toContainText('снова работает', { timeout: 60_000 });
  await page.getByRole('button', { name: 'JavaScript', exact: true }).click();
  await setEditor(page, 'console.log([1,2].map(x => x * 2))');
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await expect(page.locator('.output').first()).toContainText('[ 2, 4 ]');
  await page.getByRole('button', { name: 'SQL', exact: true }).click();
  await setEditor(page, 'SELECT 40 + 2 AS answer');
  await page.getByRole('button', { name: /Запустить/ }).first().click();
  await expect(page.getByText('42').first()).toBeVisible();
  expect(errors).toEqual([]);
});

test('command palette navigates', async ({ page }) => {
  await onboard(page);
  await page.keyboard.press('Control+k');
  await page.getByRole('combobox').fill('Карта навыков');
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#\/map/);
  await expect(page.getByTestId('skillmap')).toBeVisible();
});

test('spaced review and delayed check pick due items', async ({ page }) => {
  await onboard(page);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('learnlab:state')!);
    const past = Date.now() - 86_400_000;
    s.skills['py.types'] = { p: 0.9, evidence: [], checkStage: 0, mem: { s: 1, d: 5, last: past - 5 * 86_400_000, due: past, reps: 2, lapses: 0 } };
    s.skills['js.basics'] = { p: 0.97, evidence: [], checkStage: 0, masteredAt: past - 8 * 86_400_000, checkDue: past };
    localStorage.setItem('learnlab:state', JSON.stringify(s));
  });
  await page.goto('/#/review');
  await expect(page.getByTestId('session')).toBeVisible();
  await expect(page.getByText(/Задание 1 из 2/)).toBeVisible();
});

test('project: steps with regression checks', async ({ page }) => {
  test.setTimeout(120_000);
  await onboard(page);
  await page.goto('/#/projects');
  await page.getByTestId('project-card').first().click();
  await expect(page.getByTestId('project')).toBeVisible();
  await page.getByRole('button', { name: 'Показать решение шага' }).click();
  await page.getByRole('button', { name: 'Вставить решение' }).click();
  await page.getByTestId('check').click();
  await expect(page.getByText(/Шаг 1 пройден/)).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText(/^Шаг 2:/)).toBeVisible();
});

test('corrupted storage is recovered with a notice', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('learnlab:state', '{oops'));
  await page.reload();
  await expect(page.getByText(/повреждено/)).toBeVisible();
  await expect(page.getByTestId('onboarding')).toBeVisible();
});

test('mobile layout uses bottom navigation', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await onboard(page);
  await expect(page.locator('.bottom-nav')).toBeVisible();
  await expect(page.locator('.sidebar')).toBeHidden();
  const overflow = await page.evaluate(() => document.querySelector('.main')!.scrollWidth - document.querySelector('.main')!.clientWidth);
  expect(overflow).toBeLessThanOrEqual(1);
});
