import { useMemo } from 'react';
import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Employee, Role, User } from '@/types';

interface UserFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<User>;
  isEdit?: boolean;
}

export function UserForm(props: UserFormProps) {
  const { isEdit = false } = props;
  const { t } = useTranslation();

  const { data: employeesData, isLoading: employeesLoading } = useList<Employee>({
    resource: 'employees',
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const { data: rolesData, isLoading: rolesLoading } = useList<Role>({
    resource: 'roles',
    pagination: { current: 1, pageSize: 100 },
    sorters: [{ field: 'name', order: 'asc' }],
  });

  const employeeOptions = useMemo(
    () =>
      (employeesData?.data ?? []).map((employee) => ({
        label: `${employee.code} - ${employee.name}`,
        value: employee.id,
      })),
    [employeesData?.data]
  );

  const roleOptions = useMemo(
    () =>
      (rolesData?.data ?? []).map((role) => ({
        label: role.name,
        value: role.id,
      })),
    [rolesData?.data]
  );

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  const sections = [
    {
      value: 'basic',
      titleKey: 'basic' as const,
      children: (
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
        </>
      ),
    },
    {
      value: 'relations',
      titleKey: 'relations' as const,
      children: (
        <>
          <FormItemSelect
            name="employee_id"
            label={t('users.employee')}
            options={employeeOptions}
            loading={employeesLoading}
            showSearch
            selectProps={{ optionFilterProp: 'label' }}
            allowClear
          />

          <FormItemSelect
            name="role_ids"
            label={t('users.roles')}
            options={roleOptions}
            loading={rolesLoading}
            mode="multiple"
            showSearch
            selectProps={{ optionFilterProp: 'label' }}
            allowClear
          />

          {!isEdit ? (
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
          ) : null}
        </>
      ),
    },
    {
      value: 'status',
      titleKey: 'status' as const,
      children: (
        <FormItemSelect
          name="status"
          label={t('common.status')}
          required
          options={statusOptions}
          rules={[
            { required: true, message: t('validation.required', { field: t('common.status') }) },
          ]}
        />
      ),
    },
  ];

  return <FormAccordionSections defaultOpen="basic" sections={sections} />;
}
