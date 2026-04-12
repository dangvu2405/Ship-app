import { Form } from 'antd';
import { FormAccordionSections, FormItemText } from '@/components/form';
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
    <FormAccordionSections
      defaultOpen="single"
      sections={[
        {
          value: 'single',
          titleKey: 'single',
          children: (
            <>
              <FormItemText name="code" label={t('deductions.code')} required rules={[{ required: true, message: t('validation.required', { field: t('deductions.code') }) }]} />
              <FormItemText name="name" label={t('deductions.name')} required rules={[{ required: true, message: t('validation.required', { field: t('deductions.name') }) }]} />
            </>
          ),
        },
      ]}
    />
  );
}
