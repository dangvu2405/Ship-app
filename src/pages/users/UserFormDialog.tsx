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
import { UserForm } from './UserForm';
import { useTranslation } from '@/hooks/useTranslation';
import { ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import type { User } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  status: string;
  employee_id?: number;
  role_ids?: number[];
}

const buildPayload = (values: UserFormValues, isEdit: boolean): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    username: values.username,
    email: values.email,
    status: values.status,
    employee_id: values.employee_id,
    role_ids: values.role_ids ?? [],
  };

  if (!isEdit && values.password) {
    payload.password = values.password;
  }

  if (values.employee_id == null) {
    delete payload.employee_id;
  }

  return payload;
};

export function UserFormDialog() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm();
  const hasRecordId = !!id;
  const isViewMode = location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;

  const { data, isLoading: isLoadingData } = useOne<User>({
    resource: 'users',
    id: id || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<User>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<User>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleSubmit = (values: UserFormValues) => {
    const payload = buildPayload(values, isEdit);

    if (isEdit && id) {
      updateItem(
        {
          resource: 'users',
          id,
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('users.title') }));
            list('users');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('users.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'users',
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('users.title') }));
            list('users');
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('users.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    list('users');
  };

  useEffect(() => {
    if (!hasRecordId || !data?.data) {
      return;
    }

    form.setFieldsValue({
      username: data.data.username,
      email: data.data.email,
      status: data.data.status,
      employee_id: data.data.employee_id ?? data.data.employee?.id,
      role_ids: data.data.roles?.map((role) => role.id) ?? [],
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <Dialog open={true} onOpenChange={handleClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('users.editUser')}</DialogTitle>
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
            {isViewMode ? t('common.view') : isEdit ? t('users.editUser') : t('users.createUser')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('users.editDescription') : isEdit ? t('users.editDescription') : t('users.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <Form form={form} onFinish={handleSubmit} layout="vertical" disabled={isViewMode}>
          <UserForm form={form} initialValues={data?.data} isEdit={isEdit} />
        </Form>

        <DialogFooter>
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
