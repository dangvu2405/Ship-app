import { useMemo } from 'react';
import { App, Button, Descriptions, Drawer, Space, Table, Tag, Typography } from 'antd';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { ColumnsType } from 'antd/es/table';
import type { PayrollDriverLine, PayrollTripAttribution } from '@/types/domain/payroll';
import { useTranslation } from '@/hooks/useTranslation';
import { usePayrollPermission } from '@/hooks/usePayrollPermission';
import { formatCurrencyVND } from '@/utils/format';
import payrollService from '@/services/payroll.service';

export interface PayrollDetailDrawerProps {
  open: boolean;
  onClose: () => void;
  line: PayrollDriverLine | null;
  onPayrollUpdated?: () => void;
}

function sumFinesAndDeductions(row: PayrollDriverLine): number {
  return (
    Number(row.deduction ?? 0) +
    Number(row.violation_deduction ?? 0) +
    Number(row.fuel_excess_deduction ?? 0) +
    Number(row.leave_unpaid_deduction ?? 0)
  );
}

export function PayrollDetailDrawer({ open, onClose, line, onPayrollUpdated }: PayrollDetailDrawerProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const { canManagePayroll } = usePayrollPermission();
  const queryClient = useQueryClient();
  const payrollId = line?.payroll_id;

  const payrollQuery = useQuery({
    queryKey: ['payroll-detail-drawer', payrollId],
    queryFn: async () => {
      const res = await payrollService.getById(payrollId!);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled: open && payrollId != null,
  });

  const invalidatePayrollQueries = () => {
    void queryClient.invalidateQueries({ queryKey: ['payroll-detail-drawer', payrollId] });
    onPayrollUpdated?.();
  };

  const approveMutation = useMutation({
    mutationFn: () => payrollService.approve(payrollId!),
    onSuccess: (res) => {
      if (res.success) {
        message.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
        invalidatePayrollQueries();
      } else {
        message.error(res.message || t('notifications.updateError', { item: t('payrolls.title') }));
      }
    },
    onError: () => message.error(t('notifications.updateError', { item: t('payrolls.title') })),
  });

  const lockMutation = useMutation({
    mutationFn: () => payrollService.lock(payrollId!),
    onSuccess: (res) => {
      if (res.success) {
        message.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
        invalidatePayrollQueries();
      } else {
        message.error(res.message || t('notifications.updateError', { item: t('payrolls.title') }));
      }
    },
    onError: () => message.error(t('notifications.updateError', { item: t('payrolls.title') })),
  });

  const markPaidMutation = useMutation({
    mutationFn: () => payrollService.markPaid(payrollId!),
    onSuccess: (res) => {
      if (res.success) {
        message.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
        invalidatePayrollQueries();
      } else {
        message.error(res.message || t('notifications.updateError', { item: t('payrolls.title') }));
      }
    },
    onError: () => message.error(t('notifications.updateError', { item: t('payrolls.title') })),
  });

  const mergedLine = useMemo(() => {
    if (!line) return null;
    const full = payrollQuery.data?.details?.find((d) => d.id === line.id);
    return (full ? { ...line, ...full, payroll: payrollQuery.data ?? line.payroll } : line) as PayrollDriverLine;
  }, [line, payrollQuery.data]);

  const trips: PayrollTripAttribution[] =
    mergedLine?.payroll_trips ??
    (mergedLine?.meta_json?.trips as PayrollTripAttribution[] | undefined) ??
    [];

  const payrollRecord = payrollQuery.data;
  const payrollStatusKey = String(payrollRecord?.status ?? '').toLowerCase();

  const payrollStatusLabel = useMemo(() => {
    switch (payrollStatusKey) {
      case 'draft':
        return t('payrolls.statusDraft');
      case 'approved':
        return t('payrolls.statusApproved');
      case 'locked':
        return t('payrolls.statusLocked');
      case 'paid':
        return t('payrolls.statusPaid');
      default:
        return payrollRecord?.status ? String(payrollRecord.status) : '—';
    }
  }, [payrollRecord?.status, payrollStatusKey, t]);

  const showApprove = canManagePayroll && payrollStatusKey === 'draft';
  const showLock = canManagePayroll && payrollStatusKey === 'approved';
  const showMarkPaid = canManagePayroll && payrollStatusKey === 'locked';

  const workflowBusy = approveMutation.isPending || lockMutation.isPending || markPaidMutation.isPending;

  const tripColumns: ColumnsType<PayrollTripAttribution> = [
    { title: t('trips.code'), dataIndex: 'code', key: 'code' },
    { title: t('payrolls.tripDateCol'), dataIndex: 'trip_date', key: 'trip_date' },
    {
      title: t('payrolls.tripAmountCol'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (v: number | undefined) => formatCurrencyVND(v),
    },
    {
      title: t('payrolls.tripDistanceCol'),
      dataIndex: 'distance_km',
      key: 'distance_km',
      align: 'right',
      render: (v: number | undefined) => (v != null ? `${v} km` : '—'),
    },
  ];

  return (
    <Drawer
      title={t('payrolls.drawerTitle')}
      width={720}
      open={open}
      onClose={onClose}
      destroyOnHidden
      extra={
        payrollId != null && (showApprove || showLock || showMarkPaid) ? (
          <Space wrap>
            {showApprove ? (
              <Button type="primary" loading={workflowBusy} onClick={() => approveMutation.mutate()}>
                {t('payrolls.approve')}
              </Button>
            ) : null}
            {showLock ? (
              <Button type="primary" loading={workflowBusy} onClick={() => lockMutation.mutate()}>
                {t('payrolls.lock')}
              </Button>
            ) : null}
            {showMarkPaid ? (
              <Button type="primary" className="!bg-green-600 hover:!bg-green-700" loading={workflowBusy} onClick={() => markPaidMutation.mutate()}>
                {t('payrolls.markPaid')}
              </Button>
            ) : null}
          </Space>
        ) : null
      }
    >
      {!mergedLine ? null : (
        <>
          <Typography.Paragraph type="secondary" className="mb-3">
            {t('payrolls.systemDocHint')}
          </Typography.Paragraph>
          <Descriptions bordered size="small" column={1} className="mb-4">
            <Descriptions.Item label={t('common.status')}>
              {payrollQuery.isLoading ? (
                <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
              ) : (
                <Tag>{payrollStatusLabel}</Tag>
              )}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.batchPayrollId')}>
              <Typography.Text copyable>{String(mergedLine.payroll_id)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.lineId')}>
              <Typography.Text copyable>{String(mergedLine.id)}</Typography.Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.driverName')}>
              {mergedLine.driver?.name ?? mergedLine.employee?.name ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.baseSalary')}>
              {formatCurrencyVND(mergedLine.base_salary)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.tripBonus')}>
              {formatCurrencyVND(mergedLine.trip_bonus ?? mergedLine.bonus)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.finesDeductionsTotal')}>
              {formatCurrencyVND(sumFinesAndDeductions(mergedLine))}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.pitShort')}>
              {formatCurrencyVND(mergedLine.pit ?? mergedLine.tax)}
            </Descriptions.Item>
            <Descriptions.Item label={t('payrolls.netSalary')}>
              <Typography.Text strong>{formatCurrencyVND(mergedLine.net_salary)}</Typography.Text>
            </Descriptions.Item>
          </Descriptions>

          <Typography.Title level={5}>{t('payrolls.tripBreakdownTitle')}</Typography.Title>
          {payrollQuery.isLoading ? (
            <Typography.Text type="secondary">{t('common.loading')}</Typography.Text>
          ) : trips.length === 0 ? (
            <Typography.Text type="secondary">{t('payrolls.noTripsInBreakdown')}</Typography.Text>
          ) : (
            <Table<PayrollTripAttribution>
              size="small"
              rowKey={(r) => String(r.trip_id)}
              columns={tripColumns}
              dataSource={trips}
              pagination={false}
            />
          )}
        </>
      )}
    </Drawer>
  );
}
