import { useQuery } from '@tanstack/react-query';
import dispatchService, { type DispatchDailySummary } from '@/services/dispatch.service';

export const DISPATCH_DAILY_SUMMARY_KEY = ['dispatch', 'daily-summary'] as const;

/**
 * Fetch the dispatch daily summary KPI block.
 * Falls back gracefully (returns null) if the endpoint is not yet available on the backend.
 */
export function useDispatchDailySummary(date?: string) {
  return useQuery({
    queryKey: [...DISPATCH_DAILY_SUMMARY_KEY, date ?? null],
    queryFn: async (): Promise<DispatchDailySummary | null> => {
      try {
        const res = await dispatchService.getDailySummary(date);
        return res?.data ?? null;
      } catch {
        return null;
      }
    },
    staleTime: 30_000,
    refetchInterval: 60_000,
  });
}
