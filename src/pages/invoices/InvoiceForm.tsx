import { Form } from 'antd';
import { useEffect } from 'react';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Invoice, Trip } from '@/types';

interface InvoiceFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Invoice>;
}

export function InvoiceForm(props: InvoiceFormProps) {
  const { form } = props;
  const { t } = useTranslation();
  const selectedTripId = Form.useWatch('trip_id', form);
  const taxAmount = Form.useWatch('tax_amount', form);
  const { data: customersData, isLoading: loadingCustomers } = useList<Customer>({
    resource: 'customers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const { data: tripsData, isLoading: loadingTrips } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 200 },
    filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
    sorters: [{ field: 'id', order: 'desc' }],
  });

  const customerOptions = (customersData?.data ?? []).map((c) => ({ label: c.name, value: c.id }));
  const tripOptions = (tripsData?.data ?? []).map((tr) => ({ label: `${tr.code} (${tr.start_point} → ${tr.end_point})`, value: tr.id }));
  const selectedTrip = (tripsData?.data ?? []).find((tr) => tr.id === selectedTripId);
  const expectedTotalAmount = selectedTrip ? Number(selectedTrip.price ?? 0) + Number(taxAmount ?? 0) : undefined;

  useEffect(() => {
    if (typeof expectedTotalAmount !== 'number') {
      return;
    }

    if (form.getFieldValue('total_amount') !== expectedTotalAmount) {
      form.setFieldValue('total_amount', expectedTotalAmount);
    }
  }, [expectedTotalAmount, form]);

  const statusOptions = [
    { label: t('invoices.statusDraft'), value: 'draft' },
    { label: t('invoices.statusIssued'), value: 'issued' },
    { label: t('invoices.statusPaid'), value: 'paid' },
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
              <FormItemText name="code" label={t('invoices.code')} required rules={[{ required: true, message: t('validation.required', { field: t('invoices.code') }) }]} />
              <FormItemSelect
                name="customer_id"
                label={t('invoices.customer')}
                required
                options={customerOptions}
                loading={loadingCustomers}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('invoices.customer') }) }]}
              />
              <FormItemSelect
                name="trip_id"
                label={t('invoices.trip')}
                required
                options={tripOptions}
                loading={loadingTrips}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('invoices.trip') }) }]}
              />
            </>
          ),
        },
        {
          value: 'financial',
          titleKey: 'financial',
          children: (
            <>
              <FormItemNumber
                name="total_amount"
                label={t('invoices.totalAmount')}
                required
                min={1}
                disabled={true}
                rules={[
                  { required: true, message: t('validation.required', { field: t('invoices.totalAmount') }) },
                  { type: 'number', min: 1, message: t('validation.min', { min: 1 }) },
                  {
                    validator: (_, value) => {
                      if (typeof expectedTotalAmount !== 'number' || typeof value !== 'number' || value === expectedTotalAmount) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('validation.invoiceTotalMustMatchTrip')));
                    },
                  },
                ]}
              />
              <FormItemNumber name="tax_amount" label={t('invoices.taxAmount')} min={0} rules={[{ type: 'number', min: 0, message: t('validation.min', { min: 0 }) }]} />
              <FormItemText name="issued_at" label={t('invoices.issuedAt')} type="date" />
              <FormItemText name="due_date" label={t('invoices.dueDate')} type="date" />
            </>
          ),
        },
        {
          value: 'status',
          titleKey: 'status',
          children: (
            <FormItemSelect name="status" label={t('common.status')} options={statusOptions} />
          ),
        },
      ]}
    />
  );
}
