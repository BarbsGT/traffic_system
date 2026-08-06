import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 90000,
  expect: { timeout: 15000 },
  fullyParallel: false,
  retries: 0,
  reporter: 'list',
  use: {
    baseURL: 'https://agency-grid-system.vercel.app',
    screenshot: 'only-on-failure',
    trace: 'retain-on-failure',
    headless: true,
  },
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    {
      name: 'audit-director',
      testMatch: /audit-director\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'tests/.auth/director.json' },
    },
    {
      name: 'audit-superadmin',
      testMatch: /audit-superadmin\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'tests/.auth/superadmin.json' },
    },
    {
      name: 'audit-responsive',
      testMatch: /audit-responsive\.spec\.ts/,
      dependencies: ['setup'],
      use: { storageState: 'tests/.auth/superadmin.json' },
    },
  ],
});
