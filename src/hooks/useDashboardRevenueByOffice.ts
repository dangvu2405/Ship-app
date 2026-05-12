import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { Office, Trip } from '@/types';
import { getErrorMessage } from '@/utils/errorHandler';

export interface OfficeRevenueRow {
  key: string;
  officeId: number | '__UNASSIGNED__';
  officeName: string;
  completedTrips: number;
  revenue: number;
}

export function useDashboardRevenueByOffice(options: {
  offices: Office[];
  companyId?: number;
  officeId?: number;
  month: number;
  year: number;
}) {
  const { offices, companyId, officeId, month, year } = options;

  const query = useQuery({
    queryKey: ['dashboard-trips', { companyId, officeId, month, year, status: 'completed' }],
    queryFn: async ({ signal }) => {
      const res = await api.get(ENDPOINTS.trips.base, {
        signal,
        params: {
          status: 'completed',
          month,
          year,
          ...(companyId != null ? { company_id: companyId } : {}),
          ...(officeId != null ? { office_id: officeId } : {}),
          per_page: 1000,
        },
      });
      return (res.data?.data?.data ?? []) as Trip[];
    },
    // Cache for 5 minutes as suggested in the report
    staleTime: 5 * 60 * 1000,
  });

  const rows = useMemo(() => {
    const trips = query.data ?? [];
    const officeMap = new Map<number | '__UNASSIGNED__', OfficeRevenueRow>();

    // Initialize with known offices if we have a company filter
    if (companyId != null) {
      offices
        .filter((o) => o.company_id === companyId)
        .forEach((o) => {
          officeMap.set(o.id, {
            key: String(o.id),
            officeId: o.id,
            officeName: o.name,
            completedTrips: 0,
            revenue: 0,
          });
        });
    }

    for (const trip of trips) {
      const oid = trip.office_id || '__UNASSIGNED__';
      const existing = officeMap.get(oid);
      const price = typeof trip.price === 'number' ? trip.price : Number(trip.price) || 0;

      if (existing) {
        existing.completedTrips += 1;
        existing.revenue += price;
      } else {
        officeMap.set(oid, {
          key: String(oid),
          officeId: oid,
          officeName: oid === '__UNASSIGNED__' ? 'Unassigned' : `Office #${oid}`,
          completedTrips: 1,
          revenue: price,
        });
      }
    }

    // Sort by revenue descending
    return Array.from(officeMap.values())
      .filter((r) => r.completedTrips > 0 || r.officeId !== '__UNASSIGNED__')
      .sort((a, b) => b.revenue - a.revenue);
  }, [query.data, companyId, offices]);

  return {
    rows,
    loading: query.isLoading || query.isFetching,
    error: query.error ? getErrorMessage(query.error) : null,
    refetch: query.refetch,
  };
}

