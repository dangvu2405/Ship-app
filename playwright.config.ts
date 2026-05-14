import { defineConfig, devices } from '@playwright/test';
import { AUTH_FILE } from './tests/fixtures';

/**
 * Playwright configuration for Ship ERP E2E tests.
 *
 * Environment variables:
 *   BASE_URL            Frontend URL (default: http://localhost:3000)
 *   E2E_ADMIN_EMAIL     Admin login email
 *   E2E_ADMIN_PASSWORD  Admin login password
 *
 * Run E2E tests:
 *   npm run test:e2e
 *
 * Run with UI mode (interactive):
 *   npx playwright test tests/e2e/ --ui
 *
 * See https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: './tests',

  /*
   * The current E2E suite uses per-test API route mocks and persisted UI state.
   * Run serially to keep mocks deterministic across authenticated workflows.
   */
  fullyParallel: false,

  /* Fail the build on CI if test.only is left in source code */
  forbidOnly: !!process.env['CI'],

  /* Retry on CI only */
  retries: process.env['CI'] ? 2 : 0,

  /* Keep tests deterministic locally and in CI. */
  workers: 1,

  reporter: [['html', { open: 'never' }], ['list']],

  /* Global setup — runs once before all suites to create the auth state */
  globalSetup: './tests/global-setup.ts',

  use: {
    baseURL: process.env['BASE_URL'] ?? 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },

  projects: [
    /**
     * Primary project: authenticated Chromium.
     * Tests under tests/e2e/ run with the admin storageState by default.
     * Individual test files can override via test.use({ storageState: ... }).
     */
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: AUTH_FILE,
      },
    },

    /* Uncomment to also run on Firefox and Safari in CI */
    // {
    //   name: 'firefox',
    //   use: { ...devices['Desktop Firefox'], storageState: AUTH_FILE },
    // },
    // {
    //   name: 'webkit',
    //   use: { ...devices['Desktop Safari'], storageState: AUTH_FILE },
    // },
  ],

  /**
   * Start the Vite dev server before running tests.
   * Set reuseExistingServer: true so a manually-started server is reused.
   * Remove or adjust `command` if you use a different dev server.
   */
  webServer: {
    command: 'npm run dev',
    url: process.env['BASE_URL'] ?? 'http://localhost:3000',
    reuseExistingServer: !process.env['CI'],
    timeout: 120_000,
    stdout: 'ignore',
    stderr: 'pipe',
  },
});
