import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, Employee } from '@/types';

interface DriverFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Driver>;
}

export function DriverForm(props: DriverFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: empData, isLoading } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 500 },
    filters: [{ field: 'type', operator: 'eq', value: 'driver' }],
  });
  const employeeOptions = (empData?.data ?? []).map((e) => ({
    label: `${e.code} — ${e.name}`,
    value: e.id,
  }));

  const statusOptions = [
    { label: t('drivers.statusAvailable'), value: 'available' },
    { label: t('drivers.statusOnTrip'), value: 'on_trip' },
    { label: t('drivers.statusOff'), value: 'off' },
  ];

  return (
    <>
      <FormItemSelect
        name="employee_id"
        label={t('drivers.employee')}
        required
        options={employeeOptions}
        loading={isLoading}
        showSearch
        rules={[{ required: true, message: t('validation.required', { field: t('drivers.employee') }) }]}
      />
      <FormItemText name="license_no" label={t('drivers.licenseNo')} required rules={[{ required: true, message: t('validation.required', { field: t('drivers.licenseNo') }) }]} />
      <FormItemText name="license_class" label={t('drivers.licenseClass')} required rules={[{ required: true, message: t('validation.required', { field: t('drivers.licenseClass') }) }]} />
      <FormItemText name="expired_date" label={t('drivers.expiredDate')} type="date" />
      <FormItemSelect name="available_status" label={t('drivers.availableStatus')} options={statusOptions} allowClear />
    </>
  );
}
