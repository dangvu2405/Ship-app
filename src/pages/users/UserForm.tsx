import { useMemo } from 'react';
import { Form } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import type { UploadProps } from 'antd/es/upload';
import { InboxOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import { FormAccordionSections, FormItemSelect, FormItemText, FormItemUploadDragger } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage } from '@/utils/errorHandler';
import { strongPasswordSchema } from '@/schemas/password';
import { publicFileUploadToUrl } from '@/utils/publicFileUpload';
import type { Employee, Role, User } from '@/types';

const normUploadFileList = (e: { fileList?: UploadFile[] }) => e?.fileList ?? [];

interface UserFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<User>;
  isEdit?: boolean;
}

export function UserForm(props: UserFormProps) {
  const { isEdit = false } = props;
  const { t } = useTranslation();
  const toast = useAppFeedback();

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
    [employeesData?.data],
  );

  const roleOptions = useMemo(
    () =>
      (rolesData?.data ?? []).map((role) => ({
        label: role.name,
        value: role.id,
      })),
    [rolesData?.data],
  );

  const statusOptions = [
    { label: t('common.active'), value: 'active' },
    { label: t('common.inactive'), value: 'inactive' },
  ];

  const customAvatarRequest = useMemo<NonNullable<UploadProps['customRequest']>>(
    () => (options) => {
      void publicFileUploadToUrl({
        ...options,
        onSuccess: (body, xhr) => {
          toast.success(t('notifications.uploadSuccess'));
          options.onSuccess?.(body, xhr);
        },
        onError: (err) => {
          toast.error(getErrorMessage(err) || t('notifications.uploadError'));
          options.onError?.(err);
        },
      });
    },
    [t, toast],
  );

  const passwordMin = 8;

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
            <>
              <FormItemText
                name="password"
                label={t('users.password')}
                required
                type="password"
                autoComplete="new-password"
                rules={[
                  { required: true, message: t('validation.required', { field: t('users.password') }) },
                  () => ({
                    validator(_: unknown, value: string) {
                      const r = strongPasswordSchema.safeParse(value ?? '');
                      if (r.success) return Promise.resolve();
                      return Promise.reject(new Error(r.error.issues[0]?.message ?? t('validation.minLength', { min: passwordMin })));
                    },
                  }),
                ]}
                placeholder={t('users.passwordPlaceholder')}
              />
              <FormItemText
                name="password_confirmation"
                label={t('users.passwordConfirmation')}
                required
                type="password"
                autoComplete="new-password"
                dependencies={['password']}
                rules={[
                  { required: true, message: t('validation.required', { field: t('users.passwordConfirmation') }) },
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const pwd = getFieldValue('password') as string | undefined;
                      if (value === pwd) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('auth.registerPasswordMismatch')));
                    },
                  }),
                ]}
                placeholder={t('users.passwordConfirmationPlaceholder')}
              />
            </>
          ) : (
            <>
              <FormItemText
                name="password"
                label={t('users.newPassword')}
                type="password"
                autoComplete="new-password"
                help={t('users.optionalPasswordHint')}
                dependencies={['password_confirmation']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const confirm = getFieldValue('password_confirmation') as string | undefined;
                      if (!confirm?.trim()) {
                        if (!value?.trim()) {
                          return Promise.resolve();
                        }
                        if (value.trim().length < passwordMin) {
                          return Promise.reject(
                            new Error(t('validation.minLength', { min: passwordMin })),
                          );
                        }
                        return Promise.resolve();
                      }
                      if (!value?.trim()) {
                        return Promise.reject(new Error(t('validation.required', { field: t('users.newPassword') })));
                      }
                      if (value.trim().length < passwordMin) {
                        return Promise.reject(
                          new Error(t('validation.minLength', { min: passwordMin })),
                        );
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
                placeholder={t('users.newPasswordPlaceholder')}
              />
              <FormItemText
                name="password_confirmation"
                label={t('users.passwordConfirmation')}
                type="password"
                autoComplete="new-password"
                dependencies={['password']}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const pwd = getFieldValue('password') as string | undefined;
                      if (!pwd?.trim()) {
                        if (!value?.trim()) {
                          return Promise.resolve();
                        }
                        return Promise.reject(new Error(t('validation.required', { field: t('users.newPassword') })));
                      }
                      if (!value?.trim()) {
                        return Promise.reject(
                          new Error(t('validation.required', { field: t('users.passwordConfirmation') })),
                        );
                      }
                      if (value !== pwd) {
                        return Promise.reject(new Error(t('auth.registerPasswordMismatch')));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
                placeholder={t('users.passwordConfirmationPlaceholder')}
              />
            </>
          )}
        </>
      ),
    },
    {
      value: 'contact',
      titleKey: 'contact' as const,
      children: (
        <>
          <FormItemText
            name="emergency_contact_name"
            label={t('users.emergencyContactName')}
            placeholder={t('users.emergencyContactNamePlaceholder')}
          />
          <FormItemText
            name="emergency_contact_phone"
            label={t('users.emergencyContactPhone')}
            placeholder={t('users.emergencyContactPhonePlaceholder')}
          />
          <FormItemText
            name="residential_address"
            label={t('users.residentialAddress')}
            placeholder={t('users.residentialAddressPlaceholder')}
          />
          <FormItemUploadDragger
            name="avatar"
            label={t('users.avatar')}
            extra={<span className="text-xs text-muted-foreground">{t('users.avatarHint')}</span>}
            getValueFromEvent={normUploadFileList}
            accept="image/png,image/jpeg,image/jpg,image/webp,image/gif"
            maxCount={1}
            rules={[
              {
                validator(_, value: UploadFile[]) {
                  if (!value?.length) {
                    return Promise.resolve();
                  }
                  if (value.some((f) => f.status === 'uploading')) {
                    return Promise.reject(new Error(t('users.avatarWaitUpload')));
                  }
                  return Promise.resolve();
                },
              },
            ]}
            uploadProps={{
              listType: 'picture',
              customRequest: customAvatarRequest,
              beforeUpload: () => true,
            }}
          >
            <p className="flex justify-center">
              <InboxOutlined className="text-3xl text-muted-foreground" aria-hidden />
            </p>
            <p className="text-center text-sm font-medium">{t('users.avatarDraggerTitle')}</p>
            <p className="text-center text-xs text-muted-foreground">{t('users.avatarDraggerSubtitle')}</p>
          </FormItemUploadDragger>
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
