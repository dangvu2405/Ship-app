import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import type { Company, Trip } from '@/types';
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
  message?: string;
}

export type CompanyRevenueRow = {
  key: string;
  companyId: number | null;
  companyName: string;
  revenue: number;
  completedTrips: number;
};

type Agg = { revenue: number; completedTrips: number };

/**
 * Gom doanh thu (price) chuyến completed trong tháng/năm theo company_id.
 * Bổ sung hàng công ty chưa có chuyến (0) từ danh sách `companies`.
 */
export function useDashboardRevenueByCompany(options: {
  companies: Company[];
  companyId?: number;
  month: number;
  year: number;
}): {
  rows: CompanyRevenueRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { companies, companyId, month, year } = options;
  const [rows, setRows] = useState<CompanyRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const buildRows = useCallback(
    (agg: Map<number | 'none', Agg>, unknownIds: Set<number>) => {
      const nameById = new Map(companies.map((c) => [c.id, c.name] as const));
      const seen = new Set<number>();

      const list: CompanyRevenueRow[] = companies.map((c) => {
        seen.add(c.id);
        const a = agg.get(c.id) ?? { revenue: 0, completedTrips: 0 };
        return {
          key: `c-${c.id}`,
          companyId: c.id,
          companyName: c.name,
          revenue: a.revenue,
          completedTrips: a.completedTrips,
        };
      });

      for (const id of unknownIds) {
        if (seen.has(id)) continue;
        const a = agg.get(id) ?? { revenue: 0, completedTrips: 0 };
        if (a.revenue === 0 && a.completedTrips === 0) continue;
        list.push({
          key: `c-${id}`,
          companyId: id,
          companyName: nameById.get(id) ?? `#${id}`,
          revenue: a.revenue,
          completedTrips: a.completedTrips,
        });
      }

      const none = agg.get('none');
      if (none && (none.revenue > 0 || none.completedTrips > 0)) {
        list.push({
          key: 'none',
          companyId: null,
          companyName: '__UNASSIGNED__',
          revenue: none.revenue,
          completedTrips: none.completedTrips,
        });
      }

      list.sort((a, b) => b.revenue - a.revenue || a.companyName.localeCompare(b.companyName));

      if (companyId != null) {
        return list.filter((r) => r.companyId === companyId);
      }
      return list;
    },
    [companies, companyId],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const agg = new Map<number | 'none', Agg>();
    const unknownIds = new Set<number>();

    try {
      let page = 1;
      let lastPage = 1;
      do {
        const response = await api.get<TripsListBody>('/trips', {
          params: {
            page,
            per_page: 100,
            status: 'completed',
          },
        });
        const body = response.data;
        if (body?.success === false) {
          throw new Error(body.message || 'Request failed');
        }
        const tripRows = body?.data?.data ?? [];
        const meta = body?.data?.meta;
        lastPage = Math.max(1, Number(meta?.last_page) || 1);

        for (const trip of tripRows) {
          if (!tripDateInMonth(trip, month, year)) continue;
          const p = typeof trip.price === 'number' ? trip.price : Number(trip.price);
          const price = Number.isFinite(p) ? p : 0;
          const cid = trip.company_id;
          const key: number | 'none' = cid == null || !Number.isFinite(Number(cid)) ? 'none' : Number(cid);
          if (key !== 'none' && !companies.some((c) => c.id === key)) {
            unknownIds.add(key);
          }
          const cur = agg.get(key) ?? { revenue: 0, completedTrips: 0 };
          cur.revenue += price;
          cur.completedTrips += 1;
          agg.set(key, cur);
        }
        page += 1;
      } while (page <= lastPage);

      setRows(buildRows(agg, unknownIds));
    } catch (e) {
      setRows([]);
      setError(getErrorMessage(e) || 'Failed to load revenue by company');
    } finally {
      setLoading(false);
    }
  }, [buildRows, companies, month, year]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { rows, loading, error, refetch: fetchData };
}
