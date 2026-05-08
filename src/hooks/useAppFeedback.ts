import { useMemo } from 'react';
import { App } from 'antd';
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { HookAPI as ModalHookApi } from 'antd/es/modal/useModal';

export type FeedbackPayload =
  | string
  | {
      title?: string;
      message?: string;
      description?: string;
      duration?: number;
    };

export interface FeedbackConfirmOptions {
  title: string;
  content?: string;
  okText?: string;
  cancelText?: string;
  okType?: 'primary' | 'danger';
  onOk: () => void | Promise<void>;
  onCancel?: () => void;
}

export interface AppFeedback {
  success: (payload: FeedbackPayload) => void;
  error: (payload: FeedbackPayload) => void;
  info: (payload: FeedbackPayload) => void;
  warning: (payload: FeedbackPayload) => void;
  loading: (payload: FeedbackPayload) => void;
  confirm: (options: FeedbackConfirmOptions) => void;
  message: MessageInstance;
  notification: NotificationInstance;
  modal: ModalHookApi;
}

const resolveContent = (payload: FeedbackPayload): { content: string; duration?: number } => {
  if (typeof payload === 'string') {
    return { content: payload };
  }
  const content = payload.message ?? payload.title ?? payload.description ?? '';
  return { content, duration: payload.duration };
};

const resolveNotification = (payload: FeedbackPayload) => {
  if (typeof payload === 'string') {
    return { message: payload };
  }
  return {
    message: payload.title ?? payload.message ?? '',
    description: payload.description,
    duration: payload.duration,
  };
};

export function useAppFeedback(): AppFeedback {
  const { message, notification, modal } = App.useApp();

  return useMemo<AppFeedback>(() => {
    const buildBasic = (kind: 'success' | 'error' | 'info' | 'warning' | 'loading') =>
      (payload: FeedbackPayload) => {
        if (typeof payload === 'string') {
          message.open({ type: kind, content: payload });
          return;
        }
        if (payload.description) {
          const notiKind = kind === 'loading' ? 'info' : kind;
          notification[notiKind](resolveNotification(payload));
          return;
        }
        const { content, duration } = resolveContent(payload);
        message.open({ type: kind, content, duration });
      };

    return {
      success: buildBasic('success'),
      error: buildBasic('error'),
      info: buildBasic('info'),
      warning: buildBasic('warning'),
      loading: buildBasic('loading'),
      confirm: ({ title, content, okText, cancelText, okType, onOk, onCancel }) => {
        modal.confirm({
          title,
          content,
          okText: okText ?? 'OK',
          cancelText: cancelText ?? 'Huỷ',
          okButtonProps: okType === 'danger' ? { danger: true } : undefined,
          onOk,
          onCancel,
        });
      },
      message,
      notification,
      modal,
    };
  }, [message, notification, modal]);
}
