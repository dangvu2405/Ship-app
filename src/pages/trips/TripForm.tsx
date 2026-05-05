import { Form } from 'antd';
import { useList } from '@refinedev/core';
import {
  FormAccordionSections,
  FormItemNumber,
  FormItemSelect,
  FormItemText,
  FormItemTextArea,
} from '@/components/form';
import { VnAdminAddressFields } from '@/components/form/vn-admin-address-fields';
import { useTranslation } from '@/hooks/useTranslation';
import type { CargoType, Customer, Driver, Location, RouteTemplate, Trip, Vehicle, VehicleTypeCatalog } from '@/types';
import { TERMINAL_TRIP_STATUSES } from '@/utils/tripStatus';

interface TripFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Trip>;
  mode?: 'create' | 'edit';
  currentStatus?: string;
}

const EDITABLE_STATUSES = ['pending', 'assigned'];
const PAYMENT_METHODS = [
  { label: 'Chuyển khoản', value: 'bank_transfer' },
  { label: 'Tiền mặt', value: 'cash' },
  { label: 'Công nợ', value: 'credit' },
];

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

  const { data: cargoTypesData, isLoading: loadingCargoTypes } = useList<CargoType>({
    resource: 'cargo_types',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: routeTemplatesData, isLoading: loadingRoutes } = useList<RouteTemplate>({
    resource: 'route_templates',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: locationsData, isLoading: loadingLocations } = useList<Location>({
    resource: 'locations',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: vehicleTypesData, isLoading: loadingVehicleTypes } = useList<VehicleTypeCatalog>({
    resource: 'vehicle_types',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'sort_order', order: 'asc' }, { field: 'name', order: 'asc' }],
  });

  const customerOptions = (customersData?.data ?? []).map((c) => ({
    label: `${c.code ? `${c.code} — ` : ''}${c.name}`,
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

  const cargoTypeOptions = (cargoTypesData?.data ?? []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const routeTemplateOptions = (routeTemplatesData?.data ?? []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

  const locationOptions = (locationsData?.data ?? []).map((item) => ({
    label: `${item.name} — ${item.address}`,
    value: item.id,
  }));

  const vehicleTypeOptions = (vehicleTypesData?.data ?? []).map((item) => ({
    label: item.name,
    value: item.id,
  }));

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
                rules={[{ required: true, message: t('validation.required', { field: t('trips.code') }) }]}
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
                rules={[{ required: true, message: t('validation.required', { field: t('invoices.customer') }) }]}
              />

              <FormItemText name="contact_name" label={t('common.contactName')} placeholder={t('common.contactName')} disabled={isTerminal} />
              <FormItemText name="contact_phone" label={t('common.phone')} placeholder={t('common.phone')} disabled={isTerminal} />
              <FormItemText name="received_date" label={t('trips.receivedDate')} type="date" disabled={isTerminal} />
              <FormItemText name="scheduled_date" label={t('trips.scheduledDate')} type="date" disabled={isTerminal} />
            </>
          ),
        },
        {
          value: 'cargo',
          titleKey: 'cargo',
          children: (
            <>
              <FormItemSelect
                name="cargo_type_id"
                label={t('trips.cargoType')}
                options={cargoTypeOptions}
                loading={loadingCargoTypes}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
              />
              <FormItemTextArea name="cargo_description" label={t('trips.cargoDescription')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
              <FormItemNumber name="cargo_quantity" label={t('trips.cargoQuantity')} min={0} disabled={isTerminal} />
              <FormItemText name="cargo_unit" label={t('trips.cargoUnit')} placeholder={t('trips.cargoUnit')} disabled={isTerminal} />
              <FormItemNumber name="cargo_weight_ton" label={t('trips.cargoWeightTon')} min={0} step={0.01} disabled={isTerminal} />
              <FormItemTextArea name="cargo_notes" label={t('trips.cargoNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
            </>
          ),
        },
        {
          value: 'route',
          titleKey: 'route',
          children: (
            <>
              <FormItemSelect
                name="route_template_id"
                label={t('trips.routeTemplate')}
                options={routeTemplateOptions}
                loading={loadingRoutes}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
              />

              <FormItemSelect
                name="origin_location_id"
                label={t('trips.originLocation')}
                options={locationOptions}
                loading={loadingLocations}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
              />

              <FormItemSelect
                name="destination_location_id"
                label={t('trips.destinationLocation')}
                options={locationOptions}
                loading={loadingLocations}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
              />

              <VnAdminAddressFields
                form={form}
                fieldPrefix="start_"
                cascadeRequired
                relaxCascadeRequired={Boolean(initialValues?.id && initialValues?.start_point?.trim())}
                legacySavedAddress={initialValues?.start_point?.trim()}
                heading={t('trips.addressStartHeading')}
                disabled={isTerminal}
              />

              <VnAdminAddressFields
                form={form}
                fieldPrefix="end_"
                cascadeRequired
                relaxCascadeRequired={Boolean(initialValues?.id && initialValues?.end_point?.trim())}
                legacySavedAddress={initialValues?.end_point?.trim()}
                heading={t('trips.addressEndHeading')}
                disabled={isTerminal}
              />

              <FormItemText name="scheduled_time_from" label={t('trips.scheduledTimeFrom')} type="time" disabled={isTerminal} />
              <FormItemText name="scheduled_time_to" label={t('trips.scheduledTimeTo')} type="time" disabled={isTerminal} />
              <FormItemNumber name="distance_km" label={t('trips.distance')} required min={0} rules={[{ required: true, message: t('validation.required', { field: t('trips.distance') }) }]} placeholder={t('trips.distancePlaceholder')} disabled={isTerminal} />
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
                rules={[{ required: true, message: t('validation.required', { field: t('drivers.title') }) }]}
              />

              <FormItemSelect
                name="vehicle_id"
                label={t('vehicles.title')}
                required
                options={vehicleOptions}
                loading={loadingVehicles}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                rules={[{ required: true, message: t('validation.required', { field: t('vehicles.title') }) }]}
              />

              <FormItemSelect
                name="vehicle_type_id"
                label={t('vehicles.type')}
                options={vehicleTypeOptions}
                loading={loadingVehicleTypes}
                showSearch
                selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
              />

              <FormItemText name="dispatcher_id" label={t('trips.dispatcherId')} placeholder={t('trips.dispatcherId')} disabled={isTerminal} />
              <FormItemText name="assigned_at" label={t('trips.assignedAt')} type="datetime-local" disabled={isTerminal} />
            </>
          ),
        },
        {
          value: 'revenue',
          titleKey: 'revenue',
          children: (
            <>
              <FormItemNumber name="base_price" label={t('trips.basePrice')} required min={0} rules={[{ required: true, message: t('validation.required', { field: t('trips.basePrice') }) }]} placeholder={t('trips.basePricePlaceholder')} disabled={isTerminal} />
              <FormItemNumber name="surcharge_amount" label={t('trips.surchargeAmount')} min={0} placeholder={t('trips.surchargeAmountPlaceholder')} disabled={isTerminal} />
              <FormItemNumber name="total_revenue" label={t('trips.totalRevenue')} min={0} placeholder={t('trips.totalRevenuePlaceholder')} disabled={isTerminal} />
              <FormItemSelect name="payment_method" label={t('trips.paymentMethod')} options={PAYMENT_METHODS} selectProps={{ disabled: isTerminal }} />
              <FormItemSelect name="payment_status" label={t('trips.paymentStatus')} options={[{ label: t('trips.statusUnpaid'), value: 'unpaid' }, { label: t('trips.statusInvoiced'), value: 'invoiced' }, { label: t('trips.statusPaid'), value: 'paid' }]} selectProps={{ disabled: isTerminal }} />
              <FormItemTextArea name="internal_notes" label={t('trips.internalNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
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
                      rules={[{ required: true, message: t('validation.required', { field: t('common.status') }) }]}
                      selectProps={{ disabled: mode === 'edit' }}
                    />

                    <FormItemText name="start_time" label={t('trips.startTime')} type="datetime-local" />

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
