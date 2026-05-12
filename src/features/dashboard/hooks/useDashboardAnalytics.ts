import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import dayjs from 'dayjs';
import { dashboardService } from '../services/dashboard.service';
import { DashboardFilters } from '../types';

export function useDashboardAnalytics(initialCompanyId?: number) {
  const [filters, setFilters] = useState<DashboardFilters>({
    companyId: initialCompanyId,
    dateRange: [
      dayjs().subtract(30, 'day').toISOString(),
      dayjs().toISOString(),
    ],
  });

  const query = useQuery({
    queryKey: ['dashboard', 'analytics', filters],
    queryFn: () => dashboardService.getAnalytics(filters),
    // Refresh every 5 minutes automatically
    refetchInterval: 300000,
  });

  const setDateRange = (range: [dayjs.Dayjs, dayjs.Dayjs]) => {
    setFilters((prev) => ({
      ...prev,
      dateRange: [range[0].toISOString(), range[1].toISOString()],
    }));
  };

  const setCompanyId = (companyId?: number) => {
    setFilters((prev) => ({ ...prev, companyId }));
  };

  return {
    filters,
    setFilters,
    setDateRange,
    setCompanyId,
    analytics: query.data,
    isLoading: query.isLoading || query.isFetching,
    isError: query.isError,
    refresh: () => query.refetch(),
    query,
  };
}
