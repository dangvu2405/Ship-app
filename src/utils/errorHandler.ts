/**
 * Centralized error handling utilities
 * 
 * This module provides utilities for consistent error handling
 * across the application. Toast notifications are handled by
 * the Axios interceptor in services/api.ts
 */

import { AxiosError } from 'axios';

export interface ApiErrorResponse {
  message?: string;
  errors?: Record<string, string[]>;
}

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
    return axiosError.response?.data?.message || 'An error occurred';
  }
  return 'An error occurred';
};

/**
 * Extract validation errors from Axios error
 */
export const getValidationErrors = (error: unknown): Record<string, string> => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError<ApiErrorResponse>;
    const errors = axiosError.response?.data?.errors;
    
    if (errors) {
      const formattedErrors: Record<string, string> = {};
      Object.entries(errors).forEach(([key, value]) => {
        formattedErrors[key] = Array.isArray(value) ? value[0] : String(value);
      });
      return formattedErrors;
    }
  }
  return {};
};

/**
 * Check if error is a validation error (422)
 */
export const isValidationError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as AxiosError;
    return axiosError.response?.status === 422;
  }
  return false;
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
 * Check if error should skip toast (already handled by interceptor)
 */
export const shouldSkipToast = (error: unknown): boolean => {
  return isToastShown(error) || isValidationError(error);
};
