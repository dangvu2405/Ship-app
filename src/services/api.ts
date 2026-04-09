import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, API_ROOT_BASE_URL, STORAGE_KEYS } from '@/utils/constants';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { clearAuthToken } from '@/lib/auth-session';
import {
  ErrorMode,
  getErrorStatus,
  shouldHandleGlobalErrorToast,
  isNetworkError,
  isTimeoutError,
} from '@/utils/errorHandler';

// Extend AxiosRequestConfig to support custom config
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean; // Skip automatic toast notification
    skipErrorToast?: boolean; // Skip only error toast
    errorMode?: ErrorMode; // Controls which layer owns error UI: global | local | silent
    /** Gọi dưới `/api` (vd `/api/v2/...`), không dùng base `/api/v1`. */
    useApiRoot?: boolean;
  }
}

const TOAST_DEDUPE_WINDOW_MS = 1500;
const toastTimestamps = new Map<string, number>();

const showDedupedErrorToast = (key: string, message: string) => {
  const now = Date.now();
  const lastShown = toastTimestamps.get(key);

  if (lastShown && now - lastShown < TOAST_DEDUPE_WINDOW_MS) {
    return;
  }

  toastTimestamps.set(key, now);
  toast.error(message);
};

const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
  withCredentials: true, // For HttpOnly cookies
});

// Request interceptor
api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { useApiRoot?: boolean }) => {
    if (config.useApiRoot) {
      config.baseURL = API_ROOT_BASE_URL;
      delete config.useApiRoot;
    }
    // Get token from localStorage (set by authProvider after login)
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Centralized error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      skipToast?: boolean;
      skipErrorToast?: boolean;
      errorMode?: ErrorMode;
    };
    const errorMode = config?.errorMode ?? 'global';
    
    // Skip toast if explicitly requested or already shown
    const errorWithFlag = error as AxiosError & { __toastShown?: boolean };
    if (
      config?.skipToast ||
      config?.skipErrorToast ||
      errorMode === 'silent' ||
      errorWithFlag.__toastShown
    ) {
      return Promise.reject(error);
    }

    if (!shouldHandleGlobalErrorToast(error, errorMode)) {
      return Promise.reject(error);
    }

    // Mark that toast has been shown to prevent duplicate
    errorWithFlag.__toastShown = true;
    const status = getErrorStatus(error);

    if (status === 401) {
      clearAuthToken();
      showDedupedErrorToast('401-session-expired', 'Session expired. Please login again.');
      if (window.location.pathname !== ROUTES.login) {
        window.location.href = ROUTES.login;
      }
    } else if (status === 403) {
      showDedupedErrorToast('403-forbidden', 'Permission denied');
    } else if (typeof status === 'number' && status >= 500) {
      showDedupedErrorToast(`5xx-${status}`, 'Server error. Please try again later.');
    } else if (isTimeoutError(error)) {
      showDedupedErrorToast('timeout', 'Request timeout. Please try again.');
    } else if (isNetworkError(error)) {
      showDedupedErrorToast('network-error', 'Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
