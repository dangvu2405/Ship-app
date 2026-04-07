import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemTextArea } from '@/components/form/FormItemTextArea';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { useTranslation } from '@/hooks/useTranslation';
import type { Employee, Vehicle, VehicleExpense } from '@/types';

interface VehicleExpenseFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<VehicleExpense>;
}

export function VehicleExpenseForm(props: VehicleExpenseFormProps) {
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

  const typeOptions = [
    { label: t('vehicleExpenses.typeFuel'), value: 'fuel' },
    { label: t('vehicleExpenses.typeMaintenance'), value: 'maintenance' },
    { label: t('vehicleExpenses.typeRepair'), value: 'repair' },
    { label: t('vehicleExpenses.typeToll'), value: 'toll' },
    { label: t('vehicleExpenses.typeParking'), value: 'parking' },
    { label: t('vehicleExpenses.typeOther'), value: 'other' },
  ];

  return (
    <>
      <FormItemSelect
        name="vehicle_id"
        label={t('vehicleExpenses.vehicle')}
        required
        options={vehicleOptions}
        loading={loadingVehicles}
        showSearch
        rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.vehicle') }) }]}
      />
      <FormItemSelect name="driver_id" label={t('vehicleExpenses.driver')} options={driverOptions} loading={loadingDrivers} showSearch allowClear />
      <FormItemSelect
        name="type"
        label={t('vehicleExpenses.type')}
        required
        options={typeOptions}
        rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.type') }) }]}
      />
      <FormItemNumber name="amount" label={t('vehicleExpenses.amount')} required min={0} rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.amount') }) }]} />
      <FormItemText name="expense_date" label={t('vehicleExpenses.expenseDate')} type="date" required rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.expenseDate') }) }]} />
      <FormItemTextArea name="note" label={t('vehicleExpenses.note')} rows={2} />
    </>
  );
}
