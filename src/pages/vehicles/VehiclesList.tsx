import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Vehicle } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';
import toast from 'react-hot-toast';

export function VehiclesList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);

  const { data, isLoading, refetch } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: {
      current: 1,
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
        onError: () => {
          toast.error(t('notifications.deleteError', { item: t('vehicles.title') }));
        },
      }
    );
  };

  const columns: BaseTableColumn<Vehicle>[] = [
    {
      title: t('vehicles.plateNumber'),
      dataIndex: 'plate_number',
      key: 'plate_number',
      sorter: true,
    },
    {
      title: t('vehicles.type'),
      dataIndex: 'type',
      key: 'type',
    },
    {
      title: t('vehicles.brand'),
      dataIndex: 'brand',
      key: 'brand',
    },
    {
      title: t('vehicles.model'),
      dataIndex: 'model',
      key: 'model',
    },
    {
      title: t('vehicles.year'),
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: t('vehicles.capacity'),
      dataIndex: 'capacity',
      key: 'capacity',
      render: (capacity: number) => capacity ? `${capacity} ${t('vehicles.capacityUnit')}` : '-',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'active' ? 'text-green-600' : 'text-gray-500'}>
          {status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Vehicle) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('vehicles', record.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: '/dashboard' },
    { label: t('vehicles.title') },
  ];

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
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <BaseTable<Vehicle>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="vehicles"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('vehicles', record.id)}
            deleteConfirmMessage={t('deleteConfirm.description')}
            deleteSuccessMessage={t('notifications.deleteSuccess', { item: t('vehicles.title') })}
            deleteErrorMessage={t('notifications.deleteError', { item: t('vehicles.title') })}
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
