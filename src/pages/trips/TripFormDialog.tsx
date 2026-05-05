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
import type { StoreTripRequest, UpdateTripRequest } from '@/types/requests/trip';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { mergeVnAddressIntoPayload } from '@/utils/vnAddressForm';

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

const toNullableNumber = (value: unknown): number | null => {
  if (value === null || value === undefined || value === '') return null;
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
};

const toOptionalNumber = (value: unknown): number | undefined => {
  const numeric = toNullableNumber(value);
  return numeric === null ? undefined : numeric;
};

function buildTripPayload(values: Partial<Trip> & Record<string, unknown>, nextStatus: string): StoreTripRequest {
  const basePrice = Number(values.base_price ?? values.price ?? 0);
  const surchargeAmount = Number(values.surcharge_amount ?? 0);

  const payload: StoreTripRequest = {
    code: String(values.code ?? '').trim(),
    customer_id: Number(values.customer_id),
    contact_name: values.contact_name ? String(values.contact_name) : undefined,
    contact_phone: values.contact_phone ? String(values.contact_phone) : undefined,
    cargo_type_id: toNullableNumber(values.cargo_type_id),
    cargo_description: values.cargo_description ? String(values.cargo_description) : undefined,
    cargo_quantity: toNullableNumber(values.cargo_quantity),
    cargo_unit: values.cargo_unit ? String(values.cargo_unit) : null,
    cargo_weight_ton: toNullableNumber(values.cargo_weight_ton),
    cargo_notes: values.cargo_notes ? String(values.cargo_notes) : undefined,
    driver_id: toOptionalNumber(values.driver_id),
    vehicle_id: toOptionalNumber(values.vehicle_id),
    dispatcher_id: toNullableNumber(values.dispatcher_id),
    assigned_at: values.assigned_at ? String(values.assigned_at) : null,
    route_template_id: toNullableNumber(values.route_template_id),
    origin_location_id: toNullableNumber(values.origin_location_id),
    destination_location_id: toNullableNumber(values.destination_location_id),
    start_point: String(values.start_point ?? '').trim(),
    end_point: String(values.end_point ?? '').trim(),
    received_date: values.received_date ? String(values.received_date) : null,
    scheduled_date: values.scheduled_date ? String(values.scheduled_date) : null,
    scheduled_time_from: values.scheduled_time_from ? String(values.scheduled_time_from) : null,
    scheduled_time_to: values.scheduled_time_to ? String(values.scheduled_time_to) : null,
    distance_km: toOptionalNumber(values.distance_km),
    actual_distance_km: toNullableNumber(values.actual_distance_km),
    start_time: values.start_time ? String(values.start_time) : null,
    end_time: values.end_time ? String(values.end_time) : null,
    actual_pickup_at: values.actual_pickup_at ? String(values.actual_pickup_at) : null,
    actual_delivered_at: values.actual_delivered_at ? String(values.actual_delivered_at) : null,
    base_price: basePrice,
    surcharge_amount: surchargeAmount,
    total_revenue: Number(values.total_revenue ?? basePrice + surchargeAmount),
    payment_method: (values.payment_method as StoreTripRequest['payment_method']) ?? null,
    payment_status: (values.payment_status as StoreTripRequest['payment_status']) ?? undefined,
    status: nextStatus,
    cancellation_reason: values.cancellation_reason ? String(values.cancellation_reason) : null,
    cancelled_at: values.cancelled_at ? String(values.cancelled_at) : null,
    cancelled_by: toNullableNumber(values.cancelled_by),
    internal_notes: values.internal_notes ? String(values.internal_notes) : null,
  };

  return payload;
}

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

  const handleSubmit = (values: Partial<Trip> & Record<string, unknown>) => {
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

    const payloadObject: Record<string, unknown> = { ...values };
    mergeVnAddressIntoPayload(payloadObject, values, 'start_', 'start_point');
    mergeVnAddressIntoPayload(payloadObject, values, 'end_', 'end_point');

    const tripPayload = buildTripPayload(
      payloadObject as Partial<Trip> & Record<string, unknown>,
      nextStatus || String(values.status ?? 'pending'),
    );

    if (!tripPayload.code || !tripPayload.customer_id || !tripPayload.start_point || !tripPayload.end_point) {
      toast.error(t('validation.requiredFieldsMissing'));
      return;
    }

    if (isEdit && resolvedId) {
      const updatePayload: UpdateTripRequest = tripPayload;
      updateItem(
        {
          resource: 'trips',
          id: resolvedId,
          values: updatePayload as Partial<Trip>,
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

            toast.error(getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }));
          },
        },
      );
    } else {
      const createPayload: StoreTripRequest = {
        ...tripPayload,
        status: tripPayload.status || 'pending',
      };
      createItem(
        {
          resource: 'trips',
          values: createPayload as Partial<Trip>,
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

            toast.error(getErrorMessage(error) || t('notifications.createError', { item: t('trips.title') }));
          },
        },
      );
    }
  };

  useEffect(() => {
    if (hasRecordId && data?.data) {
      form.setFieldsValue({
        ...data.data,
        base_price: data.data.base_price ?? data.data.price,
        total_revenue: data.data.total_revenue ?? (data.data.base_price ?? data.data.price) + (data.data.surcharge_amount ?? 0),
      });
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
        <Alert type="info" message={t('formGuides.title')} description={t('formGuides.trip')} showIcon style={{ marginBottom: 16 }} />
        <Form form={form} onFinish={handleSubmit} layout="vertical" validateTrigger={['onBlur', 'onSubmit']} disabled={isViewMode}>
          <TripForm form={form} initialValues={data?.data} mode={isEdit ? 'edit' : 'create'} currentStatus={data?.data?.status} />
        </Form>
      </>
    );

  return (
    <>
      <ResourceFormModal open={dialogOpen} onOpenChange={handleDialogOpenChange} title={title} description={description} footer={footer} width={896}>
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
