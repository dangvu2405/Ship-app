import { useEffect } from 'react';
import { Alert, Button, Form, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useCreate, useUpdate, useOne } from '@refinedev/core';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ResourceFormModal } from '@/components/common/ResourceFormModal';
import { TripForm } from './TripForm';
import { useTranslation } from '@/hooks/useTranslation';
import { useFormDialogBase } from '@/hooks/useFormDialogBase';
import { useFormDialogCloseGuard } from '@/hooks/useFormDialogCloseGuard';
import { UnsavedChangesWarningDialog } from '@/components/common/UnsavedChangesWarningDialog';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Trip } from '@/types';
import type { StoreTripRequest, UpdateTripRequest } from '@/types/requests/trip';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { mergeVnAddressIntoPayload } from '@/utils/vnAddressForm';
import { tripCreateMinimalSchema } from '@/pages/trips/trip-form.schema';
import { recordAuditIntent } from '@/lib/audit-action';

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
  const rawSurcharges = Array.isArray(values.surcharges) ? values.surcharges : [];
  const surchargeFromList = rawSurcharges.reduce((sum: number, item: unknown) => {
    const amt = Number((item as { amount?: number })?.amount ?? 0);
    return sum + (Number.isFinite(amt) ? amt : 0);
  }, 0);
  const surchargeAmount = surchargeFromList > 0 ? surchargeFromList : Number(values.surcharge_amount ?? 0);
  const tripStops = Array.isArray(values.trip_stops) ? values.trip_stops : undefined;

  const payload: StoreTripRequest = {
    code: String(values.code ?? '').trim() || undefined,
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
    total_revenue: basePrice + surchargeAmount,
    payment_method: (values.payment_method as StoreTripRequest['payment_method']) ?? null,
    payment_status: (values.payment_status as StoreTripRequest['payment_status']) ?? undefined,
    status: nextStatus,
    cancellation_reason: values.cancellation_reason ? String(values.cancellation_reason) : null,
    cancelled_at: values.cancelled_at ? String(values.cancelled_at) : null,
    cancelled_by: toNullableNumber(values.cancelled_by),
    internal_notes: values.internal_notes ? String(values.internal_notes) : null,
  };

  if (tripStops && tripStops.length > 0) {
    (payload as unknown as Record<string, unknown>).trip_stops = tripStops;
  }
  if (rawSurcharges.length > 0) {
    (payload as unknown as Record<string, unknown>).trip_surcharges = rawSurcharges
      .filter((item) => item && (item as { amount?: number }).amount != null && Number((item as { amount?: number }).amount) > 0)
      .map((item) => ({
        label: (item as { label?: string }).label ?? '',
        amount: Number((item as { amount?: number }).amount ?? 0),
        note: (item as { note?: string }).note ?? null,
      }));
  }

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
  const feedback = useAppFeedback();
  const { form, resolvedId, hasRecordId, isViewMode, isEdit, dialogOpen, handleClose } = useFormDialogBase({
    open, mode, recordId, resource: 'trips', onClose,
  });

  const { data, isLoading: isLoadingData } = useOne<Trip>({
    resource: 'trips',
    id: resolvedId || '',
    queryOptions: { enabled: hasRecordId },
  });

  const { mutate: createItem, isLoading: isCreating } = useCreate<Trip>();
  const { mutate: updateItem, isLoading: isUpdating } = useUpdate<Trip>();

  const isLoading = isCreating || isUpdating || (hasRecordId && isLoadingData);

  const { requestClose, handleDialogOpenChange, unsavedChangesWarningProps } = useFormDialogCloseGuard({
    form,
    isViewMode,
    isSubmitting: isLoading,
    onClose: handleClose,
  });

  const handleSubmit = (values: Partial<Trip> & Record<string, unknown>) => {
    if (!isEdit) {
      const zodCheck = tripCreateMinimalSchema.safeParse({
        scheduled_date: values.scheduled_date,
        route_template_id: values.route_template_id,
      });
      if (!zodCheck.success) {
        feedback.error(t('validation.requiredFieldsMissing'));
        return;
      }
    }

    const previousStatus = normalizeTripStatus(data?.data?.status);
    const nextStatus = normalizeTripStatus(values.status ?? data?.data?.status ?? 'pending');

    if (!isEdit && nextStatus !== 'pending' && nextStatus !== 'draft') {
      feedback.error(t('validation.tripStatusCreatePending'));
      return;
    }

    if (isEdit && previousStatus && !canTransitionTripStatus(previousStatus, nextStatus)) {
      feedback.error(t('validation.tripStatusInvalidTransition'));
      return;
    }

    if ((nextStatus === 'in_progress' || nextStatus === 'completed') && !values.start_time) {
      feedback.error(t('validation.required', { field: t('trips.startTime') }));
      return;
    }

    if (nextStatus === 'completed' && !values.end_time) {
      feedback.error(t('validation.required', { field: t('trips.endTime') }));
      return;
    }

    const payloadObject: Record<string, unknown> = { ...values };
    mergeVnAddressIntoPayload(payloadObject, values, 'start_', 'start_point');
    mergeVnAddressIntoPayload(payloadObject, values, 'end_', 'end_point');

    const tripPayload = buildTripPayload(
      payloadObject as Partial<Trip> & Record<string, unknown>,
      nextStatus || String(values.status ?? 'pending'),
    );

    if (!tripPayload.customer_id || !tripPayload.start_point || !tripPayload.end_point) {
      feedback.error(t('validation.requiredFieldsMissing'));
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
            recordAuditIntent({ resource: 'trips', kind: 'update', recordId: resolvedId });
            feedback.success(t('notifications.updateSuccess', { item: t('trips.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            feedback.error(getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }));
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
            recordAuditIntent({ resource: 'trips', kind: 'create' });
            feedback.success(t('notifications.createSuccess', { item: t('trips.title') }));
            onSuccess?.();
            handleClose();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) {
              return;
            }

            feedback.error(getErrorMessage(error) || t('notifications.createError', { item: t('trips.title') }));
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

  const footer = isViewMode ? (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      <span />
    </Space>
  ) : isEdit ? (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button icon={<ArrowLeftOutlined />} onClick={requestClose}>
        {t('common.back')}
      </Button>
      <Button type="primary" onClick={() => form.submit()} loading={isLoading}>
        {t('common.update')}
      </Button>
    </Space>
  ) : (
    <Space style={{ width: '100%', justifyContent: 'space-between' }}>
      <Button onClick={requestClose}>{t('common.cancel')}</Button>
      <Space>
        <Button
          onClick={() => {
            form.setFieldValue('status', 'draft');
            form.submit();
          }}
          loading={isLoading}
        >
          {t('trips.saveDraft')}
        </Button>
        <Button
          type="primary"
          onClick={() => {
            form.setFieldValue('status', 'pending');
            form.submit();
          }}
          loading={isLoading}
        >
          {t('trips.createOrder')}
        </Button>
      </Space>
    </Space>
  );

  const body =
    hasRecordId && isLoadingData ? (
      <TableSkeleton rows={8} columns={1} />
    ) : (
      <>
        <Alert type="info" message={t('formGuides.title')} description={t('formGuides.trip')} showIcon style={{ marginBottom: 16 }} />
        <Form name="trip-form" form={form} onFinish={handleSubmit} layout="vertical" validateTrigger={['onBlur', 'onSubmit']} disabled={isViewMode}>
          <TripForm
            form={form}
            initialValues={data?.data}
            mode={isEdit ? 'edit' : 'create'}
            currentStatus={data?.data?.status}
            readOnly={isViewMode}
          />
        </Form>
      </>
    );

  return (
    <>
      <ResourceFormModal open={dialogOpen} onOpenChange={handleDialogOpenChange} title={title} description={description} footer={footer} width="min(56rem, calc(100vw - 2rem))">
        {body}
      </ResourceFormModal>
      <UnsavedChangesWarningDialog {...unsavedChangesWarningProps} />
    </>
  );
}
