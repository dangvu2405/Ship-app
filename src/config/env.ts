/**
 * API base URL equals normalized `{VITE_API_ORIGIN}{VITE_API_BASE_URL}`
 * (e.g. `http://localhost:8080` + `/api` → `http://localhost:8080/api`).
 * Exported as {@link ENV.API_BASE_URL}.
 */
const getEnv = (key: string, defaultValue = ''): string => {
  const value = import.meta.env[key];
  if (typeof value === 'string') {
    return value.trim() || defaultValue;
  }
  return value != null ? String(value) : defaultValue;
};

const normalizeOrigin = (origin: string): string => origin.replace(/\/+$/, '');
const normalizeApiPrefix = (prefix: string): string => {
  const trimmed = prefix.trim();
  if (!trimmed) return '/api';
  return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
};

const IS_DEV = import.meta.env.DEV;
const API_ORIGIN = normalizeOrigin(getEnv('VITE_API_ORIGIN', 'http://localhost:8080'));
const API_PREFIX = normalizeApiPrefix(getEnv('VITE_API_BASE_URL', '/api'));
const API_BASE_URL = `${API_ORIGIN}${API_PREFIX}`;
const API_ROOT_URL = `${API_ORIGIN}/`;

export const buildApiUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_BASE_URL}${normalizedPath}`;
};

export const buildOriginUrl = (path: string): string => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${API_ORIGIN}${normalizedPath}`;
};

export const ENV = {
  IS_DEV,
  API_ORIGIN,
  API_PREFIX,
  API_BASE_URL,
  API_ROOT_URL,
  GOOGLE_OAUTH_CLIENT_ID: getEnv('VITE_GOOGLE_OAUTH_CLIENT_ID'),
  AXIOS_TIMEOUT_MS: Number(getEnv('VITE_API_TIMEOUT_MS', '30000')),
};
