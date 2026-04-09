import { useCallback, useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { TripBonusRule } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { TripBonusRuleFormDialog } from './TripBonusRuleFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';

export function TripBonusRulesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<TripBonusRule | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useList<TripBonusRule>({
    resource: 'trip_bonus_rules',
    pagination: { current, pageSize: 15 },
  });

  const safeRefetch = useSafeRefetch('trip_bonus_rules-tripbonusruleslist', refetch);

  const formatKmRange = useCallback(
    (record: TripBonusRule) => {
      const min = record.min_km;
      const max = record.max_km;
      if (max === null || max === undefined || max === '') {
        return `${min} ${t('tripBonusRules.kmUnit')} — ${t('tripBonusRules.unlimitedUpper')}`;
      }
      return `${min} – ${max} ${t('tripBonusRules.kmUnit')}`;
    },
    [t]
  );

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'trip_bonus_rules', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('tripBonusRules.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('tripBonusRules.title') }));
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

  const columns = useMemo<DataTableColumn<TripBonusRule>[]>(
    () => [
    {
      key: 'range',
      header: t('tripBonusRules.distanceRange'),
      render: (r) => formatKmRange(r),
    },
    {
      key: 'bonus_per_km',
      header: t('tripBonusRules.bonusPerKm'),
      dataIndex: 'bonus_per_km',
      render: (r) => formatCurrencyVND(r.bonus_per_km),
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
              show('trip_bonus_rules', record.id);
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
    [t, show, handleEdit, formatKmRange]
  );

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('tripBonusRules.title')}
        description={t('tripBonusRules.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('tripBonusRules.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('tripBonusRules.createRule')}
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
            <DataTable<TripBonusRule>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('trip_bonus_rules', r.id)}
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
        itemName={selected ? formatKmRange(selected) : undefined}
      />
      {formOpen && (
        <TripBonusRuleFormDialog
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
