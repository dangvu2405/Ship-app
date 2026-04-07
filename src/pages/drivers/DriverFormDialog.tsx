import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { DriverForm } from './DriverForm';
import { useTranslation } from '@/hooks/useTranslation';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Driver } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function DriverFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<Driver>({
    resource: 'drivers',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Driver>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Driver>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => list('drivers');

  const handleSubmit = (values: Partial<Driver>) => {
    if (isEdit && id) {
      updateItem(
        { resource: 'drivers', id, values },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('drivers.title') }));
            list('drivers');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('drivers.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'drivers', values },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('drivers.title') }));
            list('drivers');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('drivers.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue({ ...data.data, expired_date: data.data.expired_date?.slice(0, 10) });
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('drivers.editDriver')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={6} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('drivers.editDriver') : t('drivers.createDriver')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('drivers.editDescription') : isEdit ? t('drivers.editDescription') : t('drivers.createDescription')}</DialogDescription>
        </DialogHeader>
        <Form form={form} onFinish={handleSubmit} layout="vertical" disabled={isViewMode}>
          <DriverForm form={form} initialValues={data?.data} />
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
