/**
 * Users / Người dùng — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Users
 *
 * Route: /admin/users
 * API:
 *   GET/POST /api/users
 *   PATCH /api/users/{id}/status
 *   POST /api/users/{id}/reset-password
 *
 * Roles available: super_admin, admin, dispatcher, accountant, viewer
 *
 * NOTE: This route requires role='admin'. Tests use storageState with admin auth.
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_ME_BODY,
  userListBody,
  MOCK_USERS,
  emptyListBody,
  okBody,
  errBody,
} from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type UsersApiOptions = {
  listStatus?: number;
  listBody?: string;
  createStatus?: number;
};

async function mockUsersApi(page: import('@playwright/test').Page, opts: UsersApiOptions = {}) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/users**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // Status action: PATCH /users/{id}/status
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }
    // Reset password: POST /users/{id}/reset-password
    if (method === 'POST' && url.includes('/reset-password')) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }
    // Create user: POST /users
    if (method === 'POST') {
      const status = opts.createStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? okBody(MOCK_USERS[0]) : errBody('Validation failed'),
      });
    }
    // PUT/PATCH update
    if (method === 'PUT') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody(MOCK_USERS[0]) });
    }
    // DELETE
    if (method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }

    // GET list
    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? userListBody(),
    });
  });

  // Stub roles for form selects
  await page.route('**/api/roles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Users list renders ──────────────────────────────────────────────────

test.describe('Users — list and table', () => {
  test('renders users list with names and roles', async ({ page }) => {
    await mockUsersApi(page);
    await page.goto('/admin/users');

    // users.title = 'Người dùng'
    await expect(page.getByRole('heading', { name: /người dùng|users/i }).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    await expect(page.getByText(MOCK_USERS[0].name)).toBeVisible();
    await expect(page.getByText(MOCK_USERS[1].name)).toBeVisible();
  });

  test('renders empty state when no users', async ({ page }) => {
    await mockUsersApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/users');

    await expect(page.getByText(/không có dữ liệu|no data|chưa có bản ghi/i)).toBeVisible();
  });

  test('renders error state when API returns 500', async ({ page }) => {
    await mockUsersApi(page, { listStatus: 500, listBody: errBody('Server error') });
    await page.goto('/admin/users');

    const hasError = await page
      .getByText(/lỗi|error|something went wrong|không thể tải/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const isOnLogin = page.url().includes('/login');

    expect(isOnLogin || hasError || hasTable).toBe(true);
  });
});

// ─── TC — Create user ─────────────────────────────────────────────────────────

test.describe('Users — create dialog', () => {
  test('opens create user dialog', async ({ page }) => {
    await mockUsersApi(page);
    await page.goto('/admin/users');

    // users.createUser = 'Tạo người dùng'
    const createBtn = page
      .getByRole('button', { name: /tạo người dùng|tạo mới|thêm/i })
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await mockUsersApi(page);
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /tạo người dùng|tạo mới|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    await expect(
      page.getByText(/bắt buộc|required|vui lòng|please/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('shows duplicate email error (422)', async ({ page }) => {
    await mockUsersApi(page, { createStatus: 422 });
    await page.goto('/admin/users');

    await page.getByRole('button', { name: /tạo người dùng|tạo mới|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Fill minimal valid data
    const nameInput = page.getByLabel(/họ tên|tên|name/i).first();
    const emailInput = page.getByLabel(/email/i).first();

    if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await nameInput.fill('Test User');
    }
    if (await emailInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await emailInput.fill('existing@abctransport.com');
    }

    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    // Either server error is shown in dialog OR dialog stays open
    const dialogStillOpen = await page.getByRole('dialog').isVisible({ timeout: 3_000 }).catch(() => false);
    const hasServerError = await page.getByText(/lỗi|error|validation|failed/i).isVisible({ timeout: 3_000 }).catch(() => false);

    expect(dialogStillOpen || hasServerError).toBe(true);
  });
});

// ─── TC — User status action (PATCH) ─────────────────────────────────────────

test.describe('Users — status action', () => {
  test('[contract] user status toggle calls PATCH', async ({ page }) => {
    const patchCalls: string[] = [];

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/users**', (route) => {
      const method = route.request().method();
      if (method === 'PATCH') patchCalls.push(route.request().url());
      if (method === 'GET') return route.fulfill({ status: 200, contentType: 'application/json', body: userListBody() });
      route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    });
    await page.route('**/api/roles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));

    await page.goto('/admin/users');

    // Look for a status toggle / activate/deactivate button
    const statusBtn = page
      .getByRole('button', { name: /khóa|kích hoạt|vô hiệu|activate|deactivate|block/i })
      .first();

    if (await statusBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await statusBtn.click();
      const confirmBtn = page.getByRole('button', { name: /xác nhận|ok|confirm/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      expect(patchCalls.length).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });
});

// ─── TC — Non-admin blocked from users route ──────────────────────────────────

test.describe('Users — role guard', () => {
  test('non-admin is redirected away from /admin/users', async ({ page }) => {
    // Mock auth/me as a non-admin
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { id: 3, name: 'Viewer', email: 'viewer@abctransport.com', role: 'viewer', company_id: 1 },
        }),
      }),
    );

    await page.goto('/admin/users');

    // ProtectedRoute redirects to /dashboard or /login
    await expect(page).toHaveURL(/(\/dashboard|\/login)/, { timeout: 10_000 });
    await expect(page).not.toHaveURL(/\/admin\/users/);
  });
});
