import { useCallback } from 'react';
import { Form, Input, InputNumber, Modal, Select, Space } from 'antd';
import { useSelect } from '@refinedev/antd';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, OvertimeRequest } from '@/types';
import overtimeService from '@/services/overtime.service';
import { antdUtils } from '@/utils/antdGlobal';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

type CreateOvertimeModalProps = {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
};

export function CreateOvertimeModal({ open, onClose, onSuccess }: CreateOvertimeModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const { selectProps: driverSelectProps } = useSelect<Driver>({
    resource: 'drivers',
    optionLabel: (item) => item.employee?.name ?? item.name ?? `#${item.id}`,
    optionValue: 'id',
    onSearch: (value) => [
      { field: 'name', operator: 'contains', value }
    ],
  });

  const handleFinish = useCallback(async (vals: any) => {
    try {
      await overtimeService.create(vals as Partial<OvertimeRequest>);
      antdUtils.getMessage().success(t('workforce.createOvertimeSuccess'));
      onSuccess();
      onClose();
    } catch (err: any) {
      if (!shouldShowLocalErrorToast(err)) return;
      
      const apiErrors = err.response?.data?.errors;
      if (Array.isArray(apiErrors)) {
        form.setFields(
          apiErrors.map((e: any) => ({
            name: e.field,
            errors: [e.message],
          }))
        );
      } else {
        antdUtils.getMessage().error(getErrorMessage(err) ?? 'Tạo đơn thất bại');
      }
    }
  }, [onClose, onSuccess, t, form]);

  return (
    <Modal
      title={t('workforce.createOvertime')}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('workforce.createRequest')}
      cancelText={t('common.cancel')}
      destroyOnClose
      maskClosable={false}
    >
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
      >
        <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
          <Select
            {...driverSelectProps}
            showSearch
            placeholder="Chọn tài xế"
          />
        </Form.Item>
        <Form.Item name="work_date" label={t('workforce.overtimeDate')} rules={[{ required: true, message: 'Chọn ngày' }]}>
          <Input type="date" />
        </Form.Item>
        <Space style={{ width: '100%' }} align="start">
          <Form.Item name="start_time" label={t('workforce.startTimeOt')} rules={[{ required: true, message: 'Nhập giờ bắt đầu' }]}>
            <Input type="time" />
          </Form.Item>
          <Form.Item
            name="end_time"
            label={t('workforce.endTimeOt')}
            dependencies={['start_time']}
            rules={[
              { required: true, message: 'Nhập giờ kết thúc' },
              ({ getFieldValue }) => ({
                validator(_, value) {
                  const from = getFieldValue('start_time') as string | undefined;
                  if (!value || !from || String(value) > String(from)) {
                    return Promise.resolve();
                  }
                  return Promise.reject(new Error('Giờ kết thúc phải lớn hơn giờ bắt đầu'));
                },
              }),
            ]}
          >
            <Input type="time" />
          </Form.Item>
        </Space>
        <Form.Item name="ot_hours" label={`${t('workforce.overtimeHours')} (giờ)`}>
          <InputNumber style={{ width: '100%' }} min={0.5} step={0.5} />
        </Form.Item>
        <Form.Item name="reason" label={t('workforce.overtimeReason')}>
          <Input.TextArea rows={2} placeholder={t('workforce.overtimeReasonPlaceholder')} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
