// playwright.config.ts
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({

  globalSetup: require.resolve('./utils/bootstrap.js'),
  timeout: 60_000,
  expect: { timeout: 5_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: [
    ['list'],
    ['allure-playwright', { outputFolder: 'allure-results' }],
    [require.resolve('./utils/reporter-plugin.js')] 
  ],
  use: {
    headless: true,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    baseURL: process.env.BASE_URL || 'https://your-web-app.com'
  },
  projects: [
    {
      name: 'api',
      testMatch: /.*\/api\/.*\.spec\.ts/,   // only run tests under /api
    },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
    { name: 'firefox',  use: { ...devices['Desktop Firefox'] } },
    { name: 'webkit',   use: { ...devices['Desktop Safari'] } },
  ],
});
