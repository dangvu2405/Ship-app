import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function VehiclesList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, refetch } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: {
      current,
      pageSize: 15,
    },
  });

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
        <span className={item.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
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

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
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
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedVehicle?.plate_number}
      />
    </>
  );
}
