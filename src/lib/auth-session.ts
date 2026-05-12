import { STORAGE_KEYS } from '@/utils/constants';

let remember = false;

const getStorage = () => {
  return remember ? localStorage : sessionStorage;
};

export const getAuthToken = (): string | null => {
  return getStorage().getItem(STORAGE_KEYS.AUTH_TOKEN);
};

export const getRefreshToken = (): string | null => {
  return getStorage().getItem(STORAGE_KEYS.REFRESH_TOKEN);
};

export const hasAuthToken = (): boolean => {
  return !!getAuthToken();
};

export const setAuthToken = (token: string, rememberMe = true): void => {
  remember = rememberMe;
  getStorage().setItem(STORAGE_KEYS.AUTH_TOKEN, token);
};

export const setRefreshToken = (token: string, rememberMe = true): void => {
  remember = rememberMe;
  getStorage().setItem(STORAGE_KEYS.REFRESH_TOKEN, token);
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
