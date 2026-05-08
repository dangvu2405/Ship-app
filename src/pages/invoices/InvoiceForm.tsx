import { Form } from 'antd';
import type { FormInstance } from 'antd/es/form';
import { useEffect } from 'react';
import { useList } from '@refinedev/core';
import { FormAccordionSections, FormItemNumber, FormItemSelect, FormItemText } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Invoice, Trip } from '@/types';

export interface InvoiceFormProps {
  form: FormInstance;
  initialValues?: Partial<Invoice>;
  isCreate?: boolean;
  isEdit?: boolean;
  amountsLocked?: boolean;
}

function roundMoney(n: number): number {
  return Math.round(n * 100) / 100;
}

export function InvoiceForm(props: InvoiceFormProps) {
  const { form, initialValues, isCreate, isEdit, amountsLocked } = props;
  const { t } = useTranslation();
  const selectedTripId = Form.useWatch('trip_id', form);
  const vatRateWatch = Form.useWatch('vat_rate', form);
  const manualSubtotal = Form.useWatch('subtotal', form);

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

  const customerOptions = (customersData?.data ?? []).map((c) => ({
    label: c.name ?? c.code ?? `#${c.id}`,
    value: c.id,
  }));
  const tripOptions = (tripsData?.data ?? []).map((tr) => ({
    label: `${tr.code} (${tr.start_point} → ${tr.end_point})`,
    value: tr.id,
  }));
  const selectedTrip = (tripsData?.data ?? []).find((tr) => tr.id === selectedTripId);
  const subtotalFromTrip = selectedTrip ? Number(selectedTrip.price ?? 0) : null;
  const subtotalEffective =
    selectedTripId != null && selectedTripId !== undefined
      ? subtotalFromTrip
      : typeof manualSubtotal === 'number'
        ? manualSubtotal
        : null;

  const vatRateNum = Number(vatRateWatch ?? initialValues?.vat_rate ?? 10);
  const vatAmount =
    subtotalEffective != null && !Number.isNaN(subtotalEffective)
      ? roundMoney((subtotalEffective * (Number.isFinite(vatRateNum) ? vatRateNum : 0)) / 100)
      : 0;
  const totalAmount =
    subtotalEffective != null && !Number.isNaN(subtotalEffective) ? roundMoney(subtotalEffective + vatAmount) : 0;

  useEffect(() => {
    if (amountsLocked) {
      return;
    }
    if (selectedTripId != null && selectedTripId !== undefined && typeof subtotalFromTrip === 'number') {
      form.setFieldValue('subtotal', subtotalFromTrip);
    }
  }, [selectedTripId, subtotalFromTrip, form, amountsLocked]);

  useEffect(() => {
    if (amountsLocked) {
      return;
    }
    if (selectedTrip?.customer_id != null) {
      form.setFieldValue('customer_id', selectedTrip.customer_id);
    }
  }, [selectedTrip?.customer_id, form, amountsLocked]);

  useEffect(() => {
    if (amountsLocked) {
      return;
    }
    if (subtotalEffective == null || Number.isNaN(subtotalEffective)) {
      return;
    }
    form.setFieldValue('vat_amount', vatAmount);
    form.setFieldValue('total_amount', totalAmount);
  }, [subtotalEffective, vatAmount, totalAmount, form, amountsLocked]);

  const financialLocked = amountsLocked === true;
  const statusOptions = [{ label: t('invoices.statusDraft'), value: 'draft' }];

  return (
    <FormAccordionSections
      defaultOpen="basic"
      sections={[
        {
          value: 'basic',
          titleKey: 'basic',
          children: (
            <>
              {!isCreate && (
                <FormItemText
                  name="code"
                  label={t('invoices.code')}
                  required
                  disabled={Boolean(isEdit)}
                  rules={[{ required: true, message: t('validation.required', { field: t('invoices.code') }) }]}
                />
              )}
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
                options={tripOptions}
                loading={loadingTrips}
                showSearch
                allowClear
                selectProps={{ optionFilterProp: 'label' }}
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
                name="subtotal"
                label={t('invoices.subtotal')}
                required
                min={0}
                disabled={financialLocked || (selectedTripId != null && selectedTripId !== undefined)}
                rules={[{ required: true, message: t('validation.required', { field: t('invoices.subtotal') }) }]}
              />
              <FormItemNumber
                name="vat_rate"
                label={t('invoices.vatRatePercent')}
                min={0}
                max={100}
                disabled={financialLocked}
              />
              <FormItemNumber
                name="vat_amount"
                label={t('invoices.vatAmount')}
                min={0}
                disabled
                rules={[{ type: 'number', min: 0, message: t('validation.min', { min: 0 }) }]}
              />
              <FormItemNumber
                name="total_amount"
                label={t('invoices.totalAmount')}
                required
                min={0}
                disabled
                rules={[
                  { required: true, message: t('validation.required', { field: t('invoices.totalAmount') }) },
                  { type: 'number', min: 0, message: t('validation.min', { min: 0 }) },
                ]}
              />
              <FormItemText name="issued_at" label={t('invoices.issuedAt')} type="date" disabled={financialLocked} />
              <FormItemText
                name="due_date"
                label={t('invoices.dueDate')}
                type="date"
                disabled={financialLocked}
                rules={[
                  ({ getFieldValue }) => ({
                    validator(_, value) {
                      const issuedAt = getFieldValue('issued_at') as string | undefined;
                      if (!value || !issuedAt || String(value) >= String(issuedAt)) {
                        return Promise.resolve();
                      }
                      return Promise.reject(new Error(t('validation.dueDateAfterIssuedAt')));
                    },
                  }),
                ]}
              />
            </>
          ),
        },
        {
          value: 'status',
          titleKey: 'status',
          children: (
            <FormItemSelect
              name="status"
              label={t('common.status')}
              required
              options={statusOptions}
              rules={[{ required: true, message: t('validation.required', { field: t('common.status') }) }]}
            />
          ),
        },
      ]}
    />
  );
}
