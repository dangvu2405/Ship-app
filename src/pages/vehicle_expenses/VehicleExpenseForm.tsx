import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText, FormItemTextArea } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, Vehicle, VehicleExpense } from '@/types';

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
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });
  const { data: driversData, isLoading: loadingDrivers } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'desc' }],
  });

  const vehicleOptions = (vehiclesData?.data ?? []).map((v) => ({
    label: `${v.plate_number} (${v.type})`,
    value: v.id,
  }));
  const driverOptions = (driversData?.data ?? []).map((d) => ({
    label: d.employee
      ? `${d.employee.code} — ${d.employee.name}`
      : `${d.license_no}`,
    value: d.id,
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
    <FormAccordionSections
      defaultOpen="relations"
      sections={[
        {
          value: 'relations',
          titleKey: 'relations',
          children: (
            <>
              <FormItemSelect
                name="vehicle_id"
                label={t('vehicleExpenses.vehicle')}
                required
                options={vehicleOptions}
                loading={loadingVehicles}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.vehicle') }) }]}
              />
              <FormItemSelect
                name="driver_id"
                label={t('vehicleExpenses.driver')}
                options={driverOptions}
                loading={loadingDrivers}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                allowClear
              />
            </>
          ),
        },
        {
          value: 'operational',
          titleKey: 'operational',
          children: (
            <>
              <FormItemSelect
                name="type"
                label={t('vehicleExpenses.type')}
                required
                options={typeOptions}
                rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.type') }) }]}
              />
              <FormItemNumber
                name="amount"
                label={t('vehicleExpenses.amount')}
                required
                min={1}
                rules={[
                  { required: true, message: t('validation.required', { field: t('vehicleExpenses.amount') }) },
                  { type: 'number', min: 1, message: t('validation.min', { min: 1 }) }
                ]}
              />
              <FormItemText name="expense_date" label={t('vehicleExpenses.expenseDate')} type="date" required rules={[{ required: true, message: t('validation.required', { field: t('vehicleExpenses.expenseDate') }) }]} />
              <FormItemTextArea name="note" label={t('vehicleExpenses.note')} rows={2} />
            </>
          ),
        },
      ]}
    />
  );
}
