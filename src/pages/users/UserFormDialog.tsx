import { useEffect } from 'react';
import { Alert, App, Button, Form, Space, Tabs } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useOne } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { UserForm } from './UserForm';
import { UserPermissionsTab } from './UserPermissionsTab';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';

import type { User } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface UserFormValues {
  username: string;
  email: string;
  password?: string;
  password_confirmation?: string;
  status: string;
  employee_id?: number;
  role_ids?: number[];
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  residential_address?: string;
  avatar?: UploadFile[];
}

const uploadDoneListForAvatar = (url: string | undefined): UploadFile[] => {
  if (!url?.trim()) {
    return [];
  }
  const name = url.trim().split('/').pop() || 'avatar';
  return [{ uid: '-avatar', name, status: 'done', url: url.trim() }];
};

const avatarUrlFromFormFiles = (files?: UploadFile[]): string | null => {
  if (!files?.length) {
    return null;
  }
  const f = files[0];
  const fromResponse = f.response as { data?: { url?: string } } | undefined;
  const url = fromResponse?.data?.url ?? f.url;
  if (typeof url === 'string' && url.trim()) {
    return url.trim();
  }
  return null;
};

const trimOrUndefined = (value: unknown): string | undefined => {
  if (value == null) {
    return undefined;
  }
  const s = String(value).trim();
  return s === '' ? undefined : s;
};

const buildPayload = (values: UserFormValues, isEdit: boolean): Record<string, unknown> => {
  const payload: Record<string, unknown> = {
    username: String(values.username).trim(),
    email: String(values.email).trim(),
    status: values.status,
    employee_id: values.employee_id,
    role_ids: values.role_ids ?? [],
  };

  payload.emergency_contact_name = trimOrUndefined(values.emergency_contact_name) ?? null;
  payload.emergency_contact_phone = trimOrUndefined(values.emergency_contact_phone) ?? null;
  payload.residential_address = trimOrUndefined(values.residential_address) ?? null;
  payload.avatar_url = avatarUrlFromFormFiles(values.avatar);

  if (!isEdit && values.password?.trim()) {
    payload.password = values.password.trim();
    payload.password_confirmation = values.password_confirmation?.trim() ?? '';
  }

  if (isEdit && values.password?.trim()) {
    payload.password = values.password.trim();
    payload.password_confirmation = values.password_confirmation?.trim() ?? '';
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
  const { message } = App.useApp();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'users', onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<User>({
    resource: 'users',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<User>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<User>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

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
            message.success(t('notifications.updateSuccess', { item: t('users.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            message.error(
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
            message.success(t('notifications.createSuccess', { item: t('users.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            message.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('users.title') })
            );
          },
        }
      );
    }
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
      emergency_contact_name: data.data.emergency_contact_name,
      emergency_contact_phone: data.data.emergency_contact_phone,
      residential_address: data.data.residential_address,
      avatar: uploadDoneListForAvatar(data.data.avatar_url),
      password: undefined,
      password_confirmation: undefined,
    });
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('users.editUser') : t('users.createUser');
  const description = isViewMode
    ? t('users.editDescription')
    : isEdit
      ? t('users.editDescription')
      : t('users.createDescription');

  const footer = (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      {!isViewMode ? (
        <Button type="primary" onClick={() => form.submit()} loading={isLoading}>
          {isEdit ? t('common.update') : t('common.create')}
        </Button>
      ) : (
        <span />
      )}
    </Space>
  );

  const isAdminUser = (data?.data?.roles ?? []).some((role) => {
    const code = (role as { code?: string }).code ?? role.name?.toLowerCase();
    return code === 'admin' || code === 'super_admin' || code === 'admin_company';
  });

  const formContent = (
    <>
      <Alert
        type="info"
        message={t('formGuides.title')}
        description={t('formGuides.user')}
        showIcon
        style={{ marginBottom: 16 }}
      />
      <Form
        form={form}
        name="user-form"
        onFinish={handleSubmit}
        layout="vertical"
        validateTrigger={['onBlur', 'onSubmit']}
        disabled={isViewMode}
      >
        <UserForm form={form} initialValues={data?.data} isEdit={isEdit} />
      </Form>
    </>
  );

  const body =
    hasRecordId && isLoadingData ? (
      <TableSkeleton rows={8} columns={1} />
    ) : (
      <Tabs
        defaultActiveKey="info"
        items={[
          { key: 'info', label: 'Thông tin', children: formContent },
          {
            key: 'permissions',
            label: 'Phân quyền',
            children:
              isEdit && resolvedId ? (
                <UserPermissionsTab userId={Number(resolvedId)} isAdmin={isAdminUser} />
              ) : (
                <Alert
                  type="info"
                  showIcon
                  message="Lưu người dùng trước"
                  description="Bạn có thể quản lý quyền sau khi tạo người dùng và lưu lại."
                />
              ),
          },
        ]}
      />
    );

  return (
    <>
      <ResourceFormModal
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={title}
        description={description}
        footer={footer}
        width="min(72rem, calc(100vw - 2rem))"
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
