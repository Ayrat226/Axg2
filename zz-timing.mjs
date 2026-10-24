import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const motion of ['full', 'none']) {
  const ctx = await b.newContext({ viewport: { width: 1400, height: 900 } });
  const page = await ctx.newPage();
  await page.goto('http://localhost:4173/');
  await page.evaluate((m) => {
    const now = Date.now();
    localStorage.setItem('learnlab:state', JSON.stringify({ version: 1, profile: { name: 'A', onboarded: true, activeRoute: 'python', createdAt: now }, settings: { appearance: { motion: m } } }));
  }, motion);
  let t = Date.now();
  await page.goto('http://localhost:4173/#/'); await page.reload();
  await page.getByTestId('launcher').waitFor();
  console.log(motion, 'home load', Date.now() - t);
  t = Date.now();
  for (let i = 0; i < 5; i++) { await page.goto('http://localhost:4173/#/playground'); await page.goto('http://localhost:4173/#/'); await page.getByTestId('launcher').waitFor(); }
  console.log(motion, '5 round trips', Date.now() - t);
  const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s > 2000) r(n / 2); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  console.log(motion, 'fps', fps);
  await ctx.close();
}
await b.close();
