// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  globalSetup: require.resolve('./utils/bootstrap.js'),
  testDir: 'playwright-tests',
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }]
  ],
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: process.env.BASE_URL || 'https://your-web-app.com'
  },
  projects: [
    // API project – only API folder
    {
      name: 'api',
      testDir: 'playwright-tests/api/spec',
      testMatch: /.*\/api\/.*\.spec\.ts/,   // only run tests under /api
    },
    // UI projects – only UI folder
    { name: 'chromium', testDir: 'playwright-tests/ui/specs', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  testDir: 'playwright-tests/ui/specs', use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   testDir: 'playwright-tests/ui/specs', use: { ...devices['Desktop Safari'] } },
  ],
});
