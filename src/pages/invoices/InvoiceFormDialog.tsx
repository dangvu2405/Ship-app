import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { InvoiceForm } from './InvoiceForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Invoice } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface InvoiceFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function InvoiceFormDialog({ open, mode, recordId, onClose, onSuccess }: InvoiceFormDialogProps = {}) {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isControlled = typeof open === 'boolean';
  const resolvedId = recordId ?? (id ? Number(id) : undefined);
  const hasRecordId = !!resolvedId;
  const isViewMode = mode ? mode === 'show' : location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;
  const dialogOpen = isControlled ? open : true;

  const { data, isLoading: isLoadingData } = useOne<Invoice>({
    resource: 'invoices',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Invoice>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Invoice>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('invoices');
    }
  };

  const { requestClose, handleDialogOpenChange } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Invoice> & { trip_id?: number | null }) => {
    if (values.issued_at && values.due_date && values.due_date < values.issued_at) {
      toast.error(t('validation.dueDateAfterIssuedAt'));
      return;
    }

    const normalizedStatus = values.status === 'sent' ? 'issued' : values.status;
    const payload = {
      ...values,
      status: normalizedStatus,
      trip_id: values.trip_id === undefined || values.trip_id === null ? undefined : values.trip_id,
    };
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'invoices', id: resolvedId, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('invoices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('invoices.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'invoices', values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('invoices.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('invoices.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (!hasRecordId || !data?.data) {
      return;
    }

    const d = data.data;
    form.setFieldsValue({
      ...d,
      status: d.status === 'sent' ? 'issued' : d.status,
      issued_at: d.issued_at?.slice(0, 10),
      due_date: d.due_date?.slice(0, 10),
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('invoices.editInvoice')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('invoices.editInvoice') : t('invoices.createInvoice')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('invoices.editDescription') : isEdit ? t('invoices.editDescription') : t('invoices.createDescription')}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.invoice')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <InvoiceForm form={form} initialValues={data?.data} />
          </Form>
        </div>
        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={requestClose} className="gap-2">
            <ArrowLeftIcon className="h-4 w-4" />
            {t('common.back')}
          </Button>
          {!isViewMode ? (
            <Button type="submit" onClick={() => form.submit()} disabled={isLoading}>
              {isLoading ? t('common.loading') : isEdit ? t('common.update') : t('common.create')}
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
