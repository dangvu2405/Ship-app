import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button, Card, Form, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Invoice } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { formatCurrencyVND } from '@/utils/format';

const normalizeInvoiceStatus = (status?: string): string => {
  if (!status) return '';
  if (status === 'sent') return 'issued';
  if (status === 'canceled') return 'cancelled';
  return status;
};

type InvoiceFilterForm = {
  status?: string;
};

export function InvoicesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [filterForm] = Form.useForm<InvoiceFilterForm>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const invoiceStatusOptions = useMemo(
    () => [
      { label: t('invoices.statusDraft'), value: 'draft' },
      { label: t('invoices.statusIssued'), value: 'issued' },
      { label: t('invoices.statusPaid'), value: 'paid' },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useList<Invoice>({
    resource: 'invoices',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    const { status } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(status);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
    setAppliedKeyword('');
    setAppliedStatus(undefined);
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
      { resource: 'invoices', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('invoices.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('invoices.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Invoice>[] = [
    { key: 'code', header: t('invoices.code'), dataIndex: 'code' },
    { key: 'customer', header: t('invoices.customer'), render: (r) => r.customer?.name ?? `#${r.customer_id}` },
    { key: 'trip', header: t('invoices.trip'), render: (r) => r.trip?.code ?? (r.trip_id ? `#${r.trip_id}` : '—') },
    {
      key: 'total_amount',
      header: t('invoices.totalAmount'),
      dataIndex: 'total_amount',
      render: (r) => formatCurrencyVND(r.total_amount),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (r) => {
        const status = normalizeInvoiceStatus(r.status);
        const statusLabel =
          status === 'draft'
            ? t('invoices.statusDraft')
            : status === 'issued'
              ? t('invoices.statusIssued')
              : status === 'paid'
                ? t('invoices.statusPaid')
                : status;

        const color =
          status === 'draft' ? undefined : status === 'paid' ? 'success' : status === 'issued' ? 'processing' : undefined;
        return <Tag color={color}>{statusLabel}</Tag>;
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={(e) => { e.stopPropagation(); show('invoices', record.id); }} />
          <Button type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} onClick={(e) => { e.stopPropagation(); handleEdit(record.id); }} />
          <Button type="text" size="small" danger icon={<DeleteOutlined aria-hidden />} aria-label={t('common.delete')} onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }} />
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
        title={t('invoices.title')}
        description={t('invoices.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('invoices.title') }]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('invoices.createInvoice')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
        <ListPageFilters variant="grid-4">
          <ListPageFilters.Search
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={setSearchKeyword}
          />
          <Form
            form={filterForm}
            layout="vertical"
            requiredMark={false}
            colon={false}
            className="contents min-w-0 w-full"
          >
            <FormItemSelect
              noStyle
              name="status"
              label={null}
              placeholder={t('common.status')}
              options={invoiceStatusOptions}
              allowClear
              selectProps={{
                classNames: { root: 'list-page-filters__select' },
              }}
            />
          </Form>
          <ListPageFilters.Actions
            onSearch={handleSearchFilters}
            onReset={handleClearFilters}
            busy={isFetching && !isLoading}
          />
        </ListPageFilters>

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Invoice>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('invoices', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('invoices.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('invoices.createInvoice')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.code} />
      {formOpen && (
        <InvoiceFormDialog
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
