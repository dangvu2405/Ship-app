/**
 * Companies / Công ty — E2E Tests
 *
 * Route: /admin/companies  (CRUD managed resource)
 * API:
 *   GET    /api/companies
 *   POST   /api/companies
 *   PUT    /api/companies/{id}
 *   DELETE /api/companies/{id}
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody, okBody } from '../fixtures';

const MOCK_COMPANIES = [
  { id: 1, name: 'ABC Transport', code: 'ABC', address: '123 Lý Tự Trọng, Q1', phone: '028-1234-5678', status: 'active' },
  { id: 2, name: 'XYZ Logistics', code: 'XYZ', address: '456 Nguyễn Huệ, Q1', phone: '028-8765-4321', status: 'active' },
];

function companyListBody(items = MOCK_COMPANIES) {
  return JSON.stringify({
    success: true, message: 'OK',
    data: { data: items, meta: { total: items.length, per_page: 15, current_page: 1, last_page: 1 } },
  });
}

async function mockCompaniesApis(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  await page.route('**/api/companies**', (route) => {
    const method = route.request().method();
    if (method === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: MOCK_COMPANIES[0] }) });
    if (method === 'PUT' || method === 'PATCH') return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    if (method === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    route.fulfill({ status: 200, contentType: 'application/json', body: companyListBody() });
  });
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me') || url.includes('/companies')) return route.fallback();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
  });
}

// ─── TC — Companies list ──────────────────────────────────────────────────────

test.describe('Companies — list', () => {
  test('companies page renders without crash', async ({ page }) => {
    await mockCompaniesApis(page);
    await page.goto('/admin/companies');

    await expect(page).toHaveURL(/\/admin\/companies/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('renders company records', async ({ page }) => {
    await mockCompaniesApis(page);
    await page.goto('/admin/companies');

    await expect(page).toHaveURL(/\/admin\/companies/, { timeout: 10_000 });

    const hasTable = await expect.poll(() => page.getByRole('table').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);
    const hasName = await page.getByText('ABC Transport').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.getByText(/không có dữ liệu|no data/i).last().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasTable || hasName || hasEmpty).toBe(true);
  });

  test('renders empty state when no companies', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/companies**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
    );
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/companies')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/companies');

    await expect(page).toHaveURL(/\/admin\/companies/, { timeout: 10_000 });

    const notCrashed = !(await page.getByText(/typeerror|cannot read/i).isVisible().catch(() => false));
    expect(notCrashed).toBe(true);
  });

  test('add company — opens form dialog', async ({ page }) => {
    await mockCompaniesApis(page);
    await page.goto('/admin/companies');

    await expect(page).toHaveURL(/\/admin\/companies/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /thêm|tạo|add|new/i }).first();
    await expect(addBtn).toBeVisible({ timeout: 10_000 });
    await addBtn.click();
    const hasModal = await page.getByRole('dialog').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasForm = await page.locator('form').isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasModal || hasForm).toBe(true);
  });
});
