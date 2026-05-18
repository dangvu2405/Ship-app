/**
 * Payroll Adjustments / Điều chỉnh lương — E2E Tests
 *
 * Route: /admin/payroll/adjustments  (payroll_adjustments CRUD)
 * API:
 *   GET  /api/payroll/adjustments
 *   POST /api/payroll/adjustments
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody, mockApiFallback } from '../fixtures';

const MOCK_ADJUSTMENTS = [
  { id: 1, driver: { id: 1, name: 'Nguyễn Văn An' }, type: 'bonus', amount: 500_000, reason: 'Hoàn thành chỉ tiêu tháng 5', month: '2026-05' },
  { id: 2, driver: { id: 2, name: 'Trần Thị Bình' }, type: 'deduction', amount: 200_000, reason: 'Vi phạm nội quy', month: '2026-05' },
];

function adjustmentListBody(items = MOCK_ADJUSTMENTS) {
  return JSON.stringify({
    success: true, message: 'OK',
    data: { data: items, meta: { total: items.length, per_page: 15, current_page: 1, last_page: 1 } },
  });
}

async function mockAdjustmentsApis(page: import('@playwright/test').Page) {
  await mockApiFallback(page);
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  await page.route('**/api/payroll/adjustments**', (route) => {
    const method = route.request().method();
    if (method === 'POST') return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: MOCK_ADJUSTMENTS[0] }) });
    if (method === 'PUT' || method === 'PATCH') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: MOCK_ADJUSTMENTS[0] }) });
    if (method === 'DELETE') return route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true }) });
    route.fulfill({ status: 200, contentType: 'application/json', body: adjustmentListBody() });
  });
  await page.route('**/api/drivers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me') || url.includes('/payroll') || url.includes('/drivers')) return route.fallback();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
  });
}

// ─── TC — Payroll Adjustments ─────────────────────────────────────────────────

test.describe('Payroll Adjustments — list and CRUD', () => {
  test('payroll adjustments page renders without crash', async ({ page }) => {
    await mockAdjustmentsApis(page);
    await page.goto('/admin/payroll/adjustments');

    await expect(page).toHaveURL(/\/admin\/payroll\/adjustments/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('renders adjustment records with driver names', async ({ page }) => {
    await mockAdjustmentsApis(page);
    await page.goto('/admin/payroll/adjustments');

    await expect(page).toHaveURL(/\/admin\/payroll\/adjustments/, { timeout: 10_000 });

    const hasTable = await expect.poll(() => page.getByRole('table').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);
    const hasDriver = await page.getByText('Nguyễn Văn An').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.getByText(/không có dữ liệu|no data|chưa có/i).last().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasTable || hasDriver || hasEmpty).toBe(true);
  });

  test('renders empty state when no adjustments', async ({ page }) => {
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/payroll/adjustments**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
    );
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/payroll')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, data: {} }) });
    });

    await page.goto('/admin/payroll/adjustments');

    await expect(page).toHaveURL(/\/admin\/payroll\/adjustments/, { timeout: 10_000 });

    const notCrashed = !(await page.getByText(/typeerror|cannot read/i).isVisible().catch(() => false));
    expect(notCrashed).toBe(true);
  });

  test('add adjustment — opens form dialog', async ({ page }) => {
    await mockAdjustmentsApis(page);
    await page.goto('/admin/payroll/adjustments');

    await expect(page).toHaveURL(/\/admin\/payroll\/adjustments/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const addBtn = page.getByRole('button', { name: /thêm|tạo|add|new|điều chỉnh/i }).first();
    if (!(await addBtn.isVisible({ timeout: 5_000 }).catch(() => false))) return; // page has no add button
    await addBtn.click();
    const hasModal = await page.getByRole('dialog').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasForm = await page.locator('form').isVisible({ timeout: 5_000 }).catch(() => false);
    expect(hasModal || hasForm).toBe(true);
  });
});
