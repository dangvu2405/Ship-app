import { useCallback, useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Play from 'lucide-react/dist/esm/icons/play';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
import type { Company, Office, Trip } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import tripService from '@/services/trip.service';
import { TripFormDialog } from './TripFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { notifyErrorOnce } from '@/utils/errorToast';
import { getTripStatusLabel } from '@/utils/tripStatus';

const getTripStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

export function TripsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [current, setCurrent] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedCompanyId, setAppliedCompanyId] = useState<number | undefined>(undefined);
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);
  const [busyTripId, setBusyTripId] = useState<number | null>(null);

  const { data: companiesData } = useList<Company>({
    resource: 'companies',
    pagination: {
      current: 1,
      pageSize: 100,
    },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: officesData } = useList<Office>({
    resource: 'offices',
    pagination: {
      current: 1,
      pageSize: 200,
    },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const filteredOffices = (officesData?.data ?? []).filter((office) => {
    if (!selectedCompanyId) {
      return true;
    }

    return office.company_id === selectedCompanyId;
  });

  const { data, isLoading, isError, refetch } = useList<Trip>({
    resource: 'trips',
    pagination: {
      current,
      pageSize: 15,
    },
    filters: [
      ...(appliedCompanyId ? [{ field: 'company_id', operator: 'eq' as const, value: appliedCompanyId }] : []),
      ...(appliedOfficeId ? [{ field: 'office_id', operator: 'eq' as const, value: appliedOfficeId }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });
  const safeRefetch = useSafeRefetch('trips-list', refetch);

  const handleCompanyChange = (value: number | undefined) => {
    setSelectedCompanyId(value);
    setSelectedOfficeId(undefined);
  };

  const handleOfficeChange = (value: number | undefined) => {
    setSelectedOfficeId(value);
  };

  const handleSearchFilters = () => {
    setAppliedCompanyId(selectedCompanyId);
    setAppliedOfficeId(selectedOfficeId);
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSelectedCompanyId(undefined);
    setSelectedOfficeId(undefined);
    setSelectedStatus(undefined);
    setAppliedCompanyId(undefined);
    setAppliedOfficeId(undefined);
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    const status = value === 'all' ? undefined : value;
    setSelectedStatus(status);
    setAppliedStatus(status);
    setCurrent(1);
  };

  const handleDelete = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const confirmDelete = () => {
    if (!selectedTrip) return;

    deleteItem(
      {
        resource: 'trips',
        id: selectedTrip.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('trips.title') }));
          setDeleteDialogOpen(false);
          setSelectedTrip(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          notifyErrorOnce('trips-delete', error, {
            fallbackMessage: t('notifications.deleteError', { item: t('trips.title') }),
          });
        },
      }
    );
  };

  /** Chuyển trạng thái chuyến theo workflow spec */
  const handleStatusChange = useCallback(
    async (trip: Trip, newStatus: 'in_progress' | 'completed' | 'cancelled') => {
      setBusyTripId(trip.id);
      try {
        await tripService.updateStatus(trip.id, newStatus);
        toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
        await safeRefetch(true);
      } catch (error) {
        if (shouldShowLocalErrorToast(error)) {
          notifyErrorOnce('trips-status-update', error, {
            fallbackMessage: getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }),
          });
        }
      } finally {
        setBusyTripId(null);
      }
    },
    [t, safeRefetch]
  );

  const columns = useMemo<DataTableColumn<Trip>[]>(
    () => [
    { key: 'code', header: t('trips.code'), dataIndex: 'code' },
    { key: 'start_point', header: t('trips.startPoint'), dataIndex: 'start_point' },
    { key: 'end_point', header: t('trips.endPoint'), dataIndex: 'end_point' },
    {
      key: 'distance_km',
      header: t('trips.distance'),
      dataIndex: 'distance_km',
      render: (item) => `${item.distance_km} km`,
    },
    {
      key: 'price',
      header: t('trips.price'),
      dataIndex: 'price',
      render: (item) => formatCurrencyVND(item.price),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Badge variant={getTripStatusVariant(item.status)}>
          {getTripStatusLabel(item.status, t)}
        </Badge>
      ),
    },
    {
      key: 'start_time',
      header: t('trips.startTime'),
      dataIndex: 'start_time',
      render: (item) => <DateTimeBadge value={item.start_time} mode="datetime" />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div role="presentation" className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('common.actions')}>
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => show('trips', record.id)}>
                  <Eye className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(record.id)}>
                  <Edit className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.edit')}
                </DropdownMenuItem>
                {/* Start trip: pending → in_progress */}
                {record.status === 'pending' && (
                  <DropdownMenuItem
                    disabled={busyTripId === record.id}
                    onClick={() => void handleStatusChange(record, 'in_progress')}
                  >
                    <Play className="h-4 w-4 mr-2" aria-hidden />
                    {t('trips.startTrip')}
                  </DropdownMenuItem>
                )}
                {/* Complete trip: in_progress → completed */}
                {record.status === 'in_progress' && (
                  <DropdownMenuItem
                    disabled={busyTripId === record.id}
                    onClick={() => void handleStatusChange(record, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" aria-hidden />
                    {t('trips.completeTrip')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(record)}>
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ],
    [t, show, busyTripId, handleEdit, handleDelete, handleStatusChange]
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('trips.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('trips.title')}
        description={t('trips.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('trips.createTrip')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="pending">{t('trips.statusPending')}</TabsTrigger>
              <TabsTrigger value="in_progress">{t('trips.statusInProgress')}</TabsTrigger>
              <TabsTrigger value="completed">{t('trips.statusCompleted')}</TabsTrigger>
              <TabsTrigger value="cancelled">{t('trips.statusCancelled')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Select
              allowClear
              showSearch
              placeholder={t('companies.title')}
              value={selectedCompanyId}
              onChange={handleCompanyChange}
              options={(companiesData?.data ?? []).map((company) => ({
                label: company.name,
                value: company.id,
              }))}
              optionFilterProp="label"
            />

            <Select
              allowClear
              showSearch
              placeholder={t('employees.office')}
              value={selectedOfficeId}
              onChange={handleOfficeChange}
              options={filteredOffices.map((office) => ({
                label: office.name,
                value: office.id,
              }))}
              optionFilterProp="label"
            />

            <Button type="button" onClick={handleSearchFilters} loading={isLoading}>
              {t('common.search')}
            </Button>

            <Button type="button" variant="outline" onClick={handleClearFilters} loading={isLoading}>
              {t('common.reset')}
            </Button>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} columns={columns.length} />
          ) : isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => void safeRefetch(true)}
            />
          ) : (
            <DataTable<Trip>
              data={listData}
              columns={columns}
              onRowClick={(record) => show('trips', record.id)}
              emptyMessage={t('common.noData')}
              pagination={{
                current,
                total,
                pageSize,
                onPageChange: setCurrent,
              }}
            />
          )}
        </CardContent>
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedTrip?.code}
      />
      {formOpen && (
        <TripFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void safeRefetch(true);
          }}
        />
      )}
    </>
  );
}
