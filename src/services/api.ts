import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL, STORAGE_KEYS } from '@/utils/constants';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';

// Extend AxiosRequestConfig to support custom config
declare module 'axios' {
  export interface AxiosRequestConfig {
    skipToast?: boolean; // Skip automatic toast notification
    skipErrorToast?: boolean; // Skip only error toast
  }
}

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
  (config: InternalAxiosRequestConfig) => {
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
    const config = error.config as InternalAxiosRequestConfig & { skipToast?: boolean; skipErrorToast?: boolean };
    
    // Skip toast if explicitly requested or already shown
    const errorWithFlag = error as AxiosError & { __toastShown?: boolean };
    if (config?.skipToast || config?.skipErrorToast || errorWithFlag.__toastShown) {
      return Promise.reject(error);
    }

    // Mark that toast has been shown to prevent duplicate
    errorWithFlag.__toastShown = true;

    if (error.response) {
      const { status, data } = error.response;
      const responseData = data as { message?: string; errors?: Record<string, string[]> };

      // System-level errors: Always show toast
      if (status === 401) {
        localStorage.removeItem(STORAGE_KEYS.AUTH_TOKEN);
        toast.error('Session expired. Please login again.');
        window.location.href = ROUTES.login;
      } else if (status === 403) {
        toast.error(responseData.message || 'Permission denied');
      } else if (status >= 500) {
        toast.error('Server error. Please try again later.');
      } else if (status === 404) {
        // Only show toast for 404 if it's not a resource not found (let component handle it)
        if (!responseData.message?.toLowerCase().includes('not found')) {
          toast.error(responseData.message || 'Resource not found');
        }
      } else if (status !== 422 && status !== 400) {
        // Other client errors - show toast (skip 400 and 422)
        toast.error(responseData.message || 'An error occurred');
      }
      // 422 Validation errors: Skip toast - let component handle inline validation
      // 400 Bad Request: Usually handled by component with specific messages
    } else if (error.request) {
      // Network error
      toast.error('Network error. Please check your connection.');
    }

    return Promise.reject(error);
  }
);

export default api;
