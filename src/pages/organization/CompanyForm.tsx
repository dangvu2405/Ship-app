import { Form, FormInstance } from 'antd';
import { Company } from '@/types';
import { FormItemText, FormItemTextArea, FormItemSelect } from '@/components/form';

interface CompanyFormProps {
  form: FormInstance;
  company?: Company | null;
}

export const CompanyForm = ({ form, company }: CompanyFormProps) => {
  return (
    <Form
      form={form}
      layout="vertical"
      initialValues={company || { status: 'active' }}
    >
      <FormItemText
        name="code"
        label="Code"
        rules={[
          { required: true, message: 'Please enter company code' },
          { max: 50, message: 'Code must be less than 50 characters' },
        ]}
        placeholder="Enter company code"
      />

      <FormItemText
        name="name"
        label="Company Name"
        rules={[
          { required: true, message: 'Please enter company name' },
          { max: 255, message: 'Name must be less than 255 characters' },
        ]}
        placeholder="Enter company name"
      />

      <FormItemText
        name="tax_code"
        label="Tax Code"
        rules={[{ max: 50, message: 'Tax code must be less than 50 characters' }]}
        placeholder="Enter tax code"
      />

      <FormItemText
        name="email"
        label="Email"
        rules={[
          { type: 'email', message: 'Please enter a valid email' },
          { max: 255, message: 'Email must be less than 255 characters' },
        ]}
        placeholder="Enter email address"
        inputProps={{ type: 'email' }}
      />

      <FormItemText
        name="phone"
        label="Phone"
        rules={[{ max: 20, message: 'Phone must be less than 20 characters' }]}
        placeholder="Enter phone number"
      />

      <FormItemTextArea
        name="address"
        label="Address"
        rules={[{ max: 500, message: 'Address must be less than 500 characters' }]}
        placeholder="Enter company address"
        rows={3}
      />

      <FormItemSelect
        name="status"
        label="Status"
        rules={[{ required: true, message: 'Please select status' }]}
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
        ]}
        placeholder="Select status"
      />
    </Form>
  );
};
