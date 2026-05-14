import { STORAGE_KEYS } from '@/utils/constants';

// Access token: always sessionStorage (tab-scoped, reduces XSS persistence window).
// Refresh token: localStorage only when rememberMe=true, otherwise sessionStorage.
let rememberRefresh = false;

const refreshStorage = () => (rememberRefresh ? localStorage : sessionStorage);

export const getAuthToken = (): string | null => {
  return sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const getRefreshToken = (): string | null => {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
    ?? sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

export const setAuthToken = (token: string, rememberMe = true): void => {
  rememberRefresh = rememberMe;
  sessionStorage.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const setRefreshToken = (token: string, rememberMe = true): void => {
  rememberRefresh = rememberMe;
  refreshStorage().setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
  // Clear from the other storage to avoid stale tokens
  if (rememberMe) {
    sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  } else {
    localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  }
};

export const clearAuthToken = (): void => {
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  sessionStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const getTenantId = (): number | null => {
  const raw = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
  return raw ? Number(raw) : null;
};

export const setTenantId = (id: number): void => {
  localStorage.setItem(STORAGE_KEYS.TENANT_ID, String(id));
};

export const clearTenantId = (): void => {
  localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
};
