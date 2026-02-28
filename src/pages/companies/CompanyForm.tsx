import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemTextArea } from '@/components/form/FormItemTextArea';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company } from '@/types';

interface CompanyFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Company>;
}

export function CompanyForm({ form: _form, initialValues: _initialValues }: CompanyFormProps) {
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  return (
    <>
      <FormItemText
        name="code"
        label={t('companies.code')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('companies.code') }) },
        ]}
        placeholder={t('companies.codePlaceholder')}
      />

      <FormItemText
        name="name"
        label={t('companies.name')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('companies.name') }) },
        ]}
        placeholder={t('companies.namePlaceholder')}
      />

      <FormItemText
        name="tax_code"
        label={t('companies.taxCode')}
        placeholder={t('companies.taxCodePlaceholder')}
      />

      <FormItemTextArea
        name="address"
        label={t('companies.address')}
        rows={3}
        placeholder={t('companies.addressPlaceholder')}
      />

      <FormItemText
        name="phone"
        label={t('companies.phone')}
        type="tel"
        placeholder={t('companies.phonePlaceholder')}
      />

      <FormItemText
        name="email"
        label={t('companies.email')}
        type="email"
        rules={[
          { type: 'email', message: t('validation.email') },
        ]}
        placeholder={t('companies.emailPlaceholder')}
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
