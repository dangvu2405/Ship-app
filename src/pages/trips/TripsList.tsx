import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import type { Company, Office, Trip } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function TripsList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [current, setCurrent] = useState(1);
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | undefined>(undefined);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedCompanyId, setAppliedCompanyId] = useState<number | undefined>(undefined);
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

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

  const handleDelete = (trip: Trip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  };

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
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('trips.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Trip>[] = [
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
      render: (item) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.price),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Badge variant={item.status === 'completed' ? 'default' : item.status === 'in_progress' ? 'secondary' : 'outline'}>
          {item.status === 'completed'
            ? t('trips.statusCompleted')
            : item.status === 'in_progress'
              ? t('trips.statusInProgress')
              : t('trips.statusPending')}
        </Badge>
      ),
    },
    {
      key: 'start_time',
      header: t('trips.startTime'),
      dataIndex: 'start_time',
      render: (item) => item.start_time ? new Date(item.start_time).toLocaleString() : '-',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('trips', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); edit('trips', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
          <Button onClick={() => create('trips')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('trips.createTrip')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">{t('trips.statusPending')}</TabsTrigger>
              <TabsTrigger value="in_progress">{t('trips.statusInProgress')}</TabsTrigger>
              <TabsTrigger value="completed">{t('trips.statusCompleted')}</TabsTrigger>
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

            <Button type="button" onClick={handleSearchFilters}>
              {t('common.search')}
            </Button>

            <Button type="button" variant="outline" onClick={handleClearFilters}>
              {t('common.reset')}
            </Button>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} columns={columns.length} />
          ) : isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => refetch()}
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
    </>
  );
}
