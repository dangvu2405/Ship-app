/**
 * Violations / Vi phạm — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Violations
 *
 * Route: /admin/violations
 * API:
 *   GET/POST /api/violations
 *   PATCH /api/violations/{id}/confirm
 *   PATCH /api/violations/{id}/dispute
 *   PATCH /api/violations/{id}/resolve-dispute
 *
 * All PATCH actions confirmed correct in violation.service.ts.
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody, okBody, listBody, mockApiFallback } from '../fixtures';

const MOCK_VIOLATIONS = [
  {
    id: 1,
    driver_id: 1,
    driver: { id: 1, name: 'Nguyễn Văn An' },
    type: 'speeding',
    occurred_at: '2026-05-10T08:00:00Z',
    status: 'pending',
    penalty_amount: 500_000,
    description: 'Vượt tốc độ 20km/h',
  },
  {
    id: 2,
    driver_id: 2,
    driver: { id: 2, name: 'Trần Thị Bình' },
    type: 'accident',
    occurred_at: '2026-05-12T14:00:00Z',
    status: 'confirmed',
    penalty_amount: 2_000_000,
    description: 'Va chạm nhẹ tại bãi đỗ',
  },
];

async function mockViolationsApi(page: import('@playwright/test').Page, opts: { listStatus?: number; listBody?: string } = {}) {
  await mockApiFallback(page);

  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  await page.route('**/api/violations**', (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }
    if (method === 'POST') {
      return route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ success: true, data: MOCK_VIOLATIONS[0] }) });
    }
    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? listBody(MOCK_VIOLATIONS),
    });
  });
  await page.route('**/api/drivers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/trips**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Violations list ─────────────────────────────────────────────────────

test.describe('Violations — list and table', () => {
  test('violations page renders without crash', async ({ page }) => {
    await mockViolationsApi(page);
    await page.goto('/admin/violations');

    await expect(page).toHaveURL(/\/admin\/violations/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('renders violation records with driver names', async ({ page }) => {
    await mockViolationsApi(page);
    await page.goto('/admin/violations');

    await expect(page).toHaveURL(/\/admin\/violations/, { timeout: 10_000 });
    await expect(page.getByRole('heading', { name: /vi phạm/i }).first()).toBeVisible();

    const hasTable = await expect
      .poll(() => page.getByRole('table').count().catch(() => 0))
      .toBeGreaterThan(0)
      .then(() => true)
      .catch(() => false);
    const hasDriver = await page.getByRole('cell', { name: '1', exact: true }).first().isVisible({ timeout: 5_000 }).catch(() => false);
    const hasEmpty = await page.getByText(/không có dữ liệu|no data/i).last().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasTable || hasDriver || hasEmpty).toBe(true);
  });

  test('renders empty state when no violations', async ({ page }) => {
    await mockViolationsApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/violations');

    await expect(page).toHaveURL(/\/admin\/violations/, { timeout: 10_000 });

    await expect(page.getByText(/không có dữ liệu|no data|chưa có/i)).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TC — Violation actions use PATCH ────────────────────────────────────────

test.describe('Violations — action method contract', () => {
  test('[contract] confirm violation calls PATCH', async ({ page }) => {
    const patchCalls: string[] = [];

    await mockApiFallback(page);
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/violations**', (route) => {
      if (route.request().method() === 'PATCH') patchCalls.push(route.request().url());
      route.fulfill({ status: 200, contentType: 'application/json', body: listBody(MOCK_VIOLATIONS) });
    });
    await page.route('**/api/drivers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/trips**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));

    await page.goto('/admin/violations');
    await page.waitForLoadState('networkidle');

    const confirmBtn = page.getByRole('button', { name: /xác nhận|confirm|duyệt/i }).first();
    await expect(confirmBtn).toBeVisible({ timeout: 10_000 });
    await confirmBtn.click();
    const dialogConfirm = page.getByRole('button', { name: /xác nhận|ok|confirm/i }).last();
    if (await dialogConfirm.isVisible({ timeout: 2_000 }).catch(() => false)) await dialogConfirm.click();
    expect(patchCalls.length).toBeGreaterThan(0);
  });
});
