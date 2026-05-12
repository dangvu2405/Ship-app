import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { getErrorMessage } from '@/utils/errorHandler';
import type { Trip } from '@/types';

export interface TopDriverRow {
  driverId: number | string;
  driverName: string;
  trips: number;
  revenue: number;
}

/**
 * Fetch recent completed trips for the period and aggregate top drivers.
 * This hook intentionally limits pages to avoid heavy load on the dashboard.
 */
export function useTopDrivers(options: { companyId?: number; month: number; year: number; limit?: number }) {
  const { companyId, month, year, limit = 6 } = options;
  const [rows, setRows] = useState<TopDriverRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(ENDPOINTS.trips.base, {
        params: {
          status: 'completed',
          month,
          year,
          ...(companyId != null ? { company_id: companyId } : {}),
          per_page: 200,
          page: 1,
        },
      });

      const trips = (res.data?.data?.data ?? []) as Trip[];

      const map = new Map<number | string, TopDriverRow>();
      for (const trip of trips) {
        const driverId = trip.driver_id ?? trip.driver?.id ?? '__unknown__';
        const driverName = trip.driver?.name ?? `#${driverId}`;
        const price = typeof trip.price === 'number' ? trip.price : Number(trip.price) || 0;
        const existing = map.get(driverId) ?? { driverId, driverName, trips: 0, revenue: 0 } as TopDriverRow;
        existing.trips += 1;
        existing.revenue += price;
        map.set(driverId, existing);
      }

      const out = Array.from(map.values()).sort((a, b) => b.revenue - a.revenue).slice(0, limit);
      setRows(out);
    } catch (e) {
      setError(getErrorMessage(e));
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [companyId, month, year, limit]);

  useEffect(() => {
    void fetch();
  }, [fetch]);

  return { rows, loading, error, refetch: fetch };
}
