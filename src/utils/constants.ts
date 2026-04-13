/**
 * Đồng bộ với ship-app-api `routes/api.php`: nhóm versioned `/api/v1/...`.
 * @see ship-app-api/docs/FRONTEND_API_ENDPOINTS.md
 */

import { LEGACY_ROUTES } from '@/routes';

function resolveApiPrefix(): string {
  const p = import.meta.env.VITE_API_PREFIX?.trim();
  if (p) {
    return p.startsWith('/') ? p : `/${p}`;
  }
  return '/api/v1';
}

/** Gốc REST versioned (axios baseURL), mặc định `/api/v1` — khớp `VITE_API_PREFIX` trong FRONTEND_API_ENDPOINTS. */
export const API_PREFIX = resolveApiPrefix();

function trimTrailingSlashes(s: string): string {
  return s.replace(/\/+$/, '');
}

/**
 * Bỏ segment phiên bản (`/v1`, `/v2`, …) ở cuối base → `/api` (gọi `/api/health`, `/api/v2/...`).
 */
export function resolveApiRootBaseUrl(versionedBase: string): string {
  const t = trimTrailingSlashes(versionedBase);
  const stripped = t.replace(/\/v\d+\/?$/, '');
  return stripped || '/api';
}

/** Origin backend: scheme + host + port, không có path (khớp APP_URL của Laravel). */
const DEFAULT_API_ORIGIN = 'http://localhost:8080';

/** Chuẩn hóa env cũ kết thúc `/api` thành `/api/v1`. */
function normalizeExplicitApiBase(url: string): string {
  const t = trimTrailingSlashes(url);
  if (/\/api$/i.test(t) && !/\/v1$/i.test(t)) {
    return `${t}/v1`;
  }
  return t;
}

/**
 * Base URL cho axios / Refine simple-rest:
 * 1. `VITE_API_BASE_URL` — …/api/v1 (hoặc …/api → tự thêm /v1).
 * 2. Dev: `/api/v1` → Vite proxy `/api` tới backend.
 * 3. Prod: `VITE_API_ORIGIN` + `VITE_API_PREFIX` (mặc định `/api/v1`).
 */
function resolveApiBaseUrl(): string {
  const explicit = import.meta.env.VITE_API_BASE_URL?.trim();
  if (explicit) {
    return normalizeExplicitApiBase(explicit);
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

/** Gốc `/api` (không có /v1) — dùng với `useApiRoot` trên axios. */
export const API_ROOT_BASE_URL = resolveApiRootBaseUrl(API_BASE_URL);

const normalizeApiPath = (path: string): string => {
  const trimmed = path.trim();
  if (!trimmed) return '';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

/** Cấu hình forgot-password endpoint (backend có thể mở sau). */
export const AUTH_FORGOT_PASSWORD = {
  sendEnabled: import.meta.env.VITE_AUTH_FORGOT_PASSWORD_SEND_ENABLED !== 'false',
  verifyEnabled: import.meta.env.VITE_AUTH_FORGOT_PASSWORD_VERIFY_ENABLED === 'true',
  sendPath: normalizeApiPath(import.meta.env.VITE_AUTH_FORGOT_PASSWORD_PATH || '/auth/forgot-password'),
  verifyPath: normalizeApiPath(import.meta.env.VITE_AUTH_FORGOT_PASSWORD_VERIFY_PATH || '/auth/reset-password'),
} as const;

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
