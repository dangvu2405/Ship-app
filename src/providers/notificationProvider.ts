import type { NotificationProvider } from '@refinedev/core';
import { notificationProvider as antdNotificationProvider } from '@refinedev/antd';

/**
 * Application-level notification policy:
 * - Refine error notifications are suppressed to avoid duplicate with
 *   Axios interceptor (technical errors) and local onError (business errors).
 * - Non-error notifications are forwarded.
 */
export const appNotificationProvider: NotificationProvider = {
  ...antdNotificationProvider,
  open: (params) => {
    if (params.type === 'error') {
      return;
    }

    return antdNotificationProvider.open?.(params);
  },
};
