import { STORAGE_KEYS } from '@/utils/constants';

export const getAuthToken = (): string | null => {
  // Rely on HttpOnly cookies for security. 
  // Returning null here forces Axios to not send the Authorization header,
  // allowing the browser to send the session cookie instead.
  return null;
};

export const getRefreshToken = (): string | null => {
  return null;
};

export const hasAuthToken = (): boolean => {
  // We can't check HttpOnly cookies from JS. 
  // We'll rely on the auth store's isAuthenticated state instead.
  return false; 
};

/** persistent=true (default) → localStorage. persistent=false → sessionStorage. */
export const setAuthToken = (token: string): void => {
  void token;
  // No-op: Token is now handled by HttpOnly cookies from the backend.
};

/** persistent=true (default) → localStorage. persistent=false → sessionStorage. */
export const setRefreshToken = (token: string): void => {
  void token;
  // No-op
};

export const clearAuthToken = (): void => {
  localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.TENANT_ID);
  sessionStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
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
