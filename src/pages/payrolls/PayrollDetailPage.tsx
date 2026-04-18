import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Descriptions,
  Flex,
  Space,
  Statistic,
  Table,
  Tag,
  Timeline,
  Tooltip,
  Typography,
} from 'antd';
import {
  ArrowLeftOutlined,
  DownloadOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { useDelete, useInvalidate, useNavigation, useOne } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { PayrollSIBreakdown } from '@/components/payroll/PayrollSIBreakdown';
import { useTranslation } from '@/hooks/useTranslation';
import type { Payroll, PayrollDetail } from '@/types';
import payrollService from '@/services/payroll.service';
import { useAuth } from '@/hooks/useAuth';
import { formatDateTime, formatDecimal, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { calcSI, calcPIT, fmtVND } from '@/utils/vnPayrollCalc';
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
          base_salary:           toNumber(raw.base_salary),
          gross_salary:          toNumber(raw.gross_salary ?? raw.base_salary),
          bonus:                 toNumber(raw.bonus ?? raw.trip_bonus),
          trip_bonus:            toNumber(raw.trip_bonus),
          overtime:              toNumber(raw.overtime),
          overtime_pay:          toNumber(raw.overtime_pay),
          overtime_hours:        toNumber(raw.overtime_hours),
          night_shift_allowance: toNumber(raw.night_shift_allowance),
          public_holiday_pay:    toNumber(raw.public_holiday_pay),
          allowance:             toNumber(raw.allowance),
          deduction:             toNumber(raw.deduction),
          leave_unpaid_deduction: toNumber(raw.leave_unpaid_deduction),
          violation_deduction:   toNumber(raw.violation_deduction),
          fuel_excess_deduction: toNumber(raw.fuel_excess_deduction ?? raw.fuel_cost),
          tax:                   toNumber(raw.tax),
          net_salary:            toNumber(raw.net_salary),
          leave_days_paid:       toNumber(raw.leave_days_paid),
          leave_days_unpaid:     toNumber(raw.leave_days_unpaid),
          trips_completed_count: toNumber(raw.trips_completed_count),
          total_distance_km:     toNumber(raw.total_distance_km),
          working_days:          toNumber(raw.working_days),
          driver_id:             raw.driver_id ? toNumber(raw.driver_id) : undefined,
          employee_id:           raw.employee_id ? toNumber(raw.employee_id) : 0,
          driver:                raw.driver as PayrollDetail['driver'],
          employee:              raw.employee as PayrollDetail['employee'],
          // BHXH/PIT fields from server (fallback to computed in breakdown component)
          bhxh_employee:         raw.bhxh_employee != null ? toNumber(raw.bhxh_employee) : undefined,
          bhyt_employee:         raw.bhyt_employee != null ? toNumber(raw.bhyt_employee) : undefined,
          bhtn_employee:         raw.bhtn_employee != null ? toNumber(raw.bhtn_employee) : undefined,
          total_si_employee:     raw.total_si_employee != null ? toNumber(raw.total_si_employee) : undefined,
          bhxh_employer:         raw.bhxh_employer != null ? toNumber(raw.bhxh_employer) : undefined,
          bhyt_employer:         raw.bhyt_employer != null ? toNumber(raw.bhyt_employer) : undefined,
          bhtn_employer:         raw.bhtn_employer != null ? toNumber(raw.bhtn_employer) : undefined,
          bhtnld_bnn_employer:   raw.bhtnld_bnn_employer != null ? toNumber(raw.bhtnld_bnn_employer) : undefined,
          total_si_employer:     raw.total_si_employer != null ? toNumber(raw.total_si_employer) : undefined,
          si_salary_base:        raw.si_salary_base != null ? toNumber(raw.si_salary_base) : undefined,
          dependants_count:      raw.dependants_count != null ? toNumber(raw.dependants_count) : 0,
          taxable_income:        raw.taxable_income != null ? toNumber(raw.taxable_income) : undefined,
          assessable_income:     raw.assessable_income != null ? toNumber(raw.assessable_income) : undefined,
          pit:                   raw.pit != null ? toNumber(raw.pit) : undefined,
        };
      }),
    [payroll],
  );

  /** Tổng hợp chi phí employer (tính từ calc engine nếu server không trả). */
  const employerCostSummary = useMemo(() => {
    return lineItems.reduce(
      (acc, line) => {
        const gross = line.gross_salary ?? line.base_salary;
        const si = calcSI(gross);
        const totalEr = line.total_si_employer ?? si.totalSIEmployer;
        return {
          totalGross:       acc.totalGross + gross,
          totalSIEmployee:  acc.totalSIEmployee + (line.total_si_employee ?? si.totalSIEmployee),
          totalSIEmployer:  acc.totalSIEmployer + totalEr,
          totalPIT:         acc.totalPIT + (line.pit ?? line.tax),
          totalNet:         acc.totalNet + line.net_salary,
          totalCost:        acc.totalCost + gross + totalEr,
        };
      },
      { totalGross: 0, totalSIEmployee: 0, totalSIEmployer: 0, totalPIT: 0, totalNet: 0, totalCost: 0 },
    );
  }, [lineItems]);

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
        description={
          payroll
            ? `${payroll.company?.name ?? `ID ${payroll.company_id}`} · ${String(payroll.month).padStart(2, '0')}/${payroll.year}`
            : t('common.loading')
        }
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

          {/* Header + Actions */}
          <Card>
            <Flex justify="space-between" wrap="wrap" gap={12}>
              <Space direction="vertical" size={4}>
                <Space>
                  <Tag>{formatStatusLabel(payroll.status)}</Tag>
                  <Typography.Text strong>
                    {`${String(payroll.month).padStart(2, '0')}/${payroll.year}`}
                  </Typography.Text>
                  <Typography.Text>
                    {payroll.company?.name ?? `Company ID ${payroll.company_id}`}
                  </Typography.Text>
                </Space>
                <Typography.Text type="secondary">
                  {`${t('payrolls.approvedAtLabel')}: ${formatDateTime(payroll.approved_at)}`}
                </Typography.Text>
                <Typography.Text type="secondary">
                  {`${t('payrolls.lockedAtLabel')}: ${formatDateTime(payroll.locked_at)}`}
                </Typography.Text>
                {payroll.paid_at && (
                  <Typography.Text type="secondary">
                    {`${t('payrolls.paidAtLabel')}: ${formatDateTime(payroll.paid_at)}`}
                  </Typography.Text>
                )}
              </Space>

              <Space wrap>
                <Button
                  disabled={payroll.status !== 'draft' && payroll.status !== 'generated'}
                  onClick={() => edit('payrolls', resolvedId as number)}
                >
                  {t('common.edit')}
                </Button>
                <Button
                  disabled={
                    (payroll.status !== 'draft' && payroll.status !== 'generated') ||
                    isRunning ||
                    cannotApproveBySoD
                  }
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

                {/* Export dropdown */}
                <Button
                  icon={<DownloadOutlined />}
                  loading={actionLoading === 'export'}
                  onClick={() => void runAction('export', () => payrollService.downloadExport(resolvedId as number))}
                >
                  {t('payrolls.exportJson')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={actionLoading === 'exportBhxh'}
                  onClick={() => void runAction('exportBhxh', () => payrollService.downloadBhxhReport(resolvedId as number))}
                >
                  {t('payrolls.exportBhxh')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={actionLoading === 'exportPit'}
                  onClick={() => void runAction('exportPit', () => payrollService.downloadPitReport(resolvedId as number))}
                >
                  {t('payrolls.exportPit')}
                </Button>
                <Button
                  icon={<DownloadOutlined />}
                  loading={actionLoading === 'exportPayslips'}
                  onClick={() => void runAction('exportPayslips', () => payrollService.downloadPayslips(resolvedId as number))}
                >
                  {t('payrolls.exportPayslips')}
                </Button>

                <Button
                  danger
                  loading={actionLoading === 'delete'}
                  disabled={payroll.status !== 'draft' && payroll.status !== 'generated'}
                  onClick={() => void handleDelete()}
                >
                  {t('common.delete')}
                </Button>
              </Space>
            </Flex>
          </Card>

          {/* Employer cost summary */}
          <Card title={
            <Space>
              {t('payrolls.employerCostSection')}
              <Tooltip title={t('payrolls.siRateNote')}>
                <InfoCircleOutlined style={{ color: '#8c8c8c' }} />
              </Tooltip>
            </Space>
          }>
            <Flex gap={24} wrap="wrap">
              <Statistic title={t('payrolls.grossSalary')}       value={fmtVND(employerCostSummary.totalGross)} />
              <Statistic title={t('payrolls.totalSIEmployee')}   value={fmtVND(employerCostSummary.totalSIEmployee)} valueStyle={{ color: '#cf1322' }} />
              <Statistic title={t('payrolls.pit')}               value={fmtVND(employerCostSummary.totalPIT)} valueStyle={{ color: '#cf1322' }} />
              <Statistic title={t('payrolls.netSalary')}         value={fmtVND(employerCostSummary.totalNet)} valueStyle={{ color: '#3f8600' }} />
              <Statistic title={t('payrolls.totalSIEmployer')}   value={fmtVND(employerCostSummary.totalSIEmployer)} valueStyle={{ color: '#d46b08' }} />
              <Statistic title={t('payrolls.totalEmployerCost')} value={fmtVND(employerCostSummary.totalCost)} valueStyle={{ color: '#1677ff' }} />
            </Flex>
          </Card>

          {/* Detail table */}
          <Card title={t('payrolls.title')}>
            <Table<PayrollDetail>
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 2000 }}
              dataSource={lineItems}
              expandable={{
                expandedRowRender: (record) => <PayrollSIBreakdown line={record} />,
                rowExpandable: () => true,
              }}
              columns={[
                {
                  title: t('payrolls.driverName'),
                  fixed: 'left',
                  width: 160,
                  render: (_, row) => row.driver?.name ?? row.employee?.name ?? '-',
                },
                {
                  title: t('payrolls.grossSalary'),
                  align: 'right',
                  render: (_, row) => formatMoney(row.gross_salary ?? row.base_salary, { withCurrency: true }),
                },
                {
                  title: t('payrolls.totalSIEmployee'),
                  align: 'right',
                  render: (_, row) => {
                    const gross = row.gross_salary ?? row.base_salary;
                    const si = calcSI(gross);
                    const total = row.total_si_employee ?? si.totalSIEmployee;
                    return (
                      <Typography.Text type="danger">{formatMoney(total, { withCurrency: true })}</Typography.Text>
                    );
                  },
                },
                {
                  title: t('payrolls.pit'),
                  align: 'right',
                  render: (_, row) => {
                    const gross = row.gross_salary ?? row.base_salary;
                    const si = calcSI(gross);
                    const totalEmp = row.total_si_employee ?? si.totalSIEmployee;
                    const pit = calcPIT(gross, totalEmp, row.dependants_count ?? 0);
                    const pitAmt = row.pit ?? row.tax ?? pit.totalPIT;
                    return (
                      <Typography.Text type="danger">{formatMoney(pitAmt, { withCurrency: true })}</Typography.Text>
                    );
                  },
                },
                {
                  title: t('payrolls.netSalary'),
                  align: 'right',
                  render: (_, row) => (
                    <Typography.Text strong>{formatMoney(row.net_salary, { withCurrency: true })}</Typography.Text>
                  ),
                },
                {
                  title: t('payrolls.totalSIEmployer'),
                  align: 'right',
                  render: (_, row) => {
                    const gross = row.gross_salary ?? row.base_salary;
                    const si = calcSI(gross);
                    const total = row.total_si_employer ?? si.totalSIEmployer;
                    return (
                      <Typography.Text style={{ color: '#d46b08' }}>{formatMoney(total, { withCurrency: true })}</Typography.Text>
                    );
                  },
                },
                {
                  title: t('payrolls.tripBonus'),
                  align: 'right',
                  render: (_, row) => formatMoney(row.trip_bonus ?? row.bonus, { withCurrency: true }),
                },
                {
                  title: t('payrolls.overtimePay'),
                  align: 'right',
                  render: (_, row) => formatMoney(row.overtime_pay, { withCurrency: true }),
                },
                {
                  title: t('payrolls.allowanceLabel'),
                  align: 'right',
                  render: (_, row) => formatMoney(row.allowance, { withCurrency: true }),
                },
                {
                  title: t('payrolls.deductionLabel'),
                  align: 'right',
                  render: (_, row) => formatMoney(row.deduction, { withCurrency: true }),
                },
                {
                  title: t('payrolls.tripsCompleted'),
                  align: 'right',
                  render: (_, row) => formatDecimal(row.trips_completed_count, 0),
                },
                {
                  title: t('payrolls.workingDays'),
                  align: 'right',
                  render: (_, row) => formatDecimal(row.working_days, 1),
                },
              ]}
            />
          </Card>

          {/* Status timeline */}
          <Card title={t('common.history')}>
            <Descriptions column={1} size="small" style={{ marginBottom: 16 }}>
              <Descriptions.Item label={t('payrolls.siRateNote')}>
                <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                  {t('payrolls.siRateNote')}
                </Typography.Text>
              </Descriptions.Item>
            </Descriptions>
            <Timeline
              items={[
                { color: 'blue',  children: `${t('common.create')}: ${formatDateTime(payroll.created_at)}` },
                {
                  color: payroll.approved_at ? 'green' : 'gray',
                  children: `${t('payrolls.approvedAtLabel')}: ${formatDateTime(payroll.approved_at)}`,
                },
                {
                  color: payroll.locked_at ? 'blue' : 'gray',
                  children: `${t('payrolls.lockedAtLabel')}: ${formatDateTime(payroll.locked_at)}`,
                },
                {
                  color: payroll.paid_at ? 'green' : 'gray',
                  children: `${t('payrolls.paidAtLabel')}: ${formatDateTime(payroll.paid_at)}`,
                },
              ]}
            />
          </Card>
        </Flex>
      )}
    </>
  );
}
