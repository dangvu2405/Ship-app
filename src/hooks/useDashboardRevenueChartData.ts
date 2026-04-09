import { useCallback, useEffect, useMemo, useState } from 'react';
import api from '@/services/api';
import type { Office, Trip } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

const MAX_SERIES = 10;

export type RevenueChartTimeRange = '7d' | '30d' | '90d';

type TripRow = Trip & {
  office_id?: number;
  company_id?: number;
  vehicle?: { office_id?: number; office?: Pick<Office, 'id' | 'company_id'> };
};

interface TripsBody {
  success?: boolean;
  message?: string;
  data?: { data?: TripRow[]; meta?: { last_page?: number } };
}

function tripDayKey(trip: TripRow): string | null {
  const raw = trip.end_time || trip.start_time;
  if (!raw) return null;
  const d = new Date(raw);
  if (Number.isNaN(d.getTime())) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function getDateKeysForRange(days: number): string[] {
  const end = new Date();
  const keys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(end.getFullYear(), end.getMonth(), end.getDate() - i);
    keys.push(
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`,
    );
  }
  return keys;
}

function resolveOfficeId(trip: TripRow): number | undefined {
  if (typeof trip.office_id === 'number') return trip.office_id;
  if (trip.vehicle?.office_id != null) return Number(trip.vehicle.office_id);
  return undefined;
}

function resolveCompanyId(trip: TripRow, officeById: Map<number, Office>): number | undefined {
  if (typeof trip.company_id === 'number') return trip.company_id;
  const oid = resolveOfficeId(trip);
  if (oid != null) {
    const o = officeById.get(oid);
    if (o) return o.company_id;
  }
  if (trip.vehicle?.office?.company_id != null) return Number(trip.vehicle.office.company_id);
  return undefined;
}

function seriesKeyAllCompanies(trip: TripRow, officeById: Map<number, Office>): string {
  const cid = resolveCompanyId(trip, officeById);
  return cid != null ? `co_${cid}` : 'co_other';
}

function seriesKeyOneCompany(trip: TripRow, officesForCompany: Office[]): string {
  const oid = resolveOfficeId(trip);
  if (oid != null && officesForCompany.some((o) => o.id === oid)) return `of_${oid}`;
  return 'of_other';
}

export interface UseDashboardRevenueChartDataResult {
  chartData: Record<string, string | number>[];
  seriesKeys: string[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useDashboardRevenueChartData(options: {
  companyId?: number;
  timeRange: RevenueChartTimeRange;
  offices: Office[];
}): UseDashboardRevenueChartDataResult {
  const { companyId, timeRange, offices } = options;
  const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90;

  const officeById = useMemo(() => new Map(offices.map((o) => [o.id, o])), [offices]);

  const officesForSelectedCompany = useMemo(
    () => (companyId != null ? offices.filter((o) => o.company_id === companyId) : []),
    [companyId, offices],
  );

  const [chartData, setChartData] = useState<Record<string, string | number>[]>([]);
  const [seriesKeys, setSeriesKeys] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const build = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const dateKeys = getDateKeysForRange(days);
      const rangeStart = dateKeys[0];
      const rangeEnd = dateKeys[dateKeys.length - 1];

      const daily = new Map<string, Map<string, number>>();
      for (const dk of dateKeys) {
        daily.set(dk, new Map());
      }

      let page = 1;
      let lastPage = 1;
      do {
        const res = await api.get<TripsBody>('/trips', {
          params: {
            page,
            per_page: 100,
            status: 'completed',
            ...(companyId != null ? { company_id: companyId } : {}),
          },
        });
        const body = res.data;
        if (body?.success === false) {
          throw new Error(body.message || 'Request failed');
        }
        const rows = body?.data?.data ?? [];
        lastPage = Math.max(1, Number(body?.data?.meta?.last_page) || 1);

        for (const trip of rows) {
          const dk = tripDayKey(trip);
          if (!dk || dk < rangeStart || dk > rangeEnd) continue;
          const price = typeof trip.price === 'number' ? trip.price : Number(trip.price);
          if (!Number.isFinite(price)) continue;

          const sk =
            companyId == null
              ? seriesKeyAllCompanies(trip, officeById)
              : seriesKeyOneCompany(trip, officesForSelectedCompany);

          const m = daily.get(dk);
          if (!m) continue;
          m.set(sk, (m.get(sk) ?? 0) + price);
        }
        page += 1;
      } while (page <= lastPage);

      const totals = new Map<string, number>();
      for (const m of daily.values()) {
        for (const [k, v] of m) {
          totals.set(k, (totals.get(k) ?? 0) + v);
        }
      }

      const sortedKeys = [...totals.entries()].sort((a, b) => b[1] - a[1]).map(([k]) => k);
      const topKeys = sortedKeys.slice(0, MAX_SERIES);
      const mergeKeys = sortedKeys.slice(MAX_SERIES);
      const finalKeys = [...topKeys];
      if (mergeKeys.length) {
        finalKeys.push('other');
      }

      const rowsOut: Record<string, string | number>[] = dateKeys.map((dk) => {
        const m = daily.get(dk) ?? new Map();
        const row: Record<string, string | number> = { date: dk };
        let otherSum = 0;
        for (const k of mergeKeys) {
          otherSum += m.get(k) ?? 0;
        }
        for (const k of topKeys) {
          row[k] = m.get(k) ?? 0;
        }
        if (mergeKeys.length) {
          row.other = otherSum;
        }
        return row;
      });

      setSeriesKeys(finalKeys);
      setChartData(rowsOut);
    } catch (e) {
      setChartData([]);
      setSeriesKeys([]);
      setError(getErrorMessage(e) || 'Error');
    } finally {
      setLoading(false);
    }
  }, [companyId, days, officeById, officesForSelectedCompany]);

  useEffect(() => {
    void build();
  }, [build]);

  return { chartData, seriesKeys, loading, error, refetch: build };
}
