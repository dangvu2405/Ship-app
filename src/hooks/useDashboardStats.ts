import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import dashboardService from '@/services/dashboard.service';
import type { DashboardStats } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';
import { translations, type Locale } from '@/locales';
import { useAppStore } from '@/stores/app.store';

function statsLoadFailedMessage(locale: Locale): string {
  const candidate = (translations[locale] as Record<string, unknown>)?.dashboard as Record<string, unknown> | undefined;
  const message = candidate?.statsLoadFailed;
  return typeof message === 'string' && message.trim() ? message : 'Failed to load dashboard stats';
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | undefined;
  statsLoading: boolean;
  statsError: string | null;
  refetchStats: () => Promise<void>;
}

export const useDashboardStats = (options?: {
  enablePolling?: boolean;
  pollingInterval?: number;
  companyId?: number;
}): UseDashboardStatsReturn => {
  const { enablePolling = true, pollingInterval = 60000, companyId } = options || {};
  const query = useQuery({
    queryKey: ['dashboard-stats', companyId ?? null],
    queryFn: async () => {
      const locale = useAppStore.getState().locale;
      const fallback = statsLoadFailedMessage(locale);
      const response = await dashboardService.getStats(undefined, undefined, companyId);
      if (response.success && response.data) {
        return response.data;
      }
      throw new Error(response.message || fallback);
    },
    refetchInterval: enablePolling ? pollingInterval : false,
  });

  const statsError = useMemo(() => {
    if (!query.error) return null;
    const locale = useAppStore.getState().locale;
    const fallback = statsLoadFailedMessage(locale);
    return getErrorMessage(query.error) || fallback;
  }, [query.error]);

  return {
    stats: query.data as DashboardStats | undefined,
    statsLoading: query.isLoading || query.isFetching,
    statsError,
    refetchStats: async () => {
      await query.refetch();
    },
  };
};
