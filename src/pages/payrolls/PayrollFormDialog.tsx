import { Alert, Button, Flex, Form, Space, Table, Tag, Typography, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { PayrollForm } from './PayrollForm';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import type { PayrollDetail } from '@/types';
import payrollService from '@/services/payroll.service';
import { formatDateTime, formatDecimal, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import { usePayrollFormDialog } from '@/pages/payrolls/use-payroll-form-dialog';
import './payroll-form-dialog.scss';

interface PayrollFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function PayrollFormDialog({ open, mode, recordId, onClose, onSuccess }: PayrollFormDialogProps = {}) {
  const { token } = theme.useToken();
  const p = usePayrollFormDialog({ open, mode, recordId, onClose, onSuccess });
  const { t } = p;

  const backOnlyFooter = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={p.requestClose}>
        {t('common.back')}
      </Button>
      <span />
    </Space>
  );

  const createFooter = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={p.requestClose}>
        {t('common.back')}
      </Button>
      {!p.isViewMode ? (
        <Button type="primary" onClick={() => p.form.submit()} loading={p.isLoading}>
          {t('common.create')}
        </Button>
      ) : (
        <span />
      )}
    </Space>
  );

  const footer = p.isPayrollLoading || p.isPayrollDetail ? backOnlyFooter : createFooter;

  const body = p.isPayrollLoading ? (
    <TableSkeleton rows={8} columns={1} />
  ) : p.isPayrollDetail && p.payroll ? (
    <div className="payroll-form-dialog">
      {p.isPreviewMode ? (
        <Alert
          type="info"
          showIcon
          style={{ marginBottom: 12 }}
          message={t('payrolls.previewModeTitle')}
          description={t('payrolls.previewModeDescription')}
        />
      ) : null}
      <Flex vertical gap={8} className="payroll-summary">
        <Flex wrap="wrap" gap={8} align="center">
          <Tag bordered={false}>
            {formatStatusLabel(p.payroll.status, {
              running: t('payrolls.statusRunning'),
              locked: t('payrolls.statusLocked'),
              approved: t('payrolls.statusApproved'),
              generated: t('payrolls.statusGenerated'),
              draft: t('payrolls.statusGenerated'),
              paid: t('payrolls.statusPaid'),
            })}
          </Tag>
          <Typography.Text strong className="payroll-period">{`${String(p.payroll.month).padStart(2, '0')}/${p.payroll.year}`}</Typography.Text>
          <Typography.Text>{p.payroll.company?.name ?? `Company ID ${p.payroll.company_id}`}</Typography.Text>
          <Typography.Text type="secondary">{`${t('payrolls.approvedAtLabel')}: ${formatDateTime(p.payroll.approved_at)}`}</Typography.Text>
          <Typography.Text type="secondary">{`${t('payrolls.lockedAtLabel')}: ${formatDateTime(p.payroll.locked_at)}`}</Typography.Text>
          {p.payroll.paid_at ? (
            <Typography.Text type="secondary">{`${t('payrolls.paidAtLabel')}: ${formatDateTime(p.payroll.paid_at)}`}</Typography.Text>
          ) : null}
        </Flex>
        <Typography.Text>{`${t('payrolls.notesLabel')}: ${p.payroll.notes || '-'}`}</Typography.Text>
      </Flex>

      <Flex wrap="wrap" gap={8} align="center" className="payroll-actions">
        {!p.isViewMode ? (
          <Flex wrap="wrap" gap={8} style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              disabled={
                !['draft', 'generated'].includes(p.payroll.status) ||
                p.actionLoading !== null ||
                p.isRunning ||
                p.cannotApproveBySoD
              }
              title={
                p.isRunning
                  ? t('payrolls.batchRunning')
                  : p.cannotApproveBySoD
                    ? t('payrolls.sodCreatorCannotApprove')
                    : t('payrolls.approve')
              }
              onClick={() => void p.runPayrollAction('approve', () => payrollService.approve(p.resolvedId as number))}
            >
              {p.actionLoading === 'approve' ? t('common.loading') : t('payrolls.approve')}
            </Button>
            <Button
              size="small"
              disabled={p.payroll.status !== 'approved' || p.actionLoading !== null || !p.isAdmin || p.isRunning}
              title={p.isRunning ? t('payrolls.batchRunning') : p.isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              onClick={() => void p.runPayrollAction('lock', () => payrollService.lock(p.resolvedId as number))}
            >
              {p.actionLoading === 'lock' ? t('common.loading') : t('payrolls.lock')}
            </Button>
            <Button
              size="small"
              type="primary"
              disabled={p.payroll.status !== 'locked' || p.actionLoading !== null || !p.isAdmin}
              title={p.isAdmin ? t('payrolls.markPaid') : t('messages.accessDenied')}
              onClick={() => void p.runPayrollAction('markPaid', () => payrollService.markPaid(p.resolvedId as number))}
            >
              {p.actionLoading === 'markPaid' ? t('common.loading') : t('payrolls.markPaid')}
            </Button>
            {['draft', 'generated'].includes(p.payroll.status) ? (
              <Button size="small" danger disabled={p.actionLoading !== null} onClick={() => void p.handleDeletePayroll()}>
                {p.actionLoading === 'delete' ? t('common.loading') : t('common.delete')}
              </Button>
            ) : null}
            <Button size="small" disabled={p.actionLoading !== null} onClick={() => void p.handleExportJson()}>
              {p.actionLoading === 'export' ? t('common.loading') : t('payrolls.exportJson')}
            </Button>
          </Flex>
        ) : null}
      </Flex>

      <div
        className="payroll-lines-table-wrap"
        style={{ borderColor: token.colorBorderSecondary, borderRadius: token.borderRadiusLG }}
      >
        <Table<PayrollDetail>
          className="payroll-lines-table"
          size="small"
          pagination={false}
          rowKey="id"
          dataSource={p.lineItems}
          locale={{ emptyText: t('common.noData') }}
          scroll={{ x: 2400 }}
          columns={[
            { title: t('payrolls.driverId'), key: 'driver_id', width: 96, render: (_, row) => row.driver_id ?? row.employee_id ?? '-' },
            {
              title: t('payrolls.driverName'),
              key: 'driver_name',
              width: 180,
              render: (_, row) => <span>{row.driver?.name ?? row.employee?.name ?? '-'}</span>,
            },
            {
              title: t('payrolls.baseSalary'),
              key: 'base_salary',
              align: 'right',
              render: (_, row) => formatMoney(row.base_salary, { withCurrency: true }),
            },
            {
              title: t('payrolls.tripBonus'),
              key: 'trip_bonus',
              align: 'right',
              render: (_, row) => formatMoney(row.trip_bonus ?? row.bonus, { withCurrency: true }),
            },
            {
              title: t('payrolls.overtimePay'),
              key: 'overtime_pay',
              align: 'right',
              render: (_, row) => formatMoney(row.overtime_pay, { withCurrency: true }),
            },
            {
              title: t('payrolls.nightShiftAllowance'),
              key: 'night_shift_allowance',
              align: 'right',
              render: (_, row) => formatMoney(row.night_shift_allowance, { withCurrency: true }),
            },
            {
              title: t('payrolls.publicHolidayPay'),
              key: 'public_holiday_pay',
              align: 'right',
              render: (_, row) => formatMoney(row.public_holiday_pay, { withCurrency: true }),
            },
            {
              title: t('payrolls.allowanceLabel'),
              key: 'allowance',
              align: 'right',
              render: (_, row) => formatMoney(row.allowance, { withCurrency: true }),
            },
            {
              title: t('payrolls.deductionLabel'),
              key: 'deduction',
              align: 'right',
              render: (_, row) => formatMoney(row.deduction, { withCurrency: true }),
            },
            {
              title: t('payrolls.unpaidLeaveDeduction'),
              key: 'leave_unpaid_deduction',
              align: 'right',
              render: (_, row) => formatMoney(row.leave_unpaid_deduction, { withCurrency: true }),
            },
            {
              title: t('payrolls.violationDeduction'),
              key: 'violation_deduction',
              align: 'right',
              render: (_, row) => formatMoney(row.violation_deduction, { withCurrency: true }),
            },
            {
              title: t('payrolls.fuelExcessDeduction'),
              key: 'fuel_excess_deduction',
              align: 'right',
              render: (_, row) => formatMoney(row.fuel_excess_deduction, { withCurrency: true }),
            },
            {
              title: t('payrolls.taxLabel'),
              key: 'tax',
              align: 'right',
              render: (_, row) => formatMoney(row.tax, { withCurrency: true }),
            },
            {
              title: t('payrolls.netSalary'),
              key: 'net_salary',
              align: 'right',
              render: (_, row) => <Typography.Text strong>{formatMoney(row.net_salary, { withCurrency: true })}</Typography.Text>,
            },
            { title: t('payrolls.workingDays'), key: 'working_days', align: 'right', render: (_, row) => row.working_days ?? '-' },
            { title: t('payrolls.paidLeaveDays'), key: 'leave_days_paid', align: 'right', render: (_, row) => row.leave_days_paid ?? '-' },
            { title: t('payrolls.unpaidLeaveDays'), key: 'leave_days_unpaid', align: 'right', render: (_, row) => row.leave_days_unpaid ?? '-' },
            {
              title: t('payrolls.overtimeHours'),
              key: 'overtime_hours',
              align: 'right',
              render: (_, row) => formatDecimal(row.overtime_hours ?? row.overtime, 2),
            },
            { title: t('payrolls.tripsCompleted'), key: 'trips_completed_count', align: 'right', render: (_, row) => row.trips_completed_count ?? '-' },
            { title: t('payrolls.totalDistanceKm'), key: 'total_distance_km', align: 'right', render: (_, row) => formatDecimal(row.total_distance_km, 2) },
          ]}
        />
      </div>

      <Flex wrap="wrap" gap={12} className="payroll-totals">
        <Typography.Text>{`${t('payrolls.totalBaseSalary')}: ${formatMoney(p.totals.total_base_salary, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalTripBonus')}: ${formatMoney(p.totals.total_trip_bonus, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalOvertimePay')}: ${formatMoney(p.totals.total_overtime_pay, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalAllowance')}: ${formatMoney(p.totals.total_allowance, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalDeduction')}: ${formatMoney(p.totals.total_deduction, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text strong>{`${t('payrolls.totalNetSalary')}: ${formatMoney(p.totals.total_net_salary, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalTripsCompleted')}: ${p.totals.total_trips_completed}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalDistance')}: ${formatDecimal(p.totals.total_distance_km, 2)} km`}</Typography.Text>
      </Flex>
    </div>
  ) : (
    <>
      <Alert type="info" message={t('formGuides.title')} description={t('formGuides.payrollCreate')} showIcon style={{ marginBottom: 16 }} />
      <Form form={p.form} onFinish={p.handleCreate} layout="vertical" validateTrigger={['onBlur', 'onSubmit']}>
        <PayrollForm form={p.form} />
      </Form>
    </>
  );

  return (
    <>
      <ResourceFormModal
        open={p.dialogOpen}
        onOpenChange={p.handleDialogOpenChange}
        title={p.title}
        description={p.description}
        footer={footer}
        width="min(72rem, calc(100vw - 2rem))"
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...p.unsavedChangesWarningProps} />
    </>
  );
}
