import toast from 'react-hot-toast';
import { getErrorMessage } from '@/utils/errorHandler';
import { createDedupedCaller } from '@/utils/dedupe';

type NotifyOptions = {
  fallbackMessage: string;
};

const shouldShow = createDedupedCaller(2000);

export function notifyErrorOnce(scope: string, error: unknown, options: NotifyOptions) {
  const message = getErrorMessage(error) || options.fallbackMessage;
  if (!shouldShow(`${scope}:${message}`)) return message;
  toast.error(message);
  return message;
}
