import { defineConfig, devices } from '@playwright/test';

/**
 * Playwright smoke tests for the SWO Assessment Center frontend.
 *
 * These are deliberately scoped to UX the AI-assisted changes from
 * phases 1-7: readiness checklist, session menu, theme toggle,
 * TCO scenarios, prerequisite indicators. They do not exercise the
 * full AI/backend analysis flow because that requires real Cognito
 * + Bedrock credentials.
 */
export default defineConfig({
  testDir: './e2e',
  timeout: 30_000,
  expect: { timeout: 5_000 },
  fullyParallel: true,
  retries: process.env.CI ? 2 : 0,
  reporter: [['list']],
  use: {
    baseURL: process.env.E2E_BASE_URL ?? 'http://localhost:3005',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: process.env.E2E_SKIP_SERVER
    ? undefined
    : {
        command: 'npm run dev',
        url: 'http://localhost:3005',
        reuseExistingServer: true,
        timeout: 60_000,
      },
});
