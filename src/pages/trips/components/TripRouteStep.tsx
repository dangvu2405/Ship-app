import { Row, Col, Divider, Space, Button, Flex, Spin, Form } from 'antd';
import type { FormInstance } from 'antd/lib/form';
import { EnvironmentOutlined, CalculatorOutlined, CarOutlined } from '@ant-design/icons';
import { useSelect } from '@refinedev/antd';
import {
  FormItemSelect,
  FormItemLocation,
  FormItemRangePicker,
  FormItemNumber,
  FormItemDatePicker,
} from '@/components/form';
import { VnAdminAddressFields } from '@/components/form/vn-admin-address-fields';
import { useTranslation } from '@/hooks/useTranslation';
import type { RouteTemplate, Driver, Vehicle, VehicleTypeCatalog, Trip } from '@/types';
import { TripStopsList } from './TripStopsList';

interface TripRouteStepProps {
  form: FormInstance;
  isTerminal: boolean;
  initialValues?: Partial<Trip>;
  mode: string;
  readOnly: boolean;
  shippingCalcLoading: boolean;
  onShippingFeeLookup: () => Promise<void>;
  driverToVehicleMap: Record<number, number>;
}

export const TripRouteStep = ({
  form,
  isTerminal,
  initialValues,
  mode,
  readOnly,
  shippingCalcLoading,
  onShippingFeeLookup,
  driverToVehicleMap,
}: TripRouteStepProps) => {
  const { t } = useTranslation();

  const { selectProps: routeTemplateSelectProps } = useSelect<RouteTemplate>({
    resource: 'route-templates',
    optionLabel: 'name',
  });

  const { selectProps: driverSelectProps } = useSelect<Driver>({
    resource: 'drivers',
    optionLabel: (item) =>
      item.employee ? `${item.employee.code} — ${item.employee.name}` : item.license_no || `#${item.id}`,
    filters: [{ field: 'available_status', operator: 'eq', value: 'available' }],
  });

  const { selectProps: vehicleSelectProps } = useSelect<Vehicle>({
    resource: 'vehicles',
    optionLabel: (item) => `${item.plate_number} (${item.type})`,
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
  });

  const { selectProps: vehicleTypeSelectProps } = useSelect<VehicleTypeCatalog>({
    resource: 'vehicle-types',
    optionLabel: 'name',
  });

  const { options: routeTemplateOptions = [], ...routeTemplateSelectRest } = routeTemplateSelectProps;
  const { options: driverOptions = [], ...driverSelectRest } = driverSelectProps;
  const { options: vehicleOptions = [], ...vehicleSelectRest } = vehicleSelectProps;
  const { options: vehicleTypeOptions = [], ...vehicleTypeSelectRest } = vehicleTypeSelectProps;

  const startPointTrimmed = initialValues?.start_point?.trim() ?? '';
  const endPointTrimmed = initialValues?.end_point?.trim() ?? '';
  const hasTripId = initialValues?.id != null;

  return (
    <Flex vertical gap="middle">
      <Divider orientation="left">
        <Space size="small">
          <EnvironmentOutlined />
          {t('trips.sectionRoute')}
        </Space>
      </Divider>
      <FormItemSelect
        name="route_template_id"
        label={t('trips.routeTemplate')}
        options={routeTemplateOptions}
        placeholder={t('common.select') as string}
        showSearch
        selectProps={{ ...routeTemplateSelectRest, optionFilterProp: 'label', disabled: isTerminal }}
        rules={
          mode === 'create'
            ? [{ required: true, message: t('validation.required', { field: t('trips.routeTemplate') }) }]
            : undefined
        }
      />

      <Row gutter={[16, 16]}>
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

      <Row gutter={[24, 24]}>
        <Col span={12}>
          <VnAdminAddressFields
            form={form}
            fieldPrefix="start_"
            cascadeRequired
            relaxCascadeRequired={Boolean(hasTripId && startPointTrimmed)}
            legacySavedAddress={startPointTrimmed || undefined}
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
            relaxCascadeRequired={Boolean(hasTripId && endPointTrimmed)}
            legacySavedAddress={endPointTrimmed || undefined}
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

      <Row gutter={[16, 16]}>
        <Col span={12}>
          <FormItemRangePicker
            name="scheduled_time_range"
            label={t('trips.scheduledTime')}
            picker="time"
            disabled={isTerminal}
            getValueProps={(value) => ({
              value: Array.isArray(value)
                ? value
                : [form.getFieldValue('scheduled_time_from'), form.getFieldValue('scheduled_time_to')],
            })}
            onChange={(dates) => {
              if (Array.isArray(dates)) {
                form.setFieldsValue({
                  scheduled_time_from: dates[0],
                  scheduled_time_to: dates[1],
                });
              }
            }}
          />
        </Col>
        <Col span={12}>
          <Row gutter={8} align="bottom" wrap>
            <Col flex="auto">
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
            </Col>
            <Col flex="none">
              {!shippingCalcLoading && (
                <Button
                  icon={<CalculatorOutlined />}
                  onClick={onShippingFeeLookup}
                  disabled={isTerminal || readOnly}
                >
                  {t('trips.calcDistanceAndFee')}
                </Button>
              )}
            </Col>
          </Row>
        </Col>
      </Row>

      <Divider orientation="left">
        <Space size="small">
          <CarOutlined />
          {t('trips.sectionAssignment')}
        </Space>
      </Divider>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <FormItemSelect
            name="driver_id"
            label={t('drivers.title')}
            required
            options={driverOptions}
            placeholder={t('common.select') as string}
            showSearch
            selectProps={{
              ...driverSelectRest,
              optionFilterProp: 'label',
              disabled: isTerminal,
              onChange: (value) => {
                const vehicleId = driverToVehicleMap[value as number];
                if (vehicleId) {
                  form.setFieldValue('vehicle_id', vehicleId);
                }
              },
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
            placeholder={t('common.select') as string}
            showSearch
            selectProps={{
              ...vehicleSelectRest,
              optionFilterProp: 'label',
              disabled:
                isTerminal ||
                (!!form.getFieldValue('driver_id') && !!driverToVehicleMap[form.getFieldValue('driver_id')]),
            }}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.title') }) }]}
          />
        </Col>
      </Row>
      <Row gutter={[16, 16]}>
        <Col span={12}>
          <FormItemSelect
            name="vehicle_type_id"
            label={t('vehicles.type')}
            options={vehicleTypeOptions}
            placeholder={t('common.select') as string}
            showSearch
            selectProps={{ ...vehicleTypeSelectRest, optionFilterProp: 'label', disabled: isTerminal }}
          />
        </Col>
        <Col span={12}>
          <FormItemDatePicker name="assigned_at" label={t('trips.assignedAt')} showTime disabled={isTerminal} />
        </Col>
      </Row>

      <Divider orientation="left">
        <Space size="small">
          <EnvironmentOutlined />
          {t('trips.sectionStops')}
        </Space>
      </Divider>
      <TripStopsList isTerminal={isTerminal} />
    </Flex>
  );
};
