import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Employee } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';
import toast from 'react-hot-toast';

export function EmployeesList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);

  const { data, isLoading, refetch } = useList<Employee>({
    resource: 'employees',
    pagination: {
      current: 1,
      pageSize: 15,
    },
  });

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedEmployee) return;

    deleteItem(
      {
        resource: 'employees',
        id: selectedEmployee.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('employees.title') }));
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
          refetch();
        },
        onError: () => {
          toast.error(t('notifications.deleteError', { item: t('employees.title') }));
        },
      }
    );
  };

  const columns: BaseTableColumn<Employee>[] = [
    {
      title: t('employees.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: t('employees.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: t('employees.email'),
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: t('employees.phone'),
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: t('employees.type'),
      dataIndex: 'type',
      key: 'type',
      render: (type: string) => (
        <span className="capitalize">{type === 'office' ? t('employees.typeOffice') : t('employees.typeDriver')}</span>
      ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'active' ? 'text-green-600' : 'text-gray-500'}>
          {status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    {
      title: t('employees.office'),
      dataIndex: ['office', 'name'],
      key: 'office',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Employee) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('employees', record.id)}
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
    { label: t('employees.title') },
  ];

  return (
    <>
      <PageHeader
        title={t('employees.title')}
        description={t('employees.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => create('employees')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('employees.createEmployee')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={8} />
        ) : (
          <BaseTable<Employee>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="employees"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('employees', record.id)}
            deleteConfirmMessage={t('deleteConfirm.description')}
            deleteSuccessMessage={t('notifications.deleteSuccess', { item: t('employees.title') })}
            deleteErrorMessage={t('notifications.deleteError', { item: t('employees.title') })}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedEmployee?.name}
      />
    </>
  );
}
