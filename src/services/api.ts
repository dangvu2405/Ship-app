import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL, API_ROOT_BASE_URL, AUTH_REFRESH_ENABLED, STORAGE_KEYS } from '@/utils/constants';
import { createDedupedCaller } from '@/utils/dedupe';
import toast from 'react-hot-toast';
import { clearAuthToken, getAuthToken, getRefreshToken, getTenantId, setAuthToken, setRefreshToken } from '@/lib/auth-session';
import { ENDPOINTS } from '@/services/endpoints';
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
    /** Gọi trực tiếp dưới gốc `/api`, bỏ qua baseURL của instance. */
    useApiRoot?: boolean;
    /** @internal — set by refresh interceptor to prevent infinite retry loop. */
    _retry?: boolean;
  }
}

const shouldShowToast = createDedupedCaller(1500);
const showDedupedErrorToast = (key: string, message: string) => {
  if (shouldShowToast(key)) toast.error(message);
};

export function extractFilenameFromContentDisposition(contentDisposition?: string): string | null {
  if (!contentDisposition) return null;

  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }

  const asciiMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (asciiMatch?.[1]) {
    return asciiMatch[1].replace(/["']/g, '').trim();
  }

  return null;
}

export function downloadBlobFile(blob: Blob, filename: string) {
  const objectUrl = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = objectUrl;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(objectUrl);
}

// ── 409 Conflict type → user-facing messages (bilingual EN/VI) ───────────────
const CONFLICT_MESSAGES: Record<string, { en: string; vi: string }> = {
  already_approved:     { en: 'Already approved by someone else. Please refresh the page.', vi: 'Đã được duyệt bởi người khác. Vui lòng làm mới trang.' },
  currently_calculating:{ en: 'Currently being calculated. Please try again in 30 seconds.', vi: 'Đang được tính toán. Vui lòng thử lại sau 30 giây.' },
  state_changed:        { en: 'State has changed. Please refresh the page.', vi: 'Trạng thái đã thay đổi. Vui lòng làm mới trang.' },
  already_locked:       { en: 'Locked by another admin. Please refresh the page.', vi: 'Đã bị khóa bởi admin khác. Vui lòng làm mới trang.' },
  already_paid:         { en: 'Already paid. Cannot be changed.', vi: 'Đã được thanh toán. Không thể thay đổi.' },
  duplicate_entry:      { en: 'Duplicate record. Please check again.', vi: 'Bản ghi trùng lặp. Vui lòng kiểm tra lại.' },
};

let _cachedLocale: 'en' | 'vi' | null = null;
const getUiLocale = (): 'en' | 'vi' => {
  if (_cachedLocale !== null) return _cachedLocale;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_STORAGE);
    if (raw) _cachedLocale = (JSON.parse(raw)?.state?.locale as 'en' | 'vi') ?? 'vi';
  } catch { /* ignore */ }
  return _cachedLocale ?? 'vi';
};
export const clearLocaleCache = () => { _cachedLocale = null; };

const get409Message = (error: AxiosError): string => {
  const data = error.response?.data as { conflict_type?: string; message?: string } | undefined;
  const conflictType = data?.conflict_type;
  const locale = getUiLocale();
  if (conflictType && CONFLICT_MESSAGES[conflictType]) {
    return CONFLICT_MESSAGES[conflictType][locale];
  }
  return data?.message || (locale === 'en' ? 'Business conflict. Please refresh and try again.' : 'Xung đột nghiệp vụ. Vui lòng làm mới và thử lại.');
};

// ── Token refresh queue ───────────────────────────────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (token: string) => void;
  reject: (error: unknown) => void;
}> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
};

const forceLogout = () => {
  clearAuthToken();
  const msg = getUiLocale() === 'en'
    ? 'Session expired. Please log in again.'
    : 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  showDedupedErrorToast('401-session-expired', msg);
  window.dispatchEvent(new CustomEvent('auth:force-logout'));
};

/** Attempt to refresh access token using refresh token. Returns new access token or null. */
const attemptRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Use raw axios to avoid interceptor loop
    const response: AxiosResponse<{
      success?: boolean;
      data?: { access_token?: string; token?: string; refresh_token?: string; refreshToken?: string };
    }> = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.auth.refresh}`,
      { refresh_token: refreshToken },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        withCredentials: true,
      },
    );

    const newAccessToken = response.data?.data?.access_token || response.data?.data?.token;
  const newRefreshToken = response.data?.data?.refresh_token || response.data?.data?.refreshToken;

    if (newAccessToken) {
      setAuthToken(newAccessToken);
      if (newRefreshToken) {
        setRefreshToken(newRefreshToken);
      }
      return newAccessToken;
    }
    return null;
  } catch {
    return null;
  }
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
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = getTenantId();
    if (tenantId) {
      config.headers['X-Tenant-ID'] = String(tenantId);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - Centralized error handling with token refresh
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      skipToast?: boolean;
      skipErrorToast?: boolean;
      errorMode?: ErrorMode;
      _retry?: boolean;
    };
    const status = getErrorStatus(error);

    // ── Token refresh logic (before any toast handling) ──────────────────────
    // Only attempt refresh for 401 errors that haven't been retried yet,
    // and NOT for auth endpoints themselves (prevent loop).
    const isAuthEndpoint = config?.url?.includes('/auth/');
    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      const canTryRefresh = AUTH_REFRESH_ENABLED && Boolean(getRefreshToken());

      if (canTryRefresh) {
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({
              resolve: (token: string) => {
                config.headers.Authorization = `Bearer ${token}`;
                resolve(api(config));
              },
              reject: (err: unknown) => {
                reject(err);
              },
            });
          });
        }

        config._retry = true;
        isRefreshing = true;

        try {
          const newToken = await attemptRefresh();
          if (newToken) {
            processQueue(null, newToken);
            config.headers.Authorization = `Bearer ${newToken}`;
            return api(config);
          }
          processQueue(error, null);
          forceLogout();
          return Promise.reject(error);
        } catch (refreshError) {
          processQueue(refreshError, null);
          forceLogout();
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      forceLogout();
      return Promise.reject(error);
    }

    // ── Toast error handling ─────────────────────────────────────────────────
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

    if (status === 401) {
      // If we reach here, refresh already failed or it's an auth endpoint
      forceLogout();
    } else if (status === 403) {
      showDedupedErrorToast('403-forbidden', 'Bạn không có quyền thực hiện thao tác này.');
    } else if (status === 409) {
      const conflictMessage = get409Message(error);
      showDedupedErrorToast('409-conflict', conflictMessage);
    } else if (status === 422) {
      const apiMessage =
        (error.response?.data as { message?: string } | undefined)?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      showDedupedErrorToast('422-validation', apiMessage);
    } else if (typeof status === 'number' && status >= 500) {
      showDedupedErrorToast(`5xx-${status}`, 'Lỗi hệ thống. Vui lòng thử lại sau.');
    } else if (isTimeoutError(error)) {
      showDedupedErrorToast('timeout', 'Yêu cầu quá thời gian. Vui lòng thử lại.');
    } else if (isNetworkError(error)) {
      showDedupedErrorToast('network-error', 'Lỗi mạng. Vui lòng kiểm tra kết nối.');
    }

    return Promise.reject(error);
  }
);

export default api;
