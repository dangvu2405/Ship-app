import axios, { AxiosError, AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { buildOriginUrl, ENV } from '@/config/env';
import { ENDPOINTS } from '@/services/endpoints';
import { AUTH_REFRESH_ENABLED, STORAGE_KEYS } from '@/utils/constants';
import { createDedupedCaller } from '@/utils/dedupe';
import {
  ErrorMode,
  getErrorStatus,
  isNetworkError,
  isTimeoutError,
  shouldHandleGlobalErrorToast,
} from '@/utils/errorHandler';
import { antdUtils } from '@/utils/antdGlobal';
import { clearAuthToken, getAuthToken, getRefreshToken, getTenantId, setAuthToken } from './auth-session';

declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean;
    skipErrorToast?: boolean;
    errorMode?: ErrorMode;
    useApiRoot?: boolean;
    _retry?: boolean;
  }
}

const shouldShowToast = createDedupedCaller(1500);
const showDedupedErrorToast = (key: string, message: string) => {
  if (shouldShowToast(key)) antdUtils.getMessage().error(message);
};

export function extractFilenameFromContentDisposition(contentDisposition?: string): string | null {
  if (!contentDisposition) return null;
  const utf8Match = contentDisposition.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) return decodeURIComponent(utf8Match[1]);
  const asciiMatch = contentDisposition.match(/filename=([^;]+)/i);
  if (asciiMatch?.[1]) return asciiMatch[1].replace(/["']/g, '').trim();
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

const CONFLICT_MESSAGES: Record<string, { en: string; vi: string }> = {
  already_approved: { en: 'Already approved by someone else. Please refresh the page.', vi: 'Đã được duyệt bởi người khác. Vui lòng làm mới trang.' },
  currently_calculating: { en: 'Currently being calculated. Please try again in 30 seconds.', vi: 'Đang được tính toán. Vui lòng thử lại sau 30 giây.' },
  state_changed: { en: 'State has changed. Please refresh the page.', vi: 'Trạng thái đã thay đổi. Vui lòng làm mới trang.' },
  already_locked: { en: 'Locked by another admin. Please refresh the page.', vi: 'Đã bị khóa bởi admin khác. Vui lòng làm mới trang.' },
  already_paid: { en: 'Already paid. Cannot be changed.', vi: 'Đã được thanh toán. Không thể thay đổi.' },
  duplicate_entry: { en: 'Duplicate record. Please check again.', vi: 'Bản ghi trùng lặp. Vui lòng kiểm tra lại.' },
};

let cachedLocale: 'en' | 'vi' | null = null;
const getUiLocale = (): 'en' | 'vi' => {
  if (cachedLocale !== null) return cachedLocale;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.APP_STORAGE);
    if (raw) cachedLocale = (JSON.parse(raw)?.state?.locale as 'en' | 'vi') ?? 'vi';
  } catch {
    cachedLocale = null;
  }
  return cachedLocale ?? 'vi';
};
export const clearLocaleCache = () => {
  cachedLocale = null;
};

const get409Message = (error: AxiosError): string => {
  const data = error.response?.data as { conflict_type?: string; message?: string } | undefined;
  const conflictType = data?.conflict_type;
  const locale = getUiLocale();
  if (conflictType && CONFLICT_MESSAGES[conflictType]) return CONFLICT_MESSAGES[conflictType][locale];
  return data?.message || (locale === 'en' ? 'Business conflict. Please refresh and try again.' : 'Xung đột nghiệp vụ. Vui lòng làm mới và thử lại.');
};

let isRefreshing = false;
let failedQueue: Array<{ resolve: (token: string) => void; reject: (error: unknown) => void }> = [];

const processQueue = (error: unknown, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token as string);
  });
  failedQueue = [];
};

const forceLogout = () => {
  clearAuthToken();
  const msg = getUiLocale() === 'en' ? 'Session expired. Please log in again.' : 'Phiên đăng nhập hết hạn. Vui lòng đăng nhập lại.';
  showDedupedErrorToast('401-session-expired', msg);
  window.dispatchEvent(new CustomEvent('auth:force-logout'));
};

const attemptRefresh = async (): Promise<boolean> => {
  try {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    const response: AxiosResponse<{ success?: boolean; data?: { access_token?: string; token?: string } }> = await axios.post(
      `${ENV.API_BASE_URL}${ENDPOINTS.auth.refresh}`,
      // Support both snake_case and camelCase payloads (backend variants).
      { refresh_token: refreshToken, refreshToken },
      {
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        timeout: ENV.AXIOS_TIMEOUT_MS,
      },
    );
    const nextToken = response.data?.data?.access_token ?? response.data?.data?.token;
    if (response.data?.success && nextToken) {
      setAuthToken(nextToken);
      return true;
    }
    return false;
  } catch {
    return false;
  }
};

const api: AxiosInstance = axios.create({
  baseURL: ENV.API_BASE_URL,
  timeout: ENV.AXIOS_TIMEOUT_MS,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

api.interceptors.request.use(
  (config: InternalAxiosRequestConfig & { useApiRoot?: boolean }) => {
    const token = getAuthToken();
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }

    if (config.useApiRoot) {
      config.baseURL = ENV.API_ROOT_URL;
      delete config.useApiRoot;
    }

    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }

    if (config.baseURL?.startsWith('http') && config.url?.startsWith('/')) {
      config.url = config.url.substring(1);
    }

    const tenantId = getTenantId();
    if (tenantId) config.headers['X-Tenant-ID'] = String(tenantId);
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as InternalAxiosRequestConfig & {
      skipToast?: boolean;
      skipErrorToast?: boolean;
      errorMode?: ErrorMode;
      _retry?: boolean;
    };
    const status = getErrorStatus(error);

    if (status === 419 && config && !config._retry) {
      config._retry = true;
      try {
        await axios.get(buildOriginUrl('/sanctum/csrf-cookie'), {
          withCredentials: true,
          timeout: ENV.AXIOS_TIMEOUT_MS,
        });
        return api(config);
      } catch {
        forceLogout();
        return Promise.reject(error);
      }
    }

    const url = String(config?.url ?? '');
    // `config.url` can be '/auth/login' OR 'auth/login' (we strip leading '/' in request interceptor)
    // OR a full absolute URL. Treat all as auth endpoints consistently.
    const isAuthEndpoint = /(^|\/|\b)auth\//.test(url);
    if (status === 401 && config && !config._retry && !isAuthEndpoint) {
      if (AUTH_REFRESH_ENABLED) {
        if (isRefreshing) {
          return new Promise<AxiosResponse>((resolve, reject) => {
            failedQueue.push({
              resolve: () => resolve(api(config)),
              reject: (err: unknown) => reject(err),
            });
          });
        }

        config._retry = true;
        isRefreshing = true;
        try {
          const success = await attemptRefresh();
          if (success) {
            processQueue(null, 'session-refreshed');
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

    const errorMode = config?.errorMode ?? 'global';
    const errorWithFlag = error as AxiosError & { __toastShown?: boolean };
    if (config?.skipToast || config?.skipErrorToast || errorMode === 'silent' || errorWithFlag.__toastShown) {
      return Promise.reject(error);
    }

    if (!shouldHandleGlobalErrorToast(error, errorMode)) return Promise.reject(error);
    errorWithFlag.__toastShown = true;

    if (status === 401 || status === 419) {
      forceLogout();
    } else if (status === 403) {
      showDedupedErrorToast('403-forbidden', 'Bạn không có quyền thực hiện thao tác này.');
    } else if (status === 409) {
      showDedupedErrorToast('409-conflict', get409Message(error));
    } else if (status === 422) {
      const apiMessage = (error.response?.data as { message?: string } | undefined)?.message || 'Dữ liệu không hợp lệ. Vui lòng kiểm tra lại.';
      showDedupedErrorToast('422-validation', apiMessage);
    } else if (typeof status === 'number' && status >= 500) {
      showDedupedErrorToast(`5xx-${status}`, 'Lỗi hệ thống. Vui lòng thử lại sau.');
    } else if (isTimeoutError(error)) {
      showDedupedErrorToast('timeout', 'Yêu cầu quá thời gian. Vui lòng thử lại.');
    } else if (isNetworkError(error)) {
      showDedupedErrorToast('network-error', 'Lỗi mạng. Vui lòng kiểm tra kết nối.');
    }

    return Promise.reject(error);
  },
);

export default api;
