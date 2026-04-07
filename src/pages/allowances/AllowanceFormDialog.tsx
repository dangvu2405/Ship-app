import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { AllowanceForm } from './AllowanceForm';
import { useTranslation } from '@/hooks/useTranslation';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Allowance } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function AllowanceFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<Allowance>({
    resource: 'allowances',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Allowance>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Allowance>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => list('allowances');

  const handleSubmit = (values: Partial<Allowance>) => {
    if (isEdit && id) {
      updateItem(
        { resource: 'allowances', id, values },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('allowances.title') }));
            list('allowances');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('allowances.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'allowances', values },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('allowances.title') }));
            list('allowances');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('allowances.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue({ ...data.data, taxable: Boolean(data.data.taxable) });
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('allowances.editAllowance')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={5} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('allowances.editAllowance') : t('allowances.createAllowance')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('allowances.editDescription') : isEdit ? t('allowances.editDescription') : t('allowances.createDescription')}</DialogDescription>
        </DialogHeader>
        <Form form={form} onFinish={handleSubmit} layout="vertical" initialValues={{ taxable: false }} disabled={isViewMode}>
          <AllowanceForm form={form} initialValues={data?.data} />
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
