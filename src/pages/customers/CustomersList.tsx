import { useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Customer } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { CustomerFormDialog } from './CustomerFormDialog';
import { useCustomerList, useDeleteCustomer } from '@/hooks/useCustomers';

export function CustomersList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);

  const { data, total, loading, error, refetch } = useCustomerList({
    current,
    pageSize: 15,
    search: appliedKeyword,
    type: appliedType as 'company' | 'individual' | undefined,
  });
  const { mutateAsync: deleteCustomer } = useDeleteCustomer();

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedType(selectedType);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedType(undefined);
    setAppliedKeyword('');
    setAppliedType(undefined);
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
    void deleteCustomer(selected.id)
      .then(() => {
        toast.success(t('notifications.deleteSuccess', { item: t('customers.title') }));
        setDeleteDialogOpen(false);
        setSelected(null);
        refetch();
      })
      .catch((error) => {
        if (!shouldShowLocalErrorToast(error)) return;
        toast.error(t('notifications.deleteError', { item: t('customers.title') }));
      });
  };

  const columns: DataTableColumn<Customer>[] = [
    { key: 'name', header: t('customers.name'), dataIndex: 'name' },
    {
      key: 'type',
      header: t('customers.type'),
      render: (r) => (r.type === 'company' ? t('customers.typeCompany') : t('customers.typeIndividual')),
    },
    { key: 'tax_code', header: t('customers.taxCode'), dataIndex: 'tax_code' },
    { key: 'email', header: t('customers.email'), dataIndex: 'email' },
    { key: 'phone', header: t('customers.phone'), dataIndex: 'phone' },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); show('customers', record.id); }}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const listData = data ?? [];
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('customers.title')}
        description={t('customers.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('customers.title') }]}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('customers.createCustomer')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <SearchField
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />

          <Select
            allowClear
            placeholder={t('customers.type')}
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { label: t('customers.typeCompany'), value: 'company' },
              { label: t('customers.typeIndividual'), value: 'individual' },
            ]}
          />

          <Button type="button" onClick={handleSearchFilters}>{t('common.search')}</Button>
          <Button type="button" variant="outline" onClick={handleClearFilters}>{t('common.reset')}</Button>
        </div>

        {loading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : error ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Customer>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('customers', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize, onPageChange: setCurrent }}
          />
        )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.name} />
      {formOpen && (
        <CustomerFormDialog
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
