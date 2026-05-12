import { useQuery } from '@tanstack/react-query';
import reportsService, { type ReportFilter } from '@/services/reports.service';

type ReportType = 'revenue' | 'costs' | 'trips' | 'profit' | 'vehicles' | 'drivers' | 'maintenance' | 'debt';

const fetchers: Record<ReportType, (f: ReportFilter) => Promise<unknown>> = {
  revenue: (f) => reportsService.getRevenue(f).then((r) => r.data),
  costs: (f) => reportsService.getCosts(f).then((r) => r.data),
  trips: (f) => reportsService.getTrips(f).then((r) => r.data),
  profit: (f) => reportsService.getProfit(f).then((r) => r.data),
  vehicles: (f) => reportsService.getVehicles(f).then((r) => r.data),
  drivers: (f) => reportsService.getDrivers(f).then((r) => r.data),
  maintenance: (f) => reportsService.getMaintenance(f).then((r) => r.data),
  debt: (f) => reportsService.getDebt(f).then((r) => r.data),
};

export function useReport<T = unknown>(type: ReportType, filter: ReportFilter = {}, enabled = true) {
  const query = useQuery<T | null>({
    queryKey: ['reports', type, filter] as const,
    queryFn: async () => {
      const data = (await fetchers[type](filter)) as T | null;
      return data ?? null;
    },
    enabled,
    staleTime: 30_000,
  });

  return {
    ...query,
    data: query.data ?? null,
    loading: query.isLoading,
  } as const;
}

export function useExportReport() {
  return {
    exportReport: async (
      type: ReportType,
      filter: ReportFilter = {},
      format: 'csv' | 'xlsx' = 'xlsx',
    ) => {
      const res = await reportsService.export({ type, format, filter });
      return res.data ?? null;
    },
  };
}
