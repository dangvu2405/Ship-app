import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { FormItemText } from '@/components/form/FormItemText';
import { useTranslation } from '@/hooks/useTranslation';
import type { Employee, Vehicle, VehicleAssignment } from '@/types';

interface VehicleAssignmentFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<VehicleAssignment>;
}

export function VehicleAssignmentForm(props: VehicleAssignmentFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: vehiclesData, isLoading: loadingVehicles } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 500 },
  });
  const { data: driversData, isLoading: loadingDrivers } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'type', operator: 'eq', value: 'driver' }],
  });

  const vehicleOptions = (vehiclesData?.data ?? []).map((v) => ({
    label: `${v.plate_number} (${v.type})`,
    value: v.id,
  }));
  const driverOptions = (driversData?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  }));

  return (
    <>
      <FormItemSelect
        name="vehicle_id"
        label={t('vehicleAssignments.vehicle')}
        required
        options={vehicleOptions}
        loading={loadingVehicles}
        showSearch
        rules={[{ required: true, message: t('validation.required', { field: t('vehicleAssignments.vehicle') }) }]}
      />
      <FormItemSelect
        name="driver_id"
        label={t('vehicleAssignments.driver')}
        required
        options={driverOptions}
        loading={loadingDrivers}
        showSearch
        rules={[{ required: true, message: t('validation.required', { field: t('vehicleAssignments.driver') }) }]}
      />
      <FormItemText name="from_date" label={t('vehicleAssignments.fromDate')} type="date" required rules={[{ required: true, message: t('validation.required', { field: t('vehicleAssignments.fromDate') }) }]} />
      <FormItemText name="to_date" label={t('vehicleAssignments.toDate')} type="date" />
    </>
  );
}
