import { useCallback, useState } from 'react';
import { Alert, Button, Flex, Form, Space, Table, Tag, theme } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useInvalidate, useNavigation, useOne } from '@refinedev/core';
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

export function PayrollFormDialog({ open, mode, recordId, onClose, onSuccess }: PayrollFormDialogProps = {}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { hasRole } = useAuth();
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

  const body = isPayrollLoading ? (
    <TableSkeleton rows={8} columns={1} />
  ) : isPayrollDetail && payroll ? (
    <>
      <Flex wrap="wrap" gap={8} align="center" style={{ padding: '8px 0' }}>
        <Tag bordered={false}>{statusLabel(payroll.status, t)}</Tag>
        {!isViewMode ? (
          <Flex wrap="wrap" gap={8} style={{ marginLeft: 'auto' }}>
            <Button
              size="small"
              disabled={payroll.status === 'locked' || actionLoading !== null || !(payroll.status === 'generated' || payroll.status === 'draft')}
              onClick={() => runPayrollAction('approve', () => payrollService.approve(resolvedId as number))}
            >
              {actionLoading === 'approve' ? t('common.loading') : t('payrolls.approve')}
            </Button>
            <Button
              size="small"
              disabled={payroll.status === 'locked' || actionLoading !== null || !(payroll.status === 'approved' && isAdmin)}
              title={isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              onClick={() => runPayrollAction('lock', () => payrollService.lock(resolvedId as number))}
            >
              {actionLoading === 'lock' ? t('common.loading') : t('payrolls.lock')}
            </Button>
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
          dataSource={payroll.details ?? []}
          locale={{ emptyText: t('common.noData') }}
          columns={[
            {
              title: t('payrolls.employee'),
              key: 'employee',
              render: (_, row) => (
                <span>
                  {(row as PayrollDetail & { employee?: { name?: string; code?: string } }).employee?.code ?? '—'}{' '}
                  {(row as PayrollDetail & { employee?: { name?: string } }).employee?.name ?? ''}
                </span>
              ),
            },
            {
              title: t('payrolls.amount'),
              key: 'amount',
              align: 'right',
              render: (_, row) => <span className="tabular-nums">{formatCurrencyVND(row.net_salary)}</span>,
            },
          ]}
        />
      </div>
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
