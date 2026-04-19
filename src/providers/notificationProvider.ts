import type { NotificationProvider } from '@refinedev/core';
import { useNotificationProvider as useAntdNotificationProvider } from '@refinedev/antd';
import { createDedupedCaller } from '@/utils/dedupe';

const shouldShowNotification = createDedupedCaller(1500);

export const useAppNotificationProvider = (): NotificationProvider => {
  const antdNotificationProvider = useAntdNotificationProvider();

  return {
    ...antdNotificationProvider,
    open: (params) => {
      if (params.type === 'error') {
        const msg = params.message || '';
        const isGenericAxiosError =
          msg === 'Error' ||
          msg === 'Request failed' ||
          msg.includes('status code') ||
          msg.includes('Network Error') ||
          msg.includes('timeout');
        const isGenericRefineDescription = !params.description || params.description.startsWith('Error when');
        if (isGenericAxiosError && isGenericRefineDescription) return;
      }

      if (params.type === 'success') {
        if (!params.message || params.message === 'Successful' || params.message === 'Success') return;
      }

      if (params.type === 'success' || params.type === 'error') {
        const dedupKey = `${params.type}-${params.message}-${params.description ?? ''}`;
        if (!shouldShowNotification(dedupKey)) return;
      }

      return antdNotificationProvider.open?.(params);
    },
  };
};
