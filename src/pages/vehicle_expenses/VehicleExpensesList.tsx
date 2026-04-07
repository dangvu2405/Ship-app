import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
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
import type { VehicleExpense } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function VehicleExpensesList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<VehicleExpense | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useList<VehicleExpense>({
    resource: 'vehicle_expenses',
    pagination: { current, pageSize: 15 },
  });

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'vehicle_expenses', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('vehicleExpenses.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('vehicleExpenses.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<VehicleExpense>[] = [
    { key: 'vehicle', header: t('vehicleExpenses.vehicle'), render: (r) => r.vehicle?.plate_number ?? `#${r.vehicle_id}` },
    { key: 'type', header: t('vehicleExpenses.type'), dataIndex: 'type' },
    { key: 'amount', header: t('vehicleExpenses.amount'), dataIndex: 'amount' },
    {
      key: 'expense_date',
      header: t('vehicleExpenses.expenseDate'),
      dataIndex: 'expense_date',
      render: (r) => <DateTimeBadge value={r.expense_date} mode="date" />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); show('vehicle_expenses', record.id); }}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); edit('vehicle_expenses', record.id); }}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
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
        title={t('vehicleExpenses.title')}
        description={t('vehicleExpenses.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('vehicleExpenses.title') }]}
        actions={
          <Button onClick={() => create('vehicle_expenses')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('vehicleExpenses.createExpense')}
          </Button>
        }
      />
      <div className="bg-card shadow rounded-lg border p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<VehicleExpense>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('vehicle_expenses', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize, onPageChange: setCurrent }}
          />
        )}
      </div>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.type} />
    </>
  );
}
