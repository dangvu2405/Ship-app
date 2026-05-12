/**
 * Đồng bộ với ship-app-api `routes/api.php`: nhóm `/api/...`.
 * @see ship-app-api/docs/FRONTEND_API_ENDPOINTS.md
 */

import { LEGACY_ROUTES } from '@/routes';

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

/** Bật UI chat khi backend triển khai đầy đủ (mặc định tắt — API trả 501). */
export const CHAT_ENABLED = import.meta.env.VITE_CHAT_ENABLED === 'true';

/** `POST /auth/register` — bật khi backend có route đăng ký public. */
export const REGISTER_ENABLED = import.meta.env.VITE_REGISTER_ENABLED === 'true';

// Versioned localStorage keys - bump version on schema changes
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token:v1',
  REFRESH_TOKEN: 'refresh-token:v1',
  TENANT_ID: 'tenant-id:v1',
  AUTH_STORAGE: 'auth-storage:v1',
  APP_STORAGE: 'app-storage:v1',
} as const;

/**
 * Khi `true`: axios 401 sẽ thử `POST /auth/refresh` (cần refresh token).
 * Mặc định `false`: không refresh — 401 → xóa phiên và chuyển login (phù hợp tự động logout / chỉ access token).
 */
export const AUTH_REFRESH_ENABLED = import.meta.env.VITE_AUTH_REFRESH_ENABLED === 'true';

// Auto-login is opt-in only via env flag
export const AUTO_LOGIN_ENABLED = import.meta.env.VITE_AUTO_LOGIN === 'true';

// Demo credentials — only rendered when TEST_ACCOUNTS_ENABLED is true (dev only)
export const DEMO_EMAIL = import.meta.env.VITE_DEMO_EMAIL ?? '';
export const DEMO_PASSWORD = import.meta.env.VITE_DEMO_PASSWORD ?? '';
export const TEST_ACCOUNTS_ENABLED = import.meta.env.VITE_TEST_ACCOUNTS === 'true';
export const GOOGLE_OAUTH_CLIENT_ID = import.meta.env.VITE_GOOGLE_OAUTH_CLIENT_ID?.trim() ?? '';

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
