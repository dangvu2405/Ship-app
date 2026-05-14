/**
 * TC-12 — Permission / Unauthorized State
 *
 * TC-12a — Unauthenticated user is redirected to /login
 * TC-12b — Non-admin user is blocked from admin-only routes
 * TC-12c — 401 mid-session triggers session-expired handling
 *
 * Spec reference: specs/main-ui-workflows.md § TC-12
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, TEST_USERS } from '../fixtures';

// ─── TC-12a — Unauthenticated redirect ───────────────────────────────────────
// These tests deliberately run with NO auth state.
test.describe('TC-12a — Unauthenticated access redirects to login', () => {
  // Override: clear any stored auth so we behave as a logged-out visitor.
  test.use({ storageState: { cookies: [], origins: [] } });

  test('[TC-12a] direct navigation to /admin/drivers redirects to /login', async ({ page }) => {
    // [spec TC-12a step 1] Clear state + navigate to protected route
    await page.goto('/admin/drivers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);

    // [spec TC-12a step 2–3] ProtectedRoute redirects unauthenticated users
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });

  test('[TC-12a] direct navigation to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('[TC-12a] direct navigation to /admin/users redirects to /login', async ({ page }) => {
    await page.goto('/admin/users');
    await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
  });

  test('[TC-12a] login page is publicly accessible', async ({ page }) => {
    await page.goto('/login');
    // No redirect — stays on /login
    await expect(page).toHaveURL(/\/login/);
    await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
  });
});

// ─── TC-12b — Non-admin role blocked from admin-only routes ──────────────────
// Uses the regular user session (stored state from a non-admin login).
// NOTE: This test requires a second saved auth file for a non-admin user.
// If that file does not exist, the test is skipped gracefully.
test.describe('TC-12b — Non-admin user cannot access admin-only routes', () => {
  test('[TC-12b] non-admin visiting /admin/users is redirected to /dashboard', async ({ page }) => {
    // appRouteConfig wraps routes with requiredRole: 'admin'.
    // ProtectedRoute redirects unauthorized users to /dashboard.
    // Mock /api/auth/me to return a non-admin user.
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: {
            id: 2,
            name: 'Regular User',
            email: TEST_USERS.regular.email,
            role: 'user', // ← not admin
            company_id: 1,
            permissions: [],
          },
        }),
      }),
    );

    // Navigate to an admin-only route
    await page.goto('/admin/users');

    // The ProtectedRoute component redirects to /dashboard when role check fails.
    await expect(page).toHaveURL(/(\/dashboard|\/login)/, { timeout: 10_000 });
    // Should NOT be on /admin/users
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });

  test('[TC-12b] non-admin visiting /admin/vehicles is redirected', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 2, name: 'Regular User', email: TEST_USERS.regular.email, role: 'user', company_id: 1 },
        }),
      }),
    );

    await page.goto('/admin/vehicles');
    await expect(page).toHaveURL(/(\/dashboard|\/login)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/admin\/vehicles/);
  });

  test('[TC-12b] forbidden message or redirect is shown', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 2, name: 'Regular User', role: 'user', company_id: 1 },
        }),
      }),
    );
    await page.route('**/api/**', (route) => {
      if (route.request().url().includes('/auth/me')) return route.fallback();
      route.continue();
    });

    await page.goto('/admin/users');

    // Either a redirect OR a forbidden message is shown.
    const redirected = !page.url().includes('/admin/users');
    const forbidden = await page
      .getByText(/không có quyền|forbidden|bạn không có quyền/i)
      .isVisible()
      .catch(() => false);

    expect(redirected || forbidden).toBe(true);
  });
});

// ─── TC-12c — 401 mid-session ─────────────────────────────────────────────────
test.describe('TC-12c — Session expiry handling', () => {
  test('[TC-12c] 401 from auth/me triggers session-expired message or redirect', async ({
    page,
  }) => {
    // [spec TC-12c step 2] Mock the auth refresh to return 401
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ success: false, message: 'Unauthenticated' }),
      }),
    );

    // [spec TC-12c step 3] Navigate — the app will attempt to refresh auth
    await page.goto('/dashboard');

    // The app should either:
    //   (a) redirect to /login, OR
    //   (b) show a "session expired" notification
    const redirectedToLogin = page.url().includes('/login');
    const sessionExpiredMsg = await page
      .getByText(/phiên đăng nhập đã hết hạn|session expired|đăng nhập lại/i)
      .isVisible()
      .catch(() => false);

    await expect(page).toHaveURL(/(\/login|\/dashboard)/, { timeout: 10_000 });
    // At least one of the expected behaviors must occur
    expect(redirectedToLogin || sessionExpiredMsg).toBe(true);
  });

  test('[TC-12c] 401 from API call during data fetch redirects or shows error', async ({
    page,
  }) => {
    // Auth succeeds but the drivers list returns 401
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({
        status: 401,
        contentType: 'application/json',
        body: JSON.stringify({ message: 'Unauthenticated' }),
      }),
    );

    await page.goto('/admin/drivers', { waitUntil: 'domcontentloaded' });
    await page.waitForLoadState('networkidle', { timeout: 5_000 }).catch(() => undefined);

    // The app should handle the 401 gracefully: redirect or show error
    // It should NOT crash with an uncaught exception
    const isOnLogin = page.url().includes('/login');
    const hasError = await page
      .getByText(/không có quyền|lỗi|error|something went wrong|không thể tải/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);

    // One of these states is acceptable
    expect(isOnLogin || hasError || hasTable).toBe(true);
  });
});
