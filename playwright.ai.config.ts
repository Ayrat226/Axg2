import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: 'e2e', timeout: 90_000, expect: { timeout: 30_000 }, fullyParallel: false, workers: 2, retries: 0, reporter: [['list']],
  outputDir: '/tmp/pw-ai-results',
  use: { baseURL: 'http://localhost:4180', trace: 'retain-on-failure', screenshot: 'only-on-failure' },
  webServer: { command: 'npx vite preview --outDir /tmp/dist-ai --port 4180 --strictPort', url: 'http://localhost:4180', reuseExistingServer: true, timeout: 60_000 },
  projects: [{ name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1400, height: 900 } } }],
});
