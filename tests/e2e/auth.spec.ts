/**
 * TC-01 — Login Success
 * TC-02 — Login Validation Errors
 *
 * These tests run WITHOUT an authenticated session so they can exercise
 * the actual login flow.  Each test overrides storageState to empty.
 *
 * Spec reference: specs/main-ui-workflows.md § TC-01, TC-02
 */

import { test, expect } from '@playwright/test';
import { MOCK_LOGIN_OK_BODY, MOCK_ME_BODY, TEST_USERS } from '../fixtures';

// ─── Shared: no auth state for all tests in this file ────────────────────────
test.use({ storageState: { cookies: [], origins: [] } });
test.beforeEach(async ({ page }) => {
  await page.route('**/sanctum/csrf-cookie', (route) => route.fulfill({ status: 204 }));
});

// ─── TC-01 — Login Success ────────────────────────────────────────────────────
test.describe('TC-01 — Login Success', () => {
  test('login page renders correct branding and form', async ({ page }) => {
    // [spec TC-01 step 1] Navigate to /login
    await page.goto('/login');

    // [spec TC-01 step 2] Verify page structure
    await expect(page.getByText('Ship ERP').first()).toBeVisible();
    await expect(page.getByText('Chào mừng trở lại')).toBeVisible();

    // Form fields are present
    await expect(page.getByLabel('Email')).toBeVisible();
    await expect(page.getByLabel('Mật khẩu')).toBeVisible();
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('redirects to dashboard after successful login', async ({ page }) => {
    // Mock login API so the test does not depend on real credentials.
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: MOCK_LOGIN_OK_BODY,
      }),
    );
    // Mock the session-refresh call that happens after redirect.
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: MOCK_ME_BODY,
      }),
    );
    // Allow all other requests through (dashboard, reports, etc.).
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/login') || url.includes('/auth/me')) return route.fallback();
      route.continue();
    });

    // [spec TC-01 step 1] Navigate to login
    await page.goto('/login');

    // [spec TC-01 step 3–4] Fill credentials
    await page.getByLabel('Email').fill(TEST_USERS.admin.email);
    await page.getByLabel('Mật khẩu').fill(TEST_USERS.admin.password);

    // [spec TC-01 step 5] Submit
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // [spec TC-01 step 6] URL changes to /dashboard or /select-tenant
    await expect(page).toHaveURL(/(\/dashboard|\/select-tenant)/);
  });

  test('forgot-password link is visible and navigates correctly', async ({ page }) => {
    await page.goto('/login');
    const link = page.getByRole('link', { name: 'Quên mật khẩu?' });
    await expect(link).toBeVisible();
    await link.click();
    await expect(page).toHaveURL(/\/forgot-password/);
  });
});

// ─── TC-02 — Login Validation Errors ─────────────────────────────────────────
test.describe('TC-02 — Login Validation Errors', () => {
  // ── TC-02a: Empty form submission ─────────────────────────────────────────
  test('TC-02a shows required-field errors on empty submit', async ({ page }) => {
    // [spec TC-02a step 1] Navigate
    await page.goto('/login');

    // [spec TC-02a step 2] Submit with no data
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // [spec TC-02a step 3] Ant Design Form renders inline validation errors
    // Validation messages appear as visible text under each field.
    await expect(page.getByText(/bắt buộc|required/i).first()).toBeVisible();

    // URL must not change — user stays on /login
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-02b: Invalid email format ─────────────────────────────────────────
  test('TC-02b shows email format error for non-email input', async ({ page }) => {
    // [spec TC-02b step 1] Navigate
    await page.goto('/login');

    // [spec TC-02b step 2] Type an invalid email
    await page.getByLabel('Email').fill('notanemail');
    await page.getByLabel('Mật khẩu').fill('anything');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // [spec TC-02b step 3] Email format validation message appears
    // Ant Design form fires the 'type: email' rule validator.
    await expect(page.getByText(/email không hợp lệ|email.*hợp lệ|invalid email/i)).toBeVisible();

    // Page stays on /login
    await expect(page).toHaveURL(/\/login/);
  });

  // ── TC-02c: Wrong credentials (HTTP 401) ─────────────────────────────────
  test('TC-02c shows error toast when credentials are rejected (401)', async ({ page }) => {
    // [spec TC-02c step 1] Mock the login endpoint to return 401
    await page.route('**/api/auth/login', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Invalid credentials' }),
      }),
    );

    await page.goto('/login');

    // [spec TC-02c step 2] Fill valid-format credentials
    await page.getByLabel('Email').fill('wrong@example.com');
    await page.getByLabel('Mật khẩu').fill('wrongpassword');
    await page.getByRole('button', { name: 'Đăng nhập' }).click();

    // [spec TC-02c step 3] Error message/toast appears
    // The app shows either a global Ant Design message.error or an inline Alert.
    await expect(
      page.getByText(/đăng nhập thất bại|thông tin đăng nhập|invalid|sai mật khẩu|email hoặc mật khẩu/i),
    ).toBeVisible();

    // [spec TC-02c step 4] User stays on /login
    await expect(page).toHaveURL(/\/login/);
  });
});
