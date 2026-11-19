import { defineConfig } from '@playwright/test';
import fs from 'node:fs';
import './lib/env.mjs';

const authFile = 'auth/user.json';

export default defineConfig({
  testDir: './tests',
  workers: 1,
  fullyParallel: false,
  timeout: 120_000,
  expect: { timeout: 10_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  outputDir: 'test-results',
  use: {
    baseURL: process.env.BASE_URL || 'https://shelter-uat.disaster.go.th',
    headless: process.env.HEADLESS === '1',
    viewport: { width: 1440, height: 900 },
    locale: 'th-TH',
    timezoneId: 'Asia/Bangkok',
    storageState: fs.existsSync(authFile) ? authFile : undefined,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    launchOptions: { slowMo: Number(process.env.SLOW || 0) },
  },
});
