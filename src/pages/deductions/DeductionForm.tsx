import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { useTranslation } from '@/hooks/useTranslation';
import type { Deduction } from '@/types';

interface DeductionFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Deduction>;
}

export function DeductionForm(props: DeductionFormProps) {
  void props;
  const { t } = useTranslation();

  return (
    <>
      <FormItemText name="code" label={t('deductions.code')} required rules={[{ required: true, message: t('validation.required', { field: t('deductions.code') }) }]} />
      <FormItemText name="name" label={t('deductions.name')} required rules={[{ required: true, message: t('validation.required', { field: t('deductions.name') }) }]} />
    </>
  );
}
