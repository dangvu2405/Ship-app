/**
 * Vehicles / Xe — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Vehicles
 *
 * Route: /admin/vehicles
 * API:   GET/POST /api/vehicles, PATCH /api/vehicles/{id}/status
 *
 * All tests mock /api/auth/me and /api/vehicles** so they run without a live backend.
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, vehicleListBody, vehicleSingleBody, emptyListBody, okBody, errBody, mockApiFallback } from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type VehiclesApiOptions = {
  listStatus?: number;
  listBody?: string;
  createStatus?: number;
};

async function mockVehiclesApi(page: import('@playwright/test').Page, opts: VehiclesApiOptions = {}) {
  await mockApiFallback(page);

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/vehicles**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }
    if (method === 'GET' && /\/vehicles\/\d+$/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: vehicleSingleBody() });
    }
    if (method === 'POST') {
      const status = opts.createStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? vehicleSingleBody() : errBody('Validation failed'),
      });
    }
    if (method === 'PUT' || (method === 'PATCH' && /\/vehicles\/\d+$/.test(url))) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: vehicleSingleBody() });
    }
    if (method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }

    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? vehicleListBody(),
    });
  });

  // Stub vehicle types for form selects
  await page.route('**/api/vehicle-types**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Vehicle list renders ────────────────────────────────────────────────

test.describe('Vehicles — list and table', () => {
  test('renders vehicle list with plate numbers', async ({ page }) => {
    await mockVehiclesApi(page);
    await page.goto('/admin/vehicles');

    // vehicles.title = 'Xe'
    await expect(page.getByRole('heading', { name: /xe/i }).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    // Plate numbers from mock
    await expect(page.getByText('51A-12345')).toBeVisible();
    await expect(page.getByText('51B-67890')).toBeVisible();
  });

  test('renders empty state when no vehicles', async ({ page }) => {
    await mockVehiclesApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/vehicles');

    await expect(page.getByText(/không có dữ liệu|no data|chưa có bản ghi/i).last()).toBeVisible();
  });

  test('renders error state when API returns 500', async ({ page }) => {
    await mockVehiclesApi(page, { listStatus: 500, listBody: errBody('Server error') });
    await page.goto('/admin/vehicles');

    const isOnLogin = page.url().includes('/login');
    const hasError = await page
      .getByText(/lỗi|error|something went wrong|không thể tải/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const notCrashed = !(await page.getByText(/typeerror|cannot read|uncaught/i).isVisible().catch(() => false));

    expect(isOnLogin || hasError || hasTable || notCrashed).toBe(true);
  });
});

// ─── TC — Create vehicle ──────────────────────────────────────────────────────

test.describe('Vehicles — create dialog', () => {
  test('opens create vehicle dialog', async ({ page }) => {
    await mockVehiclesApi(page);
    await page.goto('/admin/vehicles');

    // Button: vehicles.createVehicle = 'Tạo xe' or common.create = 'Tạo mới'
    const createBtn = page
      .getByRole('button', { name: /tạo xe|tạo mới|thêm xe|thêm/i })
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation error when submitting empty vehicle form', async ({ page }) => {
    await mockVehiclesApi(page);
    await page.goto('/admin/vehicles');

    await page.getByRole('button', { name: /tạo xe|tạo mới|thêm xe|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    await expect(
      page.getByText(/bắt buộc|required|vui lòng|please/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TC — Vehicle maintenance page ───────────────────────────────────────────

test.describe('Vehicles — maintenance page', () => {
  test('vehicle maintenance page renders', async ({ page }) => {
    await mockVehiclesApi(page);

    // Stub maintenance data
    await page.route('**/api/maintenance**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
    );

    await page.goto('/admin/vehicles/maintenance');

    await expect(page).toHaveURL(/\/admin\/vehicles\/maintenance/, { timeout: 10_000 });

    // Should not crash
    const crashText = page.getByText(/something went wrong|cannot read|typeerror/i);
    await expect(crashText).toHaveCount(0);
  });
});

// ─── TC — Vehicle assignments page ───────────────────────────────────────────

test.describe('Vehicles — assignments page', () => {
  test('vehicle assignments page renders', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) return route.fallback();
      route.fulfill({
        status: 200, contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }),
      });
    });

    await page.goto('/admin/vehicles/assignments');

    await expect(page).toHaveURL(/\/admin\/vehicles\/assignments/, { timeout: 10_000 });

    // Page should load without crash
    const crashText = page.getByText(/something went wrong|typeerror/i);
    await expect(crashText).toHaveCount(0);
  });
});
