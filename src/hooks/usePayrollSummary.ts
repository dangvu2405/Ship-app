import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import reportsService, { type PayrollSummaryData } from '@/services/reports.service';
import { getErrorMessage } from '@/utils/errorHandler';
import { translations, type Locale } from '@/locales';
import { useAppStore } from '@/stores/app.store';

interface UsePayrollSummaryOptions {
  companyId?: number;
  month?: number;
  year?: number;
  enabled?: boolean;
}

interface UsePayrollSummaryResult {
  data: PayrollSummaryData | null | undefined;
  loading: boolean;
  isError: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

function summaryLoadFailedMessage(locale: Locale): string {
  const candidate = (translations[locale] as Record<string, unknown>)?.reports as Record<string, unknown> | undefined;
  const message = candidate?.summaryLoadFailed;
  return typeof message === 'string' && message.trim() ? message : 'Failed to load payroll summary';
}

export function usePayrollSummary(options: UsePayrollSummaryOptions): UsePayrollSummaryResult {
  const { companyId, month, year, enabled = true } = options;

  const query = useQuery({
    queryKey: ['payroll-summary', companyId ?? null, month ?? null, year ?? null],
    enabled: enabled && companyId != null,
    queryFn: async () => {
      const locale = useAppStore.getState().locale;
      const fallback = summaryLoadFailedMessage(locale);
      if (companyId == null) {
        return null;
      }
      const response = await reportsService.getPayrollSummary(companyId, month, year);
      if (response.success) {
        return response.data ?? null;
      }
      throw new Error(response.message || fallback);
    },
  });

  const error = useMemo(() => {
    if (!query.error) return null;
    const locale = useAppStore.getState().locale;
    const fallback = summaryLoadFailedMessage(locale);
    return getErrorMessage(query.error) || fallback;
  }, [query.error]);

  return {
    data: query.data,
    loading: query.isLoading || query.isFetching,
    isError: query.isError,
    error,
    refetch: async () => {
      await query.refetch();
    },
  };
}