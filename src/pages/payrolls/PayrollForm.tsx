import { Form } from 'antd';
import { useMemo } from 'react';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Payroll } from '@/types';

interface PayrollFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Payroll>;
}

export function PayrollForm(props: PayrollFormProps) {
  const { form, initialValues } = props;
  void initialValues;
  const { t } = useTranslation();
  const now = new Date();
  const currentMonth = now.getMonth() + 1;
  const currentYear = now.getFullYear();
  const selectedYear = Form.useWatch('year', form) as number | undefined;

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

  const monthLabels = useMemo(
    () => [
      t('payrolls.month1'),
      t('payrolls.month2'),
      t('payrolls.month3'),
      t('payrolls.month4'),
      t('payrolls.month5'),
      t('payrolls.month6'),
      t('payrolls.month7'),
      t('payrolls.month8'),
      t('payrolls.month9'),
      t('payrolls.month10'),
      t('payrolls.month11'),
      t('payrolls.month12'),
    ],
    [t],
  );

  const monthOptions = useMemo(
    () =>
      Array.from({ length: 12 }, (_, i) => {
        const month = i + 1;
        return {
          label: monthLabels[i],
          value: month,
          disabled: selectedYear === currentYear && month > currentMonth,
        };
      }),
    [monthLabels, selectedYear, currentYear, currentMonth],
  );

  const yearOptions = useMemo(
    () =>
      Array.from({ length: 6 }, (_, i) => {
        const year = currentYear - i;
        return { label: year.toString(), value: year };
      }),
    [currentYear],
  );

  const validatePayrollPeriod = async () => {
    const month = form.getFieldValue('month') as number | undefined;
    const year = form.getFieldValue('year') as number | undefined;
    if (!month || !year) return;
    if (year > currentYear || (year === currentYear && month > currentMonth)) {
      throw new Error(t('validation.payrollPeriodMustNotBeFuture'));
    }
  };

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
                dependencies={['year']}
                rules={[
                  { required: true, message: t('validation.required', { field: t('payrolls.month') }) },
                  { validator: validatePayrollPeriod },
                ]}
              />

              <FormItemSelect
                name="year"
                label={t('payrolls.year')}
                required
                options={yearOptions}
                dependencies={['month']}
                rules={[
                  { required: true, message: t('validation.required', { field: t('payrolls.year') }) },
                  { validator: validatePayrollPeriod },
                ]}
              />
            </>
          ),
        },
      ]}
    />
  );
}
