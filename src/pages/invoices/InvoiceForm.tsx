import { Form } from 'antd';
import { useList } from '@refinedev/core';
import { FormItemText } from '@/components/form/FormItemText';
import { FormItemSelect } from '@/components/form/FormItemSelect';
import { FormItemNumber } from '@/components/form/FormItemNumber';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Invoice, Trip } from '@/types';

interface InvoiceFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<Invoice>;
}

export function InvoiceForm(props: InvoiceFormProps) {
  void props;
  const { t } = useTranslation();
  const { data: customersData, isLoading: loadingCustomers } = useList<Customer>({
    resource: 'customers',
    pagination: { current: 1, pageSize: 500 },
  });
  const { data: tripsData, isLoading: loadingTrips } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 200 },
  });

  const customerOptions = (customersData?.data ?? []).map((c) => ({ label: c.name, value: c.id }));
  const tripOptions = (tripsData?.data ?? []).map((tr) => ({ label: `${tr.code} (${tr.start_point} → ${tr.end_point})`, value: tr.id }));

  const statusOptions = [
    { label: t('invoices.statusDraft'), value: 'draft' },
    { label: t('invoices.statusSent'), value: 'sent' },
    { label: t('invoices.statusPaid'), value: 'paid' },
    { label: t('invoices.statusCancelled'), value: 'cancelled' },
  ];

  return (
    <>
      <FormItemText name="code" label={t('invoices.code')} required rules={[{ required: true, message: t('validation.required', { field: t('invoices.code') }) }]} />
      <FormItemSelect
        name="customer_id"
        label={t('invoices.customer')}
        required
        options={customerOptions}
        loading={loadingCustomers}
        showSearch
        rules={[{ required: true, message: t('validation.required', { field: t('invoices.customer') }) }]}
      />
      <FormItemSelect name="trip_id" label={t('invoices.trip')} options={tripOptions} loading={loadingTrips} showSearch allowClear />
      <FormItemNumber name="total_amount" label={t('invoices.totalAmount')} required min={0} rules={[{ required: true, message: t('validation.required', { field: t('invoices.totalAmount') }) }]} />
      <FormItemNumber name="tax_amount" label={t('invoices.taxAmount')} min={0} />
      <FormItemText name="issued_at" label={t('invoices.issuedAt')} type="date" />
      <FormItemText name="due_date" label={t('invoices.dueDate')} type="date" />
      <FormItemSelect name="status" label={t('common.status')} options={statusOptions} />
    </>
  );
}
