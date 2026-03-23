import { Form } from 'antd';
import { useParams } from 'react-router-dom';
import { useCreate, useUpdate, useOne, useNavigation } from '@refinedev/core';
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
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Payroll } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function PayrollFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data, isLoading: isLoadingData } = useOne<Payroll>({
    resource: 'payrolls',
    id: id || '',
    queryOptions: { enabled: isEdit },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Payroll>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Payroll>();

  const isLoading = isCreating || isUpdating || (isEdit && isLoadingData);

  const handleSubmit = (values: Partial<Payroll>) => {
    if (isEdit && id) {
      updateItem(
        {
          resource: 'payrolls',
          id,
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('payrolls.title') }));
            list('payrolls');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'payrolls',
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('payrolls.title') }));
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
    }
  };

  const handleClose = () => {
    list('payrolls');
  };

  // Set form values when data is loaded
  if (isEdit && data?.data && !form.getFieldsValue().month) {
    form.setFieldsValue(data.data);
  }

  if (isEdit && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('payrolls.editPayroll')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? t('payrolls.editPayroll') : t('payrolls.createPayroll')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('payrolls.editDescription') : t('payrolls.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <PayrollForm form={form} initialValues={data?.data} />
        </Form>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          <Button
            type="submit"
            onClick={() => form.submit()}
            disabled={isLoading}
          >
            {isLoading
              ? t('common.loading')
              : isEdit
              ? t('common.update')
              : t('common.create')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
