import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { InvoiceForm } from './InvoiceForm';
import { useTranslation } from '@/hooks/useTranslation';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Invoice } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function InvoiceFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<Invoice>({
    resource: 'invoices',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Invoice>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Invoice>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => list('invoices');

  const handleSubmit = (values: Partial<Invoice> & { trip_id?: number | null }) => {
    const payload = { ...values, trip_id: values.trip_id === undefined || values.trip_id === null ? undefined : values.trip_id };
    if (isEdit && id) {
      updateItem(
        { resource: 'invoices', id, values: payload },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('invoices.title') }));
            list('invoices');
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
            list('invoices');
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
      issued_at: d.issued_at?.slice(0, 10),
      due_date: d.due_date?.slice(0, 10),
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('invoices.editInvoice')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('invoices.editInvoice') : t('invoices.createInvoice')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('invoices.editDescription') : isEdit ? t('invoices.editDescription') : t('invoices.createDescription')}</DialogDescription>
        </DialogHeader>
        <Form form={form} onFinish={handleSubmit} layout="vertical" disabled={isViewMode}>
          <InvoiceForm form={form} initialValues={data?.data} />
        </Form>
        <DialogFooter>
          <Button variant="outline" type="button" onClick={handleClose} className="gap-2">
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
