import { DatePicker, Form } from 'antd';
import dayjs from 'dayjs';
import { FormAccordionSections, FormItemSelect, FormItemText, FormItemTextArea } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, CustomerGroup } from '@/types';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

interface CustomerFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Customer>;
  groups?: CustomerGroup[];
  isEdit?: boolean;
  customerId?: number;
}

const PHONE_PATTERN = /^[0-9+()\-\s]{8,15}$/;
const TAX_CODE_PATTERN = /^\d{10}(-\d{3})?$/;

import React from 'react';
const useCustomerUniqueCheck = () => {
  const codeTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const taxTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => () => {
    if (codeTimer.current) clearTimeout(codeTimer.current);
    if (taxTimer.current) clearTimeout(taxTimer.current);
  }, []);
  return (field: 'code' | 'tax_code', value: string, currentId?: number) =>
    new Promise<boolean>((resolve) => {
      const timerRef = field === 'code' ? codeTimer : taxTimer;
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(async () => {
        try {
          const res = await api.get(ENDPOINTS.customers.base, {
            params: { [field]: value, per_page: 5 },
            skipErrorToast: true,
          } as Parameters<typeof api.get>[1]);
          const list = (res.data as { data?: { data?: Array<{ id: number; code?: string; tax_code?: string }> } }).data?.data ?? [];
          const dup = list.find((row) => {
            const v = (row as Record<string, unknown>)[field];
            return typeof v === 'string' && v.trim().toLowerCase() === value.trim().toLowerCase() && row.id !== currentId;
          });
          resolve(!dup);
        } catch {
          resolve(true);
        }
      }, 350);
    });
};

export function CustomerForm(props: CustomerFormProps) {
  const { form, groups = [], customerId } = props;
  const checkCustomerUnique = useCustomerUniqueCheck();
  const { t } = useTranslation();
  const customerType = Form.useWatch('type', form);
  const isCompany = customerType === 'company';
  const typeOptions = [
    { label: t('customers.typeCompany'), value: 'company' },
    { label: t('customers.typeIndividual'), value: 'individual' },
  ];

  return (
    <FormAccordionSections
      defaultOpen="basic"
      sections={[
        {
          value: 'basic',
          titleKey: 'basic',
          children: (
            <>
              <FormItemText
                name="code"
                label={t('customers.code')}
                disabled
                placeholder="Tự sinh khi lưu"
              />
              <FormItemText name="name" label={t('customers.name')} required rules={[{ required: true, message: t('validation.required', { field: t('customers.name') }) }]} />
              <FormItemSelect name="type" label={t('customers.type')} required options={typeOptions} rules={[{ required: true, message: t('validation.required', { field: t('customers.type') }) }]} />
              <FormItemSelect
                name="group_id"
                label={t('customers.group')}
                options={groups.map((group) => ({ label: group.name, value: group.id }))}
              />
              <FormItemNumber name="credit_limit" label={t('customers.creditLimit')} min={0} />
              <FormItemNumber name="payment_terms_days" label={t('customers.paymentTermsDays')} min={0} />
              <FormItemText
                name="tax_code"
                label={t('customers.taxCode')}
                required={isCompany}
                rules={[
                  {
                    required: isCompany,
                    message: t('validation.required', { field: t('customers.taxCode') }),
                  },
                  {
                    validator: async (_: unknown, value: string) => {
                      if (!value || value.trim().length === 0) return;
                      if (!TAX_CODE_PATTERN.test(value.trim())) {
                        throw new Error('Mã số thuế không đúng định dạng (10 hoặc 10-3 chữ số)');
                      }
                      const ok = await checkCustomerUnique('tax_code', value.trim(), customerId);
                      if (!ok) throw new Error('Mã số thuế đã tồn tại');
                    },
                  },
                ]}
              />
              <FormItemSelect
                name="is_active"
                label={t('common.status')}
                options={[
                  { label: t('common.active'), value: 1 },
                  { label: t('common.inactive'), value: 0 },
                ]}
              />
            </>
          ),
        },
        {
          value: 'contact',
          titleKey: 'contact',
          children: (
            <>
              <FormItemText
                name="email"
                label={t('customers.email')}
                type="email"
                rules={[{ type: 'email', message: t('validation.email') }]}
              />
              <FormItemText
                name="phone"
                label={t('customers.phone')}
                rules={[
                  {
                    validator: (_: unknown, value: string) => {
                      if (!value || value.trim().length === 0) return Promise.resolve();
                      if (!PHONE_PATTERN.test(value.trim())) {
                        return Promise.reject(new Error('Số điện thoại không đúng định dạng'));
                      }
                      return Promise.resolve();
                    },
                  },
                ]}
              />
              <FormItemTextArea name="address" label={t('customers.address')} rows={2} />
              <FormItemText name="extra_contact_name" label={t('customers.contactPerson')} />
            </>
          ),
        },
        {
          value: 'contract',
          titleKey: 'contract',
          children: (
            <>
              <Form.Item
                label="Ngày bắt đầu hợp đồng"
                name="contract_start_date"
                getValueProps={(value: string | null | undefined) => ({ value: value ? dayjs(value) : null })}
                normalize={(value: dayjs.Dayjs | null) => (value ? value.format('YYYY-MM-DD') : null)}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
              <Form.Item
                label="Ngày kết thúc hợp đồng"
                name="contract_end_date"
                dependencies={['contract_start_date']}
                getValueProps={(value: string | null | undefined) => ({ value: value ? dayjs(value) : null })}
                normalize={(value: dayjs.Dayjs | null) => (value ? value.format('YYYY-MM-DD') : null)}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_: unknown, value: string | null) {
                      const start = getFieldValue('contract_start_date');
                      if (value && !start) {
                        return Promise.reject(new Error('Vui lòng nhập ngày bắt đầu hợp đồng trước'));
                      }
                      if (!value || !start) return Promise.resolve();
                      if (dayjs(value).isBefore(dayjs(start), 'day')) {
                        return Promise.reject(new Error('Ngày kết thúc phải sau ngày bắt đầu'));
                      }
                      return Promise.resolve();
                    },
                  }),
                ]}
              >
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
              </Form.Item>
              <FormItemTextArea name="notes" label="Ghi chú" rows={3} />
            </>
          ),
        },
      ]}
    />
  );
}
