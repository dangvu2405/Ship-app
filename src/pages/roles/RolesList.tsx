import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button, Card } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
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
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined aria-hidden />}
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('roles', record.id);
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
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('roles.createRole')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
        <ListPageFilters variant="grid-2">
          <ListPageFilters.Search
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />
        </ListPageFilters>
        <div className="list-page-filters__btn-row">
          <ListPageFilters.Actions
            onSearch={handleSearchFilters}
            onReset={handleClearFilters}
            busy={isFetching && !isLoading}
          />
        </div>

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
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('roles.createRole')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
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
