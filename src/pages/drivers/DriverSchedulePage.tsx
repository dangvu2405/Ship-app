import { useCallback, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver } from '@/types';
import toast from 'react-hot-toast';
import {
  addDays,
  buildWeekDayColumns,
  cellKey,
  startOfWeekMonday,
  toISODateString,
} from '@/utils/driverScheduleGrid';

export function DriverSchedulePage() {
  const { t } = useTranslation();
  const { data, isLoading } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'asc' }],
  });
  const drivers = data?.data ?? [];

  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const dayColumns = useMemo(() => buildWeekDayColumns(weekStart), [weekStart]);
  const [cells, setCells] = useState<Record<string, string>>({});

  const exportPayload = useMemo(
    () => ({
      weekStartIso: toISODateString(weekStart),
      cells,
    }),
    [weekStart, cells],
  );

  const updateCell = useCallback((driverId: number, iso: string, value: string) => {
    const key = cellKey(driverId, iso);
    setCells((prev) => {
      if (!value.trim()) {
        const next = { ...prev };
        delete next[key];
        return next;
      }
      return { ...prev, [key]: value };
    });
  }, []);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(exportPayload, null, 2)], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `driver-schedule-${exportPayload.weekStartIso}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCopyJson = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportPayload));
      toast.success(t('drivers.scheduleCopied'));
    } catch {
      toast.error(t('drivers.scheduleCopyFailed'));
    }
  };

  const goPrevWeek = () => setWeekStart((w) => startOfWeekMonday(addDays(w, -7)));
  const goNextWeek = () => setWeekStart((w) => startOfWeekMonday(addDays(w, 7)));

  return (
    <>
      <PageHeader title={t('drivers.scheduleTitle')} />
      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>{t('drivers.scheduleTitle')}</CardTitle>
            <CardDescription>{t('drivers.scheduleWeekHint')}</CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={goPrevWeek}>
              {t('drivers.schedulePrevWeek')}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={goNextWeek}>
              {t('drivers.scheduleNextWeek')}
            </Button>
            <Button type="button" variant="secondary" size="sm" onClick={handleExportJson}>
              {t('drivers.scheduleExportJson')}
            </Button>
            <Button type="button" size="sm" onClick={() => void handleCopyJson()}>
              {t('drivers.scheduleCopyJson')}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {isLoading ? (
            <TableSkeleton rows={6} columns={4} />
          ) : (
            <table className="w-full min-w-[720px] border-collapse text-sm">
              <thead>
                <tr className="border-b">
                  <th className="sticky left-0 z-20 min-w-[160px] bg-background px-2 py-3 text-left font-medium">
                    {t('drivers.title')}
                  </th>
                  {dayColumns.map((col) => (
                    <th key={col.iso} className="min-w-[140px] border-l px-2 py-3 text-left font-normal text-muted-foreground">
                      <div className="font-medium text-foreground">{col.label}</div>
                      <div className="text-xs">{col.iso}</div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {drivers.map((driver) => (
                  <tr key={driver.id} className="border-b">
                    <td className="sticky left-0 z-10 bg-background px-2 py-2 align-top font-medium">
                      {driver.employee?.name ?? `#${driver.id}`}
                    </td>
                    {dayColumns.map((col) => {
                      const key = cellKey(driver.id, col.iso);
                      return (
                        <td key={key} className="border-l p-1 align-top">
                          <textarea
                            className="box-border min-h-[88px] w-full resize-y rounded-md border border-input bg-background px-2 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                            rows={3}
                            value={cells[key] ?? ''}
                            placeholder={t('drivers.scheduleCellPlaceholder')}
                            onChange={(e) => updateCell(driver.id, col.iso, e.target.value)}
                          />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </>
  );
}
