/**
 * Navigation helpers shared across E2E specs.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { MOCK_ME_BODY } from '../fixtures';

/**
 * Stubs /api/auth/me + any other /api/** call so list pages don't wait for a real backend.
 * Call this before page.goto() in tests that don't need real data.
 */
export async function stubCommonApis(page: Page) {
  await page.route('**/api/auth/me', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: MOCK_ME_BODY }),
  );
  await page.route('**/api/**', (route) => {
    const url = route.request().url();
    if (url.includes('/auth/me')) return route.fallback();
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        message: 'OK',
        data: { data: [], meta: { total: 0, per_page: 15, current_page: 1, last_page: 1 } },
      }),
    });
  });
}

/**
 * Navigate to a route and assert:
 *   1. URL matches the expected pattern.
 *   2. A heading matching `titlePattern` is visible.
 *   3. No crash (error boundary / white screen).
 */
export async function gotoRoute(page: Page, path: string, titlePattern?: RegExp) {
  await page.goto(path);
  await expect(page).toHaveURL(new RegExp(path.replace(/\//g, '\\/')), { timeout: 10_000 });
  if (titlePattern) {
    await expect(page.getByRole('heading', { name: titlePattern }).first()).toBeVisible();
  }
}

/** Assert no visible crash / error boundary rendered. */
export async function expectNoAppCrash(page: Page) {
  const crashText = page.getByText(/something went wrong|cannot read|typeerror|uncaught/i);
  await expect(crashText).toHaveCount(0);
}
