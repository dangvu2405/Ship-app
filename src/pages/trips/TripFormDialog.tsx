import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useLocation, useParams } from 'react-router-dom';
import { useCreate, useUpdate, useOne, useNavigation } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { TripForm } from './TripForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
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

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue(data.data);
    }
  }, [hasRecordId, data?.data, form]);

  const title = isViewMode ? t('common.view') : isEdit ? t('trips.editTrip') : t('trips.createTrip');
  const description = isViewMode ? t('trips.editDescription') : isEdit ? t('trips.editDescription') : t('trips.createDescription');

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
      <TableSkeleton rows={8} columns={1} />
    ) : (
      <>
        <Alert
          type="info"
          message={t('formGuides.title')}
          description={t('formGuides.trip')}
          showIcon
          style={{ marginBottom: 16 }}
        />
        <Form
          form={form}
          onFinish={handleSubmit}
          layout="vertical"
          validateTrigger={['onBlur', 'onSubmit']}
          disabled={isViewMode}
        >
          <TripForm
            form={form}
            initialValues={data?.data}
            mode={isEdit ? 'edit' : 'create'}
            currentStatus={data?.data?.status}
          />
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
