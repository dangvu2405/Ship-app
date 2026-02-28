import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Trip } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';
import toast from 'react-hot-toast';

export function TripsList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  const { data, isLoading, refetch } = useList<Trip>({
    resource: 'trips',
    pagination: {
      current: 1,
      pageSize: 15,
    },
  });

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
        onError: () => {
          toast.error(t('notifications.deleteError', { item: t('trips.title') }));
        },
      }
    );
  };

  const columns: BaseTableColumn<Trip>[] = [
    {
      title: t('trips.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: t('trips.startPoint'),
      dataIndex: 'start_point',
      key: 'start_point',
    },
    {
      title: t('trips.endPoint'),
      dataIndex: 'end_point',
      key: 'end_point',
    },
    {
      title: t('trips.distance'),
      dataIndex: 'distance_km',
      key: 'distance_km',
      render: (distance: number) => `${distance} km`,
    },
    {
      title: t('trips.price'),
      dataIndex: 'price',
      key: 'price',
      render: (price: number) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(price),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'completed' ? 'text-green-600' : 'text-gray-500'}>
          {status}
        </span>
      ),
    },
    {
      title: t('trips.startTime'),
      dataIndex: 'start_time',
      key: 'start_time',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Trip) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('trips', record.id)}
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
    { label: t('trips.title') },
  ];

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

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <BaseTable<Trip>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="trips"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('trips', record.id)}
            deleteConfirmMessage={t('deleteConfirm.description')}
            deleteSuccessMessage={t('notifications.deleteSuccess', { item: t('trips.title') })}
            deleteErrorMessage={t('notifications.deleteError', { item: t('trips.title') })}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedTrip?.code}
      />
    </>
  );
}
