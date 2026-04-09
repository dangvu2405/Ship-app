/**
 * Centralized error handling utilities
 * 
 * This module provides utilities for consistent error handling
 * across the application. Toast notifications are handled by
 * the Axios interceptor in services/api.ts
 */

import { AxiosError } from 'axios';

export type ErrorMode = 'global' | 'local' | 'silent';

/** Laravel-style + spec-style `{ error: { code, message, details } }`. */
export interface ApiErrorResponse {
  message?: string;
  code?: string;
  errors?: Record<string, string[]>;
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, string[] | string> | string;
  };
}

const GLOBAL_TECHNICAL_STATUSES = new Set([401, 403]);

/**
 * Check if toast has already been shown for this error
 */
export const isToastShown = (error: unknown): boolean => {
  if (error && typeof error === 'object') {
    const errorWithFlag = error as { __toastShown?: boolean };
    return !!errorWithFlag.__toastShown;
  }
  return false;
};

/**
 * Extract error message from Axios error
 */
export const getErrorMessage = (error: unknown): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;
    const nested = data?.error && typeof data.error === 'object' ? data.error.message : undefined;
    return nested || data?.message || 'An error occurred';
  }

  if (error instanceof Error && error.message) {
    return error.message;
  }

  return 'An error occurred';
};

/**
 * Extract HTTP status from Axios error
 */
export const getErrorStatus = (error: unknown): number | undefined => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    return axiosError.response?.status;
  }

  return undefined;
};

/**
 * Extract backend/business error code from response
 */
export const getErrorCode = (error: unknown): string | undefined => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;
    return data?.error?.code ?? data?.code;
  }

  return undefined;
};

/**
 * Extract validation errors from Axios error
 */
function flattenDetails(details: Record<string, string[] | string>): Record<string, string> {
  const out: Record<string, string> = {};
  Object.entries(details).forEach(([key, value]) => {
    out[key] = Array.isArray(value) ? (value[0] ?? '') : String(value);
  });
  return out;
}

export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const data = axiosError.response?.data;
    const errors = data?.errors;
    if (errors) {
      const formattedErrors: Record<string, string> = {};
      Object.entries(errors).forEach(([key, value]) => {
        formattedErrors[key] = Array.isArray(value) ? value[0] : String(value);
      });
      return formattedErrors;
    }
    const details = data?.error?.details;
    if (details && typeof details === 'object' && !Array.isArray(details)) {
      return flattenDetails(details as Record<string, string[] | string>);
    }
  }
  return {};
};

/**
 * Check if error is a validation error (422)
 */
export const isValidationError = (error: unknown): boolean => {
  return getErrorStatus(error) === 422;
};

/**
 * Check if error is a network error
 */
export const isNetworkError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'request' in error) {
    const axiosError = error as AxiosError;
    return !axiosError.response && !!axiosError.request;
  }
  return false;
};

/**
 * Check if error is a timeout error
 */
export const isTimeoutError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'code' in error) {
    const axiosError = error as AxiosError;
    return axiosError.code === 'ECONNABORTED';
  }

  return false;
};

/**
 * True for technical/global errors that should be handled by interceptor.
 */
export const isGlobalTechnicalError = (error: unknown): boolean => {
  const status = getErrorStatus(error);

  if (typeof status === 'number') {
    return GLOBAL_TECHNICAL_STATUSES.has(status) || status >= 500;
  }

  return isNetworkError(error) || isTimeoutError(error);
};

/**
 * Decide whether interceptor should show a global toast.
 */
export const shouldHandleGlobalErrorToast = (
  error: unknown,
  errorMode: ErrorMode = 'global'
): boolean => {
  if (errorMode !== 'global') {
    return false;
  }

  return isGlobalTechnicalError(error);
};

/**
 * Decide whether local screen-level code should show a toast.
 */
export const shouldShowLocalErrorToast = (error: unknown): boolean => {
  return !isToastShown(error) && !isGlobalTechnicalError(error);
};

/**
 * Check if error should skip toast (already handled by interceptor)
 */
export const shouldSkipToast = (error: unknown): boolean => {
  return !shouldShowLocalErrorToast(error);
};
