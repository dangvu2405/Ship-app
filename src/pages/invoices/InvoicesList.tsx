import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation, useInvalidate } from '@refinedev/core';
import { Button, Card, Dropdown, Form, Modal, Input, Tag } from 'antd';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
  SendOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  MailOutlined,
  AuditOutlined,
} from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Invoice, EInvoiceStatus } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import invoiceService from '@/services/invoice.service';

const normalizeInvoiceStatus = (status?: string): string => {
  if (!status) return '';
  if (status === 'sent') return 'issued';
  if (status === 'canceled') return 'cancelled';
  return status;
};

const EINVOICE_STATUS_CONFIG: Record<EInvoiceStatus, { labelKey: string; color: string }> = {
  draft:      { labelKey: 'invoices.einvoiceStatusDraft',     color: 'default' },
  issued:     { labelKey: 'invoices.einvoiceStatusIssued',    color: 'blue' },
  sent_cqt:   { labelKey: 'invoices.einvoiceStatusSentCqt',   color: 'processing' },
  accepted:   { labelKey: 'invoices.einvoiceStatusAccepted',  color: 'success' },
  paid:       { labelKey: 'invoices.einvoiceStatusPaid',      color: 'success' },
  cancelled:  { labelKey: 'invoices.einvoiceStatusCancelled', color: 'error' },
};

type InvoiceFilterForm = { status?: string; einvoice_status?: string };

export function InvoicesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const invalidate = useInvalidate();
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
  const [busyId, setBusyId] = useState<number | null>(null);

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<Invoice | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const invoiceStatusOptions = useMemo(
    () => [
      { label: t('invoices.statusDraft'), value: 'draft' },
      { label: t('invoices.statusIssued'), value: 'issued' },
      { label: t('invoices.statusPaid'), value: 'paid' },
      { label: t('invoices.statusCancelled'), value: 'cancelled' },
    ],
    [t],
  );

  const einvoiceStatusOptions = useMemo(
    () => (Object.keys(EINVOICE_STATUS_CONFIG) as EInvoiceStatus[]).map((k) => ({
      label: t(EINVOICE_STATUS_CONFIG[k].labelKey),
      value: k,
    })),
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

  const refreshInvoices = () => {
    invalidate({ resource: 'invoices', invalidates: ['list'] });
  };

  const handleAction = async (action: () => Promise<unknown>, successKey: string) => {
    try {
      await action();
      toast.success(t(successKey as Parameters<typeof t>[0]));
      refreshInvoices();
    } catch {
      // global error toast handled by axios interceptor
    } finally {
      setBusyId(null);
    }
  };

  const handleIssue = (record: Invoice) => {
    setBusyId(record.id);
    void handleAction(() => invoiceService.issue(record.id), 'notifications.updateSuccess');
  };

  const handleSendCqt = (record: Invoice) => {
    setBusyId(record.id);
    void handleAction(() => invoiceService.sendCqt(record.id), 'notifications.updateSuccess');
  };

  const handleMarkPaid = (record: Invoice) => {
    setBusyId(record.id);
    void handleAction(() => invoiceService.markPaid(record.id), 'notifications.updateSuccess');
  };

  const handleOpenCancel = (record: Invoice) => {
    setCancelTarget(record);
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!cancelTarget || !cancelReason.trim()) return;
    setCancelBusy(true);
    try {
      await invoiceService.cancel(cancelTarget.id, cancelReason.trim());
      toast.success(t('notifications.updateSuccess'));
      setCancelModalOpen(false);
      refreshInvoices();
    } catch {
      // global
    } finally {
      setCancelBusy(false);
    }
  };

  const handleSendEmail = (record: Invoice) => {
    setBusyId(record.id);
    void handleAction(() => invoiceService.sendEmail(record.id), 'notifications.updateSuccess');
  };

  const handleDownloadPdf = (record: Invoice) => {
    setBusyId(record.id);
    void handleAction(() => invoiceService.downloadPdf(record.id, record.code), 'notifications.updateSuccess');
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

  const getActionMenuItems = (record: Invoice) => {
    const einvoiceStatus = record.einvoice_status ?? 'draft';
    const items = [];

    if (einvoiceStatus === 'draft') {
      items.push({ key: 'issue', label: t('invoices.actionIssue'), icon: <AuditOutlined />, onClick: () => handleIssue(record) });
    }
    if (einvoiceStatus === 'issued') {
      items.push({ key: 'send_cqt', label: t('invoices.actionSendCqt'), icon: <SendOutlined />, onClick: () => handleSendCqt(record) });
    }
    if (einvoiceStatus === 'sent_cqt' || einvoiceStatus === 'accepted') {
      items.push({ key: 'mark_paid', label: t('invoices.actionMarkPaid'), icon: <CheckOutlined />, onClick: () => handleMarkPaid(record) });
    }
    if (einvoiceStatus !== 'cancelled' && einvoiceStatus !== 'paid') {
      items.push({ key: 'div', type: 'divider' as const });
      items.push({ key: 'cancel', label: t('invoices.actionCancel'), icon: <CloseOutlined />, danger: true, onClick: () => handleOpenCancel(record) });
    }
    if (einvoiceStatus !== 'draft') {
      items.push({ key: 'div2', type: 'divider' as const });
      items.push({ key: 'download_pdf', label: t('invoices.actionDownloadPdf'), icon: <DownloadOutlined />, onClick: () => handleDownloadPdf(record) });
      items.push({ key: 'send_email', label: t('invoices.actionSendEmail'), icon: <MailOutlined />, onClick: () => handleSendEmail(record) });
    }
    return items;
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
          status === 'draft' ? t('invoices.statusDraft')
          : status === 'issued' ? t('invoices.statusIssued')
          : status === 'paid' ? t('invoices.statusPaid')
          : status === 'cancelled' ? t('invoices.statusCancelled')
          : status;
        const color = status === 'paid' ? 'success' : status === 'issued' ? 'processing' : status === 'cancelled' ? 'error' : undefined;
        return <Tag color={color}>{statusLabel}</Tag>;
      },
    },
    {
      key: 'einvoice_status',
      header: t('invoices.einvoiceStatus'),
      render: (r) => {
        const es = (r.einvoice_status ?? 'draft') as EInvoiceStatus;
        const cfg = EINVOICE_STATUS_CONFIG[es];
        return <Tag color={cfg.color}>{t(cfg.labelKey as Parameters<typeof t>[0])}</Tag>;
      },
    },
    {
      key: 'einvoice_no',
      header: t('invoices.einvoiceNo'),
      render: (r) => r.einvoice_no ?? '—',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-1">
          <Button type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={(e) => { e.stopPropagation(); show('invoices', record.id); }} />
          <Button type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} disabled={record.einvoice_status !== 'draft' && !!record.einvoice_status} onClick={(e) => { e.stopPropagation(); setFormMode('edit'); setEditingId(record.id); setFormOpen(true); }} />
          <Dropdown
            menu={{ items: getActionMenuItems(record) }}
            trigger={['click']}
            disabled={busyId === record.id}
          >
            <Button type="text" size="small" loading={busyId === record.id} icon={<MoreOutlined aria-hidden />} aria-label={t('common.actions')} onClick={(e) => e.stopPropagation()} />
          </Dropdown>
          <Button type="text" size="small" danger icon={<DeleteOutlined aria-hidden />} aria-label={t('common.delete')} disabled={record.einvoice_status !== 'draft' && !!record.einvoice_status} onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }} />
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
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setFormMode('create'); setEditingId(undefined); setFormOpen(true); }}>
            {t('invoices.createInvoice')}
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
            <div className="list-page-filters__select-row min-w-0">
              <FormItemSelect
                noStyle
                name="status"
                label={null}
                placeholder={t('common.status')}
                options={invoiceStatusOptions}
                allowClear
                classNames={{ root: 'list-page-filters__select' }}
              />
              <FormItemSelect
                noStyle
                name="einvoice_status"
                label={null}
                placeholder={t('invoices.einvoiceStatus')}
                options={einvoiceStatusOptions}
                allowClear
                classNames={{ root: 'list-page-filters__select' }}
              />
            </div>
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
            <DataTable<Invoice>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('invoices', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('invoices.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={() => { setFormMode('create'); setEditingId(undefined); setFormOpen(true); }}>
                  {t('invoices.createInvoice')}
                </Button>
              }
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          </PageLoadingOverlay>
        )}
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selected?.code}
      />

      {/* Cancel modal */}
      <Modal
        open={cancelModalOpen}
        title={t('invoices.confirmCancel')}
        onCancel={() => setCancelModalOpen(false)}
        onOk={handleConfirmCancel}
        okButtonProps={{ danger: true, loading: cancelBusy, disabled: !cancelReason.trim() }}
        okText={t('invoices.actionCancel')}
        cancelText={t('common.cancel')}
      >
        <p style={{ marginBottom: 12 }}>{t('invoices.confirmCancelDesc')}</p>
        <Input.TextArea
          rows={3}
          value={cancelReason}
          onChange={(e) => setCancelReason(e.target.value)}
          placeholder={t('invoices.cancelReasonPlaceholder')}
          maxLength={500}
          showCount
        />
      </Modal>

      {formOpen && (
        <InvoiceFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => { setFormOpen(false); setEditingId(undefined); }}
          onSuccess={() => refetch()}
        />
      )}
    </>
  );
}
