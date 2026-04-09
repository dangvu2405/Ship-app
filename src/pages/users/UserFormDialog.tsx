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
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { UserForm } from './UserForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
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

interface UserFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function UserFormDialog({ open, mode, recordId, onClose, onSuccess }: UserFormDialogProps = {}) {
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

  const { data, isLoading: isLoadingData } = useOne<User>({
    resource: 'users',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<User>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<User>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleSubmit = (values: UserFormValues) => {
    const payload = buildPayload(values, isEdit);

    if (isEdit && resolvedId) {
      updateItem(
        {
          resource: 'users',
          id: resolvedId,
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('users.title') }));
            onSuccess?.();
            handleClose();
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
            onSuccess?.();
            handleClose();
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
    onClose?.();
    if (!isControlled) {
      list('users');
    }
  };

  const { requestClose, handleDialogOpenChange } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

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
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className="w-full min-w-0 max-h-[90vh] max-w-[min(88rem,calc(100vw-2rem))] overflow-x-hidden overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('users.editUser')}</DialogTitle>
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
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('users.editUser') : t('users.createUser')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('users.editDescription') : isEdit ? t('users.editDescription') : t('users.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.user')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <UserForm form={form} initialValues={data?.data} isEdit={isEdit} />
          </Form>
        </div>

        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" onClick={requestClose} type="button" className="gap-2">
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
