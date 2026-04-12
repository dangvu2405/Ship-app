import { Form } from 'antd';
import { FormAccordionSections, FormItemNumber, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Position } from '@/types';

interface PositionFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Position>;
}

export function PositionForm(props: PositionFormProps) {
  void props;
  const { t } = useTranslation();

  return (
    <FormAccordionSections
      defaultOpen="basic"
      sections={[
        {
          value: 'basic',
          titleKey: 'basic',
          children: (
            <>
              <FormItemText
                name="code"
                label={t('companies.code')}
                required
                rules={[{ required: true, message: t('validation.required', { field: t('companies.code') }) }]}
              />
              <FormItemText
                name="name"
                label={t('companies.name')}
                required
                rules={[{ required: true, message: t('validation.required', { field: t('companies.name') }) }]}
              />
            </>
          ),
        },
        {
          value: 'financial',
          titleKey: 'financial',
          children: (
            <>
              <FormItemNumber
                name="base_salary"
                label={t('positions.baseSalary')}
                required
                min={0}
                rules={[{ required: true, message: t('validation.required', { field: t('positions.baseSalary') }) }]}
              />
              <FormItemNumber name="level" label={t('positions.level')} min={0} />
            </>
          ),
        },
      ]}
    />
  );
}
