import { useEffect, useState } from 'react';
import { Descriptions, Input, Modal, Tag, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDate, formatDateTime, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import toast from 'react-hot-toast';
import {
  ATTENDANCE_STATUS_COLOR,
  LEAVE_STATUS_COLOR,
  OT_STATUS_COLOR,
  VIOLATION_STATUS_COLOR,
  type ActionConfirmState,
  type DetailKind,
} from '@/components/system/workforce-ops.constants';

export function StatusTag({ value, colorMap }: { value: string; colorMap: Record<string, string> }) {
  return <Tag color={colorMap[value] ?? 'default'}>{formatStatusLabel(value)}</Tag>;
}

export function ActionConfirmModal({ state, onClose }: { state: ActionConfirmState; onClose: () => void }) {
  const { t } = useTranslation();
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!state.open) setReason('');
  }, [state.open]);

  const handleOk = async () => {
    if (state.requireReason && !reason.trim()) {
      toast.error(t('validation.required' as never));
      return;
    }
    setLoading(true);
    try {
      await state.onConfirm(reason.trim());
      onClose();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title={state.title}
      open={state.open}
      onCancel={onClose}
      onOk={handleOk}
      confirmLoading={loading}
      okText={t('common.confirm' as never)}
      cancelText={t('common.cancel' as never)}
    >
      {state.requireReason ? (
        <Input.TextArea
          rows={3}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          placeholder={state.placeholder ?? t('common.reasonPlaceholder' as never)}
        />
      ) : (
        <Typography.Text>{t('common.confirmAction' as never)}</Typography.Text>
      )}
    </Modal>
  );
}

const DETAIL_LABELS: Record<DetailKind, Record<string, string>> = {
  leave: {
    id: 'workforce.detail.leave.id',
    driver_id: 'workforce.detail.leave.driver_id',
    driver: 'workforce.detail.leave.driver',
    leave_type_id: 'workforce.detail.leave.leave_type_id',
    leave_type: 'workforce.detail.leave.leave_type',
    from_date: 'workforce.detail.leave.from_date',
    to_date: 'workforce.detail.leave.to_date',
    total_days: 'workforce.detail.leave.total_days',
    status: 'workforce.detail.leave.status',
    reason: 'workforce.detail.leave.reason',
    rejection_reason: 'workforce.detail.leave.rejection_reason',
    cancelled_at: 'workforce.detail.leave.cancelled_at',
    created_at: 'workforce.detail.leave.created_at',
    updated_at: 'workforce.detail.leave.updated_at',
  },
  overtime: {
    id: 'workforce.detail.overtime.id',
    driver_id: 'workforce.detail.overtime.driver_id',
    driver: 'workforce.detail.overtime.driver',
    company_id: 'workforce.detail.overtime.company_id',
    work_date: 'workforce.detail.overtime.work_date',
    start_time: 'workforce.detail.overtime.start_time',
    end_time: 'workforce.detail.overtime.end_time',
    ot_hours: 'workforce.detail.overtime.ot_hours',
    ot_rate: 'workforce.detail.overtime.ot_rate',
    ot_amount: 'workforce.detail.overtime.ot_amount',
    status: 'workforce.detail.overtime.status',
    reason: 'workforce.detail.overtime.reason',
    rejection_reason: 'workforce.detail.overtime.rejection_reason',
    approved_by: 'workforce.detail.overtime.approved_by',
    approved_at: 'workforce.detail.overtime.approved_at',
    created_at: 'workforce.detail.overtime.created_at',
  },
  violations: {
    id: 'workforce.detail.violations.id',
    driver_id: 'workforce.detail.violations.driver_id',
    driver: 'workforce.detail.violations.driver',
    company_id: 'workforce.detail.violations.company_id',
    trip_id: 'workforce.detail.violations.trip_id',
    type: 'workforce.detail.violations.type',
    occurred_at: 'workforce.detail.violations.occurred_at',
    status: 'workforce.detail.violations.status',
    description: 'workforce.detail.violations.description',
    penalty_amount: 'workforce.detail.violations.penalty_amount',
    confirmed_by: 'workforce.detail.violations.confirmed_by',
    confirmed_at: 'workforce.detail.violations.confirmed_at',
    dispute_reason: 'workforce.detail.violations.dispute_reason',
    resolution: 'workforce.detail.violations.resolution',
    resolution_note: 'workforce.detail.violations.resolution_note',
    waive_reason: 'workforce.detail.violations.waive_reason',
    created_at: 'workforce.detail.violations.created_at',
  },
  attendance: {
    id: 'workforce.detail.attendance.id',
    driver_id: 'workforce.detail.attendance.driver_id',
    driver: 'workforce.detail.attendance.driver',
    date: 'workforce.detail.attendance.date',
    check_in: 'workforce.detail.attendance.check_in',
    check_out: 'workforce.detail.attendance.check_out',
    work_hours: 'workforce.detail.attendance.work_hours',
    overtime_hours: 'workforce.detail.attendance.overtime_hours',
    status: 'workforce.detail.attendance.status',
    late_minutes: 'workforce.detail.attendance.late_minutes',
    note: 'workforce.detail.attendance.note',
  },
};

const STATUS_FIELDS = new Set(['status']);
const MONEY_FIELDS = new Set(['penalty_amount', 'ot_amount']);
const DATETIME_FIELDS = new Set(['occurred_at', 'cancelled_at', 'approved_at', 'confirmed_at', 'check_in', 'check_out', 'created_at', 'updated_at']);
const DATE_FIELDS = new Set(['from_date', 'to_date', 'work_date', 'date']);

function formatDetailValue(key: string, value: unknown, colorMap?: Record<string, string>) {
  if (value === null || value === undefined || value === '') return '-';
  if (STATUS_FIELDS.has(key)) {
    return colorMap ? <StatusTag value={String(value)} colorMap={colorMap} /> : <Tag>{formatStatusLabel(value)}</Tag>;
  }
  if (MONEY_FIELDS.has(key)) return formatMoney(value);
  if (DATETIME_FIELDS.has(key)) return formatDateTime(value);
  if (DATE_FIELDS.has(key)) return formatDate(value);
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

export function DetailDescriptions({ kind, data }: { kind: DetailKind; data: Record<string, unknown> }) {
  const { t } = useTranslation();
  const labels = DETAIL_LABELS[kind];
  const colorMap =
    kind === 'leave'
      ? LEAVE_STATUS_COLOR
      : kind === 'overtime'
        ? OT_STATUS_COLOR
        : kind === 'violations'
          ? VIOLATION_STATUS_COLOR
          : ATTENDANCE_STATUS_COLOR;

  const orderedKeys = Object.keys(labels).filter((k) => data[k] !== null && data[k] !== undefined && data[k] !== '');

  return (
    <Descriptions column={1} size="small" bordered>
      {orderedKeys.map((key) => (
        <Descriptions.Item key={key} label={t((labels[key] ?? key) as never)}>
          {formatDetailValue(key, data[key], STATUS_FIELDS.has(key) ? colorMap : undefined)}
        </Descriptions.Item>
      ))}
    </Descriptions>
  );
}
