import { useCallback, useState } from 'react';
import { Alert, Button, Flex, Form, Space, Table, Tag, Typography, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useDelete, useInvalidate, useNavigation, useOne } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { PayrollForm } from './PayrollForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Payroll, PayrollDetail } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import payrollService from '@/services/payroll.service';
import { formatDateTime, formatDecimal, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import { useAuth } from '@/hooks/useAuth';
import './payroll-form-dialog.scss';

interface PayrollFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}


function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

export function PayrollFormDialog({ open, mode, recordId, onClose, onSuccess }: PayrollFormDialogProps = {}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { hasRole, user } = useAuth();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const invalidate = useInvalidate();
  const [form] = Form.useForm();
  const isControlled = typeof open === 'boolean';
  const resolvedId = recordId ?? (id ? Number(id) : undefined);
  const hasRecordId = Boolean(resolvedId);
  const isViewMode = mode ? mode === 'show' : location.pathname.includes('/show/');
  const isPreviewMode = isViewMode && hasRecordId;
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const isAdmin = hasRole('admin');
  const dialogOpen = isControlled ? open : true;

  const { data, isLoading: isLoadingData, refetch } = useOne<Payroll>({
    resource: 'payrolls',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const payroll = data?.data;

  const { mutate: createItem, isLoading: isCreating } = useCreate<Payroll>();
  const { mutateAsync: deletePayroll } = useDelete();

  const isLoading = isCreating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('payrolls');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading || actionLoading !== null,
    onClose: handleClose,
  });

  const refreshPayroll = useCallback(async () => {
    await invalidate({ resource: 'payrolls', invalidates: ['list'] });
    await refetch();
  }, [invalidate, refetch]);

  const handleCreate = (values: { company_id: number; month: number; year: number }) => {
    createItem(
      {
        resource: 'payrolls',
        values: {
          company_id: values.company_id,
          month: values.month,
          year: values.year,
        },
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.createSuccess', { item: t('payrolls.title') }));
          onSuccess?.();
          void invalidate({ resource: 'payrolls', invalidates: ['list'] });
          handleClose();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }
          toast.error(
            getErrorMessage(error) || t('notifications.createError', { item: t('payrolls.title') })
          );
        },
      }
    );
  };

  const runPayrollAction = async (key: string, fn: () => Promise<unknown>) => {
    if (!resolvedId) return;
    try {
      setActionLoading(key);
      await fn();
      toast.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
      await refreshPayroll();
    } catch (error) {
      if (!shouldShowLocalErrorToast(error)) {
        return;
      }
      toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') }));
    } finally {
      setActionLoading(null);
    }
  };

  const isPayrollLoading = hasRecordId && isLoadingData;
  const isPayrollDetail = hasRecordId && !!payroll && !isLoadingData;
  const isRunning = payroll?.status === 'running';
  const cannotApproveBySoD =
    typeof payroll?.created_by === 'number' &&
    typeof user?.id === 'number' &&
    payroll.created_by === user.id;

  const title = isPayrollLoading || isPayrollDetail
    ? isViewMode
      ? `${t('common.view')} · ${t('payrolls.preview')}`
      : t('payrolls.editPayroll')
    : t('payrolls.createPayroll');

  const description = isPayrollLoading
    ? t('payrolls.editDescription')
    : isPayrollDetail && payroll
      ? `${(payroll as Payroll & { company?: { name?: string } }).company?.name ?? `ID ${payroll.company_id}`} · ${t('payrolls.month')} ${payroll.month}/${payroll.year}`
      : t('payrolls.createDescription');

  const backOnlyFooter = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      <span />
    </Space>
  );

  const createFooter = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      {!isViewMode ? (
        <Button type="primary" onClick={() => form.submit()} loading={isLoading}>
          {t('common.create')}
        </Button>
      ) : (
        <span />
      )}
    </Space>
  );

  const footer = isPayrollLoading || isPayrollDetail ? backOnlyFooter : createFooter;

  const lineItems: PayrollDetail[] = (payroll?.details ??
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
      fuel_cost: toNumber(raw.fuel_cost),
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
  });
  const totals = lineItems.reduce(
      (acc, line) => {
        const tripBonus = line.trip_bonus ?? line.bonus ?? 0;
        const overtimePay = line.overtime_pay ?? 0;
        const allowance = line.allowance ?? 0;
        const deductionTotal =
          (line.deduction ?? 0) +
          (line.leave_unpaid_deduction ?? 0) +
          (line.violation_deduction ?? 0) +
          (line.fuel_cost ?? 0) +
          (line.tax ?? 0);
        acc.total_base_salary += line.base_salary ?? 0;
        acc.total_trip_bonus += tripBonus;
        acc.total_overtime_pay += overtimePay;
        acc.total_allowance += allowance;
        acc.total_deduction += deductionTotal;
        acc.total_net_salary += line.net_salary ?? 0;
        acc.total_trips_completed += line.trips_completed_count ?? 0;
        acc.total_distance_km += line.total_distance_km ?? 0;
        return acc;
      },
      {
        total_base_salary: 0,
        total_trip_bonus: 0,
        total_overtime_pay: 0,
        total_allowance: 0,
        total_deduction: 0,
        total_net_salary: 0,
        total_trips_completed: 0,
        total_distance_km: 0,
      },
    );

  const body = isPayrollLoading ? (
    <TableSkeleton rows={8} columns={1} />
  ) : isPayrollDetail && payroll ? (
    <div className="payroll-form-dialog">
      {isPreviewMode ? (
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
            {formatStatusLabel(payroll.status, {
              running: t('payrolls.statusRunning'),
              locked: t('payrolls.statusLocked'),
              approved: t('payrolls.statusApproved'),
              generated: t('payrolls.statusGenerated'),
              draft: t('payrolls.statusGenerated'),
            })}
          </Tag>
          <Typography.Text strong className="payroll-period">{`${String(payroll.month).padStart(2, '0')}/${payroll.year}`}</Typography.Text>
          <Typography.Text>{payroll.company?.name ?? `Company ID ${payroll.company_id}`}</Typography.Text>
          <Typography.Text type="secondary">{`${t('payrolls.approvedAtLabel')}: ${formatDateTime(payroll.approved_at)}`}</Typography.Text>
          <Typography.Text type="secondary">{`${t('payrolls.lockedAtLabel')}: ${formatDateTime(payroll.locked_at)}`}</Typography.Text>
        </Flex>
        <Typography.Text>{`${t('payrolls.notesLabel')}: ${payroll.notes || '-'}`}</Typography.Text>
      </Flex>

      <Flex wrap="wrap" gap={8} align="center" className="payroll-actions">
        {!isViewMode ? (
          <Flex wrap="wrap" gap={8} style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              disabled={
                !['draft', 'generated'].includes(payroll.status) ||
                actionLoading !== null ||
                isRunning ||
                cannotApproveBySoD
              }
              title={
                isRunning
                  ? t('payrolls.batchRunning')
                  : cannotApproveBySoD
                    ? t('payrolls.sodCreatorCannotApprove')
                    : t('payrolls.approve')
              }
              onClick={() => runPayrollAction('approve', () => payrollService.approve(resolvedId as number))}
            >
              {actionLoading === 'approve' ? t('common.loading') : t('payrolls.approve')}
            </Button>
            <Button
              size="small"
              disabled={
                payroll.status !== 'approved' ||
                actionLoading !== null ||
                !isAdmin ||
                isRunning
              }
              title={isRunning ? t('payrolls.batchRunning') : isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              onClick={() => runPayrollAction('lock', () => payrollService.lock(resolvedId as number))}
            >
              {actionLoading === 'lock' ? t('common.loading') : t('payrolls.lock')}
            </Button>
            {['draft', 'generated'].includes(payroll.status) ? (
              <Button
                size="small"
                danger
                disabled={actionLoading !== null}
                onClick={async () => {
                  try {
                    setActionLoading('delete');
                    await deletePayroll({ resource: 'payrolls', id: resolvedId as number });
                    toast.success(t('notifications.deleteSuccess', { item: t('payrolls.title') }));
                    await invalidate({ resource: 'payrolls', invalidates: ['list'] });
                    handleClose();
                  } finally {
                    setActionLoading(null);
                  }
                }}
              >
                {actionLoading === 'delete' ? t('common.loading') : t('common.delete')}
              </Button>
            ) : null}
            <Button
              size="small"
              disabled={actionLoading !== null}
              onClick={async () => {
                if (!resolvedId) return;
                try {
                  setActionLoading('export');
                  await payrollService.downloadExport(resolvedId);
                  toast.success(t('payrolls.exportJson'));
                } catch (error) {
                  if (!shouldShowLocalErrorToast(error)) {
                    return;
                  }
                  toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') }));
                } finally {
                  setActionLoading(null);
                }
              }}
            >
              {actionLoading === 'export' ? t('common.loading') : t('payrolls.exportJson')}
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
          dataSource={lineItems}
          locale={{ emptyText: t('common.noData') }}
          scroll={{ x: 2400 }}
          columns={[
            { title: t('payrolls.driverId'), key: 'driver_id', width: 96, render: (_, row) => row.driver_id ?? row.employee_id ?? '-' },
            {
              title: t('payrolls.driverName'),
              key: 'driver_name',
              width: 180,
              render: (_, row) => (
                <span>
                  {row.driver?.name ?? row.employee?.name ?? '-'}
                </span>
              ),
            },
            {
              title: t('payrolls.baseSalary'),
              key: 'base_salary',
              align: 'right',
              render: (_, row) => formatMoney(row.base_salary, { withCurrency: true }),
            },
            { title: t('payrolls.tripBonus'), key: 'trip_bonus', align: 'right', render: (_, row) => formatMoney(row.trip_bonus ?? row.bonus, { withCurrency: true }) },
            { title: t('payrolls.overtimePay'), key: 'overtime_pay', align: 'right', render: (_, row) => formatMoney(row.overtime_pay, { withCurrency: true }) },
            { title: t('payrolls.nightShiftAllowance'), key: 'night_shift_allowance', align: 'right', render: (_, row) => formatMoney(row.night_shift_allowance, { withCurrency: true }) },
            { title: t('payrolls.publicHolidayPay'), key: 'public_holiday_pay', align: 'right', render: (_, row) => formatMoney(row.public_holiday_pay, { withCurrency: true }) },
            { title: t('payrolls.allowanceLabel'), key: 'allowance', align: 'right', render: (_, row) => formatMoney(row.allowance, { withCurrency: true }) },
            { title: t('payrolls.deductionLabel'), key: 'deduction', align: 'right', render: (_, row) => formatMoney(row.deduction, { withCurrency: true }) },
            { title: t('payrolls.unpaidLeaveDeduction'), key: 'leave_unpaid_deduction', align: 'right', render: (_, row) => formatMoney(row.leave_unpaid_deduction, { withCurrency: true }) },
            { title: t('payrolls.violationDeduction'), key: 'violation_deduction', align: 'right', render: (_, row) => formatMoney(row.violation_deduction, { withCurrency: true }) },
            { title: t('payrolls.fuelCost'), key: 'fuel_cost', align: 'right', render: (_, row) => formatMoney(row.fuel_cost, { withCurrency: true }) },
            { title: t('payrolls.taxLabel'), key: 'tax', align: 'right', render: (_, row) => formatMoney(row.tax, { withCurrency: true }) },
            {
              title: t('payrolls.netSalary'),
              key: 'net_salary',
              align: 'right',
              render: (_, row) => <Typography.Text strong>{formatMoney(row.net_salary, { withCurrency: true })}</Typography.Text>,
            },
            { title: t('payrolls.workingDays'), key: 'working_days', align: 'right', render: (_, row) => row.working_days ?? '-' },
            { title: t('payrolls.paidLeaveDays'), key: 'leave_days_paid', align: 'right', render: (_, row) => row.leave_days_paid ?? '-' },
            { title: t('payrolls.unpaidLeaveDays'), key: 'leave_days_unpaid', align: 'right', render: (_, row) => row.leave_days_unpaid ?? '-' },
            { title: t('payrolls.overtimeHours'), key: 'overtime_hours', align: 'right', render: (_, row) => formatDecimal(row.overtime_hours ?? row.overtime, 2) },
            { title: t('payrolls.tripsCompleted'), key: 'trips_completed_count', align: 'right', render: (_, row) => row.trips_completed_count ?? '-' },
            { title: t('payrolls.totalDistanceKm'), key: 'total_distance_km', align: 'right', render: (_, row) => formatDecimal(row.total_distance_km, 2) },
          ]}
        />
      </div>

      <Flex wrap="wrap" gap={12} className="payroll-totals">
        <Typography.Text>{`${t('payrolls.totalBaseSalary')}: ${formatMoney(totals.total_base_salary, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalTripBonus')}: ${formatMoney(totals.total_trip_bonus, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalOvertimePay')}: ${formatMoney(totals.total_overtime_pay, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalAllowance')}: ${formatMoney(totals.total_allowance, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalDeduction')}: ${formatMoney(totals.total_deduction, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text strong>{`${t('payrolls.totalNetSalary')}: ${formatMoney(totals.total_net_salary, { withCurrency: true })}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalTripsCompleted')}: ${totals.total_trips_completed}`}</Typography.Text>
        <Typography.Text>{`${t('payrolls.totalDistance')}: ${formatDecimal(totals.total_distance_km, 2)} km`}</Typography.Text>
      </Flex>
    </div>
  ) : (
    <>
      <Alert
        type="info"
        message={t('formGuides.title')}
        description={t('formGuides.payrollCreate')}
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form form={form} onFinish={handleCreate} layout="vertical" validateTrigger={['onBlur', 'onSubmit']}>
        <PayrollForm form={form} />
      </Form>
    </>
  );

  return (
    <>
      <ResourceFormModal
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={title}
        description={description}
        footer={footer}
        width="min(72rem, calc(100vw - 2rem))"
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
