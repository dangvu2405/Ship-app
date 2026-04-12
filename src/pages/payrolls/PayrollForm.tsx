import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Payroll } from '@/types';

interface PayrollFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Payroll>;
}

export function PayrollForm(props: PayrollFormProps) {
  void props;
  const { t } = useTranslation();

  const { data: companiesData, isLoading: companiesLoading } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 200 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const companyOptions = (companiesData?.data ?? []).map((c) => ({
    label: `${c.code} — ${c.name}`,
    value: c.id,
  }));

  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    label: [
      t('payrolls.month1'), t('payrolls.month2'), t('payrolls.month3'), t('payrolls.month4'),
      t('payrolls.month5'), t('payrolls.month6'), t('payrolls.month7'), t('payrolls.month8'),
      t('payrolls.month9'), t('payrolls.month10'), t('payrolls.month11'), t('payrolls.month12'),
    ][i],
    value: i + 1,
  }));

  const yearOptions = Array.from({ length: 10 }, (_, i) => {
    const year = new Date().getFullYear() - i;
    return { label: year.toString(), value: year };
  });

  return (
    <FormAccordionSections
      defaultOpen="basic"
      sections={[
        {
          value: 'basic',
          titleKey: 'basic',
          children: (
            <FormItemSelect
              name="company_id"
              label={t('payrolls.company')}
              required
              options={companyOptions}
              loading={companiesLoading}
              showSearch
              selectProps={{ optionFilterProp: 'label' }}
              rules={[
                { required: true, message: t('validation.required', { field: t('payrolls.company') }) },
              ]}
            />
          ),
        },
        {
          value: 'schedule',
          titleKey: 'schedule',
          children: (
            <>
              <FormItemSelect
                name="month"
                label={t('payrolls.month')}
                required
                options={monthOptions}
                rules={[
                  { required: true, message: t('validation.required', { field: t('payrolls.month') }) },
                ]}
              />

              <FormItemSelect
                name="year"
                label={t('payrolls.year')}
                required
                options={yearOptions}
                rules={[
                  { required: true, message: t('validation.required', { field: t('payrolls.year') }) },
                ]}
              />
            </>
          ),
        },
      ]}
    />
  );
}
