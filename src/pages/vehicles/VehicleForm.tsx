import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Vehicle>;
}

export function VehicleForm({ form: _form, initialValues: _initialValues }: VehicleFormProps) {
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  return (
    <>
      <FormItemText
        name="plate_number"
        label={t('vehicles.plateNumber')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('vehicles.plateNumber') }) },
        ]}
        placeholder={t('vehicles.plateNumberPlaceholder')}
      />

      <FormItemText
        name="type"
        label={t('vehicles.type')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('vehicles.type') }) },
        ]}
        placeholder={t('vehicles.typePlaceholder')}
      />

      <FormItemText
        name="brand"
        label={t('vehicles.brand')}
        placeholder={t('vehicles.brandPlaceholder')}
      />

      <FormItemText
        name="model"
        label={t('vehicles.model')}
        placeholder={t('vehicles.modelPlaceholder')}
      />

      <FormItemNumber
        name="year"
        label={t('vehicles.year')}
        min={1900}
        max={new Date().getFullYear() + 1}
        placeholder={t('vehicles.yearPlaceholder')}
      />

      <FormItemNumber
        name="capacity"
        label={t('vehicles.capacity')}
        min={0}
        placeholder={t('vehicles.capacityPlaceholder')}
      />

      <FormItemSelect
        name="status"
        label={t('common.status')}
        required
        options={statusOptions}
        rules={[
          { required: true, message: t('validation.required', { field: t('common.status') }) },
        ]}
      />
    </>
  );
}
