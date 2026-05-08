import { useQuery } from '@tanstack/react-query';
import type { Customer, Trip } from '@/types';
import customerService from '@/services/customer.service';
import type { CustomerListParams, CustomerPayment, PriceList, ReconciliationSessionSummary } from '@/types/api/customer';
import { getErrorMessage } from '@/utils/errorHandler';
import { customerKeys, normalizeList } from './_customersInternal';

export function useCustomerList(params: CustomerListParams & { enabled?: boolean } = {}) {
  const { current = 1, pageSize = 15, search, type, group_id, status, include_deleted, enabled = true } = params;

  const query = useQuery({
    queryKey: customerKeys.list({
      current,
      pageSize,
      search: search?.trim() ?? '',
      type: type ?? '',
      group_id: group_id ?? '',
      status: status ?? '',
      include_deleted: include_deleted ? 1 : 0,
    }),
    queryFn: async () => customerService.getList({ current, pageSize, search, type, group_id, status, include_deleted }),
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

export function useCustomerPriceLists(customerId?: number | null, enabled = true) {
  const query = useQuery({
    queryKey: customerId == null ? ['customers', 'price-lists', 'missing-id'] as const : ['customers', customerId, 'price-lists'] as const,
    queryFn: async () => customerService.getPriceLists(customerId as number),
    enabled: enabled && customerId != null,
  });
  const normalized = normalizeList<PriceList>(query.data ?? {});
  return {
    ...query,
    priceLists: normalized.items,
    total: normalized.total,
    loading: query.isLoading,
  } as const;
}

export function useCustomerReconciliations(customerId?: number | null, params: { current?: number; pageSize?: number; enabled?: boolean } = {}) {
  const { current = 1, pageSize = 20, enabled = true } = params;
  const query = useQuery({
    queryKey: customerId == null ? ['customers', 'reconciliations', 'missing-id'] as const : ['customers', customerId, 'reconciliations', { current, pageSize }] as const,
    queryFn: async () => customerService.getReconciliations({ customer_id: customerId as number, current, pageSize }),
    enabled: enabled && customerId != null,
  });
  const normalized = normalizeList<ReconciliationSessionSummary>(query.data ?? {});
  return {
    ...query,
    sessions: normalized.items,
    total: normalized.total,
    loading: query.isLoading,
  } as const;
}
