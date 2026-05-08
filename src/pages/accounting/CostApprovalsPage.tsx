import { useState } from 'react';
import { App, Button, Image, Input, Modal, Space, Table, Typography } from 'antd';
import { useInvalidate } from '@refinedev/core';
import { useTable } from '@refinedev/antd';
import type { ColumnsType } from 'antd/es/table';
import type { CostApprovalRequest } from '@/types/domain/cost';
import { TripCostStatuses } from '@/types/domain/cost';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { formatCurrencyVND } from '@/utils/format';
import costService from '@/services/cost.service';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { notifyErrorOnce } from '@/utils/errorToast';
import { TableSkeleton } from '@/components/common/TableSkeleton';

export function CostApprovalsPage() {
  const { t } = useTranslation();
  const { message, modal } = App.useApp();
  const invalidate = useInvalidate();
  const [rejectingId, setRejectingId] = useState<number | null>(null);
  const [rejectNote, setRejectNote] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);

  const { tableProps, tableQuery } = useTable<CostApprovalRequest>({
    resource: 'cost-approvals',
    filters: {
      permanent: [{ field: 'status', operator: 'eq', value: TripCostStatuses.pending }],
    },
    pagination: { pageSize: 15 },
    syncWithLocation: true,
  });

  const handleApprove = async (id: number) => {
    setBusyId(id);
    try {
      await costService.approveCostApproval(id);
      message.success(t('costManagement.approveSuccess'));
      await invalidate({ resource: 'cost-approvals', invalidates: ['list'] });
    } catch (error) {
      if (shouldShowLocalErrorToast(error)) {
        notifyErrorOnce(`cost-approve-${id}`, error, {
          fallbackMessage: getErrorMessage(error) || t('costManagement.approveError'),
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const openReject = (id: number) => {
    setRejectingId(id);
    setRejectNote('');
  };

  const submitReject = async () => {
    if (rejectingId == null) return;
    const note = rejectNote.trim();
    if (!note) {
      message.warning(t('costManagement.rejectNoteRequired'));
      return;
    }
    setBusyId(rejectingId);
    try {
      await costService.rejectCostApproval(rejectingId, note);
      message.success(t('costManagement.rejectSuccess'));
      setRejectingId(null);
      await invalidate({ resource: 'cost-approvals', invalidates: ['list'] });
    } catch (error) {
      if (shouldShowLocalErrorToast(error)) {
        notifyErrorOnce(`cost-reject-${rejectingId}`, error, {
          fallbackMessage: getErrorMessage(error) || t('costManagement.rejectError'),
        });
      }
    } finally {
      setBusyId(null);
    }
  };

  const columns: ColumnsType<CostApprovalRequest> = [
    {
      title: t('costManagement.colExpenseName'),
      key: 'name',
      ellipsis: true,
      render: (_: unknown, row) =>
        row.trip_cost?.description?.trim() || row.reason || row.trip?.code || `—`,
    },
    {
      title: t('costManagement.colCategory'),
      key: 'category',
      render: (_: unknown, row) =>
        row.trip_cost?.cost_category?.name ?? row.cost_category?.name ?? '—',
    },
    {
      title: t('costManagement.colAmount'),
      key: 'amount',
      align: 'right',
      render: (_: unknown, row) => formatCurrencyVND(row.trip_cost?.amount ?? row.total_amount),
    },
    {
      title: t('costManagement.colNorm'),
      key: 'norm',
      align: 'right',
      render: (_: unknown, row) => formatCurrencyVND(row.trip_cost?.norm_amount),
    },
    {
      title: t('costManagement.colRequester'),
      key: 'requester',
      render: (_: unknown, row) =>
        row.requester?.name || row.requester?.username || `#${row.requested_by}`,
    },
    {
      title: t('costManagement.colReceipt'),
      key: 'receipt',
      width: 96,
      render: (_: unknown, row) => {
        const url = row.trip_cost?.receipt_file_url;
        return url ? (
          <Image src={url} alt="" width={56} height={56} style={{ objectFit: 'cover' }} />
        ) : (
          '—'
        );
      },
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right',
      width: 200,
      render: (_: unknown, row) => (
        <Space>
          <Button
            type="primary"
            className="!bg-green-600 hover:!bg-green-700"
            size="small"
            loading={busyId === row.id}
            disabled={busyId !== null && busyId !== row.id}
            onClick={() => {
              modal.confirm({
                title: t('costManagement.confirmApproveTitle'),
                content: t('costManagement.confirmApproveBody'),
                okText: t('common.approve'),
                cancelText: t('common.cancel'),
                onOk: () => handleApprove(row.id),
              });
            }}
          >
            {t('common.approve')}
          </Button>
          <Button
            danger
            size="small"
            loading={busyId === row.id}
            disabled={busyId !== null && busyId !== row.id}
            onClick={() => openReject(row.id)}
          >
            {t('common.reject')}
          </Button>
        </Space>
      ),
    },
  ];

  if (tableQuery.isError) {
    return (
      <Typography.Paragraph type="danger">
        {t('common.loadError')}
      </Typography.Paragraph>
    );
  }

  return (
    <>
      <PageHeader
        title={t('costManagement.approvalsTitle')}
        description={t('costManagement.approvalsDescription')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.accounting'), path: ROUTES.admin.accounting.revenue },
          { label: t('costManagement.approvalsTitle') },
        ]}
      />

      {tableQuery.isLoading ? (
        <TableSkeleton rows={10} columns={6} />
      ) : (
        <Table<CostApprovalRequest>
          {...tableProps}
          rowKey="id"
          columns={columns}
          scroll={{ x: 1100 }}
        />
      )}

      <Modal
        open={rejectingId !== null}
        title={t('costManagement.rejectModalTitle')}
        okText={t('common.reject')}
        okButtonProps={{ danger: true, loading: busyId === rejectingId }}
        onCancel={() => setRejectingId(null)}
        onOk={submitReject}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary" className="mb-2">
          {t('costManagement.rejectModalHint')}
        </Typography.Paragraph>
        <Input.TextArea
          rows={4}
          value={rejectNote}
          onChange={(e) => setRejectNote(e.target.value)}
          placeholder={t('costManagement.rejectNotePlaceholder')}
        />
      </Modal>
    </>
  );
}
