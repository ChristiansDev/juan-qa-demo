import 'dotenv/config';
import { defineConfig, devices } from '@playwright/test';

// URL of the app under test. /new-e2e-scenario writes it from the scenario's `base_url`.
// BASE_URL only overrides it per environment (for example in CI).
const APP_URL = '';

export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,
  reporter: process.env.CI
    ? [['list'], ['html', { open: 'never' }], ['junit', { outputFile: 'test-results/junit.xml' }]]
    : [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.BASE_URL || APP_URL || undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  projects: [
    // tests/auth/<role>.setup.ts log in once and save the session in .auth/<role>.json.
    { name: 'setup', testMatch: /.*\.setup\.ts/ },
    { name: 'chromium', use: { ...devices['Desktop Chrome'] }, dependencies: ['setup'] },
  ],
});
