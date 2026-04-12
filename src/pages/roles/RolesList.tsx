import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Role } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { RoleFormDialog } from './RoleFormDialog';

export function RolesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const { data, isLoading, isFetching, isError, refetch } = useList<Role>({
    resource: 'roles',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setAppliedKeyword('');
    setCurrent(1);
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

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'roles', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('roles.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('roles.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Role>[] = [
    { key: 'name', header: t('roles.name'), dataIndex: 'name' },
    { key: 'description', header: t('roles.description'), dataIndex: 'description' },
    {
      key: 'permissions',
      header: t('roles.permissions'),
      render: (r) => (r.permissions?.length ?? 0).toString(),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('common.view')} onClick={(e) => { e.stopPropagation(); show('roles', record.id); }}>
            <EyeIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('common.edit')} onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }}>
            <PencilIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" aria-label={t('common.delete')} onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }}>
            <Trash2Icon className="h-4 w-4" aria-hidden />
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
        title={t('roles.title')}
        description={t('roles.descriptionPage')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('roles.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('roles.createRole')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        <ListPageFilters variant="grid-3">
          <ListPageFilters.Search
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />
          <ListPageFilters.Actions
            onSearch={handleSearchFilters}
            onReset={handleClearFilters}
            busy={isFetching && !isLoading}
          />
        </ListPageFilters>

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Role>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('roles', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('roles.title') })}
              emptyAction={
                <Button onClick={handleCreate} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {t('roles.createRole')}
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
        <RoleFormDialog
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
