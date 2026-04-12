import { Form } from 'antd';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle } from '@/types';

interface VehicleFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Vehicle>;
}

export function VehicleForm(props: VehicleFormProps) {
  void props;
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  return (
    <FormAccordionSections
      defaultOpen="identity"
      sections={[
        {
          value: 'identity',
          titleKey: 'identity',
          children: (
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
            </>
          ),
        },
        {
          value: 'operational',
          titleKey: 'operational',
          children: (
            <>
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
          ),
        },
      ]}
    />
  );
}
