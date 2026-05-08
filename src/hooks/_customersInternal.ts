import { createResourceQueryKeys } from '@/shared/query/createResourceQueryKeys';
import { showSuccess } from './_shared';

export const customerKeys = createResourceQueryKeys('customers');

export type MutationHandlers = {
  successMessage?: string;
  onSuccess?: (data: unknown) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

export function normalizeList<T>(response: { data?: { data?: T[]; total?: number; current_page?: number; per_page?: number } }) {
  return {
    items: response.data?.data ?? [],
    total: response.data?.total ?? 0,
    currentPage: response.data?.current_page ?? 1,
    pageSize: response.data?.per_page ?? 15,
  };
}

export function handleMutationSuccess(successMessage: string | undefined) {
  if (successMessage) {
    showSuccess(successMessage);
  }
}
