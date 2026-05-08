import { useQuery } from '@tanstack/react-query';
import customerService from '@/services/customer.service';
import { normalizeList } from './_customersInternal';

export function useCustomerGroups(params: { current?: number; pageSize?: number; keyword?: string; enabled?: boolean } = {}) {
  const { current = 1, pageSize = 200, keyword, enabled = true } = params;
  const query = useQuery({
    queryKey: ['customer-groups', { current, pageSize, keyword }],
    queryFn: async () => customerService.getGroups({ current, pageSize, keyword }),
    enabled,
  });
  const normalized = normalizeList(query.data ?? {});
  return {
    ...query,
    groups: normalized.items,
    total: normalized.total,
    loading: query.isLoading,
  } as const;
}
