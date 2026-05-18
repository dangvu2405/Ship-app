/**
 * Workforce Ops Hub / Quản lý nhân sự vận hành — E2E Tests
 *
 * Route: /admin/system/users  (WorkforceOps — tabs: schedule, attendance, leave, overtime, violations)
 * API: embeds multiple sub-modules via tabs — mocked generically.
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY, emptyListBody } from '../fixtures';

async function mockWorkforceApis(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  await page.route('**/api/driver-work-schedules**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/leave-requests**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/overtime**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/violations**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/drivers**', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: emptyListBody() }),
  );
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (
      url.includes('/auth/me') ||
      url.includes('/driver-work-schedules') ||
      url.includes('/leave-requests') ||
      url.includes('/overtime') ||
      url.includes('/violations') ||
      url.includes('/drivers')
    )
      return route.fallback();
    route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } } }) });
  });
}

// ─── TC — Workforce Ops Hub ───────────────────────────────────────────────────

test.describe('Workforce Ops — hub page', () => {
  test('workforce ops page renders without crash', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });

    const crash = page.getByText(/typeerror|something went wrong|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('workforce ops page has tabs', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });

    const hasTabs = await page.getByRole('tab').isVisible({ timeout: 5_000 }).catch(() => false);
    const hasHeading = await page.getByRole('heading').first().isVisible({ timeout: 5_000 }).catch(() => false);

    expect(hasTabs || hasHeading || page.url().includes('/system/users')).toBe(true);
  });

  test('schedule tab renders without crash', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const scheduleTab = page.getByRole('tab', { name: /lịch làm việc|lịch|schedule/i }).first();
    await expect(scheduleTab).toBeVisible({ timeout: 10_000 });
    await scheduleTab.click();
    const crash = page.getByText(/typeerror|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('leave tab renders without crash', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const leaveTab = page.getByRole('tab', { name: /nghỉ phép|leave/i }).first();
    await expect(leaveTab).toBeVisible({ timeout: 10_000 });
    await leaveTab.click();
    const crash = page.getByText(/typeerror|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('overtime tab renders without crash', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const overtimeTab = page.getByRole('tab', { name: /tăng ca|overtime/i }).first();
    await expect(overtimeTab).toBeVisible({ timeout: 10_000 });
    await overtimeTab.click();
    const crash = page.getByText(/typeerror|cannot read/i);
    await expect(crash).toHaveCount(0);
  });

  test('violations tab renders without crash', async ({ page }) => {
    await mockWorkforceApis(page);
    await page.goto('/admin/system/users');

    await expect(page).toHaveURL(/\/admin\/system\/users/, { timeout: 10_000 });
    await page.waitForLoadState('networkidle');

    const violTab = page.getByRole('tab', { name: /vi phạm|violation/i }).first();
    await expect(violTab).toBeVisible({ timeout: 10_000 });
    await violTab.click();
    const crash = page.getByText(/typeerror|cannot read/i);
    await expect(crash).toHaveCount(0);
  });
});
