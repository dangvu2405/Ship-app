import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError, AxiosResponse } from 'axios';
import { API_BASE_URL, API_ROOT_BASE_URL, AUTH_REFRESH_ENABLED, STORAGE_KEYS } from '@/utils/constants';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { clearAuthToken, getRefreshToken, setAuthToken, setRefreshToken } from '@/lib/auth-session';
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
    /** Gọi dưới `/api` (vd `/api/v2/...`), không dùng base `/api/v1`. */
    useApiRoot?: boolean;
    /** @internal — set by refresh interceptor to prevent infinite retry loop. */
    _retry?: boolean;
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

// ── 409 Conflict type → user-facing messages ──────────────────────────────────
const CONFLICT_MESSAGES: Record<string, string> = {
  already_approved: 'Đã được duyệt bởi người khác. Vui lòng làm mới trang.',
  currently_calculating: 'Đang được tính toán. Vui lòng thử lại sau 30 giây.',
  state_changed: 'Trạng thái đã thay đổi. Vui lòng làm mới trang.',
  already_locked: 'Đã bị khóa bởi admin khác. Vui lòng làm mới trang.',
  already_paid: 'Đã được thanh toán. Không thể thay đổi.',
  duplicate_entry: 'Bản ghi trùng lặp. Vui lòng kiểm tra lại.',
};

const get409Message = (error: AxiosError): string => {
  const data = error.response?.data as { conflict_type?: string; message?: string } | undefined;
  const conflictType = data?.conflict_type;
  if (conflictType && CONFLICT_MESSAGES[conflictType]) {
    return CONFLICT_MESSAGES[conflictType];
  }
  return data?.message || 'Xung đột nghiệp vụ. Vui lòng làm mới và thử lại.';
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
  showDedupedErrorToast('401-session-expired', 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.');
  if (window.location.pathname !== ROUTES.login) {
    window.location.href = ROUTES.login;
  }
};

/** Attempt to refresh access token using refresh token. Returns new access token or null. */
const attemptRefresh = async (): Promise<string | null> => {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    // Use raw axios to avoid interceptor loop
    const response: AxiosResponse<{
      success?: boolean;
      data?: { access_token?: string; token?: string; refresh_token?: string };
    }> = await axios.post(
      `${API_BASE_URL}${ENDPOINTS.auth.refresh}`,
      { refresh_token: refreshToken },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        withCredentials: true,
      },
    );

    const newAccessToken = response.data?.data?.access_token || response.data?.data?.token;
    const newRefreshToken = response.data?.data?.refresh_token;

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
    // Get token from localStorage (set by authProvider after login)
    const token = localStorage.getItem(STORAGE_KEYS.AUTH_TOKEN);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const tenantId = localStorage.getItem(STORAGE_KEYS.TENANT_ID);
    if (tenantId) {
      config.headers['X-Tenant-ID'] = tenantId;
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
