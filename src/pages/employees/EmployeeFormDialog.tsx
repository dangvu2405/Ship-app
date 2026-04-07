import { useEffect } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { EmployeeForm } from './EmployeeForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { Employee } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function EmployeeFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<Employee>({
    resource: 'employees',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Employee>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Employee>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

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

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('employees.editEmployee')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-0 rounded-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('employees.editEmployee') : t('employees.createEmployee')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('employees.editDescription') : isEdit ? t('employees.editDescription') : t('employees.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>Form guide</AlertTitle>
            <AlertDescription>Fields marked with * are required. Validation runs on blur and submit.</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <EmployeeForm form={form} initialValues={data?.data} />
          </Form>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" onClick={handleClose} type="button" className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Button>
          {!isViewMode ? (
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
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
