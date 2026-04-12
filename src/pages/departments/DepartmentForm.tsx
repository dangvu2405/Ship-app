import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Department, Office } from '@/types';

interface DepartmentFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Department>;
}

export function DepartmentForm(props: DepartmentFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: officesData, isLoading: officesLoading } = useList<Office>({
    resource: 'offices',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const officeOptions = (officesData?.data ?? []).map((o) => ({
    label: `${o.code} — ${o.name}`,
    value: o.id,
  }));

  const { data: deptData, isLoading: deptLoading } = useList<Department>({
    resource: 'departments',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const parentOptions = (deptData?.data ?? []).map((d) => ({
    label: `${d.code} — ${d.name}`,
    value: d.id,
  }));

  return (
    <FormAccordionSections
      defaultOpen="relations"
      sections={[
        {
          value: 'relations',
          titleKey: 'relations',
          children: (
            <>
              <FormItemSelect
                name="office_id"
                label={t('employees.office')}
                required
                options={officeOptions}
                loading={officesLoading}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('employees.office') }) }]}
              />
              <FormItemSelect
                name="parent_id"
                label={t('departments.parentDepartment')}
                options={parentOptions}
                loading={deptLoading}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                allowClear
              />
            </>
          ),
        },
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
      ]}
    />
  );
}
