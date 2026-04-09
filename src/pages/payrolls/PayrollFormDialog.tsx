import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useInvalidate, useNavigation, useOne } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { PayrollForm } from './PayrollForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Payroll, PayrollDetail } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import payrollService from '@/services/payroll.service';
import { formatCurrencyVND } from '@/utils/format';
import { useCallback, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
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

  const { requestClose, handleDialogOpenChange } = useFormDialogCloseGuard({
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

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('payrolls.editPayroll')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  if (hasRecordId && payroll) {
    const payrollId = resolvedId as number;
    const locked = payroll.status === 'locked';
    const canApprove = payroll.status === 'generated' || payroll.status === 'draft';
    const canLock = payroll.status === 'approved' && isAdmin;
    const details = payroll.details ?? [];

    return (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('payrolls.editPayroll')}</DialogTitle>
            <DialogDescription>
              {(payroll as Payroll & { company?: { name?: string } }).company?.name ?? `ID ${payroll.company_id}`}{' '}
              · {t('payrolls.month')} {payroll.month}/{payroll.year}
            </DialogDescription>
          </DialogHeader>

          <div className="flex flex-wrap items-center gap-2 py-2">
            <Badge variant="outline">{statusLabel(payroll.status, t)}</Badge>
            {!isViewMode ? (
              <div className="flex flex-wrap gap-2 ml-auto">
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={locked || actionLoading !== null || !canApprove}
                  onClick={() =>
                    runPayrollAction('approve', () => payrollService.approve(payrollId))
                  }
                >
                  {actionLoading === 'approve' ? t('common.loading') : t('payrolls.approve')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={locked || actionLoading !== null || !canLock}
                  title={isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
                  onClick={() => runPayrollAction('lock', () => payrollService.lock(payrollId))}
                >
                  {actionLoading === 'lock' ? t('common.loading') : t('payrolls.lock')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
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
              </div>
            ) : null}
          </div>

          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('payrolls.employee')}</TableHead>
                  <TableHead className="text-right">{t('payrolls.amount')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {details.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={2} className="text-muted-foreground text-center py-8">
                      {t('common.noData')}
                    </TableCell>
                  </TableRow>
                ) : (
                  details.map((row: PayrollDetail) => (
                    <TableRow key={row.id}>
                      <TableCell>
                        {(row as PayrollDetail & { employee?: { name?: string; code?: string } }).employee?.code ?? '—'}{' '}
                        {(row as PayrollDetail & { employee?: { name?: string } }).employee?.name ?? ''}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{formatCurrencyVND(row.net_salary)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={requestClose} type="button" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{t('payrolls.createPayroll')}</DialogTitle>
          <DialogDescription>{t('payrolls.createDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.payrollCreate')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleCreate}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
          >
            <PayrollForm form={form} />
          </Form>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" onClick={requestClose} type="button" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <Button type="submit" onClick={() => form.submit()} disabled={isLoading}>
            {isLoading ? t('common.loading') : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
