import { expect, type Page } from '@playwright/test';
import { EXERCISE_BY_ID } from '../src/content';

export async function setEditor(page: Page, text: string, scope = page.locator('body')) {
  await scope.locator('[data-testid="code-editor"]').first().evaluate((el, t) => {
    const v = (el as unknown as { cmView: { state: { doc: { length: number } }; dispatch: (x: object) => void } }).cmView;
    v.dispatch({ changes: { from: 0, to: v.state.doc.length, insert: t } });
  }, text);
}

/** Collect uncaught errors so every test also asserts a clean console. */
export function trackErrors(page: Page) {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error' && !/favicon|Failed to load resource/.test(m.text())) errors.push(m.text()); });
  return errors;
}

export async function onboard(page: Page, opts: { name?: string; route?: string } = {}) {
  await page.goto('/');
  await expect(page.getByTestId('onboarding')).toBeVisible();
  if (opts.name) await page.getByTestId('name-input').fill(opts.name);
  for (let i = 0; i < 4; i++) await page.getByTestId('onb-next').click();
  if (opts.route) await page.getByTestId(`onb-route-${opts.route}`).click();
  else await page.getByRole('button', { name: 'Осмотрюсь сам(а)' }).click();
}

/** Answer the visible exercise correctly using the content's reference answers. */
export async function solveCurrent(page: Page, { wrong = false } = {}) {
  const ex = page.getByTestId('exercise');
  const id = await ex.getAttribute('data-ex-id');
  const e = EXERCISE_BY_ID.get(id!)!;
  switch (e.kind) {
    case 'mcq': {
      const target = wrong ? e.options.find((o) => !o.correct)! : e.options.find((o) => o.correct)!;
      const idx = await ex.getByTestId('option').evaluateAll((els, text) => els.findIndex((el) => el.textContent?.includes(text)), target.text.replace(/`/g, ''));
      await ex.getByTestId('option').nth(idx).click();
      await ex.getByTestId('check').click();
      break;
    }
    case 'predict':
      await ex.getByTestId('predict-input').fill(wrong ? '???' : e.answer);
      await ex.getByTestId('check').click();
      break;
    case 'code':
    case 'fix':
      await setEditor(page, wrong ? (e.kind === 'code' ? e.starter : e.buggy) : e.solution, ex);
      await ex.getByTestId('check').click();
      break;
    case 'parsons':
      if (wrong) {
        const rev = [...e.lines].reverse();
        for (const l of rev) await ex.locator('button.parsons-line', { hasText: l.trim() }).filter({ hasText: l.trim() }).first().click();
      } else {
        for (const l of e.lines) {
          const btns = ex.locator('button.parsons-line');
          const n = await btns.count();
          for (let i = 0; i < n; i++) {
            if ((await btns.nth(i).textContent()) === l) { await btns.nth(i).click(); break; }
          }
        }
      }
      await ex.getByTestId('check').click();
      break;
    case 'explain':
      await ex.getByTestId('explain-input').fill('Подробное объяснение: ' + e.modelAnswer);
      await ex.getByTestId('check').click();
      if (!wrong) for (const box of await ex.locator('input[type=checkbox]').all()) await box.check();
      await ex.getByTestId('self-assess').click();
      break;
  }
  return e;
}
