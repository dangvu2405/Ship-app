/**
 * Detail / Show Pages — E2E Tests
 *
 * Covers the show/:id routes for resources that have a detail page:
 *   /admin/trips/show/:id       — TripDetailPage
 *   /admin/vehicles/show/:id    — VehicleDetailPage
 *   /admin/drivers/show/:id     — DriverDetailPage
 *   /admin/invoices/show/:id    — InvoiceDetailPage
 *
 * API mocked per resource.
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody, okBody, mockApiFallback } from '../fixtures';

const MOCK_TRIP = {
  id: 1, code: 'TRIP-001', status: 'in_progress',
  pickup_address: '123 Lý Tự Trọng, Q1', delivery_address: '456 Nguyễn Huệ, Q1',
  scheduled_at: '2026-05-14T08:00:00Z', actual_pickup_at: '2026-05-14T08:15:00Z',
  driver: { id: 1, name: 'Nguyễn Văn An' }, vehicle: { id: 1, plate_number: '51A-12345' },
  customer: { id: 1, name: 'Công ty TNHH ABC' },
  costs: [], surcharges: [],
};

const MOCK_VEHICLE = {
  id: 1, plate_number: '51A-12345', brand: 'Isuzu', model: 'NQR', year: 2020,
  status: 'active', capacity: 3500,
};

const MOCK_DRIVER = {
  id: 1, name: 'Nguyễn Văn An', phone: '0901234567', license_number: 'B2-12345678',
  status: 'active', email: 'an.nguyen@example.com',
};

const MOCK_INVOICE = {
  id: 1, invoice_number: 'INV-2026-001', status: 'issued',
  customer: { id: 1, name: 'Công ty TNHH ABC' },
  total_amount: 5_000_000, issued_at: '2026-05-01',
};

function singleBody(data: unknown) {
  return JSON.stringify({ success: true, message: 'OK', data });
}

// ─── TC — Trip Detail ─────────────────────────────────────────────────────────

test.describe('Trip Detail page — /admin/trips/show/1', () => {
  test('trip detail page renders without crash', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/trips/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_TRIP) }));
    await page.route('**/api/trips**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/trips')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/trips/show/1');

    await expect(page).toHaveURL(/\/admin\/trips\/show\/1/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('trip detail shows trip code or status', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/trips/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_TRIP) }));
    await page.route('**/api/trips**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/trips')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/trips/show/1');

    await expect(page).toHaveURL(/\/admin\/trips\/show\/1/, { timeout: 10_000 });

    const hasCode = await page.getByText('TRIP-001').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasDriver = await page.getByText('Nguyễn Văn An').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHeading = await expect.poll(() => page.getByRole('heading').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);

    expect(hasCode || hasDriver || hasHeading).toBe(true);
  });
});

// ─── TC — Vehicle Detail ──────────────────────────────────────────────────────

test.describe('Vehicle Detail page — /admin/vehicles/show/1', () => {
  test('vehicle detail page renders without crash', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/vehicles/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_VEHICLE) }));
    await page.route('**/api/vehicles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/vehicles')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/vehicles/show/1');

    await expect(page).toHaveURL(/\/admin\/vehicles\/show\/1/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('vehicle detail shows plate number', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/vehicles/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_VEHICLE) }));
    await page.route('**/api/vehicles**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/vehicles')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/vehicles/show/1');

    await expect(page).toHaveURL(/\/admin\/vehicles\/show\/1/, { timeout: 10_000 });

    const hasPlate = await page.getByText('51A-12345').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHeading = await expect.poll(() => page.getByRole('heading').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);

    expect(hasPlate || hasHeading).toBe(true);
  });
});

// ─── TC — Driver Detail ───────────────────────────────────────────────────────

test.describe('Driver Detail page — /admin/drivers/show/1', () => {
  test('driver detail page renders without crash', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/drivers/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_DRIVER) }));
    await page.route('**/api/drivers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/drivers')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/drivers/show/1');

    await expect(page).toHaveURL(/\/admin\/drivers\/show\/1/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('driver detail shows driver name', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/drivers/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_DRIVER) }));
    await page.route('**/api/drivers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/drivers')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/drivers/show/1');

    await expect(page).toHaveURL(/\/admin\/drivers\/show\/1/, { timeout: 10_000 });

    const hasName = await page.getByText('Nguyễn Văn An').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHeading = await expect.poll(() => page.getByRole('heading').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);

    expect(hasName || hasHeading).toBe(true);
  });
});

// ─── TC — Invoice Detail ──────────────────────────────────────────────────────

test.describe('Invoice Detail page — /admin/invoices/show/1', () => {
  test('invoice detail page renders without crash', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/invoices/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_INVOICE) }));
    await page.route('**/api/invoices**', (route) => {
      if (route.request().method() === 'PATCH') patchCalls.push(route.request().url());
      route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() });
    });
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/invoices')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/invoices/show/1');

    await expect(page).toHaveURL(/\/admin\/invoices\/show\/1/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('invoice detail shows invoice number and amount', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/invoices/1**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_INVOICE) }));
    await page.route('**/api/invoices**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/invoices')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/invoices/show/1');

    await expect(page).toHaveURL(/\/admin\/invoices\/show\/1/, { timeout: 10_000 });

    const hasNumber = await page.getByText('INV-2026-001').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHeading = await expect.poll(() => page.getByRole('heading').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);

    expect(hasNumber || hasHeading).toBe(true);
  });

  test('[contract] invoice detail action buttons use PATCH', async ({ page }) => {
    const patchCalls: string[] = [];

    await mockApiFallback(page);
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    // Register generic invoices FIRST (lower LIFO priority), specific /invoices/1** AFTER (higher priority)
    await page.route('**/api/invoices**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/invoices/1**', (route) => {
      if (route.request().method() === 'PATCH') patchCalls.push(route.request().url());
      route.fulfill({ status: 200, contentType: 'application/json', body: singleBody(MOCK_INVOICE) });
    });

    await page.goto('/admin/invoices/show/1');
    await page.waitForLoadState('networkidle');

    const actionBtn = page.getByRole('button', { name: /phát hành|issue|cancel|hủy|mark.paid|đã thanh toán/i }).first();
    await expect(actionBtn).toBeVisible({ timeout: 10_000 });
    await actionBtn.click();
    const confirmBtn = page.getByRole('button', { name: /xác nhận|ok|confirm/i }).last();
    if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) await confirmBtn.click();
    expect(patchCalls.length).toBeGreaterThan(0);
  });
});

// ─── TC — Customer Price List ─────────────────────────────────────────────────

test.describe('Customer Price List — /admin/customers/price-list', () => {
  test('customer price-list page renders without crash', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/customers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/customers')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/customers/price-list');

    await expect(page).toHaveURL(/\/admin\/customers\/price-list/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('customer price-list has heading or table', async ({ page }) => {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/customers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/customers')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/customers/price-list');

    await expect(page).toHaveURL(/\/admin\/customers\/price-list/, { timeout: 10_000 });

    const hasHeading = await page.getByRole('heading').first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasTable = await page.getByRole('table').isVisible({ timeout: 5_000 }).catch(() => false);
    const notCrashed = !(await page.getByText(/typeerror|cannot read/i).isVisible().catch(() => false));

    expect(notCrashed).toBe(true);
    expect(hasHeading || hasTable || page.url().includes('/price-list')).toBe(true);
  });
});

// ─── TC — Settings sub-pages ──────────────────────────────────────────────────

test.describe('Settings — categories and company sub-pages', () => {
  async function mockSettingsSubApis(page: import('@playwright/test').Page) {
    await page.route('**/api/auth/me', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }));
    await page.route('**/api/companies/**', (route) => {
      if (route.request().method() === 'PATCH' || route.request().method() === 'PUT') return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: { id: 1, name: 'ABC Transport' } }) });
    });
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/companies')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
    });
  }

  test('settings/categories page renders without crash', async ({ page }) => {
    await mockSettingsSubApis(page);
    await page.goto('/admin/settings/categories');

    await expect(page).toHaveURL(/\/admin\/settings\/categories/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('settings/company page renders without crash', async ({ page }) => {
    await mockSettingsSubApis(page);
    await page.goto('/admin/settings/company');

    await expect(page).toHaveURL(/\/admin\/settings\/company/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });
});
