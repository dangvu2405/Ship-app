import { useEffect, useMemo, useState } from 'react';
import { Button, Flex, Form, Space, Steps, Spin, Divider, Row, Col, Card } from 'antd';
import { CalculatorOutlined, CarOutlined, InfoCircleOutlined, EnvironmentOutlined, DollarOutlined, PullRequestOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import {
  FormItemDatePicker,
  FormItemLocation,
  FormItemNumber,
  FormItemSelect,
  FormItemText,
  FormItemTextArea,
  FormItemRangePicker,
} from '@/components/form';
import { VnAdminAddressFields } from '@/components/form/vn-admin-address-fields';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { CargoType, Customer, Driver, RouteTemplate, Trip, Vehicle, VehicleTypeCatalog } from '@/types';
import { TERMINAL_TRIP_STATUSES, normalizeTripStatusKey } from '@/utils/tripStatus';
import tripService from '@/services/trip.service';
import { TripStopsList } from './components/TripStopsList';
import { TripSurchargesList } from './components/TripSurchargesList';
import { FormInstance } from 'antd/lib';

interface TripFormProps {
  form: FormInstance;
  initialValues?: Partial<Trip>;
  mode?: 'create' | 'edit';
  currentStatus?: string;
  readOnly?: boolean;
}

type TripFormStep = 'info' | 'route' | 'revenue';
const STEP_ORDER: TripFormStep[] = ['info', 'route', 'revenue'];



const normalizeTripStatus = (status?: string) => normalizeTripStatusKey(status) || '';

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
  const [activeStep, setActiveStep] = useState<TripFormStep>('info');
  const basePrice = Form.useWatch('base_price', form);
  const surcharges: Array<{ label?: string; amount?: number; note?: string }> = Form.useWatch('surcharges', form) ?? [];
  const [pricingLoading, setPricingLoading] = useState(false);
  const [shippingCalcLoading, setShippingCalcLoading] = useState(false);


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
    resource: 'cargo-types',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: routeTemplatesData, isLoading: loadingRoutes } = useList<RouteTemplate>({
    resource: 'route-templates',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: vehicleTypesData, isLoading: loadingVehicleTypes } = useList<VehicleTypeCatalog>({
    resource: 'vehicle-types',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'sort_order', order: 'asc' }, { field: 'name', order: 'asc' }],
  });
  
  const { data: assignmentsData } = useList<any>({
    resource: 'vehicle-assignments',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'to_date', operator: 'null', value: null }],
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

  const vehicleTypeOptions = useMemo(
    () => (vehicleTypesData?.data ?? []).map((item) => ({ label: item.name, value: item.id })),
    [vehicleTypesData?.data],
  );

  const paymentMethods = useMemo(() => [
    { label: t('trips.paymentMethodBankTransfer'), value: 'bank_transfer' },
    { label: t('trips.paymentMethodCash'), value: 'cash' },
    { label: t('trips.paymentMethodCredit'), value: 'credit' },
  ], [t]);

  const driverToVehicleMap = useMemo(() => {
    const map: Record<number, number> = {};
    (assignmentsData?.data ?? []).forEach((a: any) => {
      map[a.driver_id] = a.vehicle_id;
    });
    return map;
  }, [assignmentsData?.data]);

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
      feedback.error(t('trips.errSelectCustomerAndRoute'));
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
        feedback.success(t('trips.calcPriceSuccess'));
      } else {
        feedback.info(t('trips.calcPriceNotFound'));
      }
    } catch {
      feedback.error(t('trips.calcPriceError'));
    } finally {
      setPricingLoading(false);
    }
  };

  // Smart Logic: Auto-calculate distance when addresses change
  const watchAddresses = Form.useWatch(['start_addr_street_detail', 'end_addr_street_detail', 'vehicle_type_id'], form);
  
  useEffect(() => {
    if (!watchAddresses) return;
    const [start, end] = watchAddresses;
    if (start && end) {
      const timer = setTimeout(() => {
        handleShippingFeeLookup();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchAddresses]);

  const handleShippingFeeLookup = async () => {
    const values = form.getFieldsValue([
      'start_addr_street_detail',
      'start_addr_ward_code',
      'start_addr_district_code',
      'start_addr_province_code',
      'end_addr_street_detail',
      'end_addr_ward_code',
      'end_addr_district_code',
      'end_addr_province_code',
      'vehicle_type_id',
    ]);

    const getAddr = (prefix: string) => {
      const street = values[`${prefix}addr_street_detail`];
      const ward = form.getFieldValue(`${prefix}addr_ward_name`);
      const district = form.getFieldValue(`${prefix}addr_district_name`);
      const province = form.getFieldValue(`${prefix}addr_province_name`);
      
      const parts = [street, ward, district, province].filter(Boolean);
      return parts.join(', ');
    };

    const origin = getAddr('start_');
    const destination = getAddr('end_');

    if (!origin || !destination) {
      feedback.error(t('trips.errEnterOriginAndDestination'));
      return;
    }

    setShippingCalcLoading(true);
    try {
      const res = await tripService.shippingFeeLookup({
        origin,
        destination,
        origin_lat: form.getFieldValue('origin_lat'),
        origin_lng: form.getFieldValue('origin_lng'),
        destination_lat: form.getFieldValue('destination_lat'),
        destination_lng: form.getFieldValue('destination_lng'),
        vehicle_type_id: values.vehicle_type_id,
      });

      if (res?.success && res.data) {
        form.setFieldValue('distance_km', res.data.distance_km);
        form.setFieldValue('base_price', res.data.shipping_fee);
        feedback.success(t('trips.calcShippingSuccess'));
      } else {
        feedback.error(t('trips.calcShippingError'));
      }
    } catch {
      feedback.error(t('trips.calcShippingError'));
    } finally {
      setShippingCalcLoading(false);
    }
  };
  // Watch all fields to trigger re-renders and update error indicators
  Form.useWatch([], form);

  const handleStepChange = (targetStep: TripFormStep) => {
    setActiveStep(targetStep);
  };

  // Check which steps have errors based on field names
  const getStepStatus = (stepKey: TripFormStep) => {
    const fieldNames = stepFieldNames[stepKey];
    const errors = form.getFieldsError();
    const hasError = errors.some(f => fieldNames.includes(f.name[0] as string) && f.errors.length > 0);
    if (hasError) return 'error';

    // In edit mode or after filling, if a step has no errors and has some data, mark as finish
    const values = form.getFieldsValue(fieldNames);
    const isFilled = Object.values(values).some((v) => v !== undefined && v !== null && v !== '');
    
    if (isFilled && stepKey !== activeStep) {
      return 'finish';
    }

    return undefined;
  };

  const stepItems = [
    {
      key: 'info',
      label: t('trips.tabInfo'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
          <Card variant="borderless" className="shadow-sm">
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Space><InfoCircleOutlined /> {t('trips.sectionGeneral')}</Space>
            </Divider>
            <Row gutter={16}>
              <Col span={24}>
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
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemText name="contact_name" label={t('common.contactName')} placeholder={t('common.contactName')} disabled={isTerminal} />
              </Col>
              <Col span={12}>
                <FormItemText name="contact_phone" label={t('common.phone')} placeholder={t('common.phone')} disabled={isTerminal} />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemDatePicker name="received_date" label={t('trips.receivedDate')} disabled={isTerminal} />
              </Col>
              <Col span={12}>
                <FormItemDatePicker
                  name="scheduled_date"
                  label={t('trips.scheduledDate')}
                  disabled={isTerminal}
                  rules={
                    mode === 'create'
                      ? [{ required: true, message: t('validation.required', { field: t('trips.scheduledDate') }) }]
                      : undefined
                  }
                />
              </Col>
            </Row>

            <Divider orientation="left">
              <Space><PullRequestOutlined /> {t('trips.sectionCargo')}</Space>
            </Divider>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemSelect
                  name="cargo_type_id"
                  label={t('trips.cargoType')}
                  options={cargoTypeOptions}
                  loading={loadingCargoTypes}
                  showSearch
                  selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                />
              </Col>
              <Col span={12}>
                <FormItemText name="cargo_unit" label={t('trips.cargoUnit')} placeholder={t('trips.cargoUnit')} disabled={isTerminal} />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemNumber name="cargo_quantity" label={t('trips.cargoQuantity')} min={0} disabled={isTerminal} />
              </Col>
              <Col span={12}>
                <FormItemNumber name="cargo_weight_ton" label={t('trips.cargoWeightTon')} min={0} step={0.01} disabled={isTerminal} />
              </Col>
            </Row>
            <FormItemTextArea name="cargo_description" label={t('trips.cargoDescription')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
            <FormItemTextArea name="cargo_notes" label={t('trips.cargoNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />
          </Card>
        </div>
      ),
    },
    {
      key: 'route',
      label: t('trips.tabRoute'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
          <Card variant="borderless" className="shadow-sm">
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Space><EnvironmentOutlined /> {t('trips.sectionRoute')}</Space>
            </Divider>
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

            <Row gutter={16}>
              <Col span={12}>
                <FormItemLocation
                  name="origin_location_id"
                  label={t('trips.origin')}
                  selectProps={{ disabled: isTerminal }}
                />
              </Col>
              <Col span={12}>
                <FormItemLocation
                  name="destination_location_id"
                  label={t('trips.destination')}
                  selectProps={{ disabled: isTerminal }}
                />
              </Col>
            </Row>

            <Form.Item name="origin_lat" hidden />
            <Form.Item name="origin_lng" hidden />
            <Form.Item name="destination_lat" hidden />
            <Form.Item name="destination_lng" hidden />

            <Row gutter={24}>
              <Col span={12}>
                <VnAdminAddressFields
                  form={form}
                  fieldPrefix="start_"
                  cascadeRequired
                  relaxCascadeRequired={Boolean(initialValues?.id && initialValues?.start_point?.trim())}
                  legacySavedAddress={initialValues?.start_point?.trim()}
                  heading={t('trips.addressStartHeading')}
                  disabled={isTerminal}
                  onAddressSelected={(lat, lng) => {
                    form.setFieldsValue({
                      origin_lat: lat,
                      origin_lng: lng,
                    });
                  }}
                />
              </Col>
              <Col span={12}>
                <VnAdminAddressFields
                  form={form}
                  fieldPrefix="end_"
                  cascadeRequired
                  relaxCascadeRequired={Boolean(initialValues?.id && initialValues?.end_point?.trim())}
                  legacySavedAddress={initialValues?.end_point?.trim()}
                  heading={t('trips.addressEndHeading')}
                  disabled={isTerminal}
                  onAddressSelected={(lat, lng) => {
                    form.setFieldsValue({
                      destination_lat: lat,
                      destination_lng: lng,
                    });
                  }}
                />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <FormItemRangePicker 
                  name="scheduled_time_range" 
                  label={t('trips.scheduledTime')} 
                  picker="time" 
                  disabled={isTerminal}
                  getValueProps={(value) => ({
                    value: Array.isArray(value) ? value : [form.getFieldValue('scheduled_time_from'), form.getFieldValue('scheduled_time_to')]
                  })}
                  onChange={(dates) => {
                    if (Array.isArray(dates)) {
                      form.setFieldsValue({
                        scheduled_time_from: dates[0],
                        scheduled_time_to: dates[1]
                      });
                    }
                  }}
                />
              </Col>
              <Col span={12}>
                <Flex gap={8} align="flex-end">
                  <div style={{ flex: 1 }}>
                    <FormItemNumber
                      name="distance_km"
                      label={t('trips.distance')}
                      required
                      min={0}
                      rules={[{ required: true, message: t('validation.required', { field: t('trips.distance') }) }]}
                      placeholder={t('trips.distancePlaceholder')}
                      disabled={isTerminal}
                      suffix={shippingCalcLoading ? <Spin size="small" /> : 'km'}
                    />
                  </div>
                  {!shippingCalcLoading && (
                    <Button
                      icon={<CalculatorOutlined />}
                      onClick={handleShippingFeeLookup}
                      disabled={isTerminal || readOnly}
                    >
                      {t('trips.calcDistanceAndFee')}
                    </Button>
                  )}
                </Flex>
              </Col>
            </Row>

            <Divider orientation="left">
              <Space><CarOutlined /> {t('trips.sectionAssignment')}</Space>
            </Divider>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemSelect
                  name="driver_id"
                  label={t('drivers.title')}
                  required
                  options={driverOptions}
                  loading={loadingDrivers}
                  showSearch
                  selectProps={{ 
                    optionFilterProp: 'label', 
                    disabled: isTerminal,
                    onChange: (value) => {
                      const vehicleId = driverToVehicleMap[value as number];
                      if (vehicleId) {
                        form.setFieldValue('vehicle_id', vehicleId);
                      }
                    }
                  }}
                  rules={[{ required: true, message: t('validation.required', { field: t('drivers.title') }) }]}
                />
              </Col>
              <Col span={12}>
                <FormItemSelect
                  name="vehicle_id"
                  label={t('vehicles.title')}
                  required
                  options={vehicleOptions}
                  loading={loadingVehicles}
                  showSearch
                  selectProps={{ 
                    optionFilterProp: 'label', 
                    disabled: isTerminal || (!!form.getFieldValue('driver_id') && !!driverToVehicleMap[form.getFieldValue('driver_id')]) 
                  }}
                  rules={[{ required: true, message: t('validation.required', { field: t('vehicles.title') }) }]}
                />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={12}>
                <FormItemSelect
                  name="vehicle_type_id"
                  label={t('vehicles.type')}
                  options={vehicleTypeOptions}
                  loading={loadingVehicleTypes}
                  showSearch
                  selectProps={{ optionFilterProp: 'label', disabled: isTerminal }}
                />
              </Col>
              <Col span={12}>
                <FormItemDatePicker name="assigned_at" label={t('trips.assignedAt')} showTime disabled={isTerminal} />
              </Col>
            </Row>

            <Divider orientation="left">
              <Space><EnvironmentOutlined /> {t('trips.sectionStops')}</Space>
            </Divider>
            <TripStopsList isTerminal={isTerminal} />
          </Card>
        </div>
      ),
    },
    {
      key: 'revenue',
      label: t('trips.tabRevenue'),
      forceRender: true,
      children: (
        <div className="flex flex-col gap-4">
          <Card variant="borderless" className="shadow-sm">
            <Divider orientation="left" style={{ marginTop: 0 }}>
              <Space><DollarOutlined /> {t('trips.sectionRevenue')}</Space>
            </Divider>
            <Row gutter={16}>
              <Col span={12}>
                <Flex gap={8} align="flex-end" style={{ marginBottom: 24 }}>
                  <div style={{ flex: 1 }}>
                    <FormItemNumber
                      name="base_price"
                      label={t('trips.basePrice')}
                      required
                      min={0}
                      rules={[{ required: true, message: t('validation.required', { field: t('trips.basePrice') }) }]}
                      placeholder={t('trips.basePricePlaceholder')}
                      disabled={isTerminal}
                      thousandSeparator
                      suffix={t('common.vnd')}
                    />
                  </div>
                  {!pricingLoading && (
                    <Button
                      icon={<CalculatorOutlined />}
                      onClick={handlePriceLookup}
                      disabled={isTerminal || readOnly}
                    >
                      {t('trips.calcPrice')}
                    </Button>
                  )}
                  {pricingLoading && <Spin size="small" />}
                </Flex>
              </Col>
              <Col span={12}>
                <FormItemNumber name="surcharge_amount" label={t('trips.surchargeAmount')} min={0} disabled={isTerminal} thousandSeparator suffix={t('common.vnd')} />
              </Col>
            </Row>

            <Row gutter={16}>
              <Col span={12}>
                <FormItemSelect
                  name="payment_method"
                  label={t('trips.paymentMethod')}
                  options={paymentMethods}
                  disabled={isTerminal}
                />
              </Col>
              <Col span={12}>
                <FormItemSelect
                  name="payment_status"
                  label={t('trips.paymentStatus')}
                  options={[
                    { label: t('trips.statusUnpaid'), value: 'unpaid' },
                    { label: t('trips.statusInvoiced'), value: 'invoiced' },
                    { label: t('trips.statusPaid'), value: 'paid' },
                  ]}
                  disabled={isTerminal}
                />
              </Col>
            </Row>

            {hasRecord && (
              <>
                <Row gutter={16}>
                  <Col span={12}>
                    <FormItemDatePicker name="start_time" label={t('trips.startTime')} showTime disabled={isTerminal} />
                  </Col>
                  <Col span={12}>
                    <FormItemDatePicker name="end_time" label={t('trips.endTime')} showTime disabled={isTerminal} />
                  </Col>
                </Row>
                <FormItemSelect
                  name="status"
                  label={t('trips.status')}
                  options={Object.values(TERMINAL_TRIP_STATUSES).map(s => ({ label: t(`trips.status.${s}`), value: s }))}
                  disabled={isTerminal}
                />
              </>
            )}

            <FormItemTextArea name="internal_notes" label={t('trips.internalNotes')} autoSize={{ minRows: 2, maxRows: 4 }} disabled={isTerminal} />

            <Divider orientation="left">
              <Space><DollarOutlined /> {t('trips.sectionSurcharges')}</Space>
            </Divider>
            <TripSurchargesList isTerminal={isTerminal} total={surchargeTotal} />
          </Card>
        </div>
      ),
    },
  ];

  const currentStepIndex = STEP_ORDER.indexOf(activeStep);

  return (
    <div className="trip-form-steps">
      <Steps
        current={currentStepIndex}
        onChange={(index) => {
          void handleStepChange(STEP_ORDER[index]);
        }}
        items={stepItems.map((item) => ({ 
          title: item.label,
          status: getStepStatus(item.key as TripFormStep)
        }))}
        style={{ marginBottom: 24 }}
      />
      
      <div className="step-content" style={{ marginBottom: 24 }}>
        {stepItems.map((item, index) => (
          <div key={item.key} style={{ display: index === currentStepIndex ? 'block' : 'none' }}>
            {item.children}
          </div>
        ))}
      </div>

    </div>
  );
}
