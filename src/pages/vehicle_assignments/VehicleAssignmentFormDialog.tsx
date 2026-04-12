import { useEffect } from 'react';
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
import { VehicleAssignmentForm } from './VehicleAssignmentForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import ArrowLeftIcon from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { VehicleAssignment } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

interface VehicleAssignmentFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function VehicleAssignmentFormDialog({ open, mode, recordId, onClose, onSuccess }: VehicleAssignmentFormDialogProps = {}) {
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

  const { data, isLoading: isLoadingData } = useOne<VehicleAssignment>({
    resource: 'vehicle_assignments',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<VehicleAssignment>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<VehicleAssignment>();
  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('vehicle_assignments');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<VehicleAssignment>) => {
    if (isEdit && resolvedId) {
      updateItem(
        { resource: 'vehicle_assignments', id: resolvedId, values },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('vehicleAssignments.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('vehicleAssignments.title') }));
          },
        }
      );
    } else {
      createItem(
        { resource: 'vehicle_assignments', values },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('vehicleAssignments.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('vehicleAssignments.title') }));
          },
        }
      );
    }
  };

  useEffect(() => {
    if (!hasRecordId || !data?.data) {
      return;
    }

    const d = data.data;
    form.setFieldsValue({
      ...d,
      from_date: d.from_date?.slice(0, 10),
      to_date: d.to_date?.slice(0, 10) ?? undefined,
    });
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={getFormDialogContentClassName('wide')}>
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('vehicleAssignments.editAssignment')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={5} columns={1} />
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
          <DialogTitle>{isViewMode ? t('common.view') : isEdit ? t('vehicleAssignments.editAssignment') : t('vehicleAssignments.createAssignment')}</DialogTitle>
          <DialogDescription>{isViewMode ? t('vehicleAssignments.editDescription') : isEdit ? t('vehicleAssignments.editDescription') : t('vehicleAssignments.createDescription')}</DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.vehicleAssignment')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <VehicleAssignmentForm form={form} initialValues={data?.data} />
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
