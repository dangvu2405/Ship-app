import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { API_BASE_URL } from '@/utils/constants';
import toastService from './toast.service';

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
    // Token will be sent via HttpOnly cookie from backend
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

      // System-level errors: Use toast service for deduplication
      if (status === 401) {
        // Unauthorized - redirect to login
        toastService.apiError('Session expired. Please login again.', 401);
        window.location.href = '/login';
      } else if (status === 403) {
        toastService.apiError(responseData.message || 'Access denied', 403);
      } else if (status >= 500) {
        toastService.apiError('Server error. Please try again later.', status);
      } else if (status === 404) {
        // Only show toast for 404 if it's not a resource not found (let component handle it)
        if (!responseData.message?.toLowerCase().includes('not found')) {
          toastService.apiError(responseData.message || 'Resource not found', 404);
        }
      } else if (status !== 422 && status !== 400) {
        // Other client errors - show toast (skip 400 and 422)
        toastService.apiError(responseData.message || 'An error occurred', status);
      }
      // 422 Validation errors: Skip toast - let component handle inline validation
      // 400 Bad Request: Usually handled by component with specific messages
    } else if (error.request) {
      // Network error
      toastService.networkError();
    }

    return Promise.reject(error);
  }
);

export default api;
