import type { NotificationProvider, OpenNotificationParams } from '@refinedev/core';
import { App } from 'antd';
import type { ArgsProps } from 'antd/es/notification/interface';
import { createDedupedCaller } from '@/utils/dedupe';
import type { AxiosError } from 'axios';

const shouldShowNotification = createDedupedCaller(1500);

type Translator = (key: string) => string;

/**
 * Chuyển lỗi HTTP (AxiosError hoặc unknown) thành chuỗi thông báo phù hợp.
 * Ưu tiên message từ backend; fallback sang i18n theo status code.
 */
export function resolveHttpError(err: unknown, t: Translator): string {
  const axiosErr = err as AxiosError<{ message?: string }>;
  const status = axiosErr?.response?.status;
  const serverMsg = axiosErr?.response?.data?.message;
  if (!status) return t('auth.networkError');
  switch (status) {
    case 400: return serverMsg || t('auth.badRequest');
    case 401: return serverMsg || t('auth.invalidCredentials');
    case 403: return serverMsg || t('auth.accountForbidden');
    case 404: return serverMsg || t('auth.accountNotFound');
    case 422: return serverMsg || t('auth.invalidCredentials');
    case 429: return serverMsg || t('auth.rateLimited');
    default:  return status >= 500 ? t('auth.serverError') : (serverMsg || t('auth.loginFailed'));
  }
}

// Lọc các thông báo lỗi generic do Refine/Axios tự sinh — không có giá trị với user
function isNoiseError(params: OpenNotificationParams): boolean {
  const msg = params.message || '';
  const desc = params.description || '';
  const genericMsg =
    msg === 'Error' ||
    msg === 'Request failed' ||
    msg.includes('status code') ||
    msg.includes('Network Error') ||
    msg.includes('timeout');
  const genericDesc = !desc || desc.startsWith('Error when');
  return genericMsg && genericDesc;
}

// Lọc thông báo success generic mà Refine tự thêm
function isNoiseSuccess(params: OpenNotificationParams): boolean {
  return !params.message || params.message === 'Successful' || params.message === 'Success';
}

export const useAppNotificationProvider = (): NotificationProvider => {
  const { notification } = App.useApp();

  return {
    open: (params) => {
      if (params.type === 'error' && isNoiseError(params)) return;
      if (params.type === 'success' && isNoiseSuccess(params)) return;

      const dedupKey = `${params.type}-${params.message}-${params.description ?? ''}`;
      if (!shouldShowNotification(dedupKey)) return;

      const config: ArgsProps = {
        key: params.key,
        message: params.message,
        description: params.description,
        placement: 'topRight',
        duration: params.type === 'error' ? 5 : 3,
      };

      switch (params.type) {
        case 'success':
          notification.success(config);
          break;
        case 'error':
          notification.error(config);
          break;
        case 'progress':
          notification.info({
            ...config,
            duration: 0,
            description: params.undoableTimeout != null
              ? `${params.description ?? ''} (${params.undoableTimeout}s)`
              : params.description,
          });
          break;
      }
    },

    close: (key) => {
      notification.destroy(key);
    },
  };
};
