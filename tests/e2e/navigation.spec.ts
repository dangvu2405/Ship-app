/**
 * TC-04 — Main Sidebar / Menu Navigation
 *
 * Verifies that clicking sidebar menu items navigates to the correct route
 * and that the sidebar can be collapsed and expanded.
 *
 * Spec reference: specs/main-ui-workflows.md § TC-04
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY } from '../fixtures';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const sidebarWidth = (page: import('@playwright/test').Page) =>
  page.locator('aside').first().evaluate((el) => Math.round(el.getBoundingClientRect().width));

/** Stub API endpoints that a list page calls on mount so it doesn't time out. */
async function stubListApis(page: import('@playwright/test').Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  // Generic 200 stub for any other API requests (reports, vehicles, customers …)
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me')) return route.fallback(); // already handled
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } }),
    });
  });
}

// ─── TC-04 — Navigation ───────────────────────────────────────────────────────
test.describe('TC-04 — Sidebar Menu Navigation', () => {
  // ── TC-04a: Navigate to Drivers ─────────────────────────────────────────
  test('TC-04a navigates to Drivers list via sidebar', async ({ page }) => {
    await stubListApis(page);
    // [spec TC-04a step 1] Start from dashboard
    await page.goto('/dashboard');

    // [spec TC-04a step 2] Locate and click "Tài xế" menu item.
    // AppSidebar renders Ant Design <Menu> → items become role="menuitem".
    // Parent group "Nhân sự" or similar may need expanding first.
    const driversItem = page.getByRole('menuitem', { name: /tài xế/i });

    // If the item is inside a collapsed SubMenu, expand the parent first.
    if (!(await driversItem.isVisible())) {
      // Try common parent labels
      for (const parent of [/nhân sự/i, /vận hành/i, /đội xe/i]) {
        const parentItem = page.getByRole('menuitem', { name: parent });
        if (await parentItem.isVisible()) {
          await parentItem.click();
          break;
        }
      }
    }

    await driversItem.click();

    // [spec TC-04a step 3–4] URL and heading
    await expect(page).toHaveURL(/\/admin\/drivers/);
    await expect(page.getByRole('heading', { name: /tài xế/i }).first()).toBeVisible();
  });

  // ── TC-04b: Navigate to Vehicles ─────────────────────────────────────────
  test('TC-04b navigates to Vehicles list via sidebar', async ({ page }) => {
    await stubListApis(page);
    await page.goto('/dashboard');

    const vehiclesItem = page.getByRole('menuitem', { name: /phương tiện|đội xe|xe/i }).first();
    if (!(await vehiclesItem.isVisible())) {
      // Expand parent if needed
      const parent = page.getByRole('menuitem', { name: /vận hành|đội xe/i }).first();
      if (await parent.isVisible()) await parent.click();
    }
    await vehiclesItem.click();

    await expect(page).toHaveURL(/\/admin\/vehicles/);
  });

  // ── TC-04c: Navigate to Trips ─────────────────────────────────────────────
  test('TC-04c navigates to Trips list via sidebar', async ({ page }) => {
    await stubListApis(page);
    await page.goto('/dashboard');

    const tripsItem = page.getByRole('menuitem', { name: /chuyến xe|chuyến/i }).first();
    await tripsItem.click();

    await expect(page).toHaveURL(/\/admin\/trips/);
  });

  // ── TC-04d: Sidebar collapse/expand via toggle button ────────────────────
  test('TC-04d sidebar collapses and expands via toggle button', async ({ page }) => {
    await stubListApis(page);
    await page.goto('/dashboard');

    // The SiteHeader renders a toggle button for the sidebar.
    // Accessible name comes from t('common.toggleSidebar') = 'Chuyển đổi thanh bên'
    const toggleBtn = page.getByRole('button', { name: /chuyển đổi thanh bên|toggle sidebar|menu/i });

    // [spec TC-04d step 1] Sidebar starts visible. Its open/collapsed state is persisted.
    const aside = page.locator('aside').first();
    const widthBefore = await sidebarWidth(page);
    expect(widthBefore).toBeGreaterThan(50);

    // [spec TC-04d step 2] Toggle once.
    await toggleBtn.click();

    // Width changes between expanded and icon-only mode.
    await expect(aside).toBeVisible(); // still in DOM
    await expect.poll(() => sidebarWidth(page), { timeout: 3_000 }).not.toBe(widthBefore);

    // [spec TC-04d step 3] Toggle back.
    await toggleBtn.click();
    await expect.poll(() => sidebarWidth(page), { timeout: 3_000 }).toBe(widthBefore);
  });

  // ── TC-04e: Keyboard shortcut Ctrl+B ─────────────────────────────────────
  test('TC-04e Ctrl+B keyboard shortcut toggles sidebar', async ({ page }) => {
    await stubListApis(page);
    await page.goto('/dashboard');

    const widthBefore = await sidebarWidth(page);

    // [spec TC-04e step 3] Press Ctrl+B
    await page.locator('body').click();
    await page.keyboard.press('Control+B');

    // Width changed (could collapse or expand depending on initial state)
    await expect.poll(() => sidebarWidth(page), { timeout: 3_000 }).not.toBe(widthBefore);
  });
});
