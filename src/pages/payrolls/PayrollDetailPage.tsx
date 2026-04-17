import { useMemo, useState } from 'react';
import { Alert, Button, Card, Flex, Space, Table, Tag, Timeline, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useDelete, useInvalidate, useNavigation, useOne } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Payroll, PayrollDetail } from '@/types';
import payrollService from '@/services/payroll.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime, formatDecimal, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function PayrollDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const invalidate = useInvalidate();
  const { mutateAsync: deletePayroll } = useDelete();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const { user, hasRole } = useAuth();
  const resolvedId = id ? Number(id) : undefined;
  const isAdmin = hasRole('admin');

  const { data, isLoading, refetch } = useOne<Payroll>({
    resource: 'payrolls',
    id: resolvedId || '',
    queryOptions: { enabled: !!resolvedId },
  });

  const payroll = data?.data;
  const isRunning = payroll?.status === 'running';
  const cannotApproveBySoD =
    typeof payroll?.created_by === 'number' &&
    typeof user?.id === 'number' &&
    payroll.created_by === user.id;

  const lineItems: PayrollDetail[] = useMemo(
    () =>
      (payroll?.details ??
        (payroll as Payroll & { lines?: PayrollDetail[] | Record<string, unknown>[] } | undefined)?.lines ??
        []
      ).map((line) => {
        const raw = line as PayrollDetail & Record<string, unknown>;
        return {
          ...raw,
          base_salary: toNumber(raw.base_salary),
          bonus: toNumber(raw.bonus ?? raw.trip_bonus),
          trip_bonus: toNumber(raw.trip_bonus),
          overtime: toNumber(raw.overtime),
          overtime_pay: toNumber(raw.overtime_pay),
          overtime_hours: toNumber(raw.overtime_hours),
          night_shift_allowance: toNumber(raw.night_shift_allowance),
          public_holiday_pay: toNumber(raw.public_holiday_pay),
          allowance: toNumber(raw.allowance),
          deduction: toNumber(raw.deduction),
          leave_unpaid_deduction: toNumber(raw.leave_unpaid_deduction),
          violation_deduction: toNumber(raw.violation_deduction),
          fuel_excess_deduction: toNumber(raw.fuel_excess_deduction ?? raw.fuel_cost),
          tax: toNumber(raw.tax),
          net_salary: toNumber(raw.net_salary),
          trips_completed_count: toNumber(raw.trips_completed_count),
          total_distance_km: toNumber(raw.total_distance_km),
          working_days: toNumber(raw.working_days),
          leave_days_paid: toNumber(raw.leave_days_paid),
          leave_days_unpaid: toNumber(raw.leave_days_unpaid),
          driver_id: raw.driver_id ? toNumber(raw.driver_id) : undefined,
          employee_id: raw.employee_id ? toNumber(raw.employee_id) : 0,
          driver: raw.driver as PayrollDetail['driver'],
          employee: raw.employee as PayrollDetail['employee'],
        };
      }),
    [payroll],
  );

  const runAction = async (key: string, fn: () => Promise<unknown>) => {
    if (!resolvedId) return;
    try {
      setActionLoading(key);
      await fn();
      toast.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
      await invalidate({ resource: 'payrolls', invalidates: ['list'] });
      await refetch();
    } catch (error) {
      if (!shouldShowLocalErrorToast(error)) return;
      toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') }));
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async () => {
    if (!resolvedId) return;
    if (!window.confirm(t('messages.confirmDelete'))) return;
    try {
      setActionLoading('delete');
      await deletePayroll({ resource: 'payrolls', id: resolvedId });
      toast.success(t('notifications.deleteSuccess', { item: t('payrolls.title') }));
      await invalidate({ resource: 'payrolls', invalidates: ['list'] });
      list('payrolls');
    } catch (error) {
      if (!shouldShowLocalErrorToast(error)) return;
      toast.error(getErrorMessage(error) || t('notifications.deleteError', { item: t('payrolls.title') }));
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <>
      <PageHeader
        title={`${t('common.view')} · ${t('payrolls.title')}`}
        description={payroll ? `${payroll.company?.name ?? `ID ${payroll.company_id}`} · ${String(payroll.month).padStart(2, '0')}/${payroll.year}` : t('common.loading')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('payrolls.title'), path: ROUTES.admin.payrolls.list },
          { label: t('common.view') },
        ]}
        actions={
          <Button icon={<ArrowLeftOutlined />} onClick={() => list('payrolls')}>
            {t('common.back')}
          </Button>
        }
      />

      {isLoading || !payroll ? (
        <TableSkeleton rows={8} columns={1} />
      ) : (
        <Flex vertical gap={12}>
          <Alert
            type="info"
            showIcon
            message={t('payrolls.previewModeTitle')}
            description={t('payrolls.previewModeDescription')}
          />

          <Card>
            <Flex justify="space-between" wrap="wrap" gap={12}>
              <Space direction="vertical" size={4}>
                <Space>
                  <Tag>{formatStatusLabel(payroll.status)}</Tag>
                  <Typography.Text strong>{`${String(payroll.month).padStart(2, '0')}/${payroll.year}`}</Typography.Text>
                  <Typography.Text>{payroll.company?.name ?? `Company ID ${payroll.company_id}`}</Typography.Text>
                </Space>
                <Typography.Text type="secondary">{`${t('payrolls.approvedAtLabel')}: ${formatDateTime(payroll.approved_at)}`}</Typography.Text>
                <Typography.Text type="secondary">{`${t('payrolls.lockedAtLabel')}: ${formatDateTime(payroll.locked_at)}`}</Typography.Text>
                {payroll.paid_at && (
                  <Typography.Text type="secondary">{`${t('payrolls.paidAtLabel')}: ${formatDateTime(payroll.paid_at)}`}</Typography.Text>
                )}
              </Space>
              <Space>
                <Button
                  disabled={payroll.status !== 'draft' && payroll.status !== 'generated'}
                  onClick={() => edit('payrolls', resolvedId as number)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  disabled={payroll.status !== 'draft' && payroll.status !== 'generated' || isRunning || cannotApproveBySoD}
                  loading={actionLoading === 'approve'}
                  onClick={() => void runAction('approve', () => payrollService.approve(resolvedId as number))}
                >
                  {t('payrolls.approve')}
                </Button>
                <Button
                  disabled={payroll.status !== 'approved' || !isAdmin || isRunning}
                  loading={actionLoading === 'lock'}
                  onClick={() => void runAction('lock', () => payrollService.lock(resolvedId as number))}
                >
                  {t('payrolls.lock')}
                </Button>
                <Button
                  type="primary"
                  disabled={payroll.status !== 'locked' || !isAdmin}
                  loading={actionLoading === 'markPaid'}
                  onClick={() => void runAction('markPaid', () => payrollService.markPaid(resolvedId as number))}
                >
                  {t('payrolls.markPaid')}
                </Button>
                <Button loading={actionLoading === 'export'} onClick={() => void runAction('export', () => payrollService.downloadExport(resolvedId as number))}>
                  {t('payrolls.exportJson')}
                </Button>
                <Button danger loading={actionLoading === 'delete'} disabled={payroll.status !== 'draft' && payroll.status !== 'generated'} onClick={() => void handleDelete()}>
                  {t('common.delete')}
                </Button>
              </Space>
            </Flex>
          </Card>

          <Card title={t('payrolls.title')}>
            <Table<PayrollDetail>
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 1800 }}
              dataSource={lineItems}
              columns={[
                { title: t('payrolls.driverId'), render: (_, row) => row.driver_id ?? row.employee_id ?? '-' },
                { title: t('payrolls.driverName'), render: (_, row) => row.driver?.name ?? row.employee?.name ?? '-' },
                { title: t('payrolls.baseSalary'), align: 'right', render: (_, row) => formatMoney(row.base_salary, { withCurrency: true }) },
                { title: t('payrolls.tripBonus'), align: 'right', render: (_, row) => formatMoney(row.trip_bonus ?? row.bonus, { withCurrency: true }) },
                { title: t('payrolls.overtimePay'), align: 'right', render: (_, row) => formatMoney(row.overtime_pay, { withCurrency: true }) },
                { title: t('payrolls.allowanceLabel'), align: 'right', render: (_, row) => formatMoney(row.allowance, { withCurrency: true }) },
                { title: t('payrolls.deductionLabel'), align: 'right', render: (_, row) => formatMoney(row.deduction, { withCurrency: true }) },
                { title: t('payrolls.netSalary'), align: 'right', render: (_, row) => <Typography.Text strong>{formatMoney(row.net_salary, { withCurrency: true })}</Typography.Text> },
                { title: t('payrolls.tripsCompleted'), align: 'right', render: (_, row) => formatDecimal(row.trips_completed_count, 0) },
              ]}
            />
          </Card>

          <Card title={t('common.history')}>
            <Timeline
              items={[
                { color: 'blue', children: `${t('common.create')}: ${formatDateTime(payroll.created_at)}` },
                { color: payroll.approved_at ? 'green' : 'gray', children: `${t('payrolls.approvedAtLabel')}: ${formatDateTime(payroll.approved_at)}` },
                { color: payroll.locked_at ? 'blue' : 'gray', children: `${t('payrolls.lockedAtLabel')}: ${formatDateTime(payroll.locked_at)}` },
                { color: payroll.paid_at ? 'green' : 'gray', children: `${t('payrolls.paidAtLabel')}: ${formatDateTime(payroll.paid_at)}` },
              ]}
            />
          </Card>
        </Flex>
      )}
    </>
  );
}
