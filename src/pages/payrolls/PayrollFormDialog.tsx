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
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { PayrollForm } from './PayrollForm';
import { useTranslation } from '@/hooks/useTranslation';

type Translate = ReturnType<typeof useTranslation>['t'];
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Payroll, PayrollDetail } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import payrollService from '@/services/payroll.service';
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

function statusLabel(status: string, t: Translate): string {
  switch (status) {
    case 'locked':
      return t('payrolls.statusLocked');
    case 'approved':
      return t('payrolls.statusApproved');
    case 'paid':
      return t('payrolls.statusPaid');
    default:
      return t('payrolls.statusDraft');
  }
}

export function PayrollFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const invalidate = useInvalidate();
  const [form] = Form.useForm();
  const hasRecordId = Boolean(id);
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const { data, isLoading: isLoadingData, refetch } = useOne<Payroll>({
    resource: 'payrolls',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const payroll = data?.data;

  const { mutate: createItem, isLoading: isCreating } = useCreate<Payroll>();

  const isLoading = isCreating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    list('payrolls');
  };

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
          void invalidate({ resource: 'payrolls', invalidates: ['list'] });
          list('payrolls');
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
    if (!id) return;
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

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('payrolls.editPayroll')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  if (hasRecordId && payroll) {
    const locked = payroll.status === 'locked';
    const details = payroll.details ?? [];

    return (
      <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
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
                  disabled={locked || actionLoading !== null}
                  onClick={() =>
                    runPayrollAction('approve', () => payrollService.approve(Number(id)))
                  }
                >
                  {actionLoading === 'approve' ? t('common.loading') : t('payrolls.approve')}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  disabled={locked || actionLoading !== null}
                  onClick={() => runPayrollAction('lock', () => payrollService.lock(Number(id)))}
                >
                  {actionLoading === 'lock' ? t('common.loading') : t('payrolls.lock')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={actionLoading !== null}
                  onClick={async () => {
                    if (!id) return;
                    try {
                      setActionLoading('export');
                      await payrollService.downloadExport(Number(id));
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
                      <TableCell className="text-right tabular-nums">{formatMoney(row.net_salary)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('payrolls.createPayroll')}</DialogTitle>
          <DialogDescription>{t('payrolls.createDescription')}</DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleCreate} layout="vertical">
          <PayrollForm form={form} />
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
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
