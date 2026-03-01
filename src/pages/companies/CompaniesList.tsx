import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Company } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';
import toast from 'react-hot-toast';

export function CompaniesList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  const { data, isLoading, refetch } = useList<Company>({
    resource: 'companies',
    pagination: {
      current: 1,
      pageSize: 15,
    },
  });

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedCompany) return;

    deleteItem(
      {
        resource: 'companies',
        id: selectedCompany.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('companies.title') }));
          setDeleteDialogOpen(false);
          setSelectedCompany(null);
          refetch();
        },
        onError: () => {
          toast.error(t('notifications.deleteError', { item: t('companies.title') }));
        },
      }
    );
  };

  const columns: BaseTableColumn<Company>[] = [
    {
      title: t('companies.code'),
      dataIndex: 'code',
      key: 'code',
      sorter: true,
    },
    {
      title: t('companies.name'),
      dataIndex: 'name',
      key: 'name',
      sorter: true,
    },
    {
      title: t('companies.taxCode'),
      dataIndex: 'tax_code',
      key: 'tax_code',
    },
    {
      title: t('companies.address'),
      dataIndex: 'address',
      key: 'address',
    },
    {
      title: t('companies.phone'),
      dataIndex: 'phone',
      key: 'phone',
    },
    {
      title: t('companies.email'),
      dataIndex: 'email',
      key: 'email',
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
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Company) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('companies', record.id)}
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
    { label: t('companies.title') },
  ];

  return (
    <>
      <PageHeader
        title={t('companies.title')}
        description={t('companies.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => create('companies')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('companies.createCompany')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={7} />
        ) : (
          <BaseTable<Company>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="companies"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('companies', record.id)}
            deleteConfirmMessage={t('deleteConfirm.description')}
            deleteSuccessMessage={t('notifications.deleteSuccess', { item: t('companies.title') })}
            deleteErrorMessage={t('notifications.deleteError', { item: t('companies.title') })}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedCompany?.name}
      />
    </>
  );
}
