import { DatePicker, Form, Input, InputNumber, Modal, Select } from 'antd';
import dayjs from 'dayjs';
import type { SalaryAdjustmentType } from '@/types/domain/payroll';
import { useTranslation } from '@/hooks/useTranslation';

export interface SalaryAdjustmentFormValues {
  type: SalaryAdjustmentType;
  amount: number;
  reason: string;
  applied_date: dayjs.Dayjs;
  driver_id?: number;
}

export interface SalaryAdjustmentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: SalaryAdjustmentFormValues) => Promise<void>;
  loading?: boolean;
  driverOptions: { value: number; label: string }[];
}

export function SalaryAdjustmentModal({
  open,
  onClose,
  onSubmit,
  loading,
  driverOptions,
}: SalaryAdjustmentModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm<SalaryAdjustmentFormValues>();

  const handleOk = async () => {
    const values = await form.validateFields();
    await onSubmit(values);
    form.resetFields();
  };

  return (
    <Modal
      open={open}
      title={t('payrolls.addAdjustment')}
      okText={t('common.submit')}
      cancelText={t('common.cancel')}
      confirmLoading={loading}
      onCancel={() => {
        form.resetFields();
        onClose();
      }}
      onOk={handleOk}
      destroyOnHidden
    >
      <Form<SalaryAdjustmentFormValues>
        form={form}
        layout="vertical"
        initialValues={{
          applied_date: dayjs(),
          type: 'bonus',
        }}
      >
        <Form.Item
          name="type"
          label={t('payrolls.adjustmentType')}
          rules={[{ required: true, message: t('validation.required') }]}
        >
          <Select
            options={[
              { value: 'bonus', label: t('payrolls.adjBonus') },
              { value: 'fine', label: t('payrolls.adjFine') },
              { value: 'deduction', label: t('payrolls.adjDeduction') },
            ]}
          />
        </Form.Item>
        <Form.Item
          name="amount"
          label={t('payrolls.adjustmentAmount')}
          rules={[{ required: true, message: t('validation.required') }]}
        >
          <InputNumber min={0} className="w-full" style={{ width: '100%' }} />
        </Form.Item>
        <Form.Item
          name="reason"
          label={t('payrolls.adjustmentReason')}
          rules={[{ required: true, message: t('validation.required') }]}
        >
          <Input.TextArea rows={3} />
        </Form.Item>
        <Form.Item
          name="applied_date"
          label={t('payrolls.appliedDate')}
          rules={[{ required: true, message: t('validation.required') }]}
        >
          <DatePicker className="w-full" format="DD/MM/YYYY" />
        </Form.Item>
        <Form.Item name="driver_id" label={t('payrolls.driverName')}>
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder={t('payrolls.driverSelectPlaceholder')}
            options={driverOptions}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
