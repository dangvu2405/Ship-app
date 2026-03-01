import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit, Trash2 } from 'lucide-react';
import type { Company } from '@/types';
import toast from 'react-hot-toast';

export function CompaniesList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [current, setCurrent] = useState(1);

  const { data, isLoading, refetch } = useList<Company>({
    resource: 'companies',
    pagination: {
      current,
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

  const columns: DataTableColumn<Company>[] = [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    { key: 'tax_code', header: t('companies.taxCode'), dataIndex: 'tax_code' },
    { key: 'address', header: t('companies.address'), dataIndex: 'address' },
    { key: 'phone', header: t('companies.phone'), dataIndex: 'phone' },
    { key: 'email', header: t('companies.email'), dataIndex: 'email' },
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
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('companies', record.id); }}
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
    { label: t('dashboard.title'), path: '/dashboard' },
    { label: t('companies.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

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
          <TableSkeleton rows={5} columns={columns.length} />
        ) : (
          <DataTable<Company>
            data={listData}
            columns={columns}
            onRowClick={(record) => show('companies', record.id)}
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
        itemName={selectedCompany?.name}
      />
    </>
  );
}
