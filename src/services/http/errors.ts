import type { AxiosError } from 'axios';
import { getErrorStatus } from '@/utils/errorHandler';

export interface NormalizedApiError {
  status?: number;
  message: string;
}

export function normalizeApiError(error: unknown, fallback = 'Something went wrong'): NormalizedApiError {
  if (!error || typeof error !== 'object') {
    return { message: fallback };
  }

  const axiosError = error as AxiosError<{ message?: string }>;
  const status = getErrorStatus(axiosError);
  const message = axiosError.response?.data?.message || axiosError.message || fallback;
  return { status: typeof status === 'number' ? status : undefined, message };
}
