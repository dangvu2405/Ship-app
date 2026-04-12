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
  getFormDialogContentClassName,
} from '@/components/ui/dialog';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { TripForm } from './TripForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import ArrowLeft from 'lucide-react/dist/esm/icons/arrow-left';
import toast from 'react-hot-toast';
import type { Trip } from '@/types';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

const normalizeTripStatus = (status?: string): string => {
  if (!status) return '';
  return status.toLowerCase() === 'canceled' ? 'cancelled' : status.toLowerCase();
};

const canTransitionTripStatus = (fromStatus: string, toStatus: string): boolean => {
  if (fromStatus === toStatus) return true;

  if (fromStatus === 'pending') {
    return toStatus === 'in_progress' || toStatus === 'cancelled';
  }

  if (fromStatus === 'in_progress') {
    return toStatus === 'completed' || toStatus === 'cancelled';
  }

  if (fromStatus === 'completed' || fromStatus === 'cancelled') {
    return false;
  }

  return true;
};

interface TripFormDialogProps {
  open?: boolean;
  mode?: 'create' | 'edit' | 'show';
  recordId?: number;
  onClose?: () => void;
  onSuccess?: () => void;
}

export function TripFormDialog({ open, mode, recordId, onClose, onSuccess }: TripFormDialogProps = {}) {
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

  const { data, isLoading: isLoadingData } = useOne<Trip>({
    resource: 'trips',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Trip>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Trip>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const handleSubmit = (values: Partial<Trip>) => {
    const previousStatus = normalizeTripStatus(data?.data?.status);
    const nextStatus = normalizeTripStatus(values.status ?? data?.data?.status ?? 'pending');

    if (!isEdit && nextStatus !== 'pending') {
      toast.error(t('validation.tripStatusCreatePending'));
      return;
    }

    if (isEdit && previousStatus && !canTransitionTripStatus(previousStatus, nextStatus)) {
      toast.error(t('validation.tripStatusInvalidTransition'));
      return;
    }

    if ((nextStatus === 'in_progress' || nextStatus === 'completed') && !values.start_time) {
      toast.error(t('validation.required', { field: t('trips.startTime') }));
      return;
    }

    if (nextStatus === 'completed' && !values.end_time) {
      toast.error(t('validation.required', { field: t('trips.endTime') }));
      return;
    }

    const payload = {
      ...values,
      status: nextStatus || values.status,
    };

    if (isEdit && resolvedId) {
      updateItem(
        {
          resource: 'trips',
          id: resolvedId,
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') })
            );
          },
        }
      );
    } else {
      createItem(
        {
          resource: 'trips',
          values: payload,
        },
        {
          onSuccess: () => {
            toast.success(t('notifications.createSuccess', { item: t('trips.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            toast.error(
              getErrorMessage(error) || t('notifications.createError', { item: t('trips.title') })
            );
          },
        }
      );
    }
  };

  const handleClose = () => {
    onClose?.();
    if (!isControlled) {
      list('trips');
    }
  };

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  if (hasRecordId && isLoadingData) {
    return (
      <>
      <Dialog open={dialogOpen} onOpenChange={handleDialogOpenChange}>
        <DialogContent className={getFormDialogContentClassName('wide')}>
          <DialogHeader>
            <DialogTitle>{isViewMode ? t('common.view') : t('trips.editTrip')}</DialogTitle>
          </DialogHeader>
          <TableSkeleton rows={8} columns={1} />
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
          <DialogTitle>
            {isViewMode ? t('common.view') : isEdit ? t('trips.editTrip') : t('trips.createTrip')}
          </DialogTitle>
          <DialogDescription>
            {isViewMode ? t('trips.editDescription') : isEdit ? t('trips.editDescription') : t('trips.createDescription')}
          </DialogDescription>
        </DialogHeader>

        <div className="px-6 pb-6 space-y-4">
          <Alert>
            <AlertTitle>{t('formGuides.title')}</AlertTitle>
            <AlertDescription>{t('formGuides.trip')}</AlertDescription>
          </Alert>

          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            validateTrigger={["onBlur", "onSubmit"]}
            disabled={isViewMode}
          >
            <TripForm
              form={form}
              initialValues={data?.data}
              mode={isEdit ? 'edit' : 'create'}
              currentStatus={data?.data?.status}
            />
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
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
