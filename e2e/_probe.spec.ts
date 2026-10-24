import { test } from '@playwright/test';
import { onboard } from './helpers';
test('probe', async ({ page }) => {
  await onboard(page);
  await page.goto('/#/practice/py.variables');
  await page.getByTestId('exercise').waitFor();
  console.log('PROBE kind=', await page.getByTestId('exercise').getAttribute('data-kind'), new Date().toISOString());
});
