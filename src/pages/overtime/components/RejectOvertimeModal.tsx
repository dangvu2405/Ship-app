import { useCallback } from 'react';
import { Form, Input, Modal, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import type { OvertimeRequest } from '@/types';
import overtimeService from '@/services/overtime.service';
import { antdUtils } from '@/utils/antdGlobal';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

type RejectOvertimeModalProps = {
  open: boolean;
  record: OvertimeRequest | null;
  onClose: () => void;
  onSuccess: () => void;
};

export function RejectOvertimeModal({ open, record, onClose, onSuccess }: RejectOvertimeModalProps) {
  const { t } = useTranslation();
  const [form] = Form.useForm();

  const handleFinish = useCallback(async (vals: any) => {
    if (!record) return;
    try {
      await overtimeService.reject(record.id, vals.rejection_reason as string);
      antdUtils.getMessage().success(t('workforce.rejected'));
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
        antdUtils.getMessage().error(getErrorMessage(err) ?? 'Thao tác thất bại');
      }
    }
  }, [record, onClose, onSuccess, t, form]);

  return (
    <Modal
      title={t('workforce.rejectOvertime')}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      okText={t('common.reject')}
      okButtonProps={{ danger: true }}
      cancelText={t('common.cancel')}
      destroyOnClose
      maskClosable={false}
    >
      <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        Tài xế #{record?.driver_id} · {record?.work_date} ({record?.start_time} → {record?.end_time})
      </Typography.Text>
      <Form
        form={form}
        layout="vertical"
        onFinish={handleFinish}
        preserve={false}
      >
        <Form.Item name="rejection_reason" label="Lý do từ chối" rules={[{ required: true, message: 'Nhập lý do' }]}>
          <Input.TextArea rows={3} placeholder="Nêu lý do..." />
        </Form.Item>
      </Form>
    </Modal>
  );
}
