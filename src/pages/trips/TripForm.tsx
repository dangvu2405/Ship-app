import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';

interface TripFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Trip>;
}

export function TripForm(props: TripFormProps) {
  void props;
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('trips.statusPending'), value: 'pending' },
    { label: t('trips.statusInProgress'), value: 'in_progress' },
    { label: t('trips.statusCompleted'), value: 'completed' },
    { label: t('trips.statusCancelled'), value: 'cancelled' },
  ];

  return (
    <>
      <FormItemText
        name="code"
        label={t('trips.code')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('trips.code') }) },
        ]}
        placeholder={t('trips.codePlaceholder')}
      />

      <FormItemText
        name="start_point"
        label={t('trips.startPoint')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('trips.startPoint') }) },
        ]}
        placeholder={t('trips.startPointPlaceholder')}
      />

      <FormItemText
        name="end_point"
        label={t('trips.endPoint')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('trips.endPoint') }) },
        ]}
        placeholder={t('trips.endPointPlaceholder')}
      />

      <FormItemNumber
        name="distance_km"
        label={t('trips.distance')}
        required
        min={0}
        rules={[
          { required: true, message: t('validation.required', { field: t('trips.distance') }) },
        ]}
        placeholder={t('trips.distancePlaceholder')}
      />

      <FormItemNumber
        name="price"
        label={t('trips.price')}
        required
        min={0}
        rules={[
          { required: true, message: t('validation.required', { field: t('trips.price') }) },
        ]}
        placeholder={t('trips.pricePlaceholder')}
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
