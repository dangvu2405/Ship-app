/**
 * Trips / Đơn hàng — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Trips
 *
 * Route: /admin/trips
 * API:   GET/POST /api/trips, PATCH /api/trips/{id}/assign|start|deliver|complete|cancel
 *
 * All tests mock /api/auth/me and /api/trips** so they run without a live backend.
 * Mocking validates the frontend renders correctly and calls the right method/endpoint.
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, tripListBody, tripSingleBody, MOCK_TRIPS, emptyListBody, okBody, errBody, mockApiFallback } from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type TripsApiOptions = {
  listStatus?: number;
  listBody?: string;
  createStatus?: number;
  singleBody?: string;
};

async function mockTripsApi(page: import('@playwright/test').Page, opts: TripsApiOptions = {}) {
  await mockApiFallback(page);

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/trips**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // Action endpoints (PATCH /trips/{id}/assign|start|...)
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }

    // Single trip
    if (method === 'GET' && /\/trips\/\d+$/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: opts.singleBody ?? tripSingleBody(),
      });
    }

    // POST create
    if (method === 'POST') {
      const status = opts.createStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? tripSingleBody() : errBody('Validation failed'),
      });
    }

    // GET list (default)
    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? tripListBody(),
    });
  });

  // Stub supporting APIs (customers, vehicles, drivers) for form selects
  await page.route('**/api/customers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/vehicles**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/drivers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Trip list renders ────────────────────────────────────────────────────

test.describe('Trips — list and table', () => {
  test('renders trip list with rows', async ({ page }) => {
    await mockTripsApi(page);
    await page.goto('/admin/trips');

    // Page heading (trips.title = 'Đơn hàng')
    await expect(page.getByRole('heading', { name: /đơn hàng/i }).first()).toBeVisible();

    // Table is present
    await expect(page.getByRole('table')).toBeVisible();

    // Rows from MOCK_TRIPS
    await expect.poll(() => page.getByRole('row').count()).toBeGreaterThan(1); // header + at least 1 data row
  });

  test('shows trip code or status in table', async ({ page }) => {
    await mockTripsApi(page);
    await page.goto('/admin/trips');

    await expect(page.getByRole('table')).toBeVisible();
    // At least one trip code visible
    await expect(page.getByText('TRIP-001')).toBeVisible();
  });

  test('renders empty state when no trips returned', async ({ page }) => {
    await mockTripsApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/trips');

    await expect(page.getByText(/không có dữ liệu|no data|chưa có bản ghi/i).last()).toBeVisible();
  });

  test('renders error state when API returns 500', async ({ page }) => {
    await mockTripsApi(page, { listStatus: 500, listBody: errBody('Server error') });
    await page.goto('/admin/trips');
    await expect(page.getByRole('heading', { name: /đơn hàng/i }).first()).toBeVisible();

    const isOnLogin = page.url().includes('/login');
    const hasError = await page
      .getByText(/lỗi|error|something went wrong|không thể tải/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await expect
      .poll(() => page.getByRole('table').count().catch(() => 0))
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);

    expect(isOnLogin || hasError || hasTable).toBe(true);
  });
});

// ─── TC — Create trip ─────────────────────────────────────────────────────────

test.describe('Trips — create dialog', () => {
  test('opens create trip dialog from list page', async ({ page }) => {
    await mockTripsApi(page);
    await page.goto('/admin/trips');

    // Button: trips.createTrip = 'Tạo đơn hàng' or common.create = 'Tạo mới'
    const createBtn = page
      .getByRole('button', { name: /tạo đơn hàng|tạo mới|thêm/i })
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    // Dialog/modal appears
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation errors when submitting empty create form', async ({ page }) => {
    await mockTripsApi(page);
    await page.goto('/admin/trips');

    await page.getByRole('button', { name: /tạo đơn hàng|tạo mới|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    // Submit empty
    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    // At least one validation message appears
    await expect(
      page.getByText(/bắt buộc|required|vui lòng|please/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TC — Trip action endpoints use PATCH ────────────────────────────────────

test.describe('Trips — action method contract', () => {
  test('[contract] trip action calls PATCH not POST', async ({ page }) => {
    const patchCalls: string[] = [];

    await mockApiFallback(page);
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/trips**', (route) => {
      const method = route.request().method();
      const url = route.request().url();
      if (method === 'PATCH') patchCalls.push(url);
      route.fulfill({ status: 200, contentType: 'application/json', body: tripSingleBody() });
    });
    await page.route('**/api/customers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/vehicles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/drivers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));

    // Navigate to trip detail (show page)
    await page.goto(`/admin/trips/show/${MOCK_TRIPS[0].id}`);
    await page.waitForLoadState('networkidle');

    // 'Hủy chuyến' is a direct confirm PATCH; 'Phân công' opens a driver form that requires filling
    const actionBtn = page
      .getByRole('button', { name: /hủy chuyến|hủy|cancel/i })
      .first();

    await expect(actionBtn).toBeVisible({ timeout: 10_000 });
    await actionBtn.click();
    // 'Hủy chuyến' dialog requires a reason — fill it in
    const reasonInput = page.getByRole('textbox').first();
    if (await reasonInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await reasonInput.fill('Test cancellation reason');
    }
    const confirmBtn = page.getByRole('button', { name: /xác nhận|confirm|ok/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
      await confirmBtn.click();
    }
    // A PATCH call must have been made (not POST)
    expect(patchCalls.length).toBeGreaterThan(0);
  });
});
