import { useMemo } from 'react';
import type { CrudFilter, CrudSort } from '@refinedev/core';
import type { Trip, VehicleExpense } from '@/types';
import { useResourceListQuery } from './useResourceListQuery';

type ReportListParams = {
  enabled?: boolean;
  pageSize?: number;
  filters?: CrudFilter[];
  sorters?: CrudSort[];
};

export function useTripReportList({ enabled = true, pageSize = 100, filters = [], sorters = [] }: ReportListParams = {}) {
  const query = useResourceListQuery<Trip>({
    resource: 'trips',
    current: 1,
    pageSize,
    filters,
    sorters,
    enabled,
  });

  return {
    ...query,
    trips: query.data?.data ?? [],
    loading: query.isLoading,
  } as const;
}

export function useVehicleExpenseReportList({ enabled = true, pageSize = 100, filters = [], sorters = [] }: ReportListParams = {}) {
  const query = useResourceListQuery<VehicleExpense>({
    resource: 'vehicle_expenses',
    current: 1,
    pageSize,
    filters,
    sorters,
    enabled,
  });

  return {
    ...query,
    expenses: query.data?.data ?? [],
    loading: query.isLoading,
  } as const;
}

export function useCustomerNamesForReport(pageSize = 100) {
  const filters = useMemo(() => [], []);
  const query = useResourceListQuery<{ id: number; name: string }>({
    resource: 'customers',
    current: 1,
    pageSize,
    filters,
    sorters: [],
  });

  return {
    ...query,
    customers: query.data?.data ?? [],
    loading: query.isLoading,
  } as const;
}