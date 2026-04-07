import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { RoleFormDialog } from './RoleFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Role } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function RolesList() {
  const { t } = useTranslation();
  const { list } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Role | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeRoleId, setActiveRoleId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const { data, isLoading, isError, refetch } = useList<Role>({
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

  const handleOpenDialog = (mode: 'create' | 'edit' | 'show', roleId?: number) => {
    setDialogMode(mode);
    setActiveRoleId(roleId);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setActiveRoleId(undefined);
    setDialogMode('create');
    list('roles');
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleOpenDialog('show', record.id); }}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleOpenDialog('edit', record.id); }}>
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
        title={t('roles.title')}
        description={t('roles.descriptionPage')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('roles.title') }]}
        actions={
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('roles.createRole')}
          </Button>
        }
      />
      <div className="bg-card shadow rounded-lg border p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <SearchField
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />
          <Button type="button" onClick={handleSearchFilters}>{t('common.search')}</Button>
          <Button type="button" variant="outline" onClick={handleClearFilters}>{t('common.reset')}</Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Role>
            data={listData}
            columns={columns}
            onRowClick={(r) => handleOpenDialog('show', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize, onPageChange: setCurrent }}
          />
        )}
      </div>
      <RoleFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeRoleId}
        onClose={handleCloseDialog}
        onSuccess={refetch}
      />
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.name} />
    </>
  );
}
