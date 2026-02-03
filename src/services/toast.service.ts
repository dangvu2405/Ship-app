/**
 * Toast Service - Centralized toast notification management
 * 
 * Features:
 * - Prevents duplicate toast notifications
 * - Deduplication by message content
 * - Queue management
 * - Auto-dismiss duplicate messages
 */

import toast, { ToastOptions } from 'react-hot-toast';

interface ToastConfig extends ToastOptions {
  id?: string;
  dedupe?: boolean; // Auto-dismiss duplicate messages
  duration?: number;
}

class ToastService {
  private activeToasts: Map<string, string> = new Map(); // message -> toastId
  private readonly DEFAULT_DURATION = 4000;
  private readonly DEDUPE_WINDOW = 2000; // ms - window to consider as duplicate

  /**
   * Show success toast
   */
  success(message: string, options?: ToastConfig): string {
    return this.show(message, 'success', options);
  }

  /**
   * Show error toast
   */
  error(message: string, options?: ToastConfig): string {
    return this.show(message, 'error', options);
  }

  /**
   * Show info toast
   */
  info(message: string, options?: ToastConfig): string {
    return this.show(message, 'success', { ...options, icon: 'ℹ️' });
  }

  /**
   * Show warning toast
   */
  warning(message: string, options?: ToastConfig): string {
    return this.show(message, 'error', { ...options, icon: '⚠️' });
  }

  /**
   * Show loading toast
   */
  loading(message: string, options?: ToastConfig): string {
    return this.show(message, 'loading', options);
  }

  /**
   * Dismiss toast by ID
   */
  dismiss(toastId?: string): void {
    if (toastId) {
      toast.dismiss(toastId);
      // Remove from active toasts
      for (const [msg, id] of this.activeToasts.entries()) {
        if (id === toastId) {
          this.activeToasts.delete(msg);
          break;
        }
      }
    } else {
      toast.dismiss();
      this.activeToasts.clear();
    }
  }

  /**
   * Dismiss all toasts
   */
  dismissAll(): void {
    toast.dismiss();
    this.activeToasts.clear();
  }

  /**
   * Update existing toast
   */
  update(toastId: string, message: string, type: 'success' | 'error' | 'loading' = 'success'): void {
    toast[type](message, { id: toastId });
  }

  /**
   * Core show method with deduplication
   */
  private show(
    message: string,
    type: 'success' | 'error' | 'loading',
    options: ToastConfig = {}
  ): string {
    const {
      id,
      dedupe = true,
      duration = this.DEFAULT_DURATION,
      ...restOptions
    } = options;

    // Normalize message for deduplication
    const normalizedMessage = message.trim().toLowerCase();

    // Check for duplicate
    if (dedupe && this.activeToasts.has(normalizedMessage)) {
      const existingToastId = this.activeToasts.get(normalizedMessage);
      if (existingToastId) {
        // Update existing toast instead of creating new one
        this.update(existingToastId, message, type);
        return existingToastId;
      }
    }

    // Create new toast
    const toastId = toast[type](message, {
      id: id || undefined,
      duration,
      ...restOptions,
    });

    // Track active toast
    if (dedupe) {
      this.activeToasts.set(normalizedMessage, toastId);

      // Auto-remove from tracking after duration
      setTimeout(() => {
        this.activeToasts.delete(normalizedMessage);
      }, duration + 1000); // Add buffer
    }

    return toastId;
  }

  /**
   * Show API error toast (with special handling)
   */
  apiError(message: string, statusCode?: number): string {
    // Custom error messages based on status code
    let displayMessage = message;
    
    if (statusCode === 401) {
      displayMessage = 'Session expired. Please login again.';
    } else if (statusCode === 403) {
      displayMessage = message || 'Access denied';
    } else if (statusCode === 404) {
      // Skip toast for "not found" messages
      if (message.toLowerCase().includes('not found')) {
        return '';
      }
      displayMessage = message || 'Resource not found';
    } else if (statusCode === 422) {
      // Validation errors - skip toast (handled inline)
      return '';
    } else if (statusCode && statusCode >= 500) {
      displayMessage = 'Server error. Please try again later.';
    } else if (!message) {
      displayMessage = 'An error occurred';
    }

    return this.error(displayMessage, {
      duration: statusCode === 401 ? 3000 : this.DEFAULT_DURATION,
    });
  }

  /**
   * Show network error toast
   */
  networkError(): string {
    return this.error('Network error. Please check your connection.', {
      duration: 5000,
    });
  }

  /**
   * Show validation error toast (for non-field errors)
   */
  validationError(message: string): string {
    return this.error(message, {
      duration: 4000,
    });
  }
}

// Export singleton instance
export const toastService = new ToastService();

// Export convenience functions
export const showToast = {
  success: (message: string, options?: ToastConfig) => toastService.success(message, options),
  error: (message: string, options?: ToastConfig) => toastService.error(message, options),
  info: (message: string, options?: ToastConfig) => toastService.info(message, options),
  warning: (message: string, options?: ToastConfig) => toastService.warning(message, options),
  loading: (message: string, options?: ToastConfig) => toastService.loading(message, options),
  dismiss: (toastId?: string) => toastService.dismiss(toastId),
  dismissAll: () => toastService.dismissAll(),
  apiError: (message: string, statusCode?: number) => toastService.apiError(message, statusCode),
  networkError: () => toastService.networkError(),
};

export default toastService;
