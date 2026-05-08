import { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Form, Space, Tabs } from 'antd';
import type { FormInstance } from 'antd';
import { CalculatorOutlined } from '@ant-design/icons';
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
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { CargoType, Customer, Driver, Location, RouteTemplate, Trip, Vehicle, VehicleTypeCatalog } from '@/types';
import { TERMINAL_TRIP_STATUSES } from '@/utils/tripStatus';
import tripService from '@/services/trip.service';
import { TripStopsList } from './components/TripStopsList';
import { TripSurchargesList } from './components/TripSurchargesList';

interface TripFormProps {
  form: FormInstance;
  initialValues?: Partial<Trip>;
  mode?: 'create' | 'edit';
  currentStatus?: string;
  readOnly?: boolean;
}

type TripFormStep = 'info' | 'route' | 'revenue';
const STEP_ORDER: TripFormStep[] = ['info', 'route', 'revenue'];

const PAYMENT_METHODS = [
  { label: 'Chuyển khoản', value: 'bank_transfer' },
  { label: 'Tiền mặt', value: 'cash' },
  { label: 'Công nợ', value: 'credit' },
];

const normalizeTripStatus = (status?: string) => {
  if (!status) return '';
  return status.toLowerCase() === 'canceled' ? 'cancelled' : status.toLowerCase();
};

const getStepFieldNames = (hasRecord: boolean) => ({
  info: ['code', 'customer_id', 'contact_name', 'contact_phone', 'received_date', 'scheduled_date', 'cargo_type_id', 'cargo_description', 'cargo_quantity', 'cargo_unit', 'cargo_weight_ton', 'cargo_notes'],
  route: ['route_template_id', 'origin_location_id', 'destination_location_id', 'start_addr_province_code', 'start_addr_district_code', 'start_addr_ward_code', 'start_addr_street_detail', 'end_addr_province_code', 'end_addr_district_code', 'end_addr_ward_code', 'end_addr_street_detail', 'scheduled_time_from', 'scheduled_time_to', 'distance_km', 'driver_id', 'vehicle_id', 'vehicle_type_id', 'dispatcher_id', 'assigned_at'],
  revenue: hasRecord
    ? ['base_price', 'surcharge_amount', 'total_revenue', 'payment_method', 'payment_status', 'internal_notes', 'status', 'start_time', 'end_time']
    : ['base_price', 'surcharge_amount', 'total_revenue', 'payment_method', 'payment_status', 'internal_notes'],
});

export function TripForm({
  form,
  initialValues,
  mode = 'create',
  currentStatus,
  readOnly = false,
}: TripFormProps) {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const normalizedCurrentStatus = normalizeTripStatus(currentStatus);
  const isTerminal = TERMINAL_TRIP_STATUSES.includes(normalizedCurrentStatus as never);
  const hasRecord = Boolean(initialValues?.id);
  const showStatusField = hasRecord;
  const [activeStep, setActiveStep] = useState<TripFormStep>('info');
  const basePrice = Form.useWatch('base_price', form);
  const surcharges: Array<{ label?: string; amount?: number; note?: string }> = Form.useWatch('surcharges', form) ?? [];
  const [pricingLoading, setPricingLoading] = useState(false);

  useEffect(() => {
    setActiveStep('info');
  }, [initialValues?.id, mode]);

  const surchargeTotal = useMemo(() => {
    if (!Array.isArray(surcharges) || surcharges.length === 0) return 0;
    return surcharges.reduce((sum, item) => {
      const n = Number(item?.amount ?? 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [surcharges]);

  useEffect(() => {
    const base = Number(basePrice ?? 0);
    const surchargeFromList = surchargeTotal;
    const surchargeField = form.getFieldValue('surcharge_amount');
    const surchargeManual = Number(surchargeField ?? 0);
    const surcharge = surchargeFromList > 0 ? surchargeFromList : (Number.isFinite(surchargeManual) ? surchargeManual : 0);
    if (surchargeFromList > 0) {
      form.setFieldValue('surcharge_amount', surchargeFromList);
    }
    const total = (Number.isFinite(base) ? base : 0) + surcharge;
    form.setFieldValue('total_revenue', total);
  }, [basePrice, surchargeTotal, form]);

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

  const customerOptions = useMemo(
    () => (customersData?.data ?? []).map((customer) => ({
      label: `${customer.code ? `${customer.code} — ` : ''}${customer.name}`,
      value: customer.id,
    })),
    [customersData?.data],
  );

  const driverOptions = useMemo(
    () => (driversData?.data ?? []).map((driver) => ({
      label: driver.employee ? `${driver.employee.code} — ${driver.employee.name}` : driver.license_no || `#${driver.id}`,
      value: driver.id,
    })),
    [driversData?.data],
  );

  const vehicleOptions = useMemo(
    () => (vehiclesData?.data ?? []).map((vehicle) => ({
      label: `${vehicle.plate_number} (${vehicle.type})`,
      value: vehicle.id,
    })),
    [vehiclesData?.data],
  );

  const cargoTypeOptions = useMemo(
    () => (cargoTypesData?.data ?? []).map((item) => ({ label: item.name, value: item.id })),
    [cargoTypesData?.data],
  );

  const routeTemplateOptions = useMemo(
    () => (routeTemplatesData?.data ?? []).map((item) => ({ label: item.name, value: item.id })),
    [routeTemplatesData?.data],
  );

  const locationOptions = useMemo(
    () => (locationsData?.data ?? []).map((item) => ({ label: `${item.name} — ${item.address}`, value: item.id })),
    [locationsData?.data],
  );

  const vehicleTypeOptions = useMemo(
    () => (vehicleTypesData?.data ?? []).map((item) => ({ label: item.name, value: item.id })),
    [vehicleTypesData?.data],
  );

  const stepFieldNames = getStepFieldNames(hasRecord);

  const handlePriceLookup = async () => {
    const values = form.getFieldsValue([
      'customer_id',
      'route_template_id',
      'vehicle_id',
      'vehicle_type_id',
      'distance_km',
      'cargo_type_id',
      'cargo_weight_ton',
    ]);
    if (!values.customer_id || !values.route_template_id) {
      feedback.error('Vui lòng chọn khách hàng và tuyến đường để tính giá');
      return;
    }
    setPricingLoading(true);
    try {
      const res = await tripService.priceLookup({
        customer_id: values.customer_id,
        route_template_id: values.route_template_id,
        vehicle_id: values.vehicle_id,
        vehicle_type_id: values.vehicle_type_id,
        distance_km: values.distance_km ? Number(values.distance_km) : undefined,
        cargo_type_id: values.cargo_type_id,
        cargo_weight_ton: values.cargo_weight_ton ? Number(values.cargo_weight_ton) : undefined,
      });
      const suggested = res?.data?.base_price ?? res?.data?.suggested_price ?? res?.data?.price;
      if (res?.success && typeof suggested === 'number') {
        form.setFieldValue('base_price', suggested);
        feedback.success('Đã tính giá theo bảng giá khách hàng');
      } else {
        feedback.info('Không tìm thấy giá phù hợp, vui lòng nhập tay');
      }
    } catch {
      feedback.error('Không tính được giá. Hãy nhập tay.');
    } finally {
      setPricingLoading(false);
    }
  };

  const validateStepAndAdvance = async (currentStep: TripFormStep, nextStep: TripFormStep) => {
    if (readOnly) {
      setActiveStep(nextStep);
      return;
    }

    try {
      await form.validateFields(stepFieldNames[currentStep]);
      setActiveStep(nextStep);
    } catch {
      // Keep the current step open until the required fields pass validation.
    }
  };

  const handleStepChange = async (targetStep: TripFormStep) => {
    if (readOnly) {
      setActiveStep(targetStep);
      return;
    }

    if (targetStep === activeStep) {
      return;
    }

    const currentIndex = STEP_ORDER.indexOf(activeStep);
    const targetIndex = STEP_ORDER.indexOf(targetStep);

    if (targetIndex <= currentIndex) {
      setActiveStep(targetStep);
      return;
    }

    try {
      await form.validateFields(stepFieldNames[activeStep]);
      setActiveStep(targetStep);
    } catch {
      return;
    }
  };

  const stepItems = [
    {
      key: 'info',
      label: t('trips.tabInfo'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
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
                      required={false}
                      placeholder={t('trips.codePlaceholder')}
                      disabled
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
                    <FormItemText
                      name="scheduled_date"
                      label={t('trips.scheduledDate')}
                      type="date"
                      disabled={isTerminal}
                      rules={
                        mode === 'create'
                          ? [{ required: true, message: t('validation.required', { field: t('trips.scheduledDate') }) }]
                          : undefined
                      }
                    />
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
            ]}
          />

          {!readOnly ? (
            <Space style={{ justifyContent: 'flex-end', width: '100%' }}>
              <Button type="primary" onClick={() => void validateStepAndAdvance('info', 'route')}>
                {t('common.next')}
              </Button>
            </Space>
          ) : null}
        </div>
      ),
    },
    {
      key: 'route',
      label: t('trips.tabRoute'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
          <FormAccordionSections
            defaultOpen="route"
            sections={[
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
                      rules={
                        mode === 'create'
                          ? [{ required: true, message: t('validation.required', { field: t('trips.routeTemplate') }) }]
                          : undefined
                      }
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
                    <FormItemText
                      name="scheduled_time_to"
                      label={t('trips.scheduledTimeTo')}
                      type="time"
                      disabled={isTerminal}
                      rules={[
                        ({ getFieldValue }) => ({
                          validator(_, value) {
                            const from = getFieldValue('scheduled_time_from') as string | undefined;
                            if (!value || !from || String(value) >= String(from)) {
                              return Promise.resolve();
                            }
                            return Promise.reject(new Error(t('validation.checkOutAfterCheckIn')));
                          },
                        }),
                      ]}
                    />
                    <FormItemNumber
                      name="distance_km"
                      label={t('trips.distance')}
                      required
                      min={0}
                      rules={[{ required: true, message: t('validation.required', { field: t('trips.distance') }) }]}
                      placeholder={t('trips.distancePlaceholder')}
                      disabled={isTerminal}
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
                value: 'stops',
                titleKey: 'stops',
                children: <TripStopsList isTerminal={isTerminal} />,
              },
            ]}
          />

          {!readOnly ? (
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Button onClick={() => setActiveStep('info')}>
                {t('common.back')}
              </Button>
              <Button type="primary" onClick={() => void validateStepAndAdvance('route', 'revenue')}>
                {t('common.next')}
              </Button>
            </Space>
          ) : null}
        </div>
      ),
    },
    {
      key: 'revenue',
      label: t('trips.tabRevenue'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
          <FormAccordionSections
            defaultOpen="revenue"
            sections={[
              {
                value: 'revenue',
                titleKey: 'revenue',
                children: (
                  <>
                    <Flex gap={8} align="flex-end" style={{ marginBottom: 8 }}>
                      <div style={{ flex: 1 }}>
                        <FormItemNumber
                          name="base_price"
                          label={t('trips.basePrice')}
                          required
                          min={0}
                          rules={[{ required: true, message: t('validation.required', { field: t('trips.basePrice') }) }]}
                          placeholder={t('trips.basePricePlaceholder')}
                          disabled={isTerminal}
                        />
                      </div>
                      <Button
                        icon={<CalculatorOutlined />}
                        loading={pricingLoading}
                        onClick={handlePriceLookup}
                        disabled={isTerminal || readOnly}
                      >
                        Tính giá
                      </Button>
                    </Flex>

                    <TripSurchargesList isTerminal={isTerminal} total={surchargeTotal} />

                    <FormItemNumber name="surcharge_amount" label={t('trips.surchargeAmount')} min={0} placeholder={t('trips.surchargeAmountPlaceholder')} disabled />
                    <FormItemNumber name="total_revenue" label={t('trips.totalRevenue')} min={0} placeholder={t('trips.totalRevenuePlaceholder')} disabled />
                    <FormItemSelect name="payment_method" label={t('trips.paymentMethod')} options={PAYMENT_METHODS} selectProps={{ disabled: isTerminal }} />
                    <FormItemSelect
                      name="payment_status"
                      label={t('trips.paymentStatus')}
                      options={[
                        { label: t('trips.statusUnpaid'), value: 'unpaid' },
                        { label: t('trips.statusInvoiced'), value: 'invoiced' },
                        { label: t('trips.statusPaid'), value: 'paid' },
                      ]}
                      selectProps={{ disabled: isTerminal }}
                    />
                    <FormItemTextArea name="internal_notes" label={t('trips.internalNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
                    {showStatusField ? (
                      <>
                        <FormItemSelect
                          name="status"
                          label={t('common.status')}
                          required
                          options={[{ label: t('trips.statusPending'), value: 'pending' }]}
                          rules={[{ required: true, message: t('validation.required', { field: t('common.status') }) }]}
                          selectProps={{ disabled: mode === 'edit' || isTerminal }}
                        />

                        <FormItemText name="start_time" label={t('trips.startTime')} type="datetime-local" disabled={isTerminal} />

                        <FormItemText
                          name="end_time"
                          label={t('trips.endTime')}
                          type="datetime-local"
                          disabled={isTerminal}
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
                    ) : null}
                  </>
                ),
              },
            ]}
          />

          {!readOnly ? (
            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
              <Button onClick={() => setActiveStep('route')}>
                {t('common.back')}
              </Button>
              <span />
            </Space>
          ) : null}
        </div>
      ),
    },
  ];

  return (
    <Tabs
      activeKey={activeStep}
      onChange={(key) => {
        void handleStepChange(key as TripFormStep);
      }}
      items={stepItems}
      className="trip-form-tabs"
      tabBarStyle={{ marginBottom: 16 }}
      destroyInactiveTabPane={false}
    />
  );
}
