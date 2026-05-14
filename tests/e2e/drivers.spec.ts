/**
 * TC-05 — List Page Renders Table Data
 * TC-06 — Search / Filter in Table
 * TC-07 — Create Form
 * TC-08 — Edit Form
 * TC-09 — Delete Confirmation Modal
 * TC-10 — Empty State
 * TC-11 — API Error State
 *
 * All tests mock the /api/drivers endpoint so they run without seed data.
 * The /api/auth/me endpoint is also mocked to keep the auth state valid.
 *
 * Spec reference: specs/main-ui-workflows.md § TC-05 … TC-11
 */

import { test, expect, type Page } from '@playwright/test';
import {
  MOCK_ME_BODY,
  MOCK_DRIVERS,
  driverListBody,
  driverSingleBody,
  okBody,
  errBody,
  type MockDriver,
} from '../fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Register route mocks for the drivers CRUD API.
 * Each handler can be overridden per test by registering a more specific route.
 */
async function mockDriversApi(
  page: Page,
  overrides: {
    getList?: MockDriver[] | null;   // null → returns 500 error
    getOne?: MockDriver;
    postStatus?: number;
    putStatus?: number;
    deleteStatus?: number;
  } = {},
) {
  await page.route('**/api/**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }),
    }),
  );

  // Auth refresh — always succeeds.
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );

  await page.route('**/api/driver-teams**', (route) =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, per_page: 100, current_page: 1, last_page: 1 } }),
    }),
  );

  await page.route('**/api/drivers**', (route) => {
    const method = route.request().method();
    const url = route.request().url();

    // Single resource: GET /api/drivers/1
    if (method === 'GET' && /\/drivers\/\d+/.test(url)) {
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: driverSingleBody(overrides.getOne ?? MOCK_DRIVERS[0]),
      });
    }

    // Collection: GET /api/drivers
    if (method === 'GET') {
      if (overrides.getList === null) {
        // Simulate 500 error
        return route.fulfill({
          status: 500,
          contentType: 'application/json',
          body: errBody('Internal Server Error'),
        });
      }
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: driverListBody(overrides.getList ?? MOCK_DRIVERS),
      });
    }

    // POST — create
    if (method === 'POST') {
      const status = overrides.postStatus ?? 201;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body:
          status >= 400
            ? errBody('Validation failed')
            : driverSingleBody({ ...MOCK_DRIVERS[0], id: 99, name: 'New Driver' }),
      });
    }

    // PUT / PATCH — update
    if (method === 'PUT' || method === 'PATCH') {
      const status = overrides.putStatus ?? 200;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body:
          status >= 400
            ? errBody('Validation failed')
            : driverSingleBody(overrides.getOne ?? MOCK_DRIVERS[0]),
      });
    }

    // DELETE
    if (method === 'DELETE') {
      const status = overrides.deleteStatus ?? 200;
      return route.fulfill({
        status,
        contentType: 'application/json',
        body: status >= 400 ? errBody('Not found') : okBody(),
      });
    }

    route.continue();
  });
}

/** Navigate to the drivers list and wait for the table to appear. */
async function gotoDriversList(page: Page) {
  await page.goto('/admin/drivers');
  await expect(page.getByRole('table').last()).toBeVisible();
}

const driverRows = (page: Page) => page.locator('tbody tr.ant-table-row');

// ─── TC-05 — List Page Renders Table Data ────────────────────────────────────
test.describe('TC-05 — Drivers list renders table data', () => {
  test.beforeEach(async ({ page }) => {
    await mockDriversApi(page);
  });

  test('[TC-05] table and column headers are visible', async ({ page }) => {
    // [spec TC-05 step 1–2] Navigate and verify table
    await gotoDriversList(page);

    // [spec TC-05 step 3] Column headers
    await expect(page.getByRole('columnheader', { name: /tên/i }).first()).toBeVisible();
    await expect(page.getByRole('columnheader', { name: /trạng thái/i }).first()).toBeVisible();
  });

  test('[TC-05] table shows driver data rows', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-05 step 4] Data rows in <tbody>
    const dataRows = driverRows(page);
    await expect(dataRows.first()).toBeVisible();
    // 3 mock drivers → 3 rows
    await expect(dataRows).toHaveCount(MOCK_DRIVERS.length);
  });

  test('[TC-05] first driver name appears in a row', async ({ page }) => {
    await gotoDriversList(page);

    // Verify mock data is rendered
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
    await expect(page.getByText('Trần Thị Bình')).toBeVisible();
  });

  test('[TC-05] row action buttons are present', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-05 step 6] "Sửa" and "Xóa" per row
    await expect(page.getByRole('button', { name: /sửa/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /xóa/i }).first()).toBeVisible();
  });

  test('[TC-05] "Tạo mới" button is visible', async ({ page }) => {
    await gotoDriversList(page);
    await expect(page.getByRole('button', { name: /tạo mới|thêm tài xế/i })).toBeVisible();
  });
});

// ─── TC-06 — Search / Filter ─────────────────────────────────────────────────
test.describe('TC-06 — Search and filter', () => {
  test.beforeEach(async ({ page }) => {
    await mockDriversApi(page);
  });

  test('[TC-06a] typing in search box filters visible rows', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-06a step 1] Find search input
    const searchInput = page
      .getByRole('textbox', { name: /tìm kiếm/i })
      .or(page.getByPlaceholder(/tìm kiếm/i))
      .first();

    // Re-mock the API to return only one driver when a filter param is present
    await page.route('**/api/drivers**', (route) => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: driverListBody([MOCK_DRIVERS[0]]),
      });
    });

    // [spec TC-06a step 2] Type a search term
    await searchInput.fill('Nguyễn');
    await page.getByRole('button', { name: /tìm kiếm|search/i }).click();

    // [spec TC-06a step 3–4] Table updates — one matching row
    const dataRows = driverRows(page);
    await expect(dataRows).toHaveCount(1);
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();
  });

  test('[TC-06a] clearing search restores full list', async ({ page }) => {
    // Start with filtered state, then clear to restore all rows
    await mockDriversApi(page, { getList: [MOCK_DRIVERS[0]] });
    await gotoDriversList(page);

    const searchInput = page
      .getByRole('textbox', { name: /tìm kiếm/i })
      .or(page.getByPlaceholder(/tìm kiếm/i))
      .first();
    await searchInput.fill('Nguyễn');
    await page.getByRole('button', { name: /tìm kiếm|search/i }).click();
    await expect(driverRows(page)).toHaveCount(1);

    // Restore all drivers when search is cleared
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: driverListBody() }),
    );

    // [spec TC-06a step 5] Reset search
    await page.getByRole('button', { name: /đặt lại|reset/i }).click();
    await page.getByRole('button', { name: /tìm kiếm|search/i }).click();
    await expect(driverRows(page)).toHaveCount(MOCK_DRIVERS.length);
  });

  test('[TC-06b] status filter dropdown narrows results', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-06b step 2] Re-mock to return only available drivers
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: driverListBody(MOCK_DRIVERS.filter((d) => d.available_status === 'available')),
      }),
    );

    await page.getByRole('tab', { name: /sẵn sàng|available/i }).click();
    await page.getByRole('button', { name: /tìm kiếm|search/i }).click();

    // [spec TC-06b step 3] Only available driver shown
    await expect(driverRows(page)).toHaveCount(1);
    await expect(page.getByText('Nguyễn Văn An')).toBeVisible();

    // [spec TC-06b step 4] Reset button restores all rows
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: driverListBody() }),
    );
    const resetBtn = page.getByRole('button', { name: /đặt lại|reset/i });
    if (await resetBtn.isVisible()) {
      await resetBtn.click();
      await expect(driverRows(page)).toHaveCount(MOCK_DRIVERS.length);
    }
  });
});

// ─── TC-07 — Create Form ─────────────────────────────────────────────────────
test.describe('TC-07 — Create driver form', () => {
  test.beforeEach(async ({ page }) => {
    await mockDriversApi(page);
  });

  test('[TC-07] dialog opens and shows form fields', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-07 step 2] Click "Tạo mới"
    await page.getByRole('button', { name: /tạo mới|thêm tài xế/i }).click();

    // [spec TC-07 step 3] Modal dialog opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // The dialog title contains "tạo" or "thêm"
    await expect(dialog.getByText(/tạo|thêm tài xế/i).first()).toBeVisible();
  });

  test('[TC-07] empty submit shows required-field validation errors', async ({ page }) => {
    await gotoDriversList(page);
    await page.getByRole('button', { name: /tạo mới|thêm tài xế/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // [spec TC-07b step 2] Submit empty form
    await dialog.getByRole('button', { name: /lưu|tạo mới|thêm/i }).click();

    // Validation errors appear — at least one "bắt buộc" message
    await expect(dialog.getByText(/bắt buộc|required/i).first()).toBeVisible();

    // [spec TC-07b step 3] Dialog stays open
    await expect(dialog).toBeVisible();
  });

  test('[TC-07] filled form submits successfully and shows feedback', async ({ page }) => {
    await gotoDriversList(page);
    await page.getByRole('button', { name: /tạo mới|thêm tài xế/i }).click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // [spec TC-07 step 4] Fill required fields
    // Name field: t('drivers.name') — use label regex for resilience
    const nameInput = dialog.getByLabel(/tên tài xế|họ và tên|họ tên|^tên$/i).first();
    if (await nameInput.isVisible()) {
      await nameInput.fill('Phạm Văn Test');
    }

    // Phone (hardcoded label in DriverForm: "Số điện thoại")
    const phoneInput = dialog.getByLabel('Số điện thoại').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0988000001');
    }

    // License number: t('drivers.licenseNo') = "Số GPLX"
    const licenseInput = dialog.getByLabel('Số GPLX').first();
    if (await licenseInput.isVisible()) {
      await licenseInput.fill('B2-TEST-001');
    }

    // [spec TC-07 step 5] Submit
    await dialog.getByRole('button', { name: /lưu|tạo mới|thêm/i }).click();

    // [spec TC-07 step 6] Success feedback — Ant Design message.success or notification
    await expect(page.getByRole('alert').or(page.getByText(/thành công|đã tạo|created/i))).toBeVisible({
      timeout: 8_000,
    });
  });
});

// ─── TC-08 — Edit Form ───────────────────────────────────────────────────────
test.describe('TC-08 — Edit driver form', () => {
  test.beforeEach(async ({ page }) => {
    await mockDriversApi(page);
  });

  test('[TC-08] edit dialog opens pre-populated with driver data', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-08 step 2] Click "Sửa" on the first row
    await page.getByRole('button', { name: /sửa/i }).first().click();

    // [spec TC-08 step 3] Edit modal opens
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Title should indicate editing
    await expect(dialog.getByText(/sửa tài xế|chỉnh sửa|edit/i).first()).toBeVisible();

    // [spec TC-08 step 3] Fields are pre-populated
    // Phone field (hardcoded label "Số điện thoại") should have the driver's phone
    const phoneInput = dialog.getByLabel('Số điện thoại').first();
    if (await phoneInput.isVisible()) {
      const value = await phoneInput.inputValue();
      expect(value).toBe(MOCK_DRIVERS[0].phone);
    }
  });

  test('[TC-08] modifying a field and saving shows success feedback', async ({ page }) => {
    await gotoDriversList(page);
    await page.getByRole('button', { name: /sửa/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // [spec TC-08 step 4] Change the phone number
    const phoneInput = dialog.getByLabel('Số điện thoại').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.clear();
      await phoneInput.fill('0999888777');
    }

    // [spec TC-08 step 5] Save
    await dialog.getByRole('button', { name: /lưu|cập nhật/i }).click();

    // [spec TC-08 step 6] Success feedback
    await expect(page.getByRole('alert').or(page.getByText(/thành công|đã cập nhật|updated/i))).toBeVisible({
      timeout: 8_000,
    });
  });

  test('[TC-08b] unsaved-changes warning appears when closing dirty form', async ({ page }) => {
    await gotoDriversList(page);
    await page.getByRole('button', { name: /sửa/i }).first().click();

    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Dirty the form
    const phoneInput = dialog.getByLabel('Số điện thoại').first();
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('0999111222');
    }

    // [spec TC-08b step 2] Attempt to close via "Hủy"
    const cancelBtn = dialog.getByRole('button', { name: /hủy/i });
    if (await cancelBtn.isVisible()) {
      await cancelBtn.click();
      // [spec TC-08b step 3] Unsaved-changes warning dialog appears
      await expect(page.getByText(/thay đổi chưa lưu|unsaved/i)).toBeVisible({ timeout: 3_000 });

      // [spec TC-08b step 4] Confirm discard
      const discardBtn = page.getByRole('button', { name: /đóng và không lưu|discard/i });
      if (await discardBtn.isVisible()) {
        await discardBtn.click();
        await expect(dialog).not.toBeVisible();
      }
    }
  });
});

// ─── TC-09 — Delete Confirmation Modal ───────────────────────────────────────
test.describe('TC-09 — Delete confirmation modal', () => {
  test.beforeEach(async ({ page }) => {
    await mockDriversApi(page);
  });

  test('[TC-09a] clicking Xóa opens confirmation modal', async ({ page }) => {
    await gotoDriversList(page);

    // [spec TC-09a step 2] Click the delete button on the first row
    await driverRows(page).first().getByRole('button', { name: /xóa/i }).click();

    // [spec TC-09a step 3] Confirmation modal opens
    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();
  });

  test('[TC-09a] confirming delete shows success and removes row', async ({ page }) => {
    await gotoDriversList(page);

    // Record initial row count
    await expect(driverRows(page)).toHaveCount(MOCK_DRIVERS.length);
    const rowsBefore = await driverRows(page).count();

    await driverRows(page).first().getByRole('button', { name: /xóa/i }).click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // [spec TC-09a step 7] Re-mock to return one fewer driver
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: driverListBody(MOCK_DRIVERS.slice(1)),
      }),
    );

    // [spec TC-09a step 5] Click the danger "Xóa" button inside the modal
    // The DeleteConfirmDialog renders the OK button with okText="Xóa" and danger=true.
    await confirmDialog.getByRole('button', { name: /^xóa$/i }).click();

    // [spec TC-09a step 6] Success feedback
    await expect(
      page.getByRole('alert').or(page.getByText(/đã xóa|deleted|thành công/i)),
    ).toBeVisible({ timeout: 8_000 });
    // After the list refreshes the count should decrease
    await expect(driverRows(page)).toHaveCount(rowsBefore - 1);
  });

  test('[TC-09b] cancelling delete keeps row in table', async ({ page }) => {
    await gotoDriversList(page);

    const rowsBefore = await driverRows(page).count();

    await driverRows(page).first().getByRole('button', { name: /xóa/i }).click();

    const confirmDialog = page.getByRole('dialog');
    await expect(confirmDialog).toBeVisible();

    // [spec TC-09b step 2] Click "Hủy"
    await confirmDialog.getByRole('button', { name: /hủy/i }).click();

    // [spec TC-09b step 3] Dialog closes
    await expect(confirmDialog).not.toBeVisible();

    // [spec TC-09b step 4] Row still present
    await expect(driverRows(page)).toHaveCount(rowsBefore);
  });
});

// ─── TC-10 — Empty State ─────────────────────────────────────────────────────
test.describe('TC-10 — Empty state', () => {
  test('[TC-10] table shows "Không có dữ liệu" when list is empty', async ({ page }) => {
    // [spec TC-10 setup] Mock API to return an empty list
    await mockDriversApi(page, { getList: [] });

    // [spec TC-10 step 1] Navigate
    await page.goto('/admin/drivers');
    await expect(page.getByRole('table').last()).toBeVisible();

    // [spec TC-10 step 3] Empty state message is visible
    // Ant Design Table renders "No data" in the configured locale ("Không có dữ liệu")
    await expect(page.getByText(/không có dữ liệu|chưa có bản ghi|no data/i).first()).toBeVisible();

    // [spec TC-10 step 4] ErrorState component (error icon) must NOT be present
    await expect(page.getByText(/something went wrong/i)).not.toBeVisible();

    // [spec TC-10 step 5] "Tạo mới" button still available
    await expect(page.getByRole('button', { name: /tạo mới|thêm/i })).toBeVisible();
  });

  test('[TC-10] search with no-match term shows empty state', async ({ page }) => {
    await mockDriversApi(page);
    await gotoDriversList(page);

    // Re-mock to return empty when a search param is present
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: driverListBody([]) }),
    );

    const searchInput = page
      .getByRole('textbox', { name: /tìm kiếm/i })
      .or(page.getByPlaceholder(/tìm kiếm/i))
      .first();

    await searchInput.fill('ZZZNOMATCH99');
    await page.getByRole('button', { name: /tìm kiếm|search/i }).click();

    await expect(page.getByText(/không có dữ liệu|chưa có bản ghi|no data/i).first()).toBeVisible();
  });
});

// ─── TC-11 — API Error State ─────────────────────────────────────────────────
test.describe('TC-11 — API error state', () => {
  test('[TC-11a] shows error UI when GET /api/drivers returns 500', async ({ page }) => {
    // [spec TC-11a step 1] Mock API to return 500 for list endpoint
    await mockDriversApi(page, { getList: null });

    // [spec TC-11a step 2] Navigate
    await page.goto('/admin/drivers');

    // [spec TC-11a step 3] ErrorState component renders with an error message
    // The ErrorState component shows "Something went wrong" or its Vietnamese equivalent
    // and a "Try Again" / "Thử lại" retry button.
    await expect(
      page
        .getByText(/something went wrong|không thể tải|lỗi|error/i)
        .or(page.getByRole('button', { name: /thử lại|try again/i })),
    ).toBeVisible({ timeout: 10_000 });
  });

  test('[TC-11a] retry button restores data after error', async ({ page }) => {
    await mockDriversApi(page, { getList: null });
    await page.goto('/admin/drivers');

    // Wait for error state
    const retryBtn = page.getByRole('button', { name: /thử lại|try again/i });
    await retryBtn.waitFor({ timeout: 10_000 });

    // [spec TC-11a step 5] Re-mock to return success, then retry
    await page.route('**/api/drivers**', (route) =>
      route.fulfill({ status: 200, contentType: 'application/json', body: driverListBody() }),
    );
    await retryBtn.click();

    // Table should now render with data
    await expect(page.getByRole('table').last()).toBeVisible();
  });

  test('[TC-11b] create API error keeps dialog open with error feedback', async ({ page }) => {
    // [spec TC-11b step 1] Mock POST to return 422
    await mockDriversApi(page, { postStatus: 422 });
    await gotoDriversList(page);

    await page.getByRole('button', { name: /tạo mới|thêm tài xế/i }).click();
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();

    // Fill minimal data and submit
    const phoneInput = dialog.getByLabel('Số điện thoại').first();
    if (await phoneInput.isVisible()) await phoneInput.fill('0900000000');
    await dialog.getByRole('button', { name: /lưu|tạo mới|thêm/i }).click();

    // [spec TC-11b step 3] Error feedback appears
    await expect(
      page.getByRole('alert').or(page.getByText(/thất bại|lỗi|failed|error/i)),
    ).toBeVisible({ timeout: 8_000 });

    // [spec TC-11b step 4] Dialog stays open
    await expect(dialog).toBeVisible();
  });
});
