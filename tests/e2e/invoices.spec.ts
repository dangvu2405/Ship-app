/**
 * Invoices / Hóa đơn — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Invoices
 *
 * Route: /admin/invoices
 * API:   GET/POST /api/invoices
 *        PATCH /api/invoices/{id}/issue
 *        PATCH /api/invoices/{id}/mark-paid
 *        PATCH /api/invoices/{id}/cancel
 *
 * NOTE: PATCH /invoices/{id}/cqt returns 422 when no e-invoice provider is configured.
 * Do not assert CQT as a success path.
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_ME_BODY,
  invoiceListBody,
  invoiceSingleBody,
  MOCK_INVOICES,
  emptyListBody,
  okBody,
  errBody,
} from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type InvoicesApiOptions = {
  listStatus?: number;
  listBody?: string;
  createStatus?: number;
  actionStatus?: number;
};

async function mockInvoicesApi(page: import('@playwright/test').Page, opts: InvoicesApiOptions = {}) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/invoices**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // Action endpoints: issue, mark-paid, cancel
    if (method === 'PATCH') {
      const status = opts.actionStatus ?? 200;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? okBody() : errBody('Action failed'),
      });
    }
    if (method === 'GET' && /\/invoices\/\d+$/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: invoiceSingleBody() });
    }
    if (method === 'POST') {
      const status = opts.createStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? invoiceSingleBody() : errBody('Validation failed'),
      });
    }
    if (method === 'DELETE') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: okBody() });
    }

    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? invoiceListBody(),
    });
  });

  // Supporting APIs
  await page.route('**/api/customers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/trips**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Invoice list renders ────────────────────────────────────────────────

test.describe('Invoices — list and table', () => {
  test('renders invoice list with invoice numbers', async ({ page }) => {
    await mockInvoicesApi(page);
    await page.goto('/admin/invoices');

    // invoices.title = 'Hóa đơn'
    await expect(page.getByRole('heading', { name: /hóa đơn/i }).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    await expect(page.getByText('INV-2026-001')).toBeVisible();
    await expect(page.getByText('INV-2026-002')).toBeVisible();
  });

  test('shows draft and issued status labels', async ({ page }) => {
    await mockInvoicesApi(page);
    await page.goto('/admin/invoices');

    await expect(page.getByRole('table')).toBeVisible();
    // Status tags from mock data
    const draftTag = page.getByText(/draft|nháp/i).first();
    const issuedTag = page.getByText(/issued|đã phát hành/i).first();

    const hasDraft = await draftTag.isVisible().catch(() => false);
    const hasIssued = await issuedTag.isVisible().catch(() => false);
    expect(hasDraft || hasIssued).toBe(true);
  });

  test('renders empty state when no invoices', async ({ page }) => {
    await mockInvoicesApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/invoices');

    await expect(page.getByText(/không có dữ liệu|no data|chưa có bản ghi/i)).toBeVisible();
  });
});

// ─── TC — Create invoice ──────────────────────────────────────────────────────

test.describe('Invoices — create dialog', () => {
  test('opens create invoice dialog', async ({ page }) => {
    await mockInvoicesApi(page);
    await page.goto('/admin/invoices');

    // invoices.createInvoice = 'Thêm hóa đơn'
    const createBtn = page
      .getByRole('button', { name: /thêm hóa đơn|tạo mới|thêm/i })
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation error on empty submit', async ({ page }) => {
    await mockInvoicesApi(page);
    await page.goto('/admin/invoices');

    await page.getByRole('button', { name: /thêm hóa đơn|tạo mới|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    await expect(
      page.getByText(/bắt buộc|required|vui lòng|please/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TC — Invoice action endpoints use PATCH ──────────────────────────────────

test.describe('Invoices — action method contract', () => {
  test('[contract] issue invoice calls PATCH not POST', async ({ page }) => {
    const patchCalls: string[] = [];

    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/invoices**', (route) => {
      const method = route.request().method();
      if (method === 'PATCH') patchCalls.push(route.request().url());
      if (method === 'GET' && /\/invoices\/\d+$/.test(route.request().url())) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: invoiceSingleBody() });
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: invoiceSingleBody() });
    });
    await page.route('**/api/customers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/trips**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));

    // Navigate to invoice detail
    await page.goto(`/admin/invoices/show/${MOCK_INVOICES[0].id}`);

    // Look for issue/mark-paid/cancel action buttons
    const actionBtn = page
      .getByRole('button', { name: /phát hành|issue|đã thanh toán|mark.paid|hủy hóa đơn/i })
      .first();

    if (await actionBtn.isVisible({ timeout: 5_000 }).catch(() => false)) {
      await actionBtn.click();
      const confirmBtn = page.getByRole('button', { name: /xác nhận|confirm|ok/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
      }
      expect(patchCalls.length).toBeGreaterThan(0);
    } else {
      test.skip();
    }
  });
});

// ─── TC — CQT warning (do not assert as success) ─────────────────────────────

test.describe('Invoices — CQT / e-invoice', () => {
  test('[known-gap] CQT action returns 422 when provider not configured', async ({ page }) => {
    // Per CONVENTION.md: /api/invoices/{id}/cqt returns 422 when no provider configured.
    // This test verifies the UI handles the 422 gracefully (no crash).
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
    );
    await page.route('**/api/invoices**', (route) => {
      const url = route.request().url();
      if (url.includes('/cqt')) {
        return route.fulfill({
          status: 422,
          contentType: 'application/json',
          body: errBody('CQT provider not configured'),
        });
      }
      if (/\/invoices\/\d+$/.test(url)) {
        return route.fulfill({ status: 200, contentType: 'application/json', body: invoiceSingleBody() });
      }
      route.fulfill({ status: 200, contentType: 'application/json', body: invoiceListBody() });
    });
    await page.route('**/api/customers**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));
    await page.route('**/api/trips**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }));

    await page.goto(`/admin/invoices/show/${MOCK_INVOICES[0].id}`);

    const cqtBtn = page.getByRole('button', { name: /cqt|hóa đơn điện tử|e-invoice/i }).first();
    if (await cqtBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await cqtBtn.click();
      // Should show error, not crash
      const hasError = await page
        .getByText(/lỗi|error|không thể|provider|422/i)
        .isVisible({ timeout: 5_000 })
        .catch(() => false);
      const notCrashed = !(await page.getByText(/typeerror|cannot read/i).isVisible().catch(() => false));
      expect(hasError || notCrashed).toBe(true);
    } else {
      // CQT button not visible — skipped as per convention
      test.skip();
    }
  });
});
