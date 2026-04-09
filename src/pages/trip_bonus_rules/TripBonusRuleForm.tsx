import type { FormInstance } from 'antd/es/form';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { useTranslation } from '@/hooks/useTranslation';
import type { TripBonusRule } from '@/types';

interface TripBonusRuleFormProps {
  form: FormInstance;
  initialValues?: Partial<TripBonusRule>;
}

export function TripBonusRuleForm(props: TripBonusRuleFormProps) {
  void props;
  const { t } = useTranslation();

  return (
    <>
      <FormItemNumber
        name="min_km"
        label={t('tripBonusRules.minKm')}
        min={0}
        required
        rules={[{ required: true, message: t('validation.required', { field: t('tripBonusRules.minKm') }) }]}
      />
      <FormItemNumber
        name="max_km"
        label={t('tripBonusRules.maxKm')}
        min={0}
        extra={t('tripBonusRules.maxKmHint')}
      />
      <FormItemNumber
        name="bonus_per_km"
        label={t('tripBonusRules.bonusPerKm')}
        min={0}
        precision={2}
        required
        rules={[{ required: true, message: t('validation.required', { field: t('tripBonusRules.bonusPerKm') }) }]}
      />
    </>
  );
}
