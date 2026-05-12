import { useCallback, useEffect, useMemo, useState } from 'react';
import { Form, Steps, Card } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { Trip } from '@/types';
import { TERMINAL_TRIP_STATUSES, normalizeTripStatusKey } from '@/utils/tripStatus';
import tripService from '@/services/trip.service';
import { TripInfoStep } from './components/TripInfoStep';
import { TripRouteStep } from './components/TripRouteStep';
import { TripRevenueStep } from './components/TripRevenueStep';
import { useList } from '@refinedev/core';
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
  const [pricingLoading, setPricingLoading] = useState(false);
  const [shippingCalcLoading, setShippingCalcLoading] = useState(false);

  useEffect(() => {
    setActiveStep('info');
  }, [initialValues?.id, mode]);

  const watchedSurcharges = Form.useWatch('surcharges', form);
  const surchargeTotal = useMemo(() => {
    if (!Array.isArray(watchedSurcharges) || watchedSurcharges.length === 0) return 0;
    return watchedSurcharges.reduce((sum, item) => {
      const n = Number(item?.amount ?? 0);
      return sum + (Number.isFinite(n) ? n : 0);
    }, 0);
  }, [watchedSurcharges]);

  // Legacy assignment data for driver -> vehicle auto-fill
  const { data: assignmentsData } = useList({
    resource: 'vehicle-assignments',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'to_date', operator: 'null', value: null }],
  });

  const driverToVehicleMap = useMemo(() => {
    const map: Record<number, number> = {};
    (assignmentsData?.data ?? []).forEach((a: any) => {
      map[a.driver_id] = a.vehicle_id;
    });
    return map;
  }, [assignmentsData?.data]);

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

  const handleShippingFeeLookup = useCallback(async () => {
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
  }, [form, feedback, t]);

  const watchAddresses = Form.useWatch(['start_addr_street_detail', 'end_addr_street_detail', 'vehicle_type_id'], form);
  useEffect(() => {
    if (!watchAddresses) return;
    const [start, end] = watchAddresses;
    if (start && end) {
      const timer = setTimeout(() => {
        void handleShippingFeeLookup();
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [watchAddresses, handleShippingFeeLookup]);

  const stepFieldNames = getStepFieldNames(hasRecord);
  const getStepStatus = (stepKey: TripFormStep) => {
    const fieldNames = stepFieldNames[stepKey];
    const errors = form.getFieldsError();
    const hasError = errors.some(f => fieldNames.includes(f.name[0] as string) && f.errors.length > 0);
    if (hasError) return 'error';
    const values = form.getFieldsValue(fieldNames);
    const isFilled = Object.values(values).some((v) => v !== undefined && v !== null && v !== '');
    if (isFilled && stepKey !== activeStep) return 'finish';
    return undefined;
  };

  const stepItems = [
    {
      key: 'info',
      label: t('trips.tabInfo'),
      children: <TripInfoStep isTerminal={isTerminal} />,
    },
    {
      key: 'route',
      label: t('trips.tabRoute'),
      children: (
        <TripRouteStep
          form={form}
          isTerminal={isTerminal}
          initialValues={initialValues}
          mode={mode}
          readOnly={readOnly}
          shippingCalcLoading={shippingCalcLoading}
          onShippingFeeLookup={handleShippingFeeLookup}
          driverToVehicleMap={driverToVehicleMap}
        />
      ),
    },
    {
      key: 'revenue',
      label: t('trips.tabRevenue'),
      children: (
        <TripRevenueStep
          isTerminal={isTerminal}
          hasRecord={hasRecord}
          readOnly={readOnly}
          pricingLoading={pricingLoading}
          onPriceLookup={handlePriceLookup}
          surchargeTotal={surchargeTotal}
        />
      ),
    },
  ];

  const currentStepIndex = STEP_ORDER.indexOf(activeStep);

  return (
    <div className="trip-form-steps">
      <Steps
        current={currentStepIndex}
        onChange={(index) => setActiveStep(STEP_ORDER[index])}
        items={stepItems.map((item) => ({ 
          title: item.label,
          status: getStepStatus(item.key as TripFormStep)
        }))}
        style={{ marginBottom: 24 }}
      />
      
      <Card variant="borderless" className="shadow-sm">
        <div className="step-content">
          {stepItems.map((item, index) => (
            <div key={item.key} style={{ display: index === currentStepIndex ? 'block' : 'none' }}>
              {item.children}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
