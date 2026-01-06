import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'e2e',
  timeout: 30 * 1000,
  expect: { timeout: 5000 },
  fullyParallel: false,
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10 * 1000,
    baseURL: 'http://localhost:4173'
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'] } }
  ]
});
