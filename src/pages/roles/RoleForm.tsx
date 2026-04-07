import { FormItemText } from '@/components/form/FormItemText';
import { FormItemTextArea } from '@/components/form/FormItemTextArea';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
export interface RoleFormValues {
  name: string;
  description?: string;
  permission_ids: number[];
}

interface RoleFormProps {
  permissionOptions: { label: string; value: number }[];
  permissionsLoading: boolean;
}

export function RoleForm({ permissionOptions, permissionsLoading }: RoleFormProps) {
  const { t } = useTranslation();

  return (
    <>
      <FormItemText name="name" label={t('roles.name')} required rules={[{ required: true, message: t('validation.required', { field: t('roles.name') }) }]} />
      <FormItemTextArea name="description" label={t('roles.description')} rows={2} />
      <FormItemSelect
        name="permission_ids"
        label={t('roles.permissions')}
        mode="multiple"
        options={permissionOptions}
        loading={permissionsLoading}
        showSearch
        allowClear
        filterOption={(input, option) =>
          String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
        }
      />
    </>
  );
}
