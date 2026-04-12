import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Deduction } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { DeductionFormDialog } from './DeductionFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

export function DeductionsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('deductions');
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Deduction | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, isError, refetch } = useResourceListQuery<Deduction>({
    resource: 'deductions',
    current,
    pageSize: 15,
  });

  const safeRefetch = useSafeRefetch('deductions-deductionslist', refetch);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('deductions.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('deductions.title') }));
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

  const columns = useMemo<DataTableColumn<Deduction>[]>(
    () => [
    { key: 'code', header: t('deductions.code'), dataIndex: 'code' },
    { key: 'name', header: t('deductions.name'), dataIndex: 'name' },
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
              show('deductions', record.id);
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
        title={t('deductions.title')}
        description={t('deductions.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('deductions.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('deductions.createDeduction')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Deduction>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('deductions', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('deductions.title') })}
              emptyAction={
                <Button onClick={handleCreate} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {t('deductions.createDeduction')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.name} />
      {formOpen && (
        <DeductionFormDialog
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
