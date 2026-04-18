import { useCallback, useMemo, useState } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useDelete, useInvalidate, useNavigation, useOne } from '@refinedev/core';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { useTranslation } from '@/hooks/useTranslation';
import toast from 'react-hot-toast';
import type { Payroll } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import payrollService from '@/services/payroll.service';
import { useAuth } from '@/hooks/useAuth';
import { buildPayrollLineItems, computePayrollTotals } from '@/pages/payrolls/payroll-form-dialog-helpers';

export interface UsePayrollFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function usePayrollFormDialog({ open, mode, recordId, onClose, onSuccess }: UsePayrollFormDialogProps = {}) {
  const { t } = useTranslation();
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

  const handleClose = useCallback(() => {
    onClose?.();
    if (!isControlled) {
      list('payrolls');
    }
  }, [onClose, isControlled, list]);

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

  const handleCreate = useCallback(
    (values: { company_id: number; month: number; year: number }) => {
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
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('payrolls.title') }));
          },
        },
      );
    },
    [createItem, t, onSuccess, invalidate, handleClose],
  );

  const runPayrollAction = useCallback(
    async (key: string, fn: () => Promise<unknown>) => {
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
    },
    [resolvedId, refreshPayroll, t],
  );

  const isPayrollLoading = hasRecordId && isLoadingData;
  const isPayrollDetail = hasRecordId && !!payroll && !isLoadingData;
  const isRunning = payroll?.status === 'running';
  const cannotApproveBySoD =
    typeof payroll?.created_by === 'number' && typeof user?.id === 'number' && payroll.created_by === user.id;

  const title = useMemo(
    () =>
      isPayrollLoading || isPayrollDetail
        ? isViewMode
          ? `${t('common.view')} · ${t('payrolls.preview')}`
          : t('payrolls.editPayroll')
        : t('payrolls.createPayroll'),
    [isPayrollLoading, isPayrollDetail, isViewMode, t],
  );

  const description = useMemo(() => {
    if (isPayrollLoading) return t('payrolls.editDescription');
    if (isPayrollDetail && payroll) {
      return `${(payroll as Payroll & { company?: { name?: string } }).company?.name ?? `ID ${payroll.company_id}`} · ${t('payrolls.month')} ${payroll.month}/${payroll.year}`;
    }
    return t('payrolls.createDescription');
  }, [isPayrollLoading, isPayrollDetail, payroll, t]);

  const lineItems = useMemo(() => buildPayrollLineItems(payroll), [payroll]);
  const totals = useMemo(() => computePayrollTotals(lineItems), [lineItems]);

  const handleDeletePayroll = useCallback(async () => {
    if (!resolvedId) return;
    try {
      setActionLoading('delete');
      await deletePayroll({ resource: 'payrolls', id: resolvedId });
      toast.success(t('notifications.deleteSuccess', { item: t('payrolls.title') }));
      await invalidate({ resource: 'payrolls', invalidates: ['list'] });
      handleClose();
    } finally {
      setActionLoading(null);
    }
  }, [resolvedId, deletePayroll, t, invalidate, handleClose]);

  const handleExportJson = useCallback(async () => {
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
  }, [resolvedId, t]);

  return {
    t,
    form,
    dialogOpen,
    handleDialogOpenChange,
    unsavedChangesWarningProps,
    requestClose,
    handleClose,
    handleCreate,
    runPayrollAction,
    handleDeletePayroll,
    handleExportJson,
    payroll,
    isLoading,
    isPayrollLoading,
    isPayrollDetail,
    isPreviewMode,
    isViewMode,
    resolvedId,
    hasRecordId,
    actionLoading,
    isRunning,
    cannotApproveBySoD,
    isAdmin,
    title,
    description,
    lineItems,
    totals,
  };
}
