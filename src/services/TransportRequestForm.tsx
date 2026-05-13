import { Form } from 'antd';
import { useSelect } from '@refinedev/antd';
import {
  FormAccordionSections,
  FormItemDatePicker,
  FormItemSelect,
  FormItemText,
} from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer } from '@/types/domain/employee';
import type { TransportRequest } from '@/types/domain/transport-request';

interface TransportRequestFormProps {
  form: ReturnType<typeof Form.useForm>[0];
  initialValues?: Partial<TransportRequest>;
  isViewMode?: boolean;
  isEdit?: boolean;
}

export function TransportRequestForm({ isEdit }: TransportRequestFormProps) {
  const { t } = useTranslation();

  const { selectProps: customerSelectProps } = useSelect<Customer>({
    resource: 'customers',
    optionLabel: (item) => `${item.code ? `${item.code} — ` : ''}${item.name}`,
  });

  const statusOptions = [
    { label: 'Mới', value: 'new' },
    { label: 'Đang xử lý', value: 'processing' },
    { label: 'Đã duyệt', value: 'approved' },
    { label: 'Từ chối', value: 'rejected' },
    { label: 'Đã hủy', value: 'cancelled' },
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
              {isEdit && (
                <FormItemText name="code" label="Mã yêu cầu" disabled placeholder="Hệ thống tự động sinh" />
              )}
              <FormItemSelect
                name="customer_id"
                label={t('customers.title')}
                required
                options={customerSelectProps.options as any}
                {...(customerSelectProps as any)}
                showSearch
                selectProps={{ optionFilterProp: 'label' }}
                rules={[{ required: true, message: t('validation.required', { field: t('customers.title') }) }]}
              />
              <FormItemText
                name="pickup_location"
                label="Điểm lấy hàng"
              />
              <FormItemText
                name="delivery_location"
                label="Điểm giao hàng"
              />
              <FormItemText name="cargo_type" label="Loại hàng hóa" />
              <FormItemDatePicker
                name="requested_delivery_date"
                label="Ngày yêu cầu giao"
                format="DD/MM/YYYY"
                valueFormat="YYYY-MM-DD"
              />
              {isEdit && (
                <FormItemSelect name="status" label={t('common.status')} options={statusOptions} />
              )}
            </>
          ),
        },
      ]}
    />
  );
}