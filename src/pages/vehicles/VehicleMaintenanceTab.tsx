import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, DatePicker, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Timeline, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { CheckCircleOutlined, PlusOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import vehicleService from '@/services/vehicle.service';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import type { MaintenanceSchedule } from '@/types';
import { formatDate } from '@/utils/displayFormat';
import { formatCurrencyVND } from '@/utils/format';

function scheduleNeedsAttention(
  schedule: MaintenanceSchedule,
  vehicleOdometer: number | null | undefined,
): boolean {
  const odom = vehicleOdometer != null ? Number(vehicleOdometer) : null;
  const alertKm = schedule.alert_before_km ?? 0;
  if (schedule.next_due_km != null && odom != null) {
    const due = Number(schedule.next_due_km);
    if (odom >= due) return true;
    if (due - odom <= alertKm) return true;
  }
  if (schedule.next_due_date) {
    const daysLeft = dayjs(schedule.next_due_date).diff(dayjs(), 'day');
    const alertDays = schedule.alert_before_days ?? 7;
    if (daysLeft <= alertDays) return true;
  }
  return false;
}

export interface VehicleMaintenanceTabProps {
  vehicleId: number;
  currentOdometerKm?: number | null;
  mode?: 'all' | 'schedules' | 'records';
}

export function VehicleMaintenanceTab({ vehicleId, currentOdometerKm, mode = 'all' }: VehicleMaintenanceTabProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [recordModalOpen, setRecordModalOpen] = useState(false);
  const [completeModalOpen, setCompleteModalOpen] = useState(false);
  const [completeRecordId, setCompleteRecordId] = useState<number | null>(null);
  const [recordForm] = Form.useForm();
  const [completeForm] = Form.useForm<{ odometer_km: number }>();

  const schedulesQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'maintenance-schedules'],
    queryFn: async () => {
      const res = await vehicleService.getMaintenanceSchedules(vehicleId, { per_page: 200 });
      return res.data.data;
    },
  });

  const recordsQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'maintenance-records'],
    queryFn: async () => {
      const res = await vehicleService.getMaintenanceRecords(vehicleId, { per_page: 200 });
      return res.data.data;
    },
  });

  const schedules = schedulesQuery.data ?? [];
  const records = useMemo(
    () => [...(recordsQuery.data ?? [])].sort((a, b) => dayjs(b.started_date).valueOf() - dayjs(a.started_date).valueOf()),
    [recordsQuery.data],
  );

  const createRecordMutation = useMutation({
    mutationFn: (payload: Parameters<typeof vehicleService.createMaintenanceRecord>[1]) =>
      vehicleService.createMaintenanceRecord(vehicleId, payload),
    onSuccess: () => {
      message.success(t('notifications.createSuccess', { item: t('vehicles.maintenanceRecord') }));
      setRecordModalOpen(false);
      recordForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'maintenance-records'] });
    },
    onError: (error) => {
      if (!shouldShowLocalErrorToast(error)) return;
      message.error(getErrorMessage(error) || t('notifications.createError', { item: t('vehicles.maintenanceRecord') }));
    },
  });

  const completeMutation = useMutation({
    mutationFn: ({ id, odometer_km }: { id: number; odometer_km: number }) =>
      vehicleService.completeMaintenanceRecord(id, { odometer_km }),
    onSuccess: () => {
      message.success(t('vehicles.maintenanceCompleteSuccess'));
      setCompleteModalOpen(false);
      setCompleteRecordId(null);
      completeForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'maintenance-records'] });
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'maintenance-schedules'] });
    },
    onError: (error) => {
      if (!shouldShowLocalErrorToast(error)) return;
      message.error(getErrorMessage(error) || t('vehicles.maintenanceCompleteError'));
    },
  });

  const scheduleColumns: ColumnsType<MaintenanceSchedule> = useMemo(
    () => [
      { title: t('vehicles.maintenanceTask'), dataIndex: 'task_name', key: 'task_name' },
      {
        title: t('vehicles.nextDueKm'),
        dataIndex: 'next_due_km',
        key: 'next_due_km',
        align: 'right',
        render: (v: number | null) => (v != null ? String(v) : '—'),
      },
      {
        title: t('vehicles.nextDueDate'),
        dataIndex: 'next_due_date',
        key: 'next_due_date',
        render: (v: string | null) => (v ? formatDate(v) : '—'),
      },
      {
        title: t('common.status'),
        key: 'due',
        render: (_: unknown, row) => {
          const need = scheduleNeedsAttention(row, currentOdometerKm);
          return need ? <Tag color="warning">{t('vehicles.needsMaintenance')}</Tag> : <Tag>{t('vehicles.maintenanceOk')}</Tag>;
        },
      },
    ],
    [t, currentOdometerKm],
  );

  const openComplete = (id: number) => {
    setCompleteRecordId(id);
    completeForm.setFieldsValue({ odometer_km: currentOdometerKm != null ? Number(currentOdometerKm) : undefined });
    setCompleteModalOpen(true);
  };

  const submitRecord = async () => {
    const v = await recordForm.validateFields();
    const startedDate =
      v.started_date && dayjs.isDayjs(v.started_date)
        ? v.started_date.format('YYYY-MM-DD')
        : (v.started_date as string);
    await createRecordMutation.mutateAsync({
      type: v.type,
      title: v.title,
      maintenance_schedule_id: v.maintenance_schedule_id ?? null,
      description: v.description,
      odometer_km: v.odometer_km,
      started_date: startedDate,
    });
  };

  const submitComplete = async () => {
    if (completeRecordId == null) return;
    const v = await completeForm.validateFields();
    await completeMutation.mutateAsync({ id: completeRecordId, odometer_km: Number(v.odometer_km) });
  };

  const showSchedules = mode === 'all' || mode === 'schedules';
  const showRecords = mode === 'all' || mode === 'records';

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="large">
      {showSchedules && (
      <div>
        <Typography.Title level={5}>
          <ToolOutlined /> {t('vehicles.maintenanceSchedules')}
        </Typography.Title>
        <Table<MaintenanceSchedule>
          rowKey="id"
          size="small"
          loading={schedulesQuery.isLoading}
          dataSource={schedules}
          columns={scheduleColumns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('vehicles.maintenanceSchedulesEmpty') }}
        />
      </div>
      )}

      {showRecords && (
      <div>
        <Space className="mb-2">
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setRecordModalOpen(true)}>
            {t('vehicles.addMaintenanceRecord')}
          </Button>
        </Space>
        <Typography.Title level={5}>{t('vehicles.maintenanceHistory')}</Typography.Title>
        <Timeline
          items={records.map((r) => ({
            color: r.status === 'completed' ? 'green' : 'blue',
            children: (
              <div>
                <Space wrap>
                  <Typography.Text strong>{r.title}</Typography.Text>
                  <Tag>{r.type}</Tag>
                  <Tag>{r.status}</Tag>
                  {r.status !== 'completed' && (
                    <Button size="small" type="link" icon={<CheckCircleOutlined />} onClick={() => openComplete(r.id)}>
                      {t('vehicles.markComplete')}
                    </Button>
                  )}
                </Space>
                <div className="text-sm text-slate-600">
                  {formatDate(r.started_date)}
                  {r.completed_date ? ` → ${formatDate(r.completed_date)}` : ''}
                  {r.odometer_km != null ? ` · ${t('vehicles.odometerAtService')}: ${r.odometer_km}` : ''}
                  {r.total_cost != null ? ` · ${formatCurrencyVND(r.total_cost)}` : ''}
                </div>
                {r.description ? <Typography.Paragraph type="secondary">{r.description}</Typography.Paragraph> : null}
              </div>
            ),
          }))}
        />
        {!records.length && !recordsQuery.isLoading ? (
          <Typography.Text type="secondary">{t('vehicles.maintenanceRecordsEmpty')}</Typography.Text>
        ) : null}
      </div>
      )}

      <Modal
        title={t('vehicles.addMaintenanceRecord')}
        open={recordModalOpen}
        onCancel={() => {
          setRecordModalOpen(false);
          recordForm.resetFields();
        }}
        onOk={() => void submitRecord()}
        confirmLoading={createRecordMutation.isPending}
        destroyOnHidden
      >
        <Form name="vehicle-maintenance-record-form" form={recordForm} layout="vertical">
          <Form.Item
            name="type"
            label={t('vehicles.maintenanceRecordType')}
            initialValue="scheduled"
            rules={[{ required: true }]}
          >
            <Select
              options={[
                { value: 'scheduled', label: t('vehicles.maintenanceType.scheduled') },
                { value: 'unscheduled', label: t('vehicles.maintenanceType.unscheduled') },
              ]}
            />
          </Form.Item>
          <Form.Item name="maintenance_schedule_id" label={t('vehicles.linkedSchedule')}>
            <Select
              allowClear
              options={schedules.map((s) => ({ value: s.id, label: s.task_name }))}
            />
          </Form.Item>
          <Form.Item
            name="title"
            label={t('vehicles.maintenanceTitle')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.maintenanceTitle') }) }]}
          >
            <Input />
          </Form.Item>
          <Form.Item name="description" label={t('common.description')}>
            <Input.TextArea rows={2} />
          </Form.Item>
          <Form.Item
            name="started_date"
            label={t('vehicles.startedDate')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.startedDate') }) }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={t('vehicles.startedDate')} />
          </Form.Item>
          <Form.Item name="odometer_km" label={t('vehicles.odometerAtService')}>
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('vehicles.completeMaintenanceTitle')}
        open={completeModalOpen}
        onCancel={() => {
          setCompleteModalOpen(false);
          setCompleteRecordId(null);
          completeForm.resetFields();
        }}
        onOk={() => void submitComplete()}
        confirmLoading={completeMutation.isPending}
        destroyOnHidden
      >
        <Typography.Paragraph type="secondary">{t('vehicles.completeMaintenanceHint')}</Typography.Paragraph>
        <Form name="vehicle-maintenance-complete-form" form={completeForm} layout="vertical">
          <Form.Item
            name="odometer_km"
            label={t('vehicles.newOdometerKm')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.newOdometerKm') }) }]}
          >
            <InputNumber min={0} className="w-full" />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
