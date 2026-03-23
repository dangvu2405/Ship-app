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
import { EmployeeForm } from './EmployeeForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Employee } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function EmployeeFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const isEdit = !!id;

  const { data, isLoading: isLoadingData } = useOne<Employee>({
    resource: 'employees',
    id: id || '',
    queryOptions: { enabled: isEdit },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Employee>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Employee>();

  const isLoading = isCreating || isUpdating || (isEdit && isLoadingData);

  const handleSubmit = (values: Partial<Employee>) => {
    if (isEdit && id) {
      updateItem(
        {
          resource: 'employees',
          id,
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('employees.title') }));
            list('employees');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('employees.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'employees',
          values,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('employees.title') }));
            list('employees');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('employees.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    list('employees');
  };

  // Set form values when data is loaded
  if (isEdit && data?.data && !form.getFieldsValue().code) {
    form.setFieldsValue(data.data);
  }

  if (isEdit && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('employees.editEmployee')}</DialogTitle>
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
            {isEdit ? t('employees.editEmployee') : t('employees.createEmployee')}
          </DialogTitle>
          <DialogDescription>
            {isEdit ? t('employees.editDescription') : t('employees.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleSubmit} layout="vertical">
          <EmployeeForm form={form} initialValues={data?.data} />
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
