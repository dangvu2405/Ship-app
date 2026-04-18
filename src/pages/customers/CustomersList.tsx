import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button, Card, Form } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { CustomerFormDialog } from './CustomerFormDialog';

type CustomerFilterForm = {
  type?: string;
};

export function CustomersList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [filterForm] = Form.useForm<CustomerFilterForm>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Customer | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);

  const customerTypeOptions = useMemo(
    () => [
      { label: t('customers.typeCompany'), value: 'company' },
      { label: t('customers.typeIndividual'), value: 'individual' },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useList<Customer>({
    resource: 'customers',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedType ? [{ field: 'type', operator: 'eq' as const, value: appliedType }] : []),
    ],
  });

  const handleSearchFilters = () => {
    const { type } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedType(type);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
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
    deleteItem(
      { resource: 'customers', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('customers.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('customers.title') }));
        },
      }
    );
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
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined aria-hidden />}
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('customers', record.id);
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
        title={t('customers.title')}
        description={t('customers.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('customers.title') }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('customers.createCustomer')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
        <Form form={filterForm} layout="vertical" requiredMark={false} colon={false} className="contents min-w-0 w-full">
          <ListPageFilters variant="grid-2">
            <ListPageFilters.Search
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
            <FormItemSelect
              noStyle
              name="type"
              label={null}
              placeholder={t('customers.type')}
              options={customerTypeOptions}
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
          </ListPageFilters>
          <div className="list-page-filters__btn-row">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </div>
        </Form>

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Customer>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('customers', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('customers.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('customers.createCustomer')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
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
