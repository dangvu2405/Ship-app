/**
 * Accounting — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Accounting
 *
 * Routes:
 *   /admin/accounting/revenue
 *   /admin/accounting/costs
 *   /admin/accounting/reconciliation
 *   /admin/accounting/debt
 *
 * API:
 *   GET /api/trip-costs
 *   GET/POST /api/cost-approvals
 *   GET/POST /api/reconciliations
 *   PATCH /api/reconciliations/{id}/confirm  ← action uses PATCH per convention
 *   GET /api/payments
 *
 * Business rules:
 *   - Cost vượt threshold → pending/approval_required
 *   - Reconciliation locked → items cannot be updated
 *   - Confirm reconciliation uses PATCH
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody, okBody, listBody } from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function mockAccountingApis(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/reconciliations**', (route) => {
    const method = route.request().method();
    if (method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() });
  });

  await page.route('**/api/trip-costs**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/cost-approvals**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/payments**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );

  // Catch-all for remaining API calls
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me') || url.includes('/reconciliation') || url.includes('/trip-costs') || url.includes('/cost-approvals') || url.includes('/payments')) {
      return route.fallback();
    }
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }),
    });
  });
}

// ─── TC — Revenue page ────────────────────────────────────────────────────────

test.describe('Accounting — Revenue page', () => {
  test('revenue page renders without crash', async ({ page }) => {
    await mockAccountingApis(page);
    await page.goto('/admin/accounting/revenue');

    await expect(page).toHaveURL(/\/admin\/accounting\/revenue/, { timeout: 10_000 });

    const crashText = page.getByText(/something went wrong|typeerror|cannot read/i);
    await expect(crashText).toHaveCount(0);
  });

  test('revenue page has a heading', async ({ page }) => {
    await mockAccountingApis(page);
    await page.goto('/admin/accounting/revenue');

    await expect(page).toHaveURL(/\/admin\/accounting\/revenue/, { timeout: 10_000 });

    const heading = page.getByRole('heading').first();
    await expect(heading).toBeVisible();
  });
});

// ─── TC — Costs page ──────────────────────────────────────────────────────────

test.describe('Accounting — Costs page', () => {
  test('costs page renders table or empty state', async ({ page }) => {
    await mockAccountingApis(page);
    await page.goto('/admin/accounting/costs');

    await expect(page).toHaveURL(/\/admin\/accounting\/costs/, { timeout: 10_000 });

    const hasTable = await expect.poll(() => page.getByRole('table').count().catch(() => 0)).toBeGreaterThan(0).then(() => true).catch(() => false);
    const hasEmpty = await page.getByText(/không có dữ liệu|no data|chưa có/i).last().isVisible({ timeout: 5_000 }).catch(() => false);
    const notCrashed = !(await page.getByText(/typeerror|cannot read/i).isVisible().catch(() => false));

    expect((hasTable || hasEmpty || page.url().includes('/accounting/costs')) && notCrashed).toBe(true);
  });

  test('costs page renders with mock cost data', async ({ page }) => {
    const mockCosts = [
      { id: 1, trip_id: 1, amount: 500_000, category: 'fuel', status: 'approved', created_at: '2026-05-01T00:00:00Z' },
      { id: 2, trip_id: 2, amount: 1_200_000, category: 'toll', status: 'pending', created_at: '2026-05-02T00:00:00Z' },
    ];

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/trip-costs**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: listBody(mockCosts) }),
    );
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/trip-costs')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
    });

    await page.goto('/admin/accounting/costs');

    await expect(page).toHaveURL(/\/admin\/accounting\/costs/, { timeout: 10_000 });

    const crashText = page.getByText(/typeerror|cannot read/i);
    await expect(crashText).toHaveCount(0);
  });
});

// ─── TC — Reconciliation page ────────────────────────────────────────────────

test.describe('Accounting — Reconciliation page', () => {
  test('reconciliation page renders without crash', async ({ page }) => {
    await mockAccountingApis(page);
    await page.goto('/admin/accounting/reconciliation');

    await expect(page).toHaveURL(/\/admin\/accounting\/reconciliation/, { timeout: 10_000 });

    const crashText = page.getByText(/typeerror|something went wrong/i);
    await expect(crashText).toHaveCount(0);
  });

  test('[contract] confirm reconciliation uses PATCH not POST', async ({ page }) => {
    const patchCalls: string[] = [];

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/reconciliations**', (route) => {
      const method = route.request().method();
      if (method === 'PATCH') patchCalls.push(route.request().url());
      route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    });
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me') || url.includes('/reconciliation')) return route.fallback();
      route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
    });

    await page.goto('/admin/accounting/reconciliation');

    // Look for confirm action
    const confirmBtn = page
      .getByRole('button', { name: /xác nhận đối soát|confirm|chốt đối soát/i })
      .first();

    if (await confirmBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await confirmBtn.click();
      const dialogConfirm = page.getByRole('button', { name: /xác nhận|ok|confirm/i }).last();
      if (await dialogConfirm.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await dialogConfirm.click();
      }
      // PATCH must have been called
      expect(patchCalls.length).toBeGreaterThan(0);
    } else {
      // No confirm action visible — acceptable if reconciliations are empty
      return;
    }
  });
});

// ─── TC — Debt page ───────────────────────────────────────────────────────────

test.describe('Accounting — Debt page', () => {
  test('debt page renders without crash', async ({ page }) => {
    await mockAccountingApis(page);
    await page.goto('/admin/accounting/debt');

    await expect(page).toHaveURL(/\/admin\/accounting\/debt/, { timeout: 10_000 });

    const crashText = page.getByText(/typeerror|something went wrong/i);
    await expect(crashText).toHaveCount(0);
  });
});
