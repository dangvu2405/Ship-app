import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import dayjs from 'dayjs';
import type { Trip } from '@/types';
import { normalizeTripStatusKey } from '@/utils/tripStatus';

const RUNNING_KEYS = new Set([
  'assigned',
  'driver_accepted',
  'en_route_pickup',
  'picked_up',
  'in_transit',
  'arrived',
  'delivered',
  'delayed',
]);

function tripRevenueAmount(row: Trip): number {
  const raw = row.total_revenue ?? row.price;
  const n = typeof raw === 'number' ? raw : Number(raw);
  return Number.isFinite(n) ? n : 0;
}

function isCreatedToday(row: Trip, todayKey: string): boolean {
  const createdAt = row.created_at;
  if (!createdAt) return false;
  return dayjs(createdAt).format('YYYY-MM-DD') === todayKey;
}

export function useDashboardTodayKpis(companyId?: number) {
  const today = dayjs().format('YYYY-MM-DD');

  const { data, isLoading, isError, refetch } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 500 },
    filters: [
      { field: 'scheduled_date', operator: 'eq', value: today },
      ...(companyId != null ? [{ field: 'company_id', operator: 'eq' as const, value: companyId }] : []),
    ],
  });

  const { data: createdTodayData } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 500 },
    filters: [
      { field: 'date_from', operator: 'eq', value: today },
      { field: 'date_to', operator: 'eq', value: today },
      ...(companyId != null ? [{ field: 'company_id', operator: 'eq' as const, value: companyId }] : []),
    ],
  });

  const rows = data?.data ?? [];
  const createdRows = createdTodayData?.data ?? [];

  const kpis = useMemo(() => {
    let runningCount = 0;
    let completedCount = 0;
    let revenueToday = 0;

    for (const row of rows) {
      const key = normalizeTripStatusKey(row.status);
      if (key === 'completed') {
        completedCount += 1;
        revenueToday += tripRevenueAmount(row);
      } else if (key && RUNNING_KEYS.has(key)) {
        runningCount += 1;
      }
    }

    const newCount = createdRows.filter((row) => isCreatedToday(row, today)).length || rows.filter((r) => normalizeTripStatusKey(r.status) === 'pending').length;

    return { newCount, runningCount, completedCount, revenueToday, sampleSize: rows.length };
  }, [rows, createdRows, today]);

  return {
    today,
    loading: isLoading,
    isError,
    refetch,
    ...kpis,
  };
}
