import { useMemo, useState } from 'react';
import { useListFilters } from '@/hooks/useListFilters';
import { useInvalidate, useList, useDelete, useNavigation } from '@refinedev/core';
import type { HttpError } from '@refinedev/core';
import { useModalForm, useTable } from '@refinedev/antd';
import {
  App,
  Button,
  Card,
  Col,
  DatePicker,
  Form,
  Modal,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined } from '@ant-design/icons';
import type { Dayjs } from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Invoice } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { formatCurrencyVND } from '@/utils/format';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { InvoiceForm } from './InvoiceForm';
import invoiceService from '@/services/invoice.service';
import { formatDate } from '@/utils/displayFormat';

const normalizeInvoiceStatus = (status?: string): string => {
  if (!status) return '';
  if (status === 'sent') return 'issued';
  if (status === 'canceled') return 'cancelled';
  return status;
};

const canDraftMutate = (row: Invoice): boolean =>
  normalizeInvoiceStatus(row.status) === 'draft' && (row.einvoice_status ?? 'draft') === 'draft';

export function InvoicesList() {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { show: navigateToInvoice } = useNavigation();
  const invalidate = useInvalidate();
  const { mutate: deleteItem } = useDelete();

  const [editOpen, setEditOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Invoice | null>(null);

  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFilters } = useListFilters({
    customerId: undefined as number | undefined,
    status: undefined as string | undefined,
    range: null as [Dayjs | null, Dayjs | null] | null,
  });

  const { data: customersData } = useList<Customer>({
    resource: 'customers',
    pagination: { current: 1, pageSize: 300 },
  });

  const customerOptions = useMemo(
    () =>
      (customersData?.data ?? []).map((c) => ({
        value: c.id,
        label: c.name ?? c.code ?? `#${c.id}`,
      })),
    [customersData?.data],
  );

  const permanentFilters = useMemo(() => {
    const f: { field: string; operator: 'eq'; value: string | number }[] = [];
    if (filterApplied.status) {
      f.push({ field: 'status', operator: 'eq', value: filterApplied.status });
    }
    if (filterApplied.customerId != null) {
      f.push({ field: 'customer_id', operator: 'eq', value: filterApplied.customerId });
    }
    const from = filterApplied.range?.[0];
    const to = filterApplied.range?.[1];
    if (from) f.push({ field: 'date_from', operator: 'eq', value: from.format('YYYY-MM-DD') });
    if (to) f.push({ field: 'date_to', operator: 'eq', value: to.format('YYYY-MM-DD') });
    return f;
  }, [filterApplied]);

  const { tableProps, tableQuery } = useTable<Invoice>({
    resource: 'invoices',
    pagination: { pageSize: 15 },
    filters: { permanent: permanentFilters },
    syncWithLocation: true,
  });

  const debtQuery = useQuery({
    queryKey: ['debt-overview'],
    queryFn: () => invoiceService.getDebtOverview(),
  });

  const debt = debtQuery.data;

  const uncollected = (() => {
    if (typeof debt?.total_uncollected === 'number') {
      return debt.total_uncollected;
    }
    if (debt?.total_uncollected != null) {
      return Number(debt.total_uncollected);
    }
    if (typeof debt?.unpaid_total === 'string') {
      return Number(String(debt.unpaid_total).replace(/[^\d.-]/g, '')) || 0;
    }
    return Number(debt?.unpaid_total ?? 0);
  })();
  const overdue = Number(debt?.overdue_amount ?? 0);
  const collected = Number(debt?.revenue_collected ?? 0);

  const { modalProps, formProps, form, show: openCreateModal, close } = useModalForm<
    Invoice,
    HttpError,
    Record<string, unknown>
  >({
    resource: 'invoices',
    action: 'create',
    redirect: false,
    defaultFormValues: { status: 'draft', vat_rate: 10 },
    warnWhenUnsavedChanges: true,
    onMutationSuccess: () => {
      void invalidate({ resource: 'invoices', invalidates: ['list'] });
      message.success(t('notifications.createSuccess', { item: t('invoices.title') }));
      close();
    },
  });

  const mergedFormProps = useMemo(
    () => ({
      ...formProps,
      onFinish: (values: Record<string, unknown>) => {
        const payload = { ...values };
        delete payload.code;
        if (payload.trip_id === null || payload.trip_id === undefined) {
          delete payload.trip_id;
        }
        return formProps.onFinish?.(payload as never);
      },
    }),
    [formProps],
  );

  const handleApplyFilters = () => applyFilters();
  const handleClearFilters = () => clearFilters();

  const handleEdit = (id: number) => {
    setEditingId(id);
    setEditOpen(true);
  };

  const confirmDelete = () => {
    if (!selected || !canDraftMutate(selected)) return;
    deleteItem(
      { resource: 'invoices', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('invoices.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void invalidate({ resource: 'invoices', invalidates: ['list'] });
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('invoices.title') }));
        },
      },
    );
  };

  const columns: ColumnsType<Invoice> = useMemo(
    () => [
      { title: t('invoices.code'), dataIndex: 'code', key: 'code' },
      {
        title: t('invoices.customer'),
        key: 'customer',
        render: (_: unknown, r) => r.customer?.name ?? `#${r.customer_id}`,
      },
      {
        title: t('invoices.issuedAt'),
        dataIndex: 'issued_at',
        key: 'issued_at',
        render: (v: string | undefined) => (v ? formatDate(v) : '—'),
      },
      {
        title: t('invoices.totalWithVat'),
        key: 'total',
        align: 'right',
        render: (_: unknown, r) => formatCurrencyVND(r.total_amount),
      },
      {
        title: t('invoices.paymentStatusCol'),
        key: 'pay',
        render: (_: unknown, r) => {
          const s = normalizeInvoiceStatus(r.payment_status ?? r.status);
          const label =
            s === 'draft'
              ? t('invoices.statusDraft')
              : s === 'issued'
                ? t('invoices.statusIssued')
                : s === 'paid'
                  ? t('invoices.statusPaid')
                  : s === 'cancelled'
                    ? t('invoices.statusCancelled')
                    : s;
          const color =
            s === 'draft' ? 'default' : s === 'issued' ? 'blue' : s === 'paid' ? 'success' : s === 'cancelled' ? 'error' : 'processing';
          return <Tag color={color}>{label}</Tag>;
        },
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 160,
        render: (_: unknown, r) => (
          <Space size="small">
            <Button
              type="link"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigateToInvoice('invoices', r.id);
              }}
            >
              {t('common.view')}
            </Button>
            {canDraftMutate(r) && (
              <>
                <Button
                  type="link"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEdit(r.id);
                  }}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  type="link"
                  size="small"
                  danger
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelected(r);
                    setDeleteDialogOpen(true);
                  }}
                >
                  {t('common.delete')}
                </Button>
              </>
            )}
          </Space>
        ),
      },
    ],
    [navigateToInvoice, t],
  );

  const total = tableQuery.data?.total ?? 0;
  const currentRows = (tableProps.dataSource ?? []) as Invoice[];
  const draftCount = currentRows.filter((row) => normalizeInvoiceStatus(row.status) === 'draft').length;
  const issuedCount = currentRows.filter((row) => normalizeInvoiceStatus(row.status) === 'issued').length;
  const paidCount = currentRows.filter((row) => normalizeInvoiceStatus(row.status) === 'paid').length;
  const cancelledCount = currentRows.filter((row) => normalizeInvoiceStatus(row.status) === 'cancelled').length;

  const setQuickStatusFilter = (status?: string) => {
    setFilterInput('status', status);
    applyFilters();
  };

  if (tableQuery.isError) {
    return (
      <>
        <PageHeader
          title={t('invoices.title')}
          description={t('invoices.description')}
          breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('invoices.title') }]}
        />
        <ErrorState
          title={t('common.loadError')}
          description={t('common.tryAgainDescription')}
          onRetry={() => void tableQuery.refetch()}
        />
      </>
    );
  }

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('invoices.title')}
        description={t('invoices.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('invoices.title') }]}
        actions={
          <Space>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openCreateModal()}>
              {t('invoices.createInvoice')}
            </Button>
          </Space>
        }
      />

      <Row gutter={[12, 12]}>
        <Col xs={24} md={8}>
          <Card size="small">
            <Statistic title={t('common.records')} value={total} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={debtQuery.isLoading}>
            <Statistic title={t('invoices.debtUncollected')} value={uncollected} formatter={(v) => formatCurrencyVND(Number(v))} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={debtQuery.isLoading}>
            <Statistic title={t('invoices.debtOverdue')} value={overdue} formatter={(v) => formatCurrencyVND(Number(v))} />
          </Card>
        </Col>
        <Col xs={24} md={8}>
          <Card size="small" loading={debtQuery.isLoading}>
            <Statistic title={t('invoices.revenueCollected')} value={collected} formatter={(v) => formatCurrencyVND(Number(v))} />
          </Card>
        </Col>
      </Row>

      <Card className="enterprise-section-card">
        <Space wrap className="mb-3">
          <Button type={!filterApplied.status ? 'primary' : 'default'} onClick={() => setQuickStatusFilter(undefined)}>
            Tất cả ({currentRows.length})
          </Button>
          <Button type={filterApplied.status === 'draft' ? 'primary' : 'default'} onClick={() => setQuickStatusFilter('draft')}>
            {t('invoices.statusDraft')} ({draftCount})
          </Button>
          <Button type={filterApplied.status === 'issued' ? 'primary' : 'default'} onClick={() => setQuickStatusFilter('issued')}>
            {t('invoices.statusIssued')} ({issuedCount})
          </Button>
          <Button type={filterApplied.status === 'paid' ? 'primary' : 'default'} onClick={() => setQuickStatusFilter('paid')}>
            {t('invoices.statusPaid')} ({paidCount})
          </Button>
          <Button type={filterApplied.status === 'cancelled' ? 'primary' : 'default'} onClick={() => setQuickStatusFilter('cancelled')}>
            {t('invoices.statusCancelled')} ({cancelledCount})
          </Button>
        </Space>

        <Space wrap className="enterprise-filter-bar mb-4" style={{ width: '100%' }} align="start">
          <Select
            allowClear
            placeholder={t('invoices.customer')}
            style={{ minWidth: 220 }}
            options={customerOptions}
            value={filterInputs.customerId}
            onChange={(v) => setFilterInput('customerId', v)}
            showSearch
            optionFilterProp="label"
          />
          <Select
            allowClear
            placeholder={t('common.status')}
            style={{ minWidth: 180 }}
            value={filterInputs.status}
            onChange={(v) => setFilterInput('status', v)}
            options={[
              { label: t('invoices.statusDraft'), value: 'draft' },
              { label: t('invoices.statusIssued'), value: 'issued' },
              { label: t('invoices.statusPaid'), value: 'paid' },
              { label: t('invoices.statusCancelled'), value: 'cancelled' },
            ]}
          />
          <DatePicker.RangePicker value={filterInputs.range} onChange={(v) => setFilterInput('range', v)} format="DD/MM/YYYY" />
          <Button type="primary" onClick={handleApplyFilters}>
            {t('common.search')}
          </Button>
          <Button onClick={handleClearFilters}>{t('common.reset')}</Button>
        </Space>

        <Typography.Text type="secondary" className="mb-2 block">
          {total} {t('common.records')}
        </Typography.Text>
        <Table<Invoice>
          {...tableProps}
          rowKey="id"
          columns={columns}
          scroll={{ x: 960 }}
          onRow={(r) => ({
            onClick: () => navigateToInvoice('invoices', r.id),
            style: { cursor: 'pointer' },
          })}
          className="enterprise-table"
          locale={{ emptyText: t('common.noData') }}
        />
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selected?.code}
      />

      {editOpen && editingId != null && (
        <InvoiceFormDialog
          open={editOpen}
          mode="edit"
          recordId={editingId}
          onClose={() => {
            setEditOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void invalidate({ resource: 'invoices', invalidates: ['list'] });
          }}
        />
      )}

      <Modal
        {...modalProps}
        title={t('invoices.createInvoice')}
        onCancel={() => close()}
        width="min(56rem, calc(100vw - 2rem))"
        destroyOnHidden
        okText={t('common.create')}
        cancelText={t('common.cancel')}
      >
        <Form {...mergedFormProps} layout="vertical">
          <InvoiceForm form={form} isCreate />
        </Form>
      </Modal>
    </div>
  );
}
