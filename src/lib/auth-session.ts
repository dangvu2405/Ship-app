import { STORAGE_KEYS } from '@/utils/constants';

export const getAuthToken = (): string | null => {
  return (
    localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN) ??
    sessionStorage.getItem(STORAGE_KEYS.AUTH_TOKEN)
  );
};

export const getRefreshToken = (): string | null => {
  return (
    localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN) ??
    sessionStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN)
  );
};

export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

/** persistent=true (default) → localStorage (survives browser restart). persistent=false → sessionStorage (cleared when tab closes). */
export const setAuthToken = (token: string, persistent = true): void => {
  const store = persistent ? localStorage : sessionStorage;
  store.setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

/** persistent=true (default) → localStorage. persistent=false → sessionStorage. */
export const setRefreshToken = (token: string, persistent = true): void => {
  const store = persistent ? localStorage : sessionStorage;
  store.setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
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
