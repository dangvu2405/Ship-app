#!/usr/bin/env node
/**
 * Chụp màn hình các trang chính.
 *
 * Cần Laravel API (mặc định proxy tới :8080) và Vite :3000.
 * Nếu `.env` có `VITE_API_BASE_URL=http://127.0.0.1:8000/api` thì trình duyệt sẽ gọi thẳng :8000
 * và bạn sẽ chỉ thấy trang login + toast "Network error". Hãy chạy Vite một trong hai cách:
 *   VITE_API_BASE_URL= VITE_API_ORIGIN=http://127.0.0.1:8080 npm run dev
 * hoặc: npm run dev:api-proxy
 *
 * Chạy script: npm run screenshots
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.join(__dirname, '..');
const outDir = path.join(rootDir, 'screenshots');
fs.mkdirSync(outDir, { recursive: true });

const BASE = (process.env.SCREENSHOT_BASE_URL || 'http://127.0.0.1:3000').replace(/\/$/, '');
const AUTH_EMAIL = process.env.SCREENSHOT_EMAIL || 'admin@abctransport.com';
const AUTH_PASSWORD = process.env.SCREENSHOT_PASSWORD || 'password';
const LS_TOKEN_KEY = 'auth-token:v1';

const PAGES_AUTHENTICATED = [
  ['/dashboard', '02-dashboard'],
  ['/admin/companies', '03-admin-companies'],
  ['/admin/offices', '04-admin-offices'],
  ['/admin/departments', '05-admin-departments'],
  ['/admin/positions', '06-admin-positions'],
  ['/admin/employees', '07-admin-employees'],
  ['/admin/vehicles', '08-admin-vehicles'],
  ['/admin/trips', '09-admin-trips'],
  ['/admin/customers', '10-admin-customers'],
  ['/admin/drivers', '11-admin-drivers'],
  ['/admin/invoices', '12-admin-invoices'],
  ['/admin/vehicle_assignments', '13-admin-vehicle-assignments'],
  ['/admin/vehicle_expenses', '14-admin-vehicle-expenses'],
  ['/admin/allowances', '15-admin-allowances'],
  ['/admin/deductions', '16-admin-deductions'],
  ['/admin/attendances', '17-admin-attendances'],
  ['/admin/payrolls', '18-admin-payrolls'],
  ['/admin/reports', '19-admin-reports'],
  ['/admin/users', '20-admin-users'],
  ['/admin/roles', '21-admin-roles'],
  ['/admin/profile', '22-admin-profile'],
  ['/admin/settings', '23-admin-settings'],
];

async function fetchToken() {
  const r = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
    body: JSON.stringify({ email: AUTH_EMAIL, password: AUTH_PASSWORD }),
  });
  if (!r.ok) {
    throw new Error(`Login API ${r.status}: ${await r.text()}`);
  }
  const body = await r.json();
  const token = body?.data?.token;
  if (!token || typeof token !== 'string') {
    throw new Error('Login response missing data.token');
  }
  return token;
}

async function main() {
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  const view = { width: 1440, height: 900 };

  // --- 01: Login (không token, không Zustand persist cũ) ---
  const ctxLogin = await browser.newContext({ viewport: view });
  const pageLogin = await ctxLogin.newPage();
  await pageLogin.goto('about:blank');
  await ctxLogin.clearCookies();
  await pageLogin.goto(`${BASE}/login`, { waitUntil: 'domcontentloaded', timeout: 120000 });
  await pageLogin.evaluate(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {
      /* ignore */
    }
  });
  await pageLogin.reload({ waitUntil: 'domcontentloaded', timeout: 120000 });
  await pageLogin.waitForTimeout(2500);
  const loginPath = path.join(outDir, '01-login.png');
  await pageLogin.screenshot({ path: loginPath, fullPage: true });
  console.error(`Capturing 01-login ← ${BASE}/login\n  → ${loginPath}`);
  await ctxLogin.close();

  const token = await fetchToken();

  // storageState khôi phục localStorage đúng chuẩn Playwright (ổn định hơn addInitScript)
  const storageState = {
    cookies: [],
    origins: [
      {
        origin: BASE,
        localStorage: [{ name: LS_TOKEN_KEY, value: token }],
      },
    ],
  };

  const ctxApp = await browser.newContext({ viewport: view, storageState });

  const page = await ctxApp.newPage();

  for (const [urlPath, fileBase] of PAGES_AUTHENTICATED) {
    const url = `${BASE}${urlPath}`;
    console.error(`Capturing ${fileBase} ← ${url}`);
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 120000 });
    await page.waitForTimeout(4000);
    const outPath = path.join(outDir, `${fileBase}.png`);
    await page.screenshot({ path: outPath, fullPage: true });
    console.error(`  → ${outPath}`);
  }

  await ctxApp.close();
  await browser.close();
  console.error(`\nDone. ${1 + PAGES_AUTHENTICATED.length} images in ${outDir}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
