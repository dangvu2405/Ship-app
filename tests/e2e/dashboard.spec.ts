/**
 * TC-03 — Dashboard Loads Correctly
 *
 * Verifies that after login the dashboard page renders its structural shell
 * (sidebar, header, main content area) without runtime errors.
 * Data cards (KPI metrics) depend on API responses; this test only asserts
 * layout presence so it stays green even when the data API is slow/offline.
 *
 * Spec reference: specs/main-ui-workflows.md § TC-03
 */

import { test, expect } from '@playwright/test';
import { MOCK_ME_BODY } from '../fixtures';

test.describe('TC-03 — Dashboard Loads Correctly', () => {
  test.beforeEach(async ({ page }) => {
    // Ensure the auth refresh endpoint always succeeds so the app
    // keeps us logged in regardless of backend token expiry.
    await page.route('**/api/auth/me', (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: MOCK_ME_BODY,
      }),
    );
    await page.route('**/api/**', (route) => {
      const url = route.request().url();
      if (url.includes('/auth/me')) return route.fallback();
      return route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true, message: 'OK', data: { data: [], meta: { total: 0 } } }),
      });
    });
  });

  test('[TC-03] sidebar navigation is visible', async ({ page }) => {
    // [spec TC-03 step 1] Navigate to dashboard
    await page.goto('/dashboard');

    // [spec TC-03 step 4] Left sidebar renders
    // AppLayout wraps the sidebar in an Ant Design <Sider> → renders as <aside>
    await expect(page.locator('aside, [class*="sider"]').first()).toBeVisible();
  });

  test('[TC-03] header/top-bar is visible', async ({ page }) => {
    await page.goto('/dashboard');

    // [spec TC-03 step 5] Top header renders
    // SiteHeader is inside an Ant Design <Header> element → rendered as <header>
    await expect(page.locator('header').first()).toBeVisible();
  });

  test('[TC-03] main content area renders without crashing', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    // [spec TC-03 step 1] Navigate
    await page.goto('/dashboard');

    // [spec TC-03 step 2] At least one content element in the main area
    const main = page.locator('main, [class*="content"]').first();
    await expect(main).toBeVisible();

    // [spec TC-03 step 6] No uncaught JS errors
    // Filter out network errors from APIs that aren't mocked — those are expected.
    const jsErrors = consoleErrors.filter(
      (e) =>
        !e.includes('Failed to fetch') &&
        !e.includes('NetworkError') &&
        !e.includes('Failed to load resource'),
    );
    expect(jsErrors).toHaveLength(0);
  });

  test('[TC-03] page title contains "Dashboard" or app name', async ({ page }) => {
    await page.goto('/dashboard');
    // The document title should contain the app name or page name.
    await expect(page).toHaveTitle(/ship erp|dashboard/i);
  });
});
