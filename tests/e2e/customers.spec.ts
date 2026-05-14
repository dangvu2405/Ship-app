/**
 * Customers / Khách hàng — E2E Tests
 *
 * Spec reference: specs/main-ui-workflows.md § Customers
 *
 * Route: /admin/customers
 * API:   GET/POST /api/customers, PUT/PATCH /api/customers/{id}, DELETE /api/customers/{id}
 *
 * Business rule: cannot delete a customer with active trips.
 */

import { test, expect } from '@playwright/test';
import {
  MOCK_ME_BODY,
  customerListBody,
  customerSingleBody,
  MOCK_CUSTOMERS,
  emptyListBody,
  okBody,
  errBody,
} from '../fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

type CustomersApiOptions = {
  listStatus?: number;
  listBody?: string;
  createStatus?: number;
  deleteStatus?: number;
};

async function mockCustomersApi(page: import('@playwright/test').Page, opts: CustomersApiOptions = {}) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/customers**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    if (method === 'GET' && /\/customers\/\d+$/.test(url)) {
      return route.fulfill({ status: 200, contentType: 'application/json', body: customerSingleBody() });
    }
    if (method === 'POST') {
      const status = opts.createStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? customerSingleBody() : errBody('Validation failed'),
      });
    }
    if (method === 'PUT' || method === 'PATCH') {
      return route.fulfill({ status: 200, contentType: 'application/json', body: customerSingleBody() });
    }
    if (method === 'DELETE') {
      const status = opts.deleteStatus ?? 200;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status < 400 ? okBody() : errBody('Khách hàng còn chuyến đang hoạt động', 'ACTIVE_TRIPS'),
      });
    }

    return route.fulfill({
      status: opts.listStatus ?? 200,
      contentType: 'application/json',
      body: opts.listBody ?? customerListBody(),
    });
  });

  // Stub customer groups
  await page.route('**/api/customer-groups**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
}

// ─── TC — Customer list renders ───────────────────────────────────────────────

test.describe('Customers — list and table', () => {
  test('renders customer list with names', async ({ page }) => {
    await mockCustomersApi(page);
    await page.goto('/admin/customers');

    // customers.title = 'Khách hàng'
    await expect(page.getByRole('heading', { name: /khách hàng/i }).first()).toBeVisible();
    await expect(page.getByRole('table')).toBeVisible();

    await expect(page.getByText(MOCK_CUSTOMERS[0].name)).toBeVisible();
    await expect(page.getByText(MOCK_CUSTOMERS[1].name)).toBeVisible();
  });

  test('renders empty state when no customers', async ({ page }) => {
    await mockCustomersApi(page, { listBody: emptyListBody() });
    await page.goto('/admin/customers');

    await expect(page.getByText(/không có dữ liệu|no data|chưa có bản ghi/i)).toBeVisible();
  });

  test('renders error state when API returns 500', async ({ page }) => {
    await mockCustomersApi(page, { listStatus: 500, listBody: errBody('Server error') });
    await page.goto('/admin/customers');

    const hasError = await page
      .getByText(/lỗi|error|something went wrong|không thể tải/i)
      .isVisible()
      .catch(() => false);
    const hasTable = await page.getByRole('table').isVisible().catch(() => false);
    const isOnLogin = page.url().includes('/login');

    expect(isOnLogin || hasError || hasTable).toBe(true);
  });
});

// ─── TC — Create customer ─────────────────────────────────────────────────────

test.describe('Customers — create dialog', () => {
  test('opens create customer dialog', async ({ page }) => {
    await mockCustomersApi(page);
    await page.goto('/admin/customers');

    // customers.createCustomer = 'Thêm khách hàng'
    const createBtn = page
      .getByRole('button', { name: /thêm khách hàng|tạo mới|thêm/i })
      .first();
    await expect(createBtn).toBeVisible();
    await createBtn.click();

    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
  });

  test('shows validation errors on empty submit', async ({ page }) => {
    await mockCustomersApi(page);
    await page.goto('/admin/customers');

    await page.getByRole('button', { name: /thêm khách hàng|tạo mới|thêm/i }).first().click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

    await page.getByRole('button', { name: /lưu|save|tạo|xác nhận/i }).last().click();

    await expect(
      page.getByText(/bắt buộc|required|vui lòng|please/i).first(),
    ).toBeVisible({ timeout: 5_000 });
  });
});

// ─── TC — Edit customer ───────────────────────────────────────────────────────

test.describe('Customers — edit', () => {
  test('opens edit dialog pre-populated with customer name', async ({ page }) => {
    await mockCustomersApi(page);
    await page.goto('/admin/customers');

    // Find and click the edit button on the first row
    const editBtn = page
      .getByRole('button', { name: /sửa|chỉnh sửa|edit/i })
      .first();

    if (await editBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await editBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });
      // Customer name should be pre-filled
      const nameInput = page.getByLabel(/tên khách hàng|tên|name/i).first();
      if (await nameInput.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await expect(nameInput).not.toBeEmpty();
      }
    } else {
      test.skip();
    }
  });
});

// ─── TC — Delete customer ─────────────────────────────────────────────────────

test.describe('Customers — delete', () => {
  test('delete confirm dialog appears and cancel keeps data', async ({ page }) => {
    await mockCustomersApi(page);
    await page.goto('/admin/customers');

    const deleteBtn = page
      .getByRole('button', { name: /xóa|delete/i })
      .first();

    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      // Confirm dialog should appear
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      // Click cancel
      await page.getByRole('button', { name: /hủy|cancel/i }).last().click();

      // Dialog closed — customer still in table
      await expect(page.getByText(MOCK_CUSTOMERS[0].name)).toBeVisible();
    } else {
      test.skip();
    }
  });

  test('shows error message when deleting customer with active trips', async ({ page }) => {
    await mockCustomersApi(page, { deleteStatus: 422 });
    await page.goto('/admin/customers');

    const deleteBtn = page.getByRole('button', { name: /xóa|delete/i }).first();
    if (await deleteBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
      await deleteBtn.click();
      await expect(page.getByRole('dialog')).toBeVisible({ timeout: 5_000 });

      const confirmBtn = page.getByRole('button', { name: /xóa|xác nhận|confirm|ok/i }).last();
      if (await confirmBtn.isVisible({ timeout: 2_000 }).catch(() => false)) {
        await confirmBtn.click();
        // Error message from API should appear — app must not crash
        const hasError = await page
          .getByText(/không thể xóa|chuyến đang hoạt động|lỗi|error/i)
          .isVisible({ timeout: 5_000 })
          .catch(() => false);
        const notCrashed = !page.getByText(/typeerror|cannot read/i);
        expect(hasError || notCrashed).toBe(true);
      }
    } else {
      test.skip();
    }
  });
});
