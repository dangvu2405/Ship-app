import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { App, Button, Card, DatePicker, Descriptions, Form, Input, Modal, Select, Space, Table, Typography } from 'antd';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import { PlusOutlined, StopOutlined } from '@ant-design/icons';
import vehicleService from '@/services/vehicle.service';
import workforceOpsService from '@/services/workforce-ops.service';
import { useTranslation } from '@/hooks/useTranslation';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import type { Driver, VehicleAssignment } from '@/types';
import { formatDate } from '@/utils/displayFormat';

const ASSIGN_END_OPEN = '2099-12-31';

function approvedLeaveOverlapsAssignment(leaveFrom: string, leaveTo: string, assignFrom: string): boolean {
  return leaveFrom <= ASSIGN_END_OPEN && leaveTo >= assignFrom;
}

export interface VehicleAssignmentsProps {
  vehicleId: number;
}

export function VehicleAssignments({ vehicleId }: VehicleAssignmentsProps) {
  const { t } = useTranslation();
  const { message } = App.useApp();
  const queryClient = useQueryClient();
  const [releaseOpen, setReleaseOpen] = useState(false);
  const [assignOpen, setAssignOpen] = useState(false);
  const [releaseForm] = Form.useForm<{ release_reason: string }>();
  const [assignForm] = Form.useForm<{ driver_id: number; from_date: dayjs.Dayjs | string }>();

  const assignmentsQuery = useQuery({
    queryKey: ['vehicles', vehicleId, 'assignments'],
    queryFn: async () => {
      const res = await vehicleService.getAssignments(vehicleId, { per_page: 200 });
      return res.data.data;
    },
  });

  const availableDriversQuery = useQuery({
    queryKey: ['drivers', 'available'],
    queryFn: async () => {
      const res = await vehicleService.getAvailableDrivers({ per_page: 500 });
      return res.data.data;
    },
    enabled: assignOpen,
  });

  const { currentAssignments, historyAssignments } = useMemo(() => {
    const rows = assignmentsQuery.data ?? [];
    const current = rows.filter((a) => a.to_date == null || a.to_date === '');
    const history = rows
      .filter((a) => a.to_date != null && a.to_date !== '')
      .sort((a, b) => new Date(b.from_date).getTime() - new Date(a.from_date).getTime());
    return { currentAssignments: current, historyAssignments: history };
  }, [assignmentsQuery.data]);

  const primaryCurrent = currentAssignments[0];
  const multipleCurrentWarning = currentAssignments.length > 1;

  const releaseMutation = useMutation({
    mutationFn: (release_reason: string) => vehicleService.releaseCurrentAssignment(primaryCurrent!.id, { release_reason }),
    onSuccess: () => {
      message.success(t('vehicles.releaseVehicleSuccess'));
      setReleaseOpen(false);
      releaseForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'assignments'] });
    },
    onError: (error) => {
      if (!shouldShowLocalErrorToast(error)) return;
      message.error(getErrorMessage(error) || t('vehicles.releaseVehicleError'));
    },
  });

  const assignMutation = useMutation({
    mutationFn: (payload: { driver_id: number; from_date: string }) =>
      vehicleService.createAssignment(vehicleId, payload),
    onSuccess: () => {
      message.success(t('vehicles.assignDriverSuccess'));
      setAssignOpen(false);
      assignForm.resetFields();
      void queryClient.invalidateQueries({ queryKey: ['vehicles', vehicleId, 'assignments'] });
    },
    onError: (error) => {
      if (!shouldShowLocalErrorToast(error)) return;
      message.error(getErrorMessage(error) || t('vehicles.assignDriverError'));
    },
  });

  const submitRelease = async () => {
    const v = await releaseForm.validateFields();
    const reason = v.release_reason?.trim();
    if (!reason) {
      message.warning(t('vehicles.releaseReasonRequired'));
      return;
    }
    await releaseMutation.mutateAsync(reason);
  };

  const submitAssign = async () => {
    const v = await assignForm.validateFields();
    const fromValue = v.from_date;
    const from = dayjs.isDayjs(fromValue) ? fromValue.format('YYYY-MM-DD') : (fromValue as string);
    const driverId = v.driver_id;
    const leaveRes = await workforceOpsService.listLeaveRequests({
      driver_id: driverId,
      from,
      to: ASSIGN_END_OPEN,
      status: 'approved',
      per_page: 100,
    });
    const conflict = leaveRes.data.find((leave) =>
      approvedLeaveOverlapsAssignment(leave.from_date, leave.to_date, from),
    );
    if (conflict) {
      message.error(t('vehicles.leaveConflictR13'));
      return;
    }
    await assignMutation.mutateAsync({ driver_id: driverId, from_date: from });
  };

  const historyColumns: ColumnsType<VehicleAssignment> = useMemo(
    () => [
      {
        title: t('drivers.title'),
        key: 'driver',
        render: (_: unknown, r) => (r.driver as Driver)?.name ?? (r.driver as { name?: string })?.name ?? `#${r.driver_id}`,
      },
      { title: t('vehicles.assignFrom'), dataIndex: 'from_date', key: 'from_date', render: (d: string) => formatDate(d) },
      { title: t('vehicles.assignTo'), dataIndex: 'to_date', key: 'to_date', render: (d: string) => formatDate(d) },
      {
        title: t('vehicles.releaseReason'),
        dataIndex: 'release_reason',
        key: 'release_reason',
        ellipsis: true,
        render: (x: string | null) => x ?? '—',
      },
    ],
    [t],
  );

  const driverOptions = (availableDriversQuery.data ?? []).map((d) => ({
    value: d.id,
    label: d.employee?.name ?? d.name ?? d.code ?? `#${d.id}`,
  }));

  return (
    <Space direction="vertical" style={{ width: '100%' }} size="middle">
      {multipleCurrentWarning && (
        <Typography.Text type="danger">{t('vehicles.multipleCurrentAssignmentWarning')}</Typography.Text>
      )}
      {primaryCurrent ? (
        <Card
          size="small"
          style={{ borderColor: '#52c41a' }}
          title={<Typography.Text style={{ color: '#52c41a' }}>{t('vehicles.currentDriver')}</Typography.Text>}
          extra={
            <Button danger icon={<StopOutlined />} size="small" onClick={() => setReleaseOpen(true)}>
              {t('vehicles.releaseVehicle')}
            </Button>
          }
        >
          <Descriptions size="small" column={2}>
            <Descriptions.Item label={t('drivers.title')}>
              {(primaryCurrent.driver as Driver)?.name ??
                (primaryCurrent.driver as { name?: string })?.name ??
                `ID: ${primaryCurrent.driver_id}`}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.assignFrom')}>{formatDate(primaryCurrent.from_date)}</Descriptions.Item>
          </Descriptions>
        </Card>
      ) : (
        <Card size="small">
          <Space direction="vertical">
            <Typography.Text type="secondary">{t('vehicles.noCurrentDriver')}</Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>
              {t('vehicles.newAssignment')}
            </Button>
          </Space>
        </Card>
      )}

      {primaryCurrent && (
        <Button type="default" icon={<PlusOutlined />} onClick={() => setAssignOpen(true)}>
          {t('vehicles.newAssignment')}
        </Button>
      )}

      <Card title={t('vehicles.assignmentHistory')} size="small">
        <Table<VehicleAssignment>
          rowKey="id"
          loading={assignmentsQuery.isLoading}
          dataSource={historyAssignments}
          columns={historyColumns}
          pagination={false}
          scroll={{ x: 'max-content' }}
          locale={{ emptyText: t('vehicles.assignmentHistoryEmpty') }}
        />
      </Card>

      <Modal
        title={t('vehicles.releaseVehicle')}
        open={releaseOpen}
        onCancel={() => {
          setReleaseOpen(false);
          releaseForm.resetFields();
        }}
        onOk={() => void submitRelease()}
        confirmLoading={releaseMutation.isPending}
        destroyOnHidden
      >
        <Form name="vehicle-release-form" form={releaseForm} layout="vertical">
          <Form.Item
            name="release_reason"
            label={t('vehicles.releaseReason')}
            rules={[{ required: true, message: t('vehicles.releaseReasonRequired') }]}
          >
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>

      <Modal
        title={t('vehicles.newAssignment')}
        open={assignOpen}
        onCancel={() => {
          setAssignOpen(false);
          assignForm.resetFields();
        }}
        onOk={() => void submitAssign()}
        confirmLoading={assignMutation.isPending}
        destroyOnHidden
      >
        <Form name="vehicle-assign-form" form={assignForm} layout="vertical">
          <Form.Item
            name="driver_id"
            label={t('drivers.title')}
            rules={[{ required: true, message: t('validation.required', { field: t('drivers.title') }) }]}
          >
            <Select
              showSearch
              optionFilterProp="label"
              options={driverOptions}
              loading={availableDriversQuery.isLoading}
            />
          </Form.Item>
          <Form.Item
            name="from_date"
            label={t('vehicles.assignFrom')}
            rules={[{ required: true, message: t('validation.required', { field: t('vehicles.assignFrom') }) }]}
          >
            <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" placeholder={t('vehicles.assignFrom')} />
          </Form.Item>
        </Form>
      </Modal>
    </Space>
  );
}
