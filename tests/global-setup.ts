/**
 * Playwright global setup — runs once before all test suites.
 *
 * Logs in as admin and saves the browser storage state (cookies + localStorage)
 * so authenticated test suites can reuse the session without re-logging in.
 *
 * Prerequisites:
 *   - Frontend running at BASE_URL (default http://localhost:3000)
 *   - Backend running at API_URL  (default http://localhost:8000)
 *   - Admin account exists with credentials from E2E_ADMIN_EMAIL / E2E_ADMIN_PASSWORD
 */

import { chromium, type FullConfig } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { TEST_USERS, AUTH_FILE, MOCK_LOGIN_OK_BODY, MOCK_ME_BODY } from './fixtures';

const AUTH_TOKEN_KEY = 'auth-token:v1';
const TENANT_ID_KEY = 'tenant-id:v1';
const E2E_AUTH_MARKER_KEY = 'e2e-auth-local-storage:v1';

export default async function globalSetup(config: FullConfig): Promise<void> {
  const baseURL =
    config.projects.find((p) => p.use.baseURL)?.use.baseURL ??
    process.env['BASE_URL'] ??
    'http://localhost:3000';

  // Ensure the directory for the auth state file exists.
  const authDir = path.dirname(AUTH_FILE);
  if (!fs.existsSync(authDir)) {
    fs.mkdirSync(authDir, { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext({ baseURL });
  const page = await context.newPage();

  await page.route('**/sanctum/csrf-cookie', (route) =>
    route.fulfill({ status: 204 }),
  );
  await page.route('**/api/auth/login', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: MOCK_LOGIN_OK_BODY,
    }),
  );
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: MOCK_ME_BODY,
    }),
  );

  // Navigate to login page.
  await page.goto('/login');

  // Wait for the login form to be ready.
  await page.getByLabel('Email').waitFor();

  // Fill credentials from env vars (or defaults).
  await page.getByLabel('Email').fill(TEST_USERS.admin.email);
  await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();

  // After login the app redirects to /dashboard or /select-tenant.
  await page.waitForURL(/(\/dashboard|\/select-tenant)/, { timeout: 20_000 });

  // Playwright storageState does not persist sessionStorage. The app keeps the
  // real access token in sessionStorage, so E2E stores a marker-scoped copy in
  // localStorage that production code ignores unless this marker is present.
  await page.evaluate(
    ({ tokenKey, tenantKey, markerKey }) => {
      localStorage.setItem(tokenKey, 'test-bearer-token');
      localStorage.setItem(tenantKey, '1');
      localStorage.setItem(markerKey, 'true');
    },
    { tokenKey: AUTH_TOKEN_KEY, tenantKey: TENANT_ID_KEY, markerKey: E2E_AUTH_MARKER_KEY },
  );

  // If the login flow lands on tenant selection, the E2E session already has a
  // tenant id persisted above; navigate to dashboard to save a ready state.
  if (page.url().includes('/select-tenant')) {
    await page.goto('/dashboard');
  }

  // Save full browser context state (cookies + localStorage).
  await context.storageState({ path: AUTH_FILE });
  await browser.close();

  console.log(`[global-setup] Auth state saved → ${AUTH_FILE}`);
}
