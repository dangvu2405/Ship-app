import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Driver, Trip, Vehicle } from '@/types';

interface TripFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Trip>;
  mode?: 'create' | 'edit';
  currentStatus?: string;
}

export function TripForm(props: TripFormProps) {
  const { form } = props;
  const { t } = useTranslation();
  const mode = props.mode ?? 'create';
  const normalizedCurrentStatus = (props.currentStatus ?? '').toLowerCase();

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

  const allStatusOptions = [
    { label: t('trips.statusPending'), value: 'pending' },
    { label: t('trips.statusInProgress'), value: 'in_progress' },
    { label: t('trips.statusCompleted'), value: 'completed' },
    { label: t('trips.statusCancelled'), value: 'cancelled' },
  ];

  const statusOptions = (() => {
    if (mode === 'create') {
      return allStatusOptions.filter((s) => s.value === 'pending');
    }

    switch (normalizedCurrentStatus) {
      case 'pending':
        return allStatusOptions.filter((s) =>
          ['pending', 'in_progress', 'cancelled'].includes(s.value)
        );
      case 'in_progress':
        return allStatusOptions.filter((s) =>
          ['in_progress', 'completed', 'cancelled'].includes(s.value)
        );
      case 'completed':
        return allStatusOptions.filter((s) => s.value === 'completed');
      case 'cancelled':
      case 'canceled':
        return allStatusOptions.filter((s) => s.value === 'cancelled');
      default:
        return allStatusOptions;
    }
  })();

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
              />

              <FormItemSelect
                name="customer_id"
                label={t('invoices.customer')}
                required
                options={customerOptions}
                loading={loadingCustomers}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
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
                selectProps={{ optionFilterProp: 'label' }}
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
                selectProps={{ optionFilterProp: 'label' }}
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
              <FormItemText
                name="start_point"
                label={t('trips.startPoint')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('trips.startPoint') }) },
                ]}
                placeholder={t('trips.startPointPlaceholder')}
              />

              <FormItemText
                name="end_point"
                label={t('trips.endPoint')}
                required
                rules={[
                  { required: true, message: t('validation.required', { field: t('trips.endPoint') }) },
                ]}
                placeholder={t('trips.endPointPlaceholder')}
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
              />
            </>
          ),
        },
        {
          value: 'status',
          titleKey: 'status',
          children: (
            <>
              <FormItemSelect
                name="status"
                label={t('common.status')}
                required
                options={statusOptions}
                rules={[
                  { required: true, message: t('validation.required', { field: t('common.status') }) },
                ]}
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
                    validator: (_, value) => {
                      const start = form.getFieldValue('start_time');
                      if (!start || !value || value >= start) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('validation.checkOutAfterCheckIn')));
                    },
                  },
                ]}
              />
            </>
          ),
        },
      ]}
    />
  );
}
