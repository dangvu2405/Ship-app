import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import type { Trip } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

function tripDateInMonth(trip: Pick<Trip, 'start_time' | 'end_time'>, month: number, year: number): boolean {
  const raw = trip.end_time || trip.start_time;
  if (!raw) return false;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return false;
  return d.getMonth() + 1 === month && d.getFullYear() === year;
}

interface TripsListBody {
  success?: boolean;
  data?: {
    data?: Trip[];
    meta?: { current_page?: number; last_page?: number; per_page?: number; total?: number };
  };
}

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
    let sum = 0;
    let count = 0;
    try {
      let page = 1;
      let lastPage = 1;
      do {
        const response = await api.get<TripsListBody>('/trips', {
          params: {
            page,
            per_page: 100,
            status: 'completed',
            ...(companyId != null ? { company_id: companyId } : {}),
          },
        });
        const body = response.data;
        if (body?.success === false) {
          throw new Error(typeof body === 'object' && body && 'message' in body ? String((body as { message?: string }).message) : 'Request failed');
        }
        const rows = body?.data?.data ?? [];
        const meta = body?.data?.meta;
        lastPage = Math.max(1, Number(meta?.last_page) || 1);

        for (const trip of rows) {
          if (!tripDateInMonth(trip, month, year)) continue;
          const p = typeof trip.price === 'number' ? trip.price : Number(trip.price);
          if (Number.isFinite(p)) sum += p;
          count += 1;
        }
        page += 1;
      } while (page <= lastPage);

      setTotal(sum);
      setTripCount(count);
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
