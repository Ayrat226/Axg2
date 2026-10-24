import { chromium } from '@playwright/test';
const b = await chromium.launch();
for (const [name, url] of [['base', 'http://localhost:4174/'], ['new', 'http://localhost:4173/'], ['base', 'http://localhost:4174/'], ['new', 'http://localhost:4173/']]) {
  const page = await (await b.newContext({ viewport: { width: 1400, height: 900 } })).newPage();
  await page.goto(url);
  await page.evaluate(() => localStorage.setItem('learnlab:state', JSON.stringify({ version: 1, profile: { name: 'A', onboarded: true, activeRoute: 'python', createdAt: Date.now() } })));
  await page.reload(); await page.waitForTimeout(3000);
  const fps = await page.evaluate(() => new Promise((r) => { let n = 0; const s = performance.now(); const f = () => { n++; if (performance.now() - s > 4000) r(n / 4); else requestAnimationFrame(f); }; requestAnimationFrame(f); }));
  console.log(name, 'fps', fps.toFixed(1));
}
await b.close();
