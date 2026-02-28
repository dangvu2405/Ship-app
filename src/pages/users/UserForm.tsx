import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { User } from '@/types';

interface UserFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<User>;
  isEdit?: boolean;
}

export function UserForm({ form: _form, initialValues: _initialValues, isEdit = false }: UserFormProps) {
  const { t } = useTranslation();

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  return (
    <>
      <FormItemText
        name="username"
        label={t('users.username')}
        required
        rules={[
          { required: true, message: t('validation.required', { field: t('users.username') }) },
        ]}
        placeholder={t('users.usernamePlaceholder')}
      />

      <FormItemText
        name="email"
        label={t('users.email')}
        required
        type="email"
        rules={[
          { required: true, message: t('validation.required', { field: t('users.email') }) },
          { type: 'email', message: t('validation.email') },
        ]}
        placeholder={t('users.emailPlaceholder')}
      />

      {!isEdit && (
        <FormItemText
          name="password"
          label={t('users.password')}
          required
          type="password"
          rules={[
            { required: true, message: t('validation.required', { field: t('users.password') }) },
            { min: 6, message: t('validation.minLength', { min: 6 }) },
          ]}
          placeholder={t('users.passwordPlaceholder')}
        />
      )}

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
