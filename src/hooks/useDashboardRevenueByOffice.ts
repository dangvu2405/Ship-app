import { useCallback, useEffect, useState } from 'react';
import api from '@/services/api';
import type { Office, Trip } from '@/types';
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

export type OfficeRevenueRow = {
  key: string;
  officeId: number | null;
  officeName: string;
  revenue: number;
  completedTrips: number;
};

type Agg = { revenue: number; completedTrips: number };

/**
 * Gom doanh thu (price) chuyến completed trong tháng/năm theo office_id.
 * Khi có companyId: chỉ chuyến thuộc công ty đó và chỉ văn phòng của công ty đó.
 */
export function useDashboardRevenueByOffice(options: {
  offices: Office[];
  companyId?: number;
  officeId?: number;
  month: number;
  year: number;
}): {
  rows: OfficeRevenueRow[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
} {
  const { offices, companyId, officeId, month, year } = options;
  const [rows, setRows] = useState<OfficeRevenueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const baseOffices = useCallback(() => {
    if (companyId == null) return offices;
    return offices.filter((o) => o.company_id === companyId);
  }, [offices, companyId]);

  const buildRows = useCallback(
    (agg: Map<number | 'none', Agg>, unknownIds: Set<number>) => {
      const listSource = baseOffices();
      const nameById = new Map(listSource.map((o) => [o.id, o.name] as const));
      const seen = new Set<number>();

      const list: OfficeRevenueRow[] = listSource.map((o) => {
        seen.add(o.id);
        const a = agg.get(o.id) ?? { revenue: 0, completedTrips: 0 };
        return {
          key: `o-${o.id}`,
          officeId: o.id,
          officeName: o.name,
          revenue: a.revenue,
          completedTrips: a.completedTrips,
        };
      });

      for (const id of unknownIds) {
        if (seen.has(id)) continue;
        const a = agg.get(id) ?? { revenue: 0, completedTrips: 0 };
        if (a.revenue === 0 && a.completedTrips === 0) continue;
        list.push({
          key: `o-${id}`,
          officeId: id,
          officeName: nameById.get(id) ?? `#${id}`,
          revenue: a.revenue,
          completedTrips: a.completedTrips,
        });
      }

      const none = agg.get('none');
      if (none && (none.revenue > 0 || none.completedTrips > 0)) {
        list.push({
          key: 'none',
          officeId: null,
          officeName: '__UNASSIGNED__',
          revenue: none.revenue,
          completedTrips: none.completedTrips,
        });
      }

      list.sort((a, b) => b.revenue - a.revenue || a.officeName.localeCompare(b.officeName));

      if (officeId != null) {
        return list.filter((r) => r.officeId === officeId);
      }
      return list;
    },
    [baseOffices, officeId],
  );

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    const agg = new Map<number | 'none', Agg>();
    const unknownIds = new Set<number>();
    const listSource = baseOffices();

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
          if (companyId != null) {
            const cid = trip.company_id;
            if (cid == null || Number(cid) !== companyId) continue;
          }
          const p = typeof trip.price === 'number' ? trip.price : Number(trip.price);
          const price = Number.isFinite(p) ? p : 0;
          const oid = trip.office_id;
          const key: number | 'none' = oid == null || !Number.isFinite(Number(oid)) ? 'none' : Number(oid);
          if (key !== 'none' && !listSource.some((o) => o.id === key)) {
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
      setError(getErrorMessage(e) || 'Failed to load revenue by office');
    } finally {
      setLoading(false);
    }
  }, [buildRows, baseOffices, companyId, month, year]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  return { rows, loading, error, refetch: fetchData };
}
