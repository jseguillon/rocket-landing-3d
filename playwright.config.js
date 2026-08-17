import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: 'tests/visual',
  fullyParallel: false,
  timeout: 120000,
  expect: { timeout: 10000 },
  reporter: [['html', { outputFolder: 'test-results/artifacts/report' }]],
  use: {
    baseURL: 'http://127.0.0.1:4173',
    viewport: { width: 1440, height: 900 },
    screenshot: 'on',
    video: 'on',
    trace: 'on',
    actionTimeout: 30000,
  },
  webServer: {
    command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4173',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120000,
  },
});
