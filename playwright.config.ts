import { defineConfig, devices } from '@playwright/test';
import dotenv from 'dotenv';
import fs from 'fs';

if (fs.existsSync('.env.e2e')) {
  dotenv.config({ path: '.env.e2e' });
}

export default defineConfig({
  testDir: './tests',
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: [['html', { open: 'never' }], ['list']],
  outputDir: 'test-results/',
  use: {
    baseURL: process.env.E2E_BASE_URL || 'http://localhost:5173',
    channel: 'chrome',
    headless: process.env.CI ? true : process.env.E2E_HEADLESS === '1',
    trace: 'retain-on-failure',
    screenshot: 'on',
    video: 'on',
    launchOptions: {
      slowMo: process.env.E2E_SLOWMO ? parseInt(process.env.E2E_SLOWMO, 10) : 0,
    },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_BASE_URL && !process.env.E2E_BASE_URL.includes('localhost') ? undefined : {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
