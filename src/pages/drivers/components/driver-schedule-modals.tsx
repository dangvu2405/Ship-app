import {
  Alert,
  Button,
  Col,
  DatePicker,
  Descriptions,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import type { FormInstance } from 'antd/es/form';
import dayjs from 'dayjs';
import type { DriverSchedule } from '@/types';
import { SCHEDULE_STATUS_COLOR, SHIFT_OPTIONS, scheduleStatusLabel } from '@/pages/drivers/components/driver-schedule.constants';

export interface DriverScheduleCreateModalProps {
  open: boolean;
  onClose: () => void;
  form: FormInstance;
  loading: boolean;
  driverOptions: { label: string; value: number }[];
  vehicleOptions: { label: string; value: number }[];
  onSubmit: () => void;
}

export function DriverScheduleCreateModal({
  open,
  onClose,
  form,
  loading,
  driverOptions,
  vehicleOptions,
  onSubmit,
}: DriverScheduleCreateModalProps) {
  return (
    <Modal
      title="Tạo lịch công tác"
      open={open}
      onCancel={onClose}
      onOk={() => void onSubmit()}
      okText="Tạo lịch"
      confirmLoading={loading}
      width={600}
      destroyOnHidden
    >
      <Form form={form} layout="vertical">
        <Row gutter={12}>
          <Col xs={24} md={12}>
            <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
              <Select showSearch optionFilterProp="label" placeholder="Chọn tài xế" options={driverOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="work_date" label="Ngày làm việc" rules={[{ required: true, message: 'Chọn ngày' }]}>
              <DatePicker className="w-full" format="DD/MM/YYYY" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="shift_code" label="Ca làm việc" rules={[{ required: true, message: 'Chọn ca' }]}>
              <Select placeholder="Chọn ca" options={SHIFT_OPTIONS} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="vehicle_id" label="Phương tiện (tùy chọn)">
              <Select showSearch allowClear optionFilterProp="label" placeholder="Chọn xe" options={vehicleOptions} />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="start_time" label="Giờ bắt đầu">
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
          </Col>
          <Col xs={24} md={12}>
            <Form.Item name="end_time" label="Giờ kết thúc">
              <TimePicker className="w-full" format="HH:mm" />
            </Form.Item>
          </Col>
          <Col xs={24}>
            <Form.Item name="notes" label="Ghi chú">
              <Input.TextArea rows={2} maxLength={500} />
            </Form.Item>
          </Col>
        </Row>
      </Form>
    </Modal>
  );
}

export interface DriverScheduleDetailModalProps {
  detailSchedule: DriverSchedule | null;
  onClose: () => void;
  hosWarning: string | null;
  actionLoading: string | null;
  canManage: boolean;
  driverOptions: { label: string; value: number }[];
  vehicleOptions: { label: string; value: number }[];
  onApproveOverrideHos: () => void;
  onDismissHos: () => void;
  onSubmitDraft: () => void;
  onApprove: () => void;
  onOpenReject: () => void;
  onLock: () => void;
  onOpenOverride: () => void;
  showActions?: boolean;
}

export function DriverScheduleDetailModal({
  detailSchedule,
  onClose,
  hosWarning,
  actionLoading,
  canManage,
  driverOptions,
  vehicleOptions,
  onApproveOverrideHos,
  onDismissHos,
  onSubmitDraft,
  onApprove,
  onOpenReject,
  onLock,
  onOpenOverride,
  showActions = true,
}: DriverScheduleDetailModalProps) {
  return (
    <Modal
      title={
        detailSchedule ? (
          <Space>
            <span>Lịch #{detailSchedule.id}</span>
            {detailSchedule.status ? (
              <Tag color={SCHEDULE_STATUS_COLOR[detailSchedule.status] ?? 'default'}>
                {scheduleStatusLabel(detailSchedule.status)}
              </Tag>
            ) : null}
          </Space>
        ) : null
      }
      open={Boolean(detailSchedule)}
      onCancel={onClose}
      footer={null}
      width={520}
      destroyOnHidden
    >
      {detailSchedule ? (
        <Flex vertical gap={16}>
          {showActions && hosWarning ? (
            <Alert
              type="warning"
              message="Vi phạm HOS"
              showIcon
              description={
                <Flex vertical gap={8}>
                  <span>{hosWarning}</span>
                  <Space>
                    <Button size="small" danger loading={actionLoading === 'approve'} onClick={onApproveOverrideHos}>
                      Duyệt mặc dù vi phạm
                    </Button>
                    <Button size="small" onClick={onDismissHos}>
                      Huỷ
                    </Button>
                  </Space>
                </Flex>
              }
            />
          ) : null}
          <Descriptions column={1} size="small" bordered>
            <Descriptions.Item label="Ngày">{dayjs(detailSchedule.work_date).format('DD/MM/YYYY (dddd)')}</Descriptions.Item>
            <Descriptions.Item label="Tài xế">
              {driverOptions.find((d) => d.value === detailSchedule.driver_id)?.label ?? `#${detailSchedule.driver_id}`}
            </Descriptions.Item>
            <Descriptions.Item label="Ca">{detailSchedule.shift_code ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="Giờ">
              {detailSchedule.start_time ?? '-'} – {detailSchedule.end_time ?? '-'}
            </Descriptions.Item>
            {detailSchedule.vehicle_id ? (
              <Descriptions.Item label="Xe">
                {vehicleOptions.find((v) => v.value === detailSchedule.vehicle_id)?.label ?? `#${detailSchedule.vehicle_id}`}
              </Descriptions.Item>
            ) : null}
            {detailSchedule.notes ? <Descriptions.Item label="Ghi chú">{detailSchedule.notes}</Descriptions.Item> : null}
            {detailSchedule.override_reason ? (
              <Descriptions.Item label="Override">{detailSchedule.override_reason}</Descriptions.Item>
            ) : null}
          </Descriptions>
          <Typography.Text type="secondary" className="text-xs">
            Luồng: <strong>Nháp</strong> → <strong>Đã nộp</strong> → <strong>Đã duyệt</strong> → <strong>Đã khóa</strong>
          </Typography.Text>
          {showActions && canManage && !hosWarning ? (
            <Flex gap={8} wrap="wrap">
              {detailSchedule.status === 'draft' || !detailSchedule.status ? (
                <Button type="primary" loading={actionLoading === 'submit'} onClick={onSubmitDraft}>
                  Nộp lịch
                </Button>
              ) : null}
              {detailSchedule.status === 'submitted' ? (
                <>
                  <Button type="primary" loading={actionLoading === 'approve' || actionLoading === 'hos'} onClick={onApprove}>
                    Duyệt
                  </Button>
                  <Button danger onClick={onOpenReject}>
                    Từ chối
                  </Button>
                </>
              ) : null}
              {detailSchedule.status === 'approved' ? (
                <Button loading={actionLoading === 'lock'} onClick={onLock}>
                  Khóa lịch
                </Button>
              ) : null}
              {detailSchedule.status === 'locked' ? (
                <Button onClick={onOpenOverride}>Override lịch</Button>
              ) : null}
            </Flex>
          ) : null}
        </Flex>
      ) : null}
    </Modal>
  );
}

export interface DriverScheduleRejectModalProps {
  open: boolean;
  detailSchedule: DriverSchedule | null;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLoading: boolean;
}

export function DriverScheduleRejectModal({
  open,
  detailSchedule,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  confirmLoading,
}: DriverScheduleRejectModalProps) {
  return (
    <Modal
      title="Từ chối lịch công tác"
      open={open}
      onCancel={onClose}
      onOk={() => void onConfirm()}
      okText="Từ chối"
      okButtonProps={{ danger: true }}
      confirmLoading={confirmLoading}
    >
      <Typography.Text type="secondary" className="mb-3 block">
        Lịch #{detailSchedule?.id} · {detailSchedule?.work_date} · {detailSchedule?.shift_code}
      </Typography.Text>
      <Input.TextArea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Lý do từ chối..."
        rows={3}
        maxLength={500}
      />
    </Modal>
  );
}

export interface DriverScheduleOverrideModalProps {
  open: boolean;
  detailSchedule: DriverSchedule | null;
  reason: string;
  onReasonChange: (v: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  confirmLoading: boolean;
}

export function DriverScheduleOverrideModal({
  open,
  detailSchedule,
  reason,
  onReasonChange,
  onClose,
  onConfirm,
  confirmLoading,
}: DriverScheduleOverrideModalProps) {
  return (
    <Modal
      title="Override lịch đã khóa"
      open={open}
      onCancel={onClose}
      onOk={() => void onConfirm()}
      okText="Override"
      okButtonProps={{ disabled: !reason.trim() }}
      confirmLoading={confirmLoading}
    >
      <Typography.Text type="secondary" className="mb-3 block">
        Lịch #{detailSchedule?.id} đã khóa. Cần lý do để ghi nhận.
      </Typography.Text>
      <Input.TextArea
        value={reason}
        onChange={(e) => onReasonChange(e.target.value)}
        placeholder="Lý do override..."
        rows={3}
        maxLength={500}
      />
    </Modal>
  );
}
