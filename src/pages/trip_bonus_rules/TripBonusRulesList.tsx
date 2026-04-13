import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button, Card } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { TripBonusRule } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { TripBonusRuleFormDialog } from './TripBonusRuleFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

export function TripBonusRulesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('trip_bonus_rules');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<TripBonusRule | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useResourceListQuery<TripBonusRule>({
    resource: 'trip_bonus_rules',
    current,
    pageSize: 15,
  });

  const safeRefetch = useSafeRefetch('trip_bonus_rules-tripbonusruleslist', refetch);

  const formatKmRange = useCallback(
    (record: TripBonusRule) => {
      const min = record.min_km;
      const max = record.max_km;
      if (max === null || max === undefined) {
        return `${min} ${t('tripBonusRules.kmUnit')} — ${t('tripBonusRules.unlimitedUpper')}`;
      }
      return `${min} – ${max} ${t('tripBonusRules.kmUnit')}`;
    },
    [t]
  );

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
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
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined aria-hidden />}
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('trip_bonus_rules', record.id);
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined aria-hidden />}
            aria-label={t('common.edit')}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record.id);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined aria-hidden />}
            aria-label={t('common.delete')}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteDialogOpen(true);
            }}
          />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('tripBonusRules.createRule')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
          {isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => void safeRefetch(true)}
            />
          ) : (
            <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
              <DataTable<TripBonusRule>
                data={listData}
                columns={columns}
                onRowClick={(r) => show('trip_bonus_rules', r.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('tripBonusRules.title') })}
                emptyAction={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('tripBonusRules.createRule')}
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
