import { useMemo, useState } from 'react';
import { Alert, Button, Card, Descriptions, Flex, Tag, Timeline } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigation, useOne } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Invoice } from '@/types';
import { ROUTES } from '@/routes';
import { formatDateTime, formatMoney } from '@/utils/displayFormat';
import { InvoiceFormDialog } from './InvoiceFormDialog';

const normalizeInvoiceStatus = (status?: string): string => {
  if (!status) return '';
  if (status === 'sent') return 'issued';
  if (status === 'canceled') return 'cancelled';
  return status;
};

export function InvoiceDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const [reverse, setReverse] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Invoice>({
    resource: 'invoices',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId },
  });

  const invoice = data?.data;
  const status = normalizeInvoiceStatus(invoice?.status);

  const statusLabel =
    status === 'draft'
      ? t('invoices.statusDraft')
      : status === 'issued'
        ? t('invoices.statusIssued')
        : status === 'paid'
          ? t('invoices.statusPaid')
          : status === 'cancelled'
            ? t('invoices.statusCancelled')
            : status;

  const timelineItems = useMemo(
    () => [
      {
        color: 'blue' as const,
        children: `${t('common.create')}: ${formatDateTime(invoice?.created_at)}`,
      },
      {
        color: invoice?.issued_at ? ('green' as const) : ('gray' as const),
        children: `${t('invoices.issuedAt')}: ${formatDateTime(invoice?.issued_at)}`,
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
    [invoice?.created_at, invoice?.issued_at, invoice?.paid_at, invoice?.due_date, statusLabel, t],
  );

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
          <Flex gap={8}>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('invoices')}>
              {t('common.back')}
            </Button>
            <Button
              onClick={() => {
                setFormMode('create');
                setFormOpen(true);
              }}
            >
              {t('invoices.createInvoice')}
            </Button>
            {resolvedId ? (
              <Button
                type="primary"
                onClick={() => {
                  setFormMode('edit');
                  setFormOpen(true);
                }}
              >
                {t('common.edit')}
              </Button>
            ) : null}
          </Flex>
        }
      />

      {isLoading || !invoice ? (
        <TableSkeleton rows={8} columns={1} />
      ) : (
        <Flex vertical gap={12}>
          <Alert type="info" showIcon message={t('invoices.description')} description={t('invoices.editDescription')} />

          <Card>
            <Descriptions column={2} bordered size="small">
              <Descriptions.Item label={t('invoices.code')}>{invoice.code}</Descriptions.Item>
              <Descriptions.Item label={t('common.status')}>
                <Tag color={status === 'paid' ? 'success' : status === 'issued' ? 'processing' : undefined}>{statusLabel || '-'}</Tag>
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

          <Card title={t('common.history')}>
            <Flex vertical gap="middle" align="flex-start">
              <Timeline reverse={reverse} items={timelineItems} />
              <Button type="primary" onClick={() => setReverse((prev) => !prev)}>
                Toggle Reverse
              </Button>
            </Flex>
          </Card>
        </Flex>
      )}
      {formOpen ? (
        <InvoiceFormDialog
          open={formOpen}
          mode={formMode}
          recordId={formMode === 'edit' ? resolvedId : undefined}
          onClose={() => setFormOpen(false)}
        />
      ) : null}
    </>
  );
}
