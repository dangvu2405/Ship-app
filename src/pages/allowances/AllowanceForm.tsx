import { Form } from 'antd';
import {
  FormAccordionSections,
  FormItemNumber,
  FormItemSwitch,
  FormItemText,
} from '@/components/form';
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
    <FormAccordionSections
      defaultOpen="single"
      sections={[
        {
          value: 'single',
          titleKey: 'single',
          children: (
            <>
              <FormItemText name="code" label={t('allowances.code')} required rules={[{ required: true, message: t('validation.required', { field: t('allowances.code') }) }]} />
              <FormItemText name="name" label={t('allowances.name')} required rules={[{ required: true, message: t('validation.required', { field: t('allowances.name') }) }]} />
              <FormItemNumber name="default_amount" label={t('allowances.defaultAmount')} min={0} />
              <FormItemSwitch name="taxable" label={t('allowances.taxable')} />
            </>
          ),
        },
      ]}
    />
  );
}
