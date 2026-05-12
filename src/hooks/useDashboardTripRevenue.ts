import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { Trip } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

export interface UseDashboardTripRevenueResult {
  total: number;
  tripCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<any>;
}

/** Tổng giá chuyến (price) cho chuyến completed trong tháng/năm, lọc theo company_id nếu có. */
export function useDashboardTripRevenue(options: {
  companyId?: number;
  month?: number;
  year?: number;
}): UseDashboardTripRevenueResult {
  const month = options.month ?? new Date().getMonth() + 1;
  const year = options.year ?? new Date().getFullYear();
  const { companyId } = options;

  const query = useQuery({
    queryKey: ['dashboard-trips', { companyId, month, year, status: 'completed' }],
    queryFn: async ({ signal }) => {
      const res = await api.get(ENDPOINTS.trips.base, {
        signal,
        params: {
          status: 'completed',
          month,
          year,
          ...(companyId != null ? { company_id: companyId } : {}),
          per_page: 1000,
        },
      });
      return (res.data?.data?.data ?? []) as Trip[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { total, tripCount } = useMemo(() => {
    const trips = query.data ?? [];
    return trips.reduce(
      (acc, trip) => {
        const price = typeof trip.price === 'number' ? trip.price : Number(trip.price) || 0;
        acc.total += price;
        acc.tripCount += 1;
        return acc;
      },
      { total: 0, tripCount: 0 },
    );
  }, [query.data]);

  return {
    total,
    tripCount,
    loading: query.isLoading || query.isFetching,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

