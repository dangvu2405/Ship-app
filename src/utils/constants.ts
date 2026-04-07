/**
 * Đồng bộ URI với Laravel (routes/api.php → prefix `api`).
 * @see ship-app-api/config/ship.php — API_URI_PREFIX (mặc định `api`)
 */

import { LEGACY_ROUTES } from '@/routes';

/** Luôn `/api` trừ khi bạn đổi API_URI_PREFIX ở backend và sửa giá trị này. */
export const API_PREFIX = '/api' as const;

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

/** Origin backend: scheme + host + port, không có path (khớp APP_URL của Laravel). */
const DEFAULT_API_ORIGIN = 'http://localhost:8080';

/**
 * Giải quyết base URL cho axios / Refine:
 * 1. `VITE_API_BASE_URL` — URL đầy đủ …/api (ghi đè mọi quy tắc).
 * 2. Dev: luôn `/api` → cùng origin với Vite, proxy tới backend (target: `VITE_API_ORIGIN` trong vite.config).
 * 3. Build production: `VITE_API_ORIGIN` + API_PREFIX, hoặc mặc định Docker :8080.
 */
function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicit) {
    return trimTrailingSlashes(explicit);
  }

  if (import.meta.env.DEV) {
    return API_PREFIX;
  }

  const origin =
    import.meta.env.VITE_API_ORIGIN?.trim() ||
    import.meta.env.VITE_PROXY_TARGET?.trim() ||
    '';
  const prodOrigin = origin || DEFAULT_API_ORIGIN;
  return `${trimTrailingSlashes(prodOrigin)}${API_PREFIX}`;
}

export const API_BASE_URL = resolveApiBaseUrl();

// Versioned localStorage keys - bump version on schema changes
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token:v1',
} as const;

// Auto-login is opt-in only via env flag
export const AUTO_LOGIN_ENABLED = import.meta.env.VITE_AUTO_LOGIN === 'true';

// Demo credentials (can be overridden via env variables)
export const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL || 'admin@abctransport.com';
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD || 'password';
export const TEST_ACCOUNTS_ENABLED = import.meta.env.VITE_TEST_ACCOUNTS === 'true';

export const ROUTES = LEGACY_ROUTES;

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
} as const;

export const PERMISSIONS = {
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_APPROVE: 'payroll.approve',
  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_CREATE: 'employee.create',
  TRIP_VIEW: 'trip.view',
  TRIP_CREATE: 'trip.create',
} as const;
