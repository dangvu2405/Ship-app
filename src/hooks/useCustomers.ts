import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Customer, Trip } from '@/types';
import customerService from '@/services/customer.service';
import type {
  CustomerListParams,
  CustomerPayment,
} from '@/types/api/customer';
import type {
  StoreCustomerPaymentRequest,
  StoreCustomerRequest,
  StorePriceListItemRequest,
  StorePriceListRequest,
  UpdateCustomerRequest,
} from '@/types/requests/customer';
import { createResourceQueryKeys } from '@/shared/query/createResourceQueryKeys';
import { getErrorMessage } from '@/utils/errorHandler';
import { showSuccess } from './_shared';

const customerKeys = createResourceQueryKeys('customers');

type MutationHandlers = {
  successMessage?: string;
  onSuccess?: (data: unknown) => void | Promise<void>;
  onError?: (error: unknown) => void | Promise<void>;
};

function normalizeList<T>(response: { data?: { data?: T[]; total?: number; current_page?: number; per_page?: number } }) {
  return {
    items: response.data?.data ?? [],
    total: response.data?.total ?? 0,
    currentPage: response.data?.current_page ?? 1,
    pageSize: response.data?.per_page ?? 15,
  };
}

function handleMutationSuccess(successMessage: string | undefined) {
  if (successMessage) {
    showSuccess(successMessage);
  }
}

export function useCustomerList(params: CustomerListParams & { enabled?: boolean } = {}) {
  const { current = 1, pageSize = 15, search, type, enabled = true } = params;

  const query = useQuery({
    queryKey: customerKeys.list({ current, pageSize, search: search?.trim() ?? '', type: type ?? '' }),
    queryFn: async () => customerService.getList({ current, pageSize, search, type }),
    enabled,
  });

  const normalized = normalizeList<Customer>(query.data ?? {});

  return {
    ...query,
    data: normalized.items,
    total: normalized.total,
    currentPage: normalized.currentPage,
    pageSize: normalized.pageSize,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCustomerDetail(id?: number | null, enabled = true) {
  const query = useQuery({
    queryKey: id == null ? [...customerKeys.details(), 'missing-id'] as const : customerKeys.detail(id),
    queryFn: async () => customerService.getById(id as number),
    enabled: enabled && id != null,
  });

  return {
    ...query,
    customer: query.data?.data ?? null,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCustomerTrips(id?: number | null, params: { current?: number; pageSize?: number; enabled?: boolean } = {}) {
  const { current = 1, pageSize = 50, enabled = true } = params;

  const query = useQuery({
    queryKey: id == null ? ['customers', 'trips', 'missing-id'] as const : ['customers', id, 'trips', { current, pageSize }] as const,
    queryFn: async () => customerService.getTrips(id as number, { current, pageSize }),
    enabled: enabled && id != null,
  });

  const normalized = normalizeList<Trip>(query.data ?? {});

  return {
    ...query,
    trips: normalized.items,
    total: normalized.total,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCustomerPayments(id?: number | null, params: { current?: number; pageSize?: number; enabled?: boolean } = {}) {
  const { current = 1, pageSize = 20, enabled = true } = params;

  const query = useQuery({
    queryKey: id == null ? ['customers', 'payments', 'missing-id'] as const : ['customers', id, 'payments', { current, pageSize }] as const,
    queryFn: async () => customerService.getPayments(id as number, { current, pageSize }),
    enabled: enabled && id != null,
  });

  const normalized = normalizeList<CustomerPayment>(query.data ?? {});

  return {
    ...query,
    payments: normalized.items,
    total: normalized.total,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCustomerDebt(id?: number | null, enabled = true) {
  const query = useQuery({
    queryKey: id == null ? ['customers', 'debt', 'missing-id'] as const : ['customers', id, 'debt'] as const,
    queryFn: async () => customerService.getDebt(id as number),
    enabled: enabled && id != null,
  });

  return {
    ...query,
    debt: query.data?.data ?? null,
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCreateCustomer({ successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StoreCustomerRequest) => customerService.create(values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useUpdateCustomer({ successMessage = 'Updated successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { id: number; values: UpdateCustomerRequest }) => customerService.update(params.id, params.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useDeleteCustomer({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => customerService.delete(id),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useCreateCustomerPayment(customerId?: number | null, { successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (values: StoreCustomerPaymentRequest) => customerService.createPayment(customerId as number, values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      if (customerId != null) {
        await queryClient.invalidateQueries({ queryKey: ['customers', customerId] });
      }
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useDeleteCustomerPayment({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (paymentId: number) => customerService.deletePayment(paymentId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: customerKeys.all });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}
export function useCustomerPriceLists(id?: number | null, enabled = true) {
  const query = useQuery({
    queryKey: id == null ? ['customers', 'price-lists', 'missing-id'] as const : ['customers', id, 'price-lists'] as const,
    queryFn: async () => customerService.getPriceLists(id as number),
    enabled: enabled && id != null,
  });

  return {
    ...query,
    priceLists: query.data?.data ?? [],
    loading: query.isLoading,
    error: query.error ? getErrorMessage(query.error) : null,
  } as const;
}

export function useCreatePriceList({ successMessage = 'Created successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { customerId: number; values: StorePriceListRequest }) =>
      customerService.createPriceList(params.customerId, params.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useDeletePriceList({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => customerService.deletePriceList(id),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useAddPriceListItem({ successMessage = 'Added successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { priceListId: number; values: StorePriceListItemRequest }) =>
      customerService.addPriceListItem(params.priceListId, params.values),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}

export function useDeletePriceListItem({ successMessage = 'Deleted successfully', onSuccess, onError }: MutationHandlers = {}) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (params: { priceListId: number; itemId: number }) =>
      customerService.deletePriceListItem(params.priceListId, params.itemId),
    onSuccess: async (result) => {
      await queryClient.invalidateQueries({ queryKey: ['customers'] });
      handleMutationSuccess(successMessage);
      await onSuccess?.(result);
    },
    onError: async (error) => {
      await onError?.(error);
    },
  });
}
