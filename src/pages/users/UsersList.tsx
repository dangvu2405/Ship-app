import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { User } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';
import toast from 'react-hot-toast';

export function UsersList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const { data, isLoading, refetch } = useList<User>({
    resource: 'users',
    pagination: {
      current: 1,
      pageSize: 15,
    },
  });

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
        onError: () => {
          toast.error(t('notifications.deleteError', { item: t('users.title') }));
        },
      }
    );
  };

  const columns: BaseTableColumn<User>[] = [
    {
      title: t('users.username'),
      dataIndex: 'username',
      key: 'username',
      sorter: true,
    },
    {
      title: t('users.email'),
      dataIndex: 'email',
      key: 'email',
      sorter: true,
    },
    {
      title: t('users.employee'),
      dataIndex: ['employee', 'name'],
      key: 'employee',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      title: t('users.roles'),
      dataIndex: 'roles',
      key: 'roles',
      render: (roles: Array<{ name: string }>) => roles?.map(r => r.name).join(', ') || '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: User) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('users', record.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(record)}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: '/dashboard' },
    { label: t('users.title') },
  ];

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
        {isLoading ? (
          <TableSkeleton rows={5} columns={6} />
        ) : (
          <BaseTable<User>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="users"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('users', record.id)}
            deleteConfirmMessage={t('deleteConfirm.description')}
            deleteSuccessMessage={t('notifications.deleteSuccess', { item: t('users.title') })}
            deleteErrorMessage={t('notifications.deleteError', { item: t('users.title') })}
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
