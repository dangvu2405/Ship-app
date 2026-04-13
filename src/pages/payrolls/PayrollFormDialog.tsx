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
import { formatCurrencyVND } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';

type Translate = ReturnType<typeof useTranslation>['t'];

interface PayrollFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

function statusLabel(status: string, t: Translate): string {
  switch (status) {
    case 'running':
      return 'Running';
    case 'locked':
      return t('payrolls.statusLocked');
    case 'approved':
      return t('payrolls.statusApproved');
    case 'generated':
    case 'draft':
      return t('payrolls.statusGenerated');
    default:
      return status;
  }
}

function formatDecimal(value?: number | null, digits = 1): string {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '-';
  return Number(value).toLocaleString('vi-VN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: digits,
  });
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
      ? t('common.view')
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

  const lineItems = payroll?.details ?? [];
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
    <>
      <Flex vertical gap={8} style={{ marginBottom: 12 }}>
        <Flex wrap="wrap" gap={8} align="center">
          <Tag bordered={false}>{statusLabel(payroll.status, t)}</Tag>
          <Typography.Text strong>{`${String(payroll.month).padStart(2, '0')}/${payroll.year}`}</Typography.Text>
          <Typography.Text>{payroll.company?.name ?? `Company ID ${payroll.company_id}`}</Typography.Text>
          <Typography.Text type="secondary">{`Approved: ${payroll.approved_at ?? '-'}`}</Typography.Text>
          <Typography.Text type="secondary">{`Locked: ${payroll.locked_at ?? '-'}`}</Typography.Text>
        </Flex>
        <Typography.Text>{`Notes: ${payroll.notes || '-'}`}</Typography.Text>
      </Flex>

      <Flex wrap="wrap" gap={8} align="center" style={{ padding: '8px 0' }}>
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
                  ? 'Batch is running'
                  : cannotApproveBySoD
                    ? 'SoD: creator cannot approve this payroll'
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
              title={isRunning ? 'Batch is running' : isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
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

      <div style={{ border: `1px solid ${token.colorBorderSecondary}`, borderRadius: token.borderRadiusLG, overflow: 'hidden' }}>
        <Table<PayrollDetail>
          size="small"
          pagination={false}
          rowKey="id"
          dataSource={lineItems}
          locale={{ emptyText: t('common.noData') }}
          scroll={{ x: 2400 }}
          columns={[
            { title: 'Driver ID', key: 'driver_id', width: 96, render: (_, row) => row.driver_id ?? row.employee_id ?? '-' },
            {
              title: 'Driver Name',
              key: 'driver_name',
              width: 180,
              render: (_, row) => (
                <span>
                  {row.driver?.name ?? row.employee?.name ?? '-'}
                </span>
              ),
            },
            {
              title: 'Base Salary',
              key: 'base_salary',
              align: 'right',
              render: (_, row) => formatCurrencyVND(row.base_salary),
            },
            { title: 'Trip Bonus', key: 'trip_bonus', align: 'right', render: (_, row) => formatCurrencyVND(row.trip_bonus ?? row.bonus) },
            { title: 'Overtime Pay', key: 'overtime_pay', align: 'right', render: (_, row) => formatCurrencyVND(row.overtime_pay) },
            { title: 'Night Shift Allowance', key: 'night_shift_allowance', align: 'right', render: (_, row) => formatCurrencyVND(row.night_shift_allowance) },
            { title: 'Public Holiday Pay', key: 'public_holiday_pay', align: 'right', render: (_, row) => formatCurrencyVND(row.public_holiday_pay) },
            { title: 'Allowance', key: 'allowance', align: 'right', render: (_, row) => formatCurrencyVND(row.allowance) },
            { title: 'Deduction', key: 'deduction', align: 'right', render: (_, row) => formatCurrencyVND(row.deduction) },
            { title: 'Unpaid Leave Deduction', key: 'leave_unpaid_deduction', align: 'right', render: (_, row) => formatCurrencyVND(row.leave_unpaid_deduction) },
            { title: 'Violation Deduction', key: 'violation_deduction', align: 'right', render: (_, row) => formatCurrencyVND(row.violation_deduction) },
            { title: 'Fuel Cost', key: 'fuel_cost', align: 'right', render: (_, row) => formatCurrencyVND(row.fuel_cost) },
            { title: 'Tax', key: 'tax', align: 'right', render: (_, row) => formatCurrencyVND(row.tax) },
            {
              title: 'Net Salary',
              key: 'net_salary',
              align: 'right',
              render: (_, row) => <Typography.Text strong>{formatCurrencyVND(row.net_salary)}</Typography.Text>,
            },
            { title: 'Working Days', key: 'working_days', align: 'right', render: (_, row) => row.working_days ?? '-' },
            { title: 'Paid Leave Days', key: 'leave_days_paid', align: 'right', render: (_, row) => row.leave_days_paid ?? '-' },
            { title: 'Unpaid Leave Days', key: 'leave_days_unpaid', align: 'right', render: (_, row) => row.leave_days_unpaid ?? '-' },
            { title: 'Overtime Hours', key: 'overtime_hours', align: 'right', render: (_, row) => formatDecimal(row.overtime_hours ?? row.overtime, 2) },
            { title: 'Trips Completed', key: 'trips_completed_count', align: 'right', render: (_, row) => row.trips_completed_count ?? '-' },
            { title: 'Total Distance (km)', key: 'total_distance_km', align: 'right', render: (_, row) => formatDecimal(row.total_distance_km, 2) },
          ]}
        />
      </div>

      <Flex wrap="wrap" gap={12} style={{ marginTop: 12 }}>
        <Typography.Text>{`Total Base Salary: ${formatCurrencyVND(totals.total_base_salary)}`}</Typography.Text>
        <Typography.Text>{`Total Trip Bonus: ${formatCurrencyVND(totals.total_trip_bonus)}`}</Typography.Text>
        <Typography.Text>{`Total Overtime Pay: ${formatCurrencyVND(totals.total_overtime_pay)}`}</Typography.Text>
        <Typography.Text>{`Total Allowance: ${formatCurrencyVND(totals.total_allowance)}`}</Typography.Text>
        <Typography.Text>{`Total Deduction: ${formatCurrencyVND(totals.total_deduction)}`}</Typography.Text>
        <Typography.Text strong>{`Total Net Salary: ${formatCurrencyVND(totals.total_net_salary)}`}</Typography.Text>
        <Typography.Text>{`Total Trips Completed: ${totals.total_trips_completed}`}</Typography.Text>
        <Typography.Text>{`Total Distance: ${formatDecimal(totals.total_distance_km, 2)} km`}</Typography.Text>
      </Flex>
    </>
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
