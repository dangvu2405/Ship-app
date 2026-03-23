import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Employee } from '@/types';

interface EmployeeFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Employee>;
}

export function EmployeeForm(props: EmployeeFormProps) {
  void props;
  const { t } = useTranslation();

  const typeOptions = [
    { label: t('employees.typeOffice'), value: 'office' },
    { label: t('employees.typeDriver'), value: 'driver' },
  ];

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  return (
    <>
      <FormItemText
        name="code"
        label={t('employees.code')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('employees.code') }) },
        ]}
        placeholder={t('employees.codePlaceholder')}
      />

      <FormItemText
        name="name"
        label={t('employees.name')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('employees.name') }) },
        ]}
        placeholder={t('employees.namePlaceholder')}
      />

      <FormItemText
        name="email"
        label={t('employees.email')}
        type="email"
        rules={[
          { type: 'email', message: t('validation.email') },
        ]}
        placeholder={t('employees.emailPlaceholder')}
      />

      <FormItemText
        name="phone"
        label={t('employees.phone')}
        type="tel"
        placeholder={t('employees.phonePlaceholder')}
      />

      <FormItemSelect
        name="type"
        label={t('employees.type')}
        required
        options={typeOptions}
        rules={[
          { required: true, message: t('validation.required', { field: t('employees.type') }) },
        ]}
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
