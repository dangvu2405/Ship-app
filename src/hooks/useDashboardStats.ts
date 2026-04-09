import { useCallback, useEffect, useState } from 'react';
import dashboardService from '@/services/dashboard.service';
import type { DashboardStats } from '@/types';
import { useGuardedAsync } from '@/hooks/useGuardedAsync';
import { getErrorMessage } from '@/utils/errorHandler';
import { translations, type Locale } from '@/locales';
import { useAppStore } from '@/stores/app.store';

function statsLoadFailedMessage(locale: Locale): string {
  return translations[locale].dashboard.statsLoadFailed;
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
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [statsLoading, setStatsLoading] = useState(false);
  const [statsError, setStatsError] = useState<string | null>(null);
  const { run } = useGuardedAsync(1000);

  const fetchStats = useCallback(async () => {
    await run('dashboard-stats', async () => {
      const locale = useAppStore.getState().locale;
      const fallback = statsLoadFailedMessage(locale);
      try {
        setStatsLoading(true);
        setStatsError(null);
        const response = await dashboardService.getStats(undefined, undefined, companyId);
        if (response.success && response.data) {
          setStats(response.data);
          setStatsError(null);
        } else {
          setStats(undefined);
          setStatsError(response.message || fallback);
        }
      } catch (error) {
        setStats(undefined);
        setStatsError(getErrorMessage(error) || fallback);
      } finally {
        setStatsLoading(false);
      }
    });
  }, [run, companyId]);

  useEffect(() => {
    void fetchStats();
  }, [fetchStats]);

  useEffect(() => {
    if (!enablePolling) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      void fetchStats();
    }, pollingInterval);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [enablePolling, pollingInterval, fetchStats]);

  return {
    stats,
    statsLoading,
    statsError,
    refetchStats: fetchStats,
  };
};
