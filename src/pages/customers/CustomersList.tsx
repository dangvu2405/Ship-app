import { useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { useListFilters } from '@/hooks/useListFilters';
import { useTable } from '@refinedev/antd';
import type { CrudFilter } from '@refinedev/core';
import { Button, Card, Flex, Input, Select, Space, Table, Tag } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  TeamOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { CustomerFormDialog } from './CustomerFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Customer } from '@/types';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';

export function CustomersList() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('customers');
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  
  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFiltersBase } = useListFilters({
    search: '',
    type: undefined as string | undefined,
  });
  
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const permanentFilters = useMemo<CrudFilter[]>(() => {
    const f: CrudFilter[] = [];
    if (filterApplied.search.trim()) {
      f.push({ field: 'search', operator: 'contains', value: filterApplied.search.trim() });
    }
    if (filterApplied.type) {
      f.push({ field: 'type', operator: 'eq', value: filterApplied.type });
    }
    return f;
  }, [filterApplied]);

  const { tableProps, tableQuery } = useTable<Customer>({
    resource: 'customers',
    pagination: { pageSize: 15 },
    filters: { permanent: permanentFilters },
    syncWithLocation: true,
  });

  const safeRefetch = useSafeRefetch('customers-customerslist', tableQuery.refetch);

  const clearFilters = () => {
    clearFiltersBase();
    setSelectedRowKeys([]);
  };

  const handleDelete = (customer: Customer) => {
    setSelectedCustomer(customer);
    setDeleteDialogOpen(true);
  };

  const handleOpenDialog = (mode: 'create' | 'edit', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selectedCustomer) return;

    deleteItem(
      { id: selectedCustomer.id },
      {
        onSuccess: () => {
          feedback.success(t('notifications.deleteSuccess', { item: t('customers.title') }));
          setDeleteDialogOpen(false);
          setSelectedCustomer(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }
          feedback.error(t('notifications.deleteError', { item: t('customers.title') }));
        },
      },
    );
  };

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('customers.title') },
  ];

  const total = tableQuery.data?.total ?? 0;

  const columns: ColumnsType<Customer> = useMemo(
    () => [
      {
        title: t('customers.name'),
        dataIndex: 'name',
        key: 'name',
        render: (v: string, row) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => show('customers', row.id)}>
            {v}
          </Button>
        ),
      },
      {
        title: t('customers.type'),
        key: 'type',
        render: (_: unknown, row) => (
          <Tag color={row.type === 'company' ? 'blue' : 'green'}>
            {row.type === 'company' ? t('customers.typeCompany') : t('customers.typeIndividual')}
          </Tag>
        ),
      },
      {
        title: t('customers.taxCode'),
        dataIndex: 'tax_code',
        key: 'tax_code',
        render: (v: string | null) => v || '—',
      },
      {
        title: t('customers.email'),
        dataIndex: 'email',
        key: 'email',
        render: (v: string | null) => v || '—',
      },
      {
        title: t('customers.phone'),
        dataIndex: 'phone',
        key: 'phone',
        render: (v: string | null) => v || '—',
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 140,
        render: (_: unknown, row) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              aria-label={t('common.view')}
              onClick={() => show('customers', row.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              aria-label={t('common.edit')}
              onClick={() => handleOpenDialog('edit', row.id)}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined aria-hidden />}
              aria-label={t('common.delete')}
              onClick={() => handleDelete(row)}
            />
          </Space>
        ),
      },
    ],
    [show, t],
  );

  if (tableQuery.isError) {
    return (
      <>
        <PageHeader title={t('customers.title')} description={t('customers.description')} breadcrumb={breadcrumb} />
        <ErrorState
          title={t('common.loadError')}
          description={t('common.tryAgainDescription')}
          onRetry={() => void tableQuery.refetch()}
        />
      </>
    );
  }

  return (
    <div className="enterprise-page customers-page space-y-4">
      <PageHeader
        title={t('customers.title')}
        description={t('customers.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
            {t('customers.createCustomer')}
          </Button>
        }
      />

      <Card
        className="enterprise-section-card"
        title={<Flex align="center" gap={8}><TeamOutlined /><span>{t('customers.title')}</span></Flex>}
        extra={<Tag>{total} {t('common.records')}</Tag>}
        styles={{ body: { padding: 16 } }}
      >
        <ListPageFilters variant="grid-2" className="enterprise-filter-bar mb-4">
          <Input
            placeholder={t('common.search')}
            value={filterInputs.search}
            onChange={(e) => setFilterInput('search', e.target.value)}
            onPressEnter={applyFilters}
            allowClear
            onClear={() => setFilterInput('search', '')}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('customers.type')}
            value={filterInputs.type}
            onChange={(v) => setFilterInput('type', v)}
            options={[
              { value: 'company', label: t('customers.typeCompany') },
              { value: 'individual', label: t('customers.typeIndividual') },
            ]}
          />
          <div className="list-page-filters__btn-row col-span-full">
            <ListPageFilters.Actions
              onSearch={applyFilters}
              onReset={clearFilters}
              busy={tableQuery.isFetching && !tableQuery.isLoading}
            />
          </div>
        </ListPageFilters>

        <Table<Customer>
          {...tableProps}
          rowKey="id"
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 'max-content' }}
          loading={tableProps.loading}
          className="enterprise-table"
        />
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedCustomer?.name}
      />
      <CustomerFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          void safeRefetch(true);
        }}
      />
    </div>
  );
}

