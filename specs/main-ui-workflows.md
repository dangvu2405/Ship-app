# Playwright Test Plan — Ship ERP Main UI Workflows

> **Project**: Ship ERP (ship-app)
> **Stack**: React + TypeScript + Ant Design v5 + Refine
> **Base URL**: `http://localhost:5173` (configure in `playwright.config.ts` → `use.baseURL`)
> **Test dir**: `./tests` (move specs here or update `testDir` in `playwright.config.ts`)
> **Seed file**: `tests/seed.spec.ts`

---

## Locator Strategy

| Priority | Technique | Example |
|----------|-----------|---------|
| 1 | Role + accessible name | `page.getByRole('button', { name: 'Đăng nhập' })` |
| 2 | Label | `page.getByLabel('Email')` |
| 3 | Placeholder | `page.getByPlaceholder('admin@example.com')` |
| 4 | Visible text | `page.getByText('Tạo mới')` |
| 5 | `data-testid` | `page.getByTestId('driver-table')` — only if no semantic locator exists |

**Never use**: `.ant-*` internal Ant Design classes.

---

## Shared Test Data & Fixtures

```ts
// tests/fixtures.ts
export const ADMIN_USER = {
  email: 'admin@example.com',
  password: 'Password123',
};

export const REGULAR_USER = {
  email: 'user@example.com',
  password: 'Password123',
};

// Storage state file for authenticated session (generated once via global setup)
export const AUTH_STATE_FILE = 'playwright/.auth/admin.json';
```

### Global Setup (recommended)

```ts
// tests/global-setup.ts
import { chromium } from '@playwright/test';
import { ADMIN_USER, AUTH_STATE_FILE } from './fixtures';

export default async function globalSetup() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  await page.goto('/login');
  await page.getByLabel('Email').fill(ADMIN_USER.email);
  await page.getByLabel('Mật khẩu').fill(ADMIN_USER.password);
  await page.getByRole('button', { name: 'Đăng nhập' }).click();
  await page.waitForURL('/dashboard');
  await page.context().storageState({ path: AUTH_STATE_FILE });
  await browser.close();
}
```

---

## TC-01 — Login Success

**Workflow**: User submits valid credentials and lands on Dashboard.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login page renders with "Chào mừng trở lại" heading and "Ship ERP" brand text |
| 2 | Verify page structure | Left panel shows branding; right panel shows login form |
| 3 | Fill email field | `getByLabel('Email')` → `admin@example.com` |
| 4 | Fill password field | `getByLabel('Mật khẩu')` → valid password |
| 5 | Click submit button | `getByRole('button', { name: 'Đăng nhập' })` |
| 6 | Wait for navigation | URL changes to `/dashboard` or `/select-tenant` |
| 7 | Verify authenticated state | Sidebar is visible; user avatar/menu is present in header |

**Locators**:
```ts
page.getByLabel('Email')
page.getByLabel('Mật khẩu')
page.getByRole('button', { name: 'Đăng nhập' })
page.getByText('Chào mừng trở lại')
```

**Required test data**: Valid admin credentials (`ADMIN_USER`)

**Notes**:
- If tenant selector appears at `/select-tenant`, click the target company tile then verify redirect to `/dashboard`.
- "Remember me" toggle uses `Switch` — locator: `page.getByText('Ghi nhớ đăng nhập').locator('..').getByRole('switch')`.

---

## TC-02 — Login Validation Error

**Workflow**: User submits invalid/incomplete credentials; appropriate error messages appear.

### TC-02a — Empty Fields

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/login` | Login form renders |
| 2 | Click submit without filling fields | `getByRole('button', { name: 'Đăng nhập' })` | Inline validation errors appear under Email and Mật khẩu fields |
| 3 | Verify error text | Each required field shows its validation message (e.g., `"Email là bắt buộc"`) |

### TC-02b — Invalid Email Format

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill email with `notanemail` | Validation error: invalid email format message |
| 2 | Verify button stays disabled / form blocked | Page does not navigate |

### TC-02c — Wrong Credentials (HTTP 401)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Fill valid email, wrong password | Submit form |
| 2 | Wait for API response | Toast/message error: `"Đăng nhập thất bại"` or `"Thông tin đăng nhập không hợp lệ"` |
| 3 | Verify user stays on `/login` | URL unchanged |

**Locators**:
```ts
// Ant Design Form.Item error text rendered in the DOM under the input
page.getByText(/bắt buộc/i).first()
// Global message (Ant Design message.error)
page.getByRole('alert')  // or page.locator('[role="alert"]')
```

**Notes**: Ant Design inline form errors are `<div class="ant-form-item-explain-error">` — do not use that class directly; instead assert by visible text.

---

## TC-03 — Dashboard Loads Correctly

**Pre-condition**: Authenticated as admin (use saved `AUTH_STATE_FILE`).

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/dashboard` | Page loads without errors |
| 2 | Verify KPI cards present | At least one stats card/metric widget visible |
| 3 | Verify page title / heading | Heading or breadcrumb contains "Dashboard" or equivalent |
| 4 | Verify sidebar rendered | Navigation menu visible on the left |
| 5 | Verify header rendered | Top bar with user avatar/logout action is present |
| 6 | No console errors | `page.on('console', ...)` — no uncaught errors |

**Locators**:
```ts
page.getByRole('navigation')           // sidebar
page.getByRole('banner')               // header
page.getByRole('main')                 // main content area
// KPI cards — use visible text or structural role
page.getByRole('article').first()      // Card elements if wrapped
```

---

## TC-04 — Main Sidebar / Menu Navigation

**Pre-condition**: Authenticated as admin.

### TC-04a — Navigate to Drivers List

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate sidebar navigation | `getByRole('navigation')` |
| 2 | Click "Tài xế" menu item | `getByRole('menuitem', { name: /tài xế/i })` — may need to expand parent group first |
| 3 | Verify URL | URL becomes `/admin/drivers` |
| 4 | Verify page heading | "Tài xế" heading or breadcrumb visible |

### TC-04b — Navigate to Vehicles List

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click "Đội xe" / "Phương tiện" menu item | URL becomes `/admin/vehicles` |
| 2 | Verify page content | Vehicles table renders |

### TC-04c — Sidebar Collapse/Expand

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click toggle button in header | Sidebar collapses to icon-only mode (width ~72px) |
| 2 | Click toggle again | Sidebar expands back to full width (~260px) |
| 3 | Verify keyboard shortcut | Press `Ctrl+B` (or `Meta+B`) → sidebar toggles |

**Locators**:
```ts
// Sidebar toggle button in SiteHeader
page.getByRole('button', { name: /chuyển đổi thanh bên|toggle/i })
// Menu items (Ant Design Menu renders as role="menuitem")
page.getByRole('menuitem', { name: /tài xế/i })
page.getByRole('menuitem', { name: /phương tiện|đội xe/i })
page.getByRole('menuitem', { name: /chuyến xe/i })
page.getByRole('menuitem', { name: /khách hàng/i })
```

**Notes**: SubMenu groups may need `page.getByRole('menuitem', { name: /nhân sự/i }).click()` to expand before reaching child items.

---

## TC-05 — List Page Renders Table Data

**Target page**: `/admin/drivers` (representative CRUD list)
**Pre-condition**: Authenticated; at least 1 driver record exists in the DB.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/drivers` | Page loads |
| 2 | Verify table renders | `getByRole('table')` is visible |
| 3 | Verify column headers | Headers: "Tên", "Số điện thoại", "Trạng thái", "Thao tác" (or equivalent) |
| 4 | Verify data rows | At least 1 `getByRole('row')` beyond the header row |
| 5 | Verify pagination | Pagination controls visible when records > page size |
| 6 | Verify action buttons in rows | "Xem", "Sửa", "Xóa" buttons present in each row |

**Locators**:
```ts
page.getByRole('table')
page.getByRole('columnheader', { name: /tên/i })
page.getByRole('columnheader', { name: /trạng thái/i })
page.getByRole('row').nth(1)                    // first data row (row 0 = header)
// Pagination
page.getByRole('navigation', { name: /phân trang|pagination/i })
page.getByRole('button', { name: /trang sau|next/i })
// Row actions
page.getByRole('button', { name: /sửa/i }).first()
page.getByRole('button', { name: /xóa/i }).first()
```

---

## TC-06 — Search / Filter in Table

**Target page**: `/admin/drivers`
**Pre-condition**: Authenticated; multiple driver records exist.

### TC-06a — Text Search

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Locate search input | `getByPlaceholder(/tìm kiếm/i)` or `getByRole('searchbox')` |
| 2 | Type a driver name | e.g., `"Nguyễn"` |
| 3 | Wait for table to update | Debounced or on Enter — rows filtered to matching results |
| 4 | Verify results | Only rows matching the keyword are shown |
| 5 | Clear search | Clear input → all rows return |

### TC-06b — Status Filter Dropdown

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Click status filter dropdown | `getByRole('combobox', { name: /trạng thái/i })` |
| 2 | Select "available" / "Có mặt" | Option selected |
| 3 | Verify filtered results | Only drivers with selected status are shown |
| 4 | Click "Đặt lại" (reset) button | `getByRole('button', { name: /đặt lại/i })` → all results restored |

**Locators**:
```ts
page.getByRole('textbox', { name: /tìm kiếm/i })
// or
page.getByPlaceholder(/tìm kiếm/i)
// Ant Design Select
page.getByRole('combobox')
// Ant Design Select option in dropdown overlay
page.getByRole('option', { name: /có mặt|available/i })
// Reset
page.getByRole('button', { name: /đặt lại/i })
```

---

## TC-07 — Create Form

**Target resource**: Drivers (`/admin/drivers/create`)
**Pre-condition**: Authenticated as admin.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/drivers` | List page renders |
| 2 | Click "Tạo mới" button | `getByRole('button', { name: /tạo mới/i })` |
| 3 | Verify modal/dialog opens | `getByRole('dialog')` is visible; title contains "Tạo" or "Thêm tài xế" |
| 4 | Fill required fields | Full name, phone number, etc. |
| 5 | Submit form | `getByRole('button', { name: /lưu|tạo mới/i })` inside dialog |
| 6 | Verify success feedback | Success toast/notification appears |
| 7 | Verify dialog closes | `getByRole('dialog')` no longer visible |
| 8 | Verify new record in table | New driver appears in the list |

**Locators**:
```ts
page.getByRole('button', { name: /tạo mới/i })
page.getByRole('dialog')
page.getByRole('dialog').getByLabel(/họ tên|tên tài xế/i)
page.getByRole('dialog').getByLabel(/số điện thoại/i)
page.getByRole('dialog').getByRole('button', { name: /lưu/i })
// Success notification (Ant Design message or notification)
page.getByRole('alert')
```

**Validation sub-test** (TC-07b):

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open create dialog | Dialog is open |
| 2 | Submit empty form | Inline required field errors appear |
| 3 | Verify dialog stays open | `getByRole('dialog')` still visible |

---

## TC-08 — Edit Form

**Target resource**: Drivers
**Pre-condition**: Authenticated as admin; at least 1 driver record exists.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/drivers` | List renders |
| 2 | Click "Sửa" on first row | `getByRole('row').nth(1).getByRole('button', { name: /sửa/i })` |
| 3 | Verify edit modal opens | `getByRole('dialog')` visible; fields pre-populated with existing data |
| 4 | Modify a field | Change phone number or name |
| 5 | Submit | `getByRole('button', { name: /lưu|cập nhật/i })` inside dialog |
| 6 | Verify success feedback | Success toast/notification |
| 7 | Verify updated data in table | Row shows updated value |

**Locators**:
```ts
page.getByRole('row').nth(1).getByRole('button', { name: /sửa/i })
page.getByRole('dialog')
// Pre-populated field — check .inputValue()
page.getByRole('dialog').getByLabel(/họ tên/i)
page.getByRole('dialog').getByRole('button', { name: /cập nhật|lưu/i })
```

**Unsaved changes guard (TC-08b)**:

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open edit dialog and modify a field | Dirty state triggered |
| 2 | Click "Hủy" or the × close button | `getByRole('dialog').getByRole('button', { name: /hủy|đóng/i })` |
| 3 | Verify warning dialog | "Thay đổi chưa lưu" warning modal appears |
| 4 | Click "Đóng và không lưu" | Changes discarded; dialogs close |

---

## TC-09 — Delete Confirmation Modal

**Target resource**: Drivers
**Pre-condition**: Authenticated as admin; at least 1 driver record exists.

### TC-09a — Confirm Delete

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to `/admin/drivers` | List renders |
| 2 | Click "Xóa" on first row | `getByRole('row').nth(1).getByRole('button', { name: /xóa/i })` |
| 3 | Verify confirmation modal opens | `getByRole('dialog')` with title matching "Xác nhận xóa" or `deleteConfirm.title` |
| 4 | Verify modal content | Description text warns about permanent deletion |
| 5 | Click danger "Xóa" button in modal | `getByRole('dialog').getByRole('button', { name: /xóa/i })` |
| 6 | Verify success feedback | Toast/notification confirms deletion |
| 7 | Verify record removed | Row no longer appears in table |

### TC-09b — Cancel Delete

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Open delete confirmation modal | Modal is open |
| 2 | Click "Hủy" | `getByRole('dialog').getByRole('button', { name: /hủy/i })` |
| 3 | Verify modal closes | `getByRole('dialog')` no longer visible |
| 4 | Verify record still exists | Row still present in table |

**Locators**:
```ts
page.getByRole('button', { name: /xóa/i }).first()      // row action
page.getByRole('dialog')                                  // confirmation modal
page.getByRole('dialog').getByRole('button', { name: /xóa/i })   // danger confirm
page.getByRole('dialog').getByRole('button', { name: /hủy/i })   // cancel
```

---

## TC-10 — Empty State

**Workflow**: List page with zero records renders a meaningful empty state.
**Setup**: Use a dedicated test DB state with no driver records, or filter to produce zero results.

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Navigate to a list page with no data | e.g., `/admin/drivers` with empty DB or filter that matches nothing |
| 2 | Verify table renders | `getByRole('table')` still visible |
| 3 | Verify empty state message | Text matching `"Không có dữ liệu"` or the `emptyState.listDescription` locale string is visible |
| 4 | Verify no error state shown | `ErrorState` component (error icon) is NOT present |
| 5 | Verify "Tạo mới" button still available | User can still create a first record |

**Locators**:
```ts
page.getByText(/không có dữ liệu/i)
// Ant Design Table empty state — rendered inside the table body
page.getByRole('table').getByText(/không có dữ liệu/i)
// Fallback: locate the table cell that spans all columns
page.getByRole('cell', { name: /không có dữ liệu/i })
```

**Alternative approach** (no DB teardown needed):
1. Navigate to drivers list.
2. Enter a search term guaranteed to match nothing (e.g., `"ZZZNOMATCH99"`).
3. Assert empty state is shown.

---

## TC-11 — API Error State

**Workflow**: When the backend returns an error, the UI shows a recoverable error state rather than crashing.

### TC-11a — Network Error on List Load

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mock network — intercept `GET /api/drivers` to return 500 | `page.route('**/api/drivers**', r => r.fulfill({ status: 500, body: '{"success":false,"message":"Server error"}' }))` |
| 2 | Navigate to `/admin/drivers` | Page renders |
| 3 | Verify error state component | `ErrorState` text "Something went wrong" or Vietnamese equivalent visible |
| 4 | Verify retry button visible | `getByRole('button', { name: /thử lại|try again/i })` |
| 5 | Restore network and click retry | Normal data loads |

### TC-11b — Create/Save API Error

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Mock `POST /api/drivers` to return 422 with validation errors | `{ success: false, message: "Validation failed" }` |
| 2 | Open create dialog and submit valid-looking form | Request intercepted |
| 3 | Verify error toast | Toast/alert with error message appears |
| 4 | Verify dialog stays open | User can correct and resubmit |

**Playwright route mocking**:
```ts
await page.route('**/api/drivers', async (route) => {
  if (route.request().method() === 'GET') {
    await route.fulfill({
      status: 500,
      contentType: 'application/json',
      body: JSON.stringify({ success: false, message: 'Internal Server Error' }),
    });
  } else {
    await route.continue();
  }
});
```

**Locators**:
```ts
page.getByText(/không thể tải dữ liệu|something went wrong/i)
page.getByRole('button', { name: /thử lại|try again/i })
page.getByRole('alert')   // toast/notification
```

---

## TC-12 — Permission / Unauthorized State

**Workflow**: Accessing admin-only routes as a non-admin user results in a redirect or forbidden message.

### TC-12a — Unauthenticated Access

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Clear all cookies/storage (no auth state) | Logged out state |
| 2 | Navigate directly to `/admin/drivers` | Redirect to `/login` |
| 3 | Verify login page renders | Login form visible |

**Code**:
```ts
test('redirects unauthenticated user to login', async ({ page }) => {
  // No storageState — fresh unauthenticated context
  await page.goto('/admin/drivers');
  await expect(page).toHaveURL(/\/login/);
  await expect(page.getByRole('button', { name: 'Đăng nhập' })).toBeVisible();
});
```

### TC-12b — Non-Admin Accessing Admin-Only Route

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Login as `REGULAR_USER` (non-admin role) | Authenticated |
| 2 | Navigate to `/admin/users` (requiredRole: 'admin') | Redirect to `/dashboard` |
| 3 | Verify cannot access page | URL is `/dashboard`; "Bạn không có quyền" or similar message may appear |

### TC-12c — Session Expiry (401 mid-session)

| Step | Action | Expected Result |
|------|--------|-----------------|
| 1 | Authenticated session | Normal operation |
| 2 | Intercept next API call to return 401 | Mock `page.route` |
| 3 | Trigger an action (navigate or fetch) | Toast: `"Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại."` |
| 4 | Verify redirect to login | URL changes to `/login` |

**Locators**:
```ts
page.getByText(/không có quyền|bạn không có quyền/i)
page.getByText(/phiên đăng nhập đã hết hạn/i)
// Or check redirect
await expect(page).toHaveURL(/\/login/);
await expect(page).toHaveURL(/\/dashboard/);
```

---

## Additional Workflows (Recommended Extensions)

| TC | Workflow | Target Page |
|----|----------|-------------|
| TC-13 | Pagination — click page 2, verify different rows | `/admin/drivers` |
| TC-14 | Detail/Show page — click "Xem", verify `/admin/drivers/show/:id` loads | DriverDetailPage |
| TC-15 | Chat Assistant — open floating chat, send a message, verify response | Any authenticated page |
| TC-16 | Notification badge — unread count shows, clicking "Đọc tất cả" clears it | Header notification bell |
| TC-17 | Forgot password flow — submit email, verify OTP step, reset password | `/forgot-password` |
| TC-18 | Profile page — update display name, verify saved | `/admin/profile` |
| TC-19 | Settings page — toggle theme or locale, verify persistence | `/admin/settings` |
| TC-20 | Payroll list — generate payroll, verify new entry | `/admin/payroll` |

---

## Playwright Config Additions Required

Add to `playwright.config.ts`:

```ts
export default defineConfig({
  testDir: './tests',
  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:5173',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  globalSetup: './tests/global-setup.ts',
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    {
      name: 'setup',
      testMatch: /global-setup\.ts/,
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        storageState: 'playwright/.auth/admin.json',
      },
      dependencies: ['setup'],
    },
    {
      name: 'unauthenticated',
      use: { ...devices['Desktop Chrome'] },
      // No storageState — runs TC-12a
    },
  ],
});
```

---

## File Structure

```
tests/
  global-setup.ts       # Login once, save auth state
  fixtures.ts           # Shared test data constants
  seed.spec.ts          # Seed test (existing placeholder)
  auth.spec.ts          # TC-01, TC-02, TC-12
  dashboard.spec.ts     # TC-03
  navigation.spec.ts    # TC-04
  drivers.spec.ts       # TC-05, TC-06, TC-07, TC-08, TC-09, TC-10, TC-11
playwright/
  .auth/
    admin.json          # Saved auth storage state (git-ignored)
specs/
  main-ui-workflows.md  # This document
```

---

*Generated: 2026-05-14 | Based on ship-app React/TypeScript + Ant Design v5 codebase inspection.*
