import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function VehiclesList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: {
      current,
      pageSize: 15,
    },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedStatus(undefined);
    setAppliedKeyword('');
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    setSelectedStatus(value === 'all' ? undefined : value);
    setAppliedStatus(value === 'all' ? undefined : value);
    setCurrent(1);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedVehicle) return;

    deleteItem(
      {
        resource: 'vehicles',
        id: selectedVehicle.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('vehicles.title') }));
          setDeleteDialogOpen(false);
          setSelectedVehicle(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('vehicles.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Vehicle>[] = [
    { key: 'plate_number', header: t('vehicles.plateNumber'), dataIndex: 'plate_number' },
    { key: 'type', header: t('vehicles.type'), dataIndex: 'type' },
    { key: 'brand', header: t('vehicles.brand'), dataIndex: 'brand' },
    { key: 'model', header: t('vehicles.model'), dataIndex: 'model' },
    { key: 'year', header: t('vehicles.year'), dataIndex: 'year' },
    {
      key: 'capacity',
      header: t('vehicles.capacity'),
      dataIndex: 'capacity',
      render: (item) => item.capacity ? `${item.capacity} ${t('vehicles.capacityUnit')}` : '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('vehicles', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); edit('vehicles', record.id); }}
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
    { label: t('vehicles.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('vehicles.title')}
        description={t('vehicles.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => create('vehicles')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('vehicles.createVehicle')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="active">{t('common.active')}</TabsTrigger>
              <TabsTrigger value="inactive">{t('common.inactive')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <Input
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={(event) => setSearchKeyword(event.target.value)}
            />
            <Select
              allowClear
              placeholder={t('common.status')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { label: t('common.active'), value: 'active' },
                { label: t('common.inactive'), value: 'inactive' },
              ]}
            />
            <Button type="button" onClick={handleSearchFilters}>{t('common.search')}</Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>{t('common.reset')}</Button>
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
            <DataTable<Vehicle>
              data={listData}
              columns={columns}
              onRowClick={(record) => show('vehicles', record.id)}
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
        itemName={selectedVehicle?.plate_number}
      />
    </>
  );
}
