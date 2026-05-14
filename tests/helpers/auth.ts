/**
 * Auth helper utilities shared across E2E specs.
 */

import type { Page } from '@playwright/test';
import { expect } from '@playwright/test';
import { TEST_USERS } from '../fixtures';

/** Fill login form and submit. Does not assert post-login state. */
export async function login(page: Page, email = TEST_USERS.admin.email, password = TEST_USERS.admin.password) {
  await page.goto('/login');

  const emailField = page.getByLabel(/email/i).or(page.getByPlaceholder(/email/i)).first();
  const passwordField = page.getByLabel(/mật khẩu|password/i).first();
  const submitBtn = page.getByRole('button', { name: /đăng nhập|login/i });

  await emailField.fill(email);
  await passwordField.fill(password);
  await submitBtn.click();
}

/**
 * If the app shows a tenant/company selector after login, choose the first option.
 * Called after a real login (global-setup or integration tests with a live backend).
 */
export async function selectTenantIfNeeded(page: Page) {
  const isTenantPage = page.url().includes('/select-tenant');
  if (!isTenantPage) return;

  // Try radio-based selector first, then button-based
  const firstRadio = page.getByRole('radio').first();
  if (await firstRadio.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await firstRadio.click();
  }

  const confirmBtn = page.getByRole('button', { name: /chọn|tiếp tục|confirm|select|continue/i }).first();
  if (await confirmBtn.isVisible({ timeout: 3_000 }).catch(() => false)) {
    await confirmBtn.click();
  }
}

/** Assert the app shell (sidebar + header) is present — confirming authenticated state. */
export async function expectAuthenticatedApp(page: Page) {
  await expect(page.locator('aside').first()).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('header').first()).toBeVisible();
}
