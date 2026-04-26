import { Form } from 'antd';
import { useList } from '@refinedev/core';
import {
  FormAccordionSections,
  FormItemNumber,
  FormItemSelect,
  FormItemText,
} from '@/components/form';
import { VnAdminAddressFields } from '@/components/form/vn-admin-address-fields';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Driver, Trip, Vehicle } from '@/types';
import { TERMINAL_TRIP_STATUSES } from '@/utils/tripStatus';

interface TripFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Trip>;
  mode?: 'create' | 'edit';
  currentStatus?: string;
}

/** Trạng thái cho phép chỉnh sửa thủ công trong form (chỉ khi pending). Các trạng thái khác dùng action buttons. */
const EDITABLE_STATUSES = ['pending', 'assigned'];

export function TripForm(props: TripFormProps) {
  const { form, initialValues } = props;
  const { t } = useTranslation();
  const mode = props.mode ?? 'create';
  const normalizedCurrentStatus = (props.currentStatus ?? '').toLowerCase();
  const isTerminal = TERMINAL_TRIP_STATUSES.includes(normalizedCurrentStatus as never);

  const { data: customersData, isLoading: loadingCustomers } = useList<Customer>({
    resource: 'customers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: driversData, isLoading: loadingDrivers } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'available_status', operator: 'eq', value: 'available' }],
    sorters: [{ field: 'id', order: 'desc' }],
  });

  const { data: vehiclesData, isLoading: loadingVehicles } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });

  const customerOptions = (customersData?.data ?? []).map((c) => ({
    label: c.name,
    value: c.id,
  }));

  const driverOptions = (driversData?.data ?? []).map((d) => ({
    label: d.employee ? `${d.employee.code} — ${d.employee.name}` : d.license_no,
    value: d.id,
  }));

  const vehicleOptions = (vehiclesData?.data ?? []).map((v) => ({
    label: `${v.plate_number} (${v.type})`,
    value: v.id,
  }));

  // Trong create, chỉ cho phép tạo với status = pending
  // Trong edit, chỉ hiển thị status field nếu chuyến còn ở giai đoạn EDITABLE_STATUSES
  // Các chuyển đổi nâng cao dùng action buttons ở TripDetailPage
  const showStatusField = mode === 'create' || EDITABLE_STATUSES.includes(normalizedCurrentStatus);

  return (
    <FormAccordionSections
      defaultOpen="basic"
      sections={[
        {
          value: 'basic',
          titleKey: 'basic',
          children: (
            <>
              <FormItemText
                name="code"
                label={t('trips.code')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('trips.code') }) },
                ]}
                placeholder={t('trips.codePlaceholder')}
                disabled={isTerminal}
              />

              <FormItemSelect
                name="customer_id"
                label={t('invoices.customer')}
                required
                options={customerOptions}
                loading={loadingCustomers}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                rules={[
                  { required: true, message: t('validation.required', { field: t('invoices.customer') }) },
                ]}
              />
            </>
          ),
        },
        {
          value: 'assignment',
          titleKey: 'assignment',
          children: (
            <>
              <FormItemSelect
                name="driver_id"
                label={t('drivers.title')}
                required
                options={driverOptions}
                loading={loadingDrivers}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                rules={[
                  { required: true, message: t('validation.required', { field: t('drivers.title') }) },
                ]}
              />

              <FormItemSelect
                name="vehicle_id"
                label={t('vehicles.title')}
                required
                options={vehicleOptions}
                loading={loadingVehicles}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                rules={[
                  { required: true, message: t('validation.required', { field: t('vehicles.title') }) },
                ]}
              />
            </>
          ),
        },
        {
          value: 'operational',
          titleKey: 'operational',
          children: (
            <>
              <VnAdminAddressFields
                form={form}
                fieldPrefix="start_"
                cascadeRequired
                relaxCascadeRequired={Boolean(
                  initialValues?.id && initialValues?.start_point?.trim(),
                )}
                legacySavedAddress={initialValues?.start_point?.trim()}
                heading={t('trips.addressStartHeading')}
                disabled={isTerminal}
              />

              <VnAdminAddressFields
                form={form}
                fieldPrefix="end_"
                cascadeRequired
                relaxCascadeRequired={Boolean(
                  initialValues?.id && initialValues?.end_point?.trim(),
                )}
                legacySavedAddress={initialValues?.end_point?.trim()}
                heading={t('trips.addressEndHeading')}
                disabled={isTerminal}
              />

              <FormItemNumber
                name="distance_km"
                label={t('trips.distance')}
                required
                min={0}
                rules={[
                  { required: true, message: t('validation.required', { field: t('trips.distance') }) },
                ]}
                placeholder={t('trips.distancePlaceholder')}
                disabled={isTerminal}
              />

              <FormItemNumber
                name="price"
                label={t('trips.price')}
                required
                min={0}
                rules={[
                  { required: true, message: t('validation.required', { field: t('trips.price') }) },
                ]}
                placeholder={t('trips.pricePlaceholder')}
                disabled={isTerminal}
              />
            </>
          ),
        },
        ...(showStatusField
          ? [
              {
                value: 'status',
                titleKey: 'status' as const,
                children: (
                  <>
                    <FormItemSelect
                      name="status"
                      label={t('common.status')}
                      required
                      options={[{ label: t('trips.statusPending'), value: 'pending' }]}
                      rules={[
                        { required: true, message: t('validation.required', { field: t('common.status') }) },
                      ]}
                      selectProps={{ disabled: mode === 'edit' }}
                    />

                    <FormItemText
                      name="start_time"
                      label={t('trips.startTime')}
                      type="datetime-local"
                    />

                    <FormItemText
                      name="end_time"
                      label={t('trips.endTime')}
                      type="datetime-local"
                      rules={[
                        {
                          validator: async (_: unknown, value: unknown) => {
                            const start = form.getFieldValue('start_time') as string | undefined;
                            if (!start || !value || String(value) >= String(start)) {
                              return;
                            }
                            throw new Error(t('validation.checkOutAfterCheckIn'));
                          },
                        },
                      ]}
                    />
                  </>
                ),
              },
            ]
          : []),
      ]}
    />
  );
}
