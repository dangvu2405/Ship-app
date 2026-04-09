import { useCallback, useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { VehicleAssignment } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { VehicleAssignmentFormDialog } from './VehicleAssignmentFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';

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

  const safeRefetch = useSafeRefetch('vehicle_assignments-vehicleassignmentslist', refetch);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'vehicle_assignments', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('vehicleAssignments.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
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

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const columns = useMemo<DataTableColumn<VehicleAssignment>[]>(
    () => [
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
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('vehicle_assignments', record.id);
            }}
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={t('common.edit')}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record.id);
            }}
          >
            <PencilIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            aria-label={t('common.delete')}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2Icon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ],
    [t, show, handleEdit]
  );

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
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('vehicleAssignments.createAssignment')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <DataTable<VehicleAssignment>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('vehicle_assignments', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize, onPageChange: setCurrent }}
          />
        )}
        </CardContent>
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
            void safeRefetch(true);
          }}
        />
      )}
    </>
  );
}
