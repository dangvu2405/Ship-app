import { useCallback, useEffect, useState } from 'react';
import reportsService from '@/services/reports.service';
import { getErrorMessage } from '@/utils/errorHandler';

export interface UseDashboardTripRevenueResult {
  total: number;
  tripCount: number;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
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

  const [total, setTotal] = useState(0);
  const [tripCount, setTripCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchRevenue = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await reportsService.getRevenueSummary(companyId, month, year);
      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to load revenue');
      }
      const payload = response.data;
      const totalCandidate = payload.total_revenue ?? payload.total ?? 0;
      const tripsCandidate = payload.trips_completed ?? payload.completed ?? 0;
      setTotal(Number.isFinite(Number(totalCandidate)) ? Number(totalCandidate) : 0);
      setTripCount(Number.isFinite(Number(tripsCandidate)) ? Number(tripsCandidate) : 0);
    } catch (e) {
      setTotal(0);
      setTripCount(0);
      setError(getErrorMessage(e) || 'Failed to load revenue');
    } finally {
      setLoading(false);
    }
  }, [companyId, month, year]);

  useEffect(() => {
    void fetchRevenue();
  }, [fetchRevenue]);

  return { total, tripCount, loading, error, refetch: fetchRevenue };
}
