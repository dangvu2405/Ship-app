import { useEffect, useState } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { RoleForm, type RoleFormValues } from './RoleForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import toast from 'react-hot-toast';
import type { Role } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { fetchPermissionsPage } from '@/services/permissions.service';
import { syncRolePermissions } from '@/services/roles.service';

interface RoleFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function RoleFormDialog({ open, mode, recordId, onClose, onSuccess }: RoleFormDialogProps = {}) {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const location = useLocation();
  const { list } = useNavigation();
  const [form] = Form.useForm<RoleFormValues>();
  const isControlled = typeof open === 'boolean';
  const resolvedId = recordId ?? (id ? Number(id) : undefined);
  const hasRecordId = !!resolvedId;
  const isViewMode = mode ? mode === 'show' : location.pathname.includes('/show/');
  const isEdit = hasRecordId && !isViewMode;
  const dialogOpen = isControlled ? open : true;
  const [permissionOptions, setPermissionOptions] = useState<{ label: string; value: number; code: string }[]>([]);
  const [permissionsLoading, setPermissionsLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    fetchPermissionsPage(1, 100)
      .then((rows) => {
        if (!cancelled) {
          setPermissionOptions(
            rows.map((p) => ({
              label: [p.code, p.name].filter(Boolean).join(' — ') || String(p.id),
              value: p.id,
              code: p.code ?? String(p.id),
            }))
          );
        }
      })
      .finally(() => {
        if (!cancelled) setPermissionsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const { data, isLoading: isLoadingData } = useOne<Role>({
    resource: 'roles',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Role>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Role>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('roles');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: RoleFormValues) => {
    const { permission_ids = [], name, description } = values;
    const roleFields = { name, description };
    const selectedPermissionCodes = permission_ids
      .map((id) => permissionOptions.find((opt) => opt.value === id)?.code)
      .filter((code): code is string => Boolean(code));

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'roles', id: resolvedId, values: roleFields },
        {
          onSuccess: async () => {
            try {
              await syncRolePermissions(resolvedId, selectedPermissionCodes);
            } catch (error) {
              toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('roles.permissions') }));
              return;
            }
            toast.success(t('notifications.updateSuccess', { item: t('roles.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('roles.title') }));
          },
        }
      );
      return;
    }

    createItem(
      { resource: 'roles', values: roleFields },
      {
        onSuccess: async (res) => {
          const newId = res?.data?.id;
          if (newId != null) {
            try {
              await syncRolePermissions(newId, selectedPermissionCodes);
            } catch (error) {
              toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('roles.permissions') }));
              return;
            }
          }
          toast.success(t('notifications.createSuccess', { item: t('roles.title') }));
          onSuccess?.();
          handleClose();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('roles.title') }));
        },
      }
    );
  };

  useEffect(() => {
    if (!hasRecordId || !data?.data) {
      return;
    }

    const r = data.data;
    form.setFieldsValue({
      name: r.name,
      description: r.description,
      permission_ids: r.permissions?.map((p) => p.id) ?? [],
    });
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('roles.editRole') : t('roles.createRole');
  const description = isViewMode
    ? t('roles.editDescription')
    : isEdit
      ? t('roles.editDescription')
      : t('roles.createDescription');

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

  const body =
    hasRecordId && isLoadingData ? (
      <TableSkeleton rows={4} columns={1} />
    ) : (
      <>
        <Alert
          type="info"
          message={t('formGuides.title')}
          description={t('formGuides.role')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          initialValues={{ permission_ids: [] }}
          disabled={isViewMode}
        >
          <RoleForm permissionOptions={permissionOptions} permissionsLoading={permissionsLoading} />
        </Form>
      </>
    );

  return (
    <>
      <ResourceFormModal
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
        title={title}
        description={description}
        footer={footer}
        width={896}
      >
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
