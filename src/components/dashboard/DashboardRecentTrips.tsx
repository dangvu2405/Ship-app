import { useList, useNavigation } from '@refinedev/core';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import RouteIcon from 'lucide-react/dist/esm/icons/route';
import ChevronRightIcon from 'lucide-react/dist/esm/icons/chevron-right';

export function DashboardRecentTrips() {
  const { t } = useTranslation();
  const { show } = useNavigation();

  const { data, isLoading } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 8 },
    sorters: [{ field: 'id', order: 'desc' }],
  });

  const rows = data?.data ?? [];

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <div className="space-y-1">
          <CardTitle className="text-lg">{t('dashboard.recentTrips')}</CardTitle>
          <CardDescription>{t('dashboard.recentTripsDescription')}</CardDescription>
        </div>
        <RouteIcon className="h-5 w-5 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <TableSkeleton rows={5} columns={5} />
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground py-6 text-center">{t('dashboard.noRecentTrips')}</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('trips.code')}</TableHead>
                <TableHead>{t('trips.startPoint')}</TableHead>
                <TableHead>{t('trips.endPoint')}</TableHead>
                <TableHead>{t('common.status')}</TableHead>
                <TableHead className="w-[100px] text-right">{t('common.actions')}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((trip) => (
                <TableRow key={trip.id}>
                  <TableCell className="font-medium">{trip.code}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{trip.start_point}</TableCell>
                  <TableCell className="max-w-[140px] truncate">{trip.end_point}</TableCell>
                  <TableCell>
                    <span className="text-sm capitalize text-muted-foreground">{trip.status}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 gap-1"
                      onClick={() => show('trips', trip.id)}
                    >
                      {t('common.view')}
                      <ChevronRightIcon className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
}
