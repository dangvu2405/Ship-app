import { Form } from 'antd';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemTextArea } from '@/components/form/FormItemTextArea';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer } from '@/types';

interface CustomerFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Customer>;
}

export function CustomerForm(props: CustomerFormProps) {
  const { form } = props;
  const { t } = useTranslation();
  // Spec: nếu type=company thì tax_code bắt buộc
  const customerType = Form.useWatch('type', form);
  const isCompany = customerType === 'company';
  const typeOptions = [
    { label: t('customers.typeCompany'), value: 'company' },
    { label: t('customers.typeIndividual'), value: 'individual' },
  ];

  return (
    <>
      <FormItemText name="name" label={t('customers.name')} required rules={[{ required: true, message: t('validation.required', { field: t('customers.name') }) }]} />
      <FormItemSelect name="type" label={t('customers.type')} required options={typeOptions} rules={[{ required: true, message: t('validation.required', { field: t('customers.type') }) }]} />
      <FormItemText
        name="tax_code"
        label={t('customers.taxCode')}
        required={isCompany}
        rules={[
          {
            required: isCompany,
            message: t('validation.required', { field: t('customers.taxCode') }),
          },
        ]}
      />
      <FormItemText name="email" label={t('customers.email')} type="email" rules={[{ type: 'email', message: t('validation.email') }]} />
      <FormItemText name="phone" label={t('customers.phone')} />
      <FormItemTextArea name="address" label={t('customers.address')} rows={2} />
      <FormItemText name="contact_person" label={t('customers.contactPerson')} />
    </>
  );
}
