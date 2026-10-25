// Settings personalisation (custom theme, user profiles, search) and the optional AI tutor.
// The AI provider is always mocked with page.route — these tests never reach a real API.
import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { EXERCISE_BY_ID } from '../src/content';
import { onboard, setEditor, solveCurrent, trackErrors } from './helpers';

const SHOTS = '.hoplite/artifacts/shots';
const FAKE_KEY = 'sk-test-FAKE-0000';
const BASE = 'https://mock-llm.test/v1';

type Seen = { url: string; auth?: string; body?: { model: string; messages: { role: string; content: string }[] } };

async function mockProvider(page: Page, chat: (seen: Seen) => string | { status: number; body: string }) {
  const seen: Seen[] = [];
  const cors = { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*', 'Access-Control-Allow-Methods': 'GET,POST,OPTIONS' };
  await page.route('**/v1/**', async (route) => {
    const req = route.request();
    if (req.method() === 'OPTIONS') return route.fulfill({ status: 204, headers: cors });
    const entry: Seen = { url: req.url(), auth: req.headers().authorization, body: req.postDataJSON() ?? undefined };
    if (req.url().endsWith('/models')) {
      seen.push(entry);
      return route.fulfill({ status: 200, headers: cors, contentType: 'application/json', body: JSON.stringify({ data: [{ id: 'mock-model-b' }, { id: 'mock-model-a' }] }) });
    }
    if (req.url().endsWith('/chat/completions')) {
      seen.push(entry);
      const r = chat(entry);
      if (typeof r !== 'string') return route.fulfill({ status: r.status, headers: cors, contentType: 'application/json', body: r.body });
      return route.fulfill({
        status: 200, headers: cors, contentType: 'application/json',
        body: JSON.stringify({ model: 'mock-model-a', choices: [{ message: { content: r, reasoning_content: 'СЕКРЕТНЫЕ РАССУЖДЕНИЯ' } }] }),
      });
    }
    return route.fulfill({ status: 404, headers: cors, body: '{}' });
  });
  return seen;
}

async function setupAi(page: Page) {
  await page.goto('/#/settings/ai');
  await page.getByRole('switch', { name: 'Включить AI-помощника' }).check();
  await page.getByLabel('Адрес API').fill(BASE);
  await page.getByLabel('API-ключ').fill(FAKE_KEY);
  await page.getByTestId('ai-load-models').click();
  await expect(page.getByTestId('ai-probe')).toContainText('Найдено моделей: 2');
  await page.getByLabel('Модель из списка').selectOption('mock-model-a');
  await page.getByTestId('ai-test').click();
  await expect(page.getByTestId('ai-probe')).toContainText('Соединение работает: модель mock-model-a');
  await expect(page.getByTestId('ai-status')).toContainText('Готов');
}

/** Opens practice for a Python skill whose first exercise is a code task (selection is adaptive, so probe a few). */
async function openCodeExercise(page: Page, query = '') {
  for (const id of ['py.variables', 'py.loops', 'py.functions', 'py.conditions', 'py.lists', 'py.strings']) {
    await page.goto(`/#/practice/${id}${query}`);
    await expect(page.getByTestId('exercise')).toBeVisible();
    const kind = await page.getByTestId('exercise').getAttribute('data-kind');
    if (kind === 'code' || kind === 'fix') return;
  }
  throw new Error('no code exercise found');
}

test('custom theme: edit colours with live preview, contrast warning, persists, resets', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/settings/appearance');
  const html = page.locator('html');
  const cssVar = (name: string) => page.evaluate((n) => document.documentElement.style.getPropertyValue(n).trim(), name);

  await page.getByRole('button', { name: 'Тема «Своя тема»' }).click();
  await expect(html).toHaveAttribute('data-theme', 'custom');
  await expect(page.getByTestId('custom-theme-active')).toBeVisible();

  await page.getByLabel('Фон: код цвета', { exact: true }).fill('#102030');
  expect(await cssVar('--bg')).toBe('#102030');
  await expect(page.getByTestId('custom-theme-preview')).toHaveCSS('background-color', 'rgb(16, 32, 48)');

  // Low-contrast text must be flagged with the ratio, not only by colour.
  await page.getByLabel('Текст: код цвета', { exact: true }).fill('#18283a');
  await expect(page.getByTestId('contrast-warning')).toBeVisible();
  await expect(page.getByTestId('contrast-report').locator('li[data-ok="false"]').first()).toContainText(/ниже 4\.5:1/);
  await page.getByLabel('Текст: код цвета', { exact: true }).fill('#f0f4ff');
  await expect(page.getByTestId('contrast-warning')).toHaveCount(0);

  // invalid hex is rejected and not applied
  await page.getByLabel('Фон: код цвета', { exact: true }).fill('#12');
  await expect(page.getByText('формат #rrggbb')).toBeVisible();
  expect(await cssVar('--bg')).toBe('#102030');
  await page.getByLabel('Фон: код цвета', { exact: true }).fill('#102030');

  // effects
  await page.getByRole('switch', { name: /Тени карточек/ }).uncheck();
  expect(await cssVar('--shadow')).toBe('none');
  await page.getByRole('button', { name: 'Сильное' }).click();
  expect(await cssVar('--glass')).toBe('blur(26px)');
  await page.getByRole('button', { name: 'По теме' }).click();
  await page.getByRole('switch', { name: /Тени карточек/ }).check();

  await page.locator('[data-setting="Своя тема"]').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/30-settings-theme-editor.png` });

  await page.reload();
  await expect(html).toHaveAttribute('data-theme', 'custom');
  expect(await cssVar('--bg')).toBe('#102030');

  await page.getByTestId('custom-theme-reset').click();
  expect(await cssVar('--bg')).toBe('#0f1424');

  await page.getByRole('button', { name: 'Тема «Светлая»' }).click();
  await expect(html).toHaveAttribute('data-theme', 'light');
  expect(await cssVar('--bg')).toBe('');
  expect(errors).toEqual([]);
});

test('user profiles: save, apply, rename, export, import (validated), delete; reset keeps them', async ({ page }) => {
  test.setTimeout(240_000);
  const errors = trackErrors(page);
  await onboard(page);
  await page.goto('/#/settings/appearance');
  await page.getByRole('button', { name: 'Тема «Терминал»' }).click();
  await page.goto('/#/settings/profiles');
  await page.getByTestId('profile-title').fill('Ночной терминал');
  await page.getByRole('button', { name: 'Значок 🌙' }).click();
  await page.getByTestId('profile-save').click();
  const card = page.getByTestId('user-profile').filter({ hasText: 'Ночной терминал' });
  await expect(card).toBeVisible();
  await expect(card).toContainText('✓ Применён');

  await page.goto('/#/settings/appearance');
  await page.getByRole('button', { name: 'Тема «Светлая»' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await page.goto('/#/settings/profiles');
  await expect(card).toContainText('Изменит:');
  await page.getByRole('button', { name: 'Применить профиль «Ночной терминал»' }).click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'terminal');

  await page.getByRole('button', { name: 'Переименовать профиль «Ночной терминал»' }).click();
  await page.getByLabel('Новое название профиля «Ночной терминал»').fill('Терминал 2');
  await page.getByRole('button', { name: 'Готово' }).click();
  const renamed = page.getByTestId('user-profile').filter({ hasText: 'Терминал 2' });
  await expect(renamed).toBeVisible();

  const [dl] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Экспортировать профиль «Терминал 2»' }).click()]);
  const exported = readFileSync(await dl.path(), 'utf8');
  const parsed = JSON.parse(exported);
  expect(parsed).toMatchObject({ kind: 'learnlab-profile', title: 'Терминал 2', icon: '🌙' });
  expect(parsed.settings.appearance.theme).toBe('terminal');
  expect(exported).not.toContain('userPresets');

  // import: invalid first, then the exported one
  await page.getByTestId('profile-import').setInputFiles({ name: 'bad.json', mimeType: 'application/json', buffer: Buffer.from(JSON.stringify({ kind: 'learnlab-profile', title: 'X', settings: { learning: { sessionSize: 999 } } })) });
  await expect(page.getByTestId('profile-import-error')).toContainText('недопустимые значения');
  await page.getByTestId('profile-import').setInputFiles({ name: 'ok.json', mimeType: 'application/json', buffer: Buffer.from(exported) });
  await expect(page.getByTestId('user-profile')).toHaveCount(2);
  await expect(page.getByTestId('profile-import-error')).toHaveCount(0);

  // reset of all settings keeps the profiles
  await page.getByRole('button', { name: 'Сбросить все настройки' }).click();
  await page.getByRole('button', { name: 'Сбросить', exact: true }).click();
  await expect(page.locator('html')).not.toHaveAttribute('data-theme', 'terminal');
  await expect(page.getByTestId('user-profile')).toHaveCount(2);

  // delete needs confirmation
  await page.getByRole('button', { name: 'Удалить профиль «Терминал 2»' }).first().click();
  await page.getByRole('button', { name: 'Подтвердить удаление профиля «Терминал 2»' }).click();
  await expect(page.getByTestId('user-profile')).toHaveCount(1);
  await page.reload();
  await expect(page.getByTestId('user-profile')).toHaveCount(1);
  expect(errors).toEqual([]);
});

test('settings search finds a setting on another tab and focuses it', async ({ page }) => {
  test.setTimeout(240_000);
  await onboard(page);
  await page.goto('/#/settings/profiles');
  const box = page.getByRole('searchbox', { name: 'Поиск по настройкам' });
  await box.fill('тайм-аут');
  await page.getByTestId('settings-search-result').first().click();
  await expect(page).toHaveURL(/#\/settings\/editor/);
  await expect(page.locator('[data-setting="Тайм-аут выполнения"] input[type="range"]')).toBeFocused();

  await box.fill('максимум подсказок');
  await box.press('Enter');
  await expect(page).toHaveURL(/#\/settings\/learning/);
  await expect(page.locator('[data-setting="Максимум подсказок на задание"] input')).toBeFocused();

  await box.fill('нет такой настройки zzz');
  await expect(page.getByTestId('settings-search-empty')).toBeVisible();
});

test('explanation options change behaviour: auto-explain off, question first, term style, hint cap', async ({ page }) => {
  test.setTimeout(240_000);
  await onboard(page);
  await page.goto('/#/settings/feedback');
  const preview = page.getByTestId('explanation').first();
  await expect(preview).toHaveAttribute('data-state', 'open');
  await expect(preview).toContainText('Термин:');

  await page.getByRole('button', { name: 'English первым' }).click();
  await expect(page.getByTestId('explanation').first()).toContainText(/Термин: [A-Za-z]/);
  await page.getByRole('button', { name: 'Русский', exact: true }).click();
  await expect(page.getByTestId('explanation').first()).toContainText('Термин: тип данных');
  await expect(page.getByTestId('explanation').first()).not.toContainText('Термин: тип данных —');

  await page.getByRole('switch', { name: /Сначала вопрос, потом объяснение/ }).check();
  await expect(page.getByTestId('explanation').first()).toHaveAttribute('data-state', 'gated');
  await page.getByTestId('explain-reveal').click();
  await expect(page.getByTestId('explanation').first()).toHaveAttribute('data-state', 'open');
  await page.getByRole('switch', { name: /Сначала вопрос, потом объяснение/ }).uncheck();

  await page.getByRole('switch', { name: /Объяснять автоматически/ }).uncheck();
  await expect(page.getByTestId('explanation').first()).toHaveAttribute('data-state', 'collapsed');
  await page.getByTestId('explain-open').click();
  await expect(page.getByTestId('explanation').first()).toHaveAttribute('data-state', 'open');

  // the same preferences apply to a real wrong answer
  await page.getByRole('switch', { name: /Объяснять автоматически/ }).uncheck();
  await openCodeExercise(page);
  await solveCurrent(page, { wrong: true });
  await expect(page.getByTestId('explanation').first()).toHaveAttribute('data-state', 'collapsed', { timeout: 60_000 });
});

test('AI tutor: setup with a mocked provider, "explain differently", error help, guarded hint that counts', async ({ page }) => {
  test.setTimeout(300_000);
  const errors = trackErrors(page);
  await onboard(page);
  let solution = '';
  const seen = await mockProvider(page, (s) => {
    const last = s.body!.messages.at(-1)!.content;
    if (last.includes('AI-подсказку')) return `Подумайте о цикле. Вот решение целиком:\n\`\`\`python\n${solution}\n\`\`\`\nА теперь сами.`;
    if (last.includes('почему так')) return 'Причина в **типах**: сравните строки выше.\n\n<img src=x onerror="window.__xss=1">';
    return 'Вот **другой взгляд**: переменная — это *коробка* с этикеткой.\n\n- первое\n- второе\n\n```python\nx = 5\n```';
  });

  await setupAi(page);
  expect(seen[0].auth).toBe(`Bearer ${FAKE_KEY}`);
  // the key lives only in learnlab:ai, never in the app state / exports
  const stored = await page.evaluate(() => ({ ai: localStorage.getItem('learnlab:ai'), state: localStorage.getItem('learnlab:state') }));
  expect(stored.ai).toContain(FAKE_KEY);
  expect(stored.state).not.toContain(FAKE_KEY);
  await expect(page.getByTestId('ai-privacy')).toContainText('напрямую с вашего устройства');
  await page.locator('[data-setting="AI-помощник"]').screenshot({ path: `${SHOTS}/31-settings-ai.png` });

  // Lesson: explain differently
  await page.goto('/#/skill/py.variables');
  await page.getByTestId('ai-style-analogy').click();
  const answer = page.getByTestId('ai-explain').getByTestId('ai-answer');
  await expect(answer).toContainText('другой взгляд');
  await expect(answer.getByTestId('ai-label')).toHaveText(/Ответ AI — может содержать ошибки/);
  await expect(answer.locator('strong').first()).toHaveText('другой взгляд');
  await expect(answer.locator('li')).toHaveCount(2);
  await expect(answer).not.toContainText('СЕКРЕТНЫЕ');
  expect(seen.at(-1)!.body!.messages[0].role).toBe('system');
  expect(seen.at(-1)!.body!.messages.at(-1)!.content).toContain('аналогию');
  await answer.getByRole('button', { name: 'Полезно' }).click();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('learnlab:ai')!).feedback.up)).toBe(1);
  await page.getByTestId('ai-explain').scrollIntoViewIfNeeded();
  await page.screenshot({ path: `${SHOTS}/32-lesson-ai.png` });

  // Exercise: error explanation + guarded hint
  await openCodeExercise(page);
  const exId = (await page.getByTestId('exercise').getAttribute('data-ex-id'))!;
  const ex = EXERCISE_BY_ID.get(exId)!;
  if (ex.kind !== 'code' && ex.kind !== 'fix') throw new Error('expected code exercise');
  solution = ex.solution;

  await setEditor(page, 'x = (');
  await page.getByTestId('run').click();
  await page.getByTestId('ai-ask-btn').click();
  await expect(page.getByTestId('ai-ask-error').getByTestId('ai-answer')).toContainText('Причина в типах');
  expect(await page.evaluate(() => (window as unknown as { __xss?: number }).__xss)).toBeUndefined();
  await expect(page.getByTestId('ai-ask-error').locator('img')).toHaveCount(0);
  // the request carried code and error as data, and never the reference solution
  const errReq = JSON.stringify(seen.at(-1)!.body);
  expect(errReq).toContain('⟦DATA code⟧');
  expect(errReq).not.toContain(solution);

  await expect(page.getByTestId('hint-count')).toHaveCount(0);
  await page.getByTestId('ai-hint-btn').click();
  const hint = page.getByTestId('ai-hint').getByTestId('ai-answer');
  await expect(hint).toContainText('Подумайте о цикле');
  await expect(hint.getByTestId('ai-filtered')).toBeVisible();
  await expect(page.getByTestId('ai-hint')).not.toContainText([...solution.split('\n')].sort((a, b) => b.length - a.length)[0].trim());
  await expect(page.getByTestId('hint-count')).toContainText('Использовано подсказок: 1 из 5');

  // solving after an AI hint is recorded as hinted
  await solveCurrent(page);
  await expect(page.getByTestId('result')).toContainText('с подсказками', { timeout: 60_000 });
  expect(errors).toEqual([]);
});

test('AI errors are explained and the hint cap is respected', async ({ page }) => {
  test.setTimeout(180_000);
  await onboard(page);
  let mode: 'rate' | 'ok' = 'ok';
  await mockProvider(page, () => (mode === 'rate' ? { status: 429, body: '{"error":{"message":"slow down"}}' } : 'Подсказка.'));
  await setupAi(page);
  mode = 'rate';
  await page.goto('/#/settings/learning');
  await page.locator('[data-setting="Максимум подсказок на задание"] input').fill('1');
  await openCodeExercise(page);
  await page.getByTestId('ai-hint-btn').click();
  await expect(page.getByTestId('ai-error')).toContainText('Слишком много запросов');
  await expect(page.getByTestId('hint-count')).toHaveCount(0); // a failed request is not a hint
  mode = 'ok';
  await page.getByTestId('ai-hint-btn').click();
  await expect(page.getByTestId('hint-count')).toContainText('1 из 1');
  await expect(page.getByTestId('hint-limit')).toBeVisible();
  await expect(page.getByTestId('ai-hint-btn')).toHaveCount(0);
});

test('AI is unavailable in delayed checks, and absent everywhere while disabled', async ({ page }) => {
  test.setTimeout(240_000);
  await onboard(page);
  // disabled by default
  await page.goto('/#/skill/py.variables');
  await expect(page.getByTestId('lesson')).toBeVisible();
  await expect(page.getByTestId('ai-explain')).toHaveCount(0);
  await openCodeExercise(page);
  await expect(page.getByTestId('ai-hint')).toHaveCount(0);
  await setEditor(page, 'x = (');
  await page.getByTestId('run').click();
  await expect(page.getByTestId('explanation').first()).toBeVisible({ timeout: 60_000 });
  await expect(page.getByTestId('ai-ask-btn')).toHaveCount(0);
  await page.goto('/#/settings/feedback');
  await expect(page.getByTestId('ai-ask-btn')).toHaveCount(0);

  // enable AI, then check that strict modes still hide it
  await mockProvider(page, () => 'x');
  await setupAi(page);
  await page.goto('/#/skill/py.variables');
  await expect(page.getByTestId('ai-explain')).toBeVisible();
  await page.goto('/#/practice/py.loops?mode=check');
  await expect(page.getByTestId('exercise')).toBeVisible();
  await expect(page.getByTestId('ai-hint')).toHaveCount(0);
  await expect(page.getByTestId('ai-hint-btn')).toHaveCount(0);
  if (['code', 'fix'].includes((await page.getByTestId('exercise').getAttribute('data-kind')) ?? '')) {
    await solveCurrent(page, { wrong: true });
    await expect(page.getByTestId('explanation').first()).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('ai-ask-btn')).toHaveCount(0);
  }

  // turning it off again removes the buttons
  await page.goto('/#/settings/ai');
  await page.getByRole('switch', { name: 'Включить AI-помощника' }).uncheck();
  await page.goto('/#/skill/py.variables');
  await expect(page.getByTestId('lesson')).toBeVisible();
  await expect(page.getByTestId('ai-explain')).toHaveCount(0);
});
