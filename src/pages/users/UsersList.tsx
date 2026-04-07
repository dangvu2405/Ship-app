import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function UsersList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<User>({
    resource: 'users',
    pagination: {
      current,
      pageSize: 15,
    },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedStatus(undefined);
    setAppliedKeyword('');
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;

    deleteItem(
      {
        resource: 'users',
        id: selectedUser.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('users.title') }));
          setDeleteDialogOpen(false);
          setSelectedUser(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('users.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<User>[] = [
    { key: 'username', header: t('users.username'), dataIndex: 'username' },
    { key: 'email', header: t('users.email'), dataIndex: 'email' },
    { key: 'employee', header: t('users.employee'), dataIndex: ['employee', 'name'] },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <span className={item.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      key: 'roles',
      header: t('users.roles'),
      dataIndex: 'roles',
      render: (item) => item.roles?.map((r: { name: string }) => r.name).join(', ') || '-',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('users', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); edit('users', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('users.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => create('users')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('users.createUser')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <Select
            allowClear
            placeholder={t('common.status')}
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]}
          />

          <Button type="button" onClick={handleSearchFilters}>
            {t('common.search')}
          </Button>

          <Button type="button" variant="outline" onClick={handleClearFilters}>
            {t('common.reset')}
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title="Unable to load users"
            description="Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<User>
            data={listData}
            columns={columns}
            onRowClick={(record) => show('users', record.id)}
            emptyMessage={t('common.noData')}
            pagination={{
              current,
              total,
              pageSize,
              onPageChange: setCurrent,
            }}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedUser?.username}
      />
    </>
  );
}
