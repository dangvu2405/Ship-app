import { Form, Switch } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { useTranslation } from '@/hooks/useTranslation';
import type { Allowance } from '@/types';

interface AllowanceFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Allowance>;
}

export function AllowanceForm(props: AllowanceFormProps) {
  void props;
  const { t } = useTranslation();

  return (
    <>
      <FormItemText name="code" label={t('allowances.code')} required rules={[{ required: true, message: t('validation.required', { field: t('allowances.code') }) }]} />
      <FormItemText name="name" label={t('allowances.name')} required rules={[{ required: true, message: t('validation.required', { field: t('allowances.name') }) }]} />
      <FormItemNumber name="default_amount" label={t('allowances.defaultAmount')} min={0} />
      <Form.Item name="taxable" label={t('allowances.taxable')} valuePropName="checked">
        <Switch />
      </Form.Item>
    </>
  );
}
