import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button, Card } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { VehicleAssignment } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { VehicleAssignmentFormDialog } from './VehicleAssignmentFormDialog';

export function VehicleAssignmentsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<VehicleAssignment | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useList<VehicleAssignment>({
    resource: 'vehicle_assignments',
    pagination: { current, pageSize: 15 },
  });

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'vehicle_assignments', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('vehicleAssignments.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('vehicleAssignments.title') }));
        },
      }
    );
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  };

  const columns: DataTableColumn<VehicleAssignment>[] = [
    { key: 'vehicle', header: t('vehicleAssignments.vehicle'), render: (r) => r.vehicle?.plate_number ?? `#${r.vehicle_id}` },
    {
      key: 'driver',
      header: t('vehicleAssignments.driver'),
      render: (r) => {
        const driver = r.driver;
        if (!driver) return `#${r.driver_id}`;
        if ('employee_id' in driver) {
          return driver.employee?.name ?? `#${r.driver_id}`;
        }
        return driver.name ?? `#${r.driver_id}`;
      },
    },
    {
      key: 'from_date',
      header: t('vehicleAssignments.fromDate'),
      dataIndex: 'from_date',
      render: (r) => <DateTimeBadge value={r.from_date} mode="date" />,
    },
    {
      key: 'to_date',
      header: t('vehicleAssignments.toDate'),
      dataIndex: 'to_date',
      render: (r) => <DateTimeBadge value={r.to_date} mode="date" />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={(e) => { e.stopPropagation(); show('vehicle_assignments', record.id); }} />
          <Button type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }} />
          <Button type="text" size="small" danger icon={<DeleteOutlined aria-hidden />} aria-label={t('common.delete')} onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }} />
        </div>
      ),
    },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('vehicleAssignments.title')}
        description={t('vehicleAssignments.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('vehicleAssignments.title') }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('vehicleAssignments.createAssignment')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<VehicleAssignment>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('vehicle_assignments', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('vehicleAssignments.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('vehicleAssignments.createAssignment')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
      </Card>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selected?.from_date ? new Intl.DateTimeFormat('vi-VN').format(new Date(selected.from_date)) : undefined}
      />
      {formOpen && (
        <VehicleAssignmentFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
