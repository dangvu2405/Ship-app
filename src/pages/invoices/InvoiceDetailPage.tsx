import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Input,
  Modal,
  Space,
  Tag,
  Timeline,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  AuditOutlined,
  CheckOutlined,
  CloseOutlined,
  DownloadOutlined,
  MailOutlined,
  SendOutlined,
} from '@ant-design/icons';
import { useNavigation, useOne, useInvalidate } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Invoice, EInvoiceStatus } from '@/types';
import { ROUTES } from '@/routes';
import { formatDateTime, formatMoney } from '@/utils/displayFormat';
import { InvoiceFormDialog } from './InvoiceFormDialog';
import invoiceService from '@/services/invoice.service';
import toast from 'react-hot-toast';

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

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const invalidate = useInvalidate();
  const [reverse, setReverse] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [busy, setBusy] = useState<string | null>(null);

  // Cancel modal
  const [cancelModalOpen, setCancelModalOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [cancelBusy, setCancelBusy] = useState(false);

  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Invoice>({
    resource: 'invoices',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId },
  });

  const invoice = data?.data;
  const status = normalizeInvoiceStatus(invoice?.status);
  const einvoiceStatus = (invoice?.einvoice_status ?? 'draft') as EInvoiceStatus;
  const einvoiceCfg = EINVOICE_STATUS_CONFIG[einvoiceStatus];

  const statusLabel =
    status === 'draft' ? t('invoices.statusDraft')
    : status === 'issued' ? t('invoices.statusIssued')
    : status === 'paid' ? t('invoices.statusPaid')
    : status === 'cancelled' ? t('invoices.statusCancelled')
    : status;

  const refresh = () => {
    void invalidate({ resource: 'invoices', id: resolvedId, invalidates: ['detail'] });
  };

  const handleAction = async (key: string, action: () => Promise<unknown>) => {
    setBusy(key);
    try {
      await action();
      toast.success(t('notifications.updateSuccess'));
      refresh();
    } catch {
      // global toast from axios interceptor
    } finally {
      setBusy(null);
    }
  };

  const handleIssue = () => {
    if (!resolvedId) return;
    void handleAction('issue', () => invoiceService.issue(resolvedId));
  };

  const handleSendCqt = () => {
    if (!resolvedId) return;
    void handleAction('send_cqt', () => invoiceService.sendCqt(resolvedId));
  };

  const handleMarkPaid = () => {
    if (!resolvedId) return;
    void handleAction('mark_paid', () => invoiceService.markPaid(resolvedId));
  };

  const handleOpenCancel = () => {
    setCancelReason('');
    setCancelModalOpen(true);
  };

  const handleConfirmCancel = async () => {
    if (!resolvedId || !cancelReason.trim()) return;
    setCancelBusy(true);
    try {
      await invoiceService.cancel(resolvedId, cancelReason.trim());
      toast.success(t('notifications.updateSuccess'));
      setCancelModalOpen(false);
      refresh();
    } catch {
      // global
    } finally {
      setCancelBusy(false);
    }
  };

  const handleSendEmail = () => {
    if (!resolvedId) return;
    void handleAction('send_email', () => invoiceService.sendEmail(resolvedId));
  };

  const handleDownloadPdf = () => {
    if (!resolvedId || !invoice) return;
    void handleAction('download_pdf', () => invoiceService.downloadPdf(resolvedId, invoice.code));
  };

  const timelineItems = useMemo(
    () => [
      {
        color: 'blue' as const,
        children: `${t('common.create')}: ${formatDateTime(invoice?.created_at)}`,
      },
      {
        color: invoice?.signed_at ? ('green' as const) : ('gray' as const),
        children: `${t('invoices.signedAt')}: ${formatDateTime(invoice?.signed_at)}`,
      },
      {
        color: invoice?.issued_at ? ('green' as const) : ('gray' as const),
        children: `${t('invoices.issuedAt')}: ${formatDateTime(invoice?.issued_at)}`,
      },
      {
        color: invoice?.cqt_sent_at ? ('green' as const) : ('gray' as const),
        children: `${t('invoices.cqtSentAt')}: ${formatDateTime(invoice?.cqt_sent_at)}`,
      },
      {
        color: invoice?.cqt_response_at ? ('green' as const) : ('gray' as const),
        children: `${t('invoices.cqtResponseAt')}: ${formatDateTime(invoice?.cqt_response_at)}`,
      },
      {
        color: invoice?.paid_at ? ('green' as const) : ('gray' as const),
        children: `${t('common.status')}: ${statusLabel || '-'}`,
      },
      {
        color: invoice?.due_date ? ('orange' as const) : ('gray' as const),
        children: `${t('invoices.dueDate')}: ${formatDateTime(invoice?.due_date)}`,
      },
    ],
    [invoice, statusLabel, t],
  );

  const isEditable = !invoice?.einvoice_status || invoice.einvoice_status === 'draft';
  const isDeletable = isEditable;

  return (
    <>
      <PageHeader
        title={`${t('common.view')} · ${t('invoices.title')}`}
        description={invoice?.code ?? t('common.loading')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('invoices.title'), path: ROUTES.admin.invoices.list },
          { label: t('common.view') },
        ]}
        actions={
          <Flex gap={8} wrap="wrap">
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('invoices')}>
              {t('common.back')}
            </Button>
            {isEditable && resolvedId && (
              <Button
                type="primary"
                onClick={() => { setFormMode('edit'); setFormOpen(true); }}
              >
                {t('common.edit')}
              </Button>
            )}
            {einvoiceStatus === 'draft' && (
              <Button
                icon={<AuditOutlined />}
                loading={busy === 'issue'}
                onClick={handleIssue}
              >
                {t('invoices.actionIssue')}
              </Button>
            )}
            {einvoiceStatus === 'issued' && (
              <Button
                icon={<SendOutlined />}
                loading={busy === 'send_cqt'}
                onClick={handleSendCqt}
              >
                {t('invoices.actionSendCqt')}
              </Button>
            )}
            {(einvoiceStatus === 'sent_cqt' || einvoiceStatus === 'accepted') && (
              <Button
                icon={<CheckOutlined />}
                loading={busy === 'mark_paid'}
                type="primary"
                onClick={handleMarkPaid}
              >
                {t('invoices.actionMarkPaid')}
              </Button>
            )}
            {einvoiceStatus !== 'cancelled' && einvoiceStatus !== 'paid' && invoice && (
              <Button
                danger
                icon={<CloseOutlined />}
                onClick={handleOpenCancel}
              >
                {t('invoices.actionCancel')}
              </Button>
            )}
            {einvoiceStatus !== 'draft' && (
              <Space>
                <Button
                  icon={<DownloadOutlined />}
                  loading={busy === 'download_pdf'}
                  onClick={handleDownloadPdf}
                >
                  {t('invoices.actionDownloadPdf')}
                </Button>
                <Button
                  icon={<MailOutlined />}
                  loading={busy === 'send_email'}
                  onClick={handleSendEmail}
                >
                  {t('invoices.actionSendEmail')}
                </Button>
              </Space>
            )}
          </Flex>
        }
      />

      {isLoading || !invoice ? (
        <TableSkeleton rows={8} columns={1} />
      ) : (
        <Flex vertical gap={12}>
          {invoice.cqt_result === 'rejected' && (
            <Alert
              type="error"
              showIcon
              message={t('invoices.cqtResult')}
              description={invoice.cqt_message ?? '—'}
            />
          )}
          {einvoiceStatus === 'cancelled' && (
            <Alert
              type="warning"
              showIcon
              message={t('invoices.einvoiceStatusCancelled')}
              description={invoice.cancel_reason}
            />
          )}

          {/* Basic info */}
          <Card>
            <Descriptions column={2} bordered size="small" title={null}>
              <Descriptions.Item label={t('invoices.code')}>{invoice.code}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={status === 'paid' ? 'success' : status === 'issued' ? 'processing' : status === 'cancelled' ? 'error' : undefined}>
                  {statusLabel || '-'}
                </Tag>
              </Descriptions.Item>
              <Descriptions.Item label={t('invoices.customer')}>{invoice.customer?.name ?? `#${invoice.customer_id}`}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.trip')}>{invoice.trip?.code ?? (invoice.trip_id ? `#${invoice.trip_id}` : '-')}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.totalAmount')}>
                {formatMoney(invoice.total_amount, { withCurrency: true })}
              </Descriptions.Item>
              <Descriptions.Item label={t('invoices.taxAmount')}>
                {formatMoney(invoice.vat_amount ?? invoice.tax_amount, { withCurrency: true })}
              </Descriptions.Item>
              <Descriptions.Item label={t('invoices.issuedAt')}>{formatDateTime(invoice.issued_at)}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.dueDate')}>{formatDateTime(invoice.due_date)}</Descriptions.Item>
            </Descriptions>
          </Card>

          {/* E-invoice section */}
          <Card
            title={
              <Flex align="center" gap={8}>
                <Typography.Text strong>{t('invoices.einvoiceSection')}</Typography.Text>
                <Tag color={einvoiceCfg.color}>{t(einvoiceCfg.labelKey as Parameters<typeof t>[0])}</Tag>
              </Flex>
            }
          >
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('invoices.einvoiceNo')}>{invoice.einvoice_no ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.einvoiceSerial')}>{invoice.einvoice_serial ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.einvoiceTemplate')}>{invoice.einvoice_template ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.einvoiceProvider')}>{invoice.einvoice_provider ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.signedAt')}>{formatDateTime(invoice.signed_at)}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.cqtCode')}>{invoice.cqt_code ?? '—'}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.cqtSentAt')}>{formatDateTime(invoice.cqt_sent_at)}</Descriptions.Item>
              <Descriptions.Item label={t('invoices.cqtResponseAt')}>{formatDateTime(invoice.cqt_response_at)}</Descriptions.Item>
              {invoice.cqt_result && (
                <Descriptions.Item label={t('invoices.cqtResult')} span={2}>
                  <Tag color={invoice.cqt_result === 'accepted' ? 'success' : 'error'}>
                    {invoice.cqt_result}
                  </Tag>
                  {invoice.cqt_message && (
                    <Typography.Text type="secondary" style={{ marginLeft: 8 }}>
                      {invoice.cqt_message}
                    </Typography.Text>
                  )}
                </Descriptions.Item>
              )}
              {invoice.einvoice_pdf_url && (
                <Descriptions.Item label="PDF URL" span={2}>
                  <Typography.Link href={invoice.einvoice_pdf_url} target="_blank" rel="noreferrer">
                    {invoice.einvoice_pdf_url}
                  </Typography.Link>
                </Descriptions.Item>
              )}
              {!isDeletable && invoice.cancel_reason && (
                <Descriptions.Item label={t('invoices.cancelReason')} span={2}>
                  {invoice.cancel_reason}
                </Descriptions.Item>
              )}
            </Descriptions>
          </Card>

          {/* Timeline */}
          <Card title={t('common.history')}>
            <Flex vertical gap="middle" align="flex-start">
              <Timeline reverse={reverse} items={timelineItems} />
              <Button type="default" onClick={() => setReverse((prev) => !prev)}>
                {reverse ? '↑' : '↓'} {t('common.history')}
              </Button>
            </Flex>
          </Card>
        </Flex>
      )}

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

      {formOpen && resolvedId ? (
        <InvoiceFormDialog
          open={formOpen}
          mode={formMode}
          recordId={formMode === 'edit' ? resolvedId : undefined}
          onClose={() => setFormOpen(false)}
          onSuccess={refresh}
        />
      ) : null}
    </>
  );
}
