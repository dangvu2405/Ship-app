import { useCallback } from 'react';
import { useCustomRequest } from '@/hooks/useRequest';
import systemService from '@/services/system.service';

export type ApiHealthState = 'idle' | 'loading' | 'ok' | 'error';

export function useApiHealth() {
  const query = useCustomRequest<ApiHealthState>({
    queryKey: ['settings-api-health'],
    staleTime: 30_000,
    gcTime: 5 * 60_000,
    retry: false,
    queryFn: async () => {
      const healthy = await systemService.checkApiHealth();
      return healthy ? 'ok' : 'error';
    },
  });

  const refreshApiHealth = useCallback(async (): Promise<void> => {
    await query.refetch();
  }, [query]);

  return {
    apiHealth: query.data ?? 'idle',
    apiHealthLoading: query.isFetching,
    refreshApiHealth,
  };
}
