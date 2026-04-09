import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';

type NotifyOptions = {
  fallbackMessage: string;
  dedupeMs?: number;
};

const lastShownAtByKey = new Map<string, number>();

export function notifyErrorOnce(scope: string, error: unknown, options: NotifyOptions) {
  const dedupeMs = options.dedupeMs ?? 2000;
  const message = getErrorMessage(error) || options.fallbackMessage;
  const key = `${scope}:${message}`;
  const now = Date.now();
  const lastAt = lastShownAtByKey.get(key) ?? 0;

  if (now - lastAt < dedupeMs) {
    return message;
  }

  lastShownAtByKey.set(key, now);
  toast.error(message);
  return message;
}
