import { useEffect, useState } from 'react';
import { Form } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useNavigation, useOne, useUpdate } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  getFormDialogContentClassName,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { RoleForm, type RoleFormValues } from './RoleForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
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
  const [permissionOptions, setPermissionOptions] = useState<{ label: string; value: number }[]>([]);
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

    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'roles', id: resolvedId, values: roleFields },
        {
          onSuccess: async () => {
            try {
              await syncRolePermissions(resolvedId, permission_ids);
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
              await syncRolePermissions(newId, permission_ids);
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

  if (hasRecordId && isLoadingData) {
    return (
      <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={getFormDialogContentClassName('default')}>
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('roles.editRole')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={4} columns={1} />
        </DialogContent>
      </Dialog>
        <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
      </>
    );
  }

  return (
    <>
    <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
      <DialogContent className={getFormDialogContentClassName('wide', 'p-0 rounded-2xl')}>
        <DialogHeader className="px-6 pt-6">
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('roles.editRole') : t('roles.createRole')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('roles.editDescription') : isEdit ? t('roles.editDescription') : t('roles.createDescription')}</DialogDescription>
        </DialogHeader>
        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.role')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            initialValues={{ permission_ids: [] }}
            disabled={isViewMode}
          >
            <RoleForm permissionOptions={permissionOptions} permissionsLoading={permissionsLoading} />
          </Form>
        </div>
        <DialogFooter className="mx-0 mb-0 border-t px-6 py-4">
          <Button variant="outline" type="button" onClick={requestClose} className="gap-2">
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
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
