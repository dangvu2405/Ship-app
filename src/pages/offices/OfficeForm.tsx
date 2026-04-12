import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemSelect, FormItemText, FormItemTextArea } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Office } from '@/types';

interface OfficeFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Office>;
}

export function OfficeForm(props: OfficeFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: companiesData, isLoading } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 200 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const companyOptions = (companiesData?.data ?? []).map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  }));

  return (
    <FormAccordionSections
      defaultOpen="relations"
      sections={[
        {
          value: 'relations',
          titleKey: 'relations',
          children: (
            <FormItemSelect
              name="company_id"
              label={t('payrolls.company')}
              required
              options={companyOptions}
              loading={isLoading}
              showSearch
              selectProps={{ optionFilterProp: 'label' }}
              rules={[{ required: true, message: t('validation.required', { field: t('payrolls.company') }) }]}
            />
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
              <FormItemTextArea name="address" label={t('companies.address')} rows={2} />
            </>
          ),
        },
      ]}
    />
  );
}
