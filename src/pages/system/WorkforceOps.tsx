import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Descriptions, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, TimePicker, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import workforceOpsService from '@/services/workforce-ops.service';
import type { DriverSchedule, LeaveRequest, OvertimeRequest, ViolationRecord, WorkforceAttendanceRecord } from '@/types';
import { getErrorMessage, getErrorStatus } from '@/utils/errorHandler';
import { afterOrEqualDateRule, afterTimeRule, nonNegativeNumberRule, requiredRule } from '@/utils/validation';
import dayjs from 'dayjs';

type TabKey = 'schedule' | 'attendance' | 'leave' | 'overtime' | 'violations';
type DetailKind = 'leave' | 'overtime' | 'violations';

export function WorkforceOps() {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [overtimeForm] = Form.useForm();
  const [violationForm] = Form.useForm();
  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [loading, setLoading] = useState(false);
  const [reason, setReason] = useState('');
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);
  const [scheduleFilters, setScheduleFilters] = useState<Record<string, unknown>>({});
  const [attendanceFilters, setAttendanceFilters] = useState<Record<string, unknown>>({});
  const [leaveFilters, setLeaveFilters] = useState<Record<string, unknown>>({});
  const [overtimeFilters, setOvertimeFilters] = useState<Record<string, unknown>>({});
  const [violationFilters, setViolationFilters] = useState<Record<string, unknown>>({});
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<Array<{ label: string; value: number }>>([]);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailKind, setDetailKind] = useState<DetailKind>('leave');
  const [detailData, setDetailData] = useState<unknown>(null);

  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [attendance, setAttendance] = useState<WorkforceAttendanceRecord[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveRequest[]>([]);
  const [overtimeRows, setOvertimeRows] = useState<OvertimeRequest[]>([]);
  const [violationRows, setViolationRows] = useState<ViolationRecord[]>([]);
  const requiredRules = (label: string) => [requiredRule(label)];

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'schedule') {
        const data = await workforceOpsService.listDriverSchedules({ per_page: 50, ...scheduleFilters });
        setSchedules(data.data);
      } else if (tab === 'attendance') {
        const data = await workforceOpsService.listAttendance({ per_page: 50, ...attendanceFilters });
        setAttendance(data.data);
      } else if (tab === 'leave') {
        const data = await workforceOpsService.listLeave({ per_page: 50, ...leaveFilters });
        setLeaveRows(data.data);
      } else if (tab === 'overtime') {
        const data = await workforceOpsService.listOvertime({ per_page: 50, ...overtimeFilters });
        setOvertimeRows(data.data);
      } else {
        const data = await workforceOpsService.listViolations({ per_page: 50, ...violationFilters });
        setViolationRows(data.data);
      }
    } catch (error) {
      toast.error(t('common.loadError'));
      void error;
    } finally {
      setLoading(false);
    }
  }, [t, scheduleFilters, attendanceFilters, leaveFilters, overtimeFilters, violationFilters]);

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const response = await workforceOpsService.listLeaveTypes();
        const options = (response.data || []).map((item) => ({ label: item.name || `Type ${item.id}`, value: item.id }));
        setLeaveTypeOptions(options);
      } catch (error) {
        void error;
      }
    };
    void loadLeaveTypes();
  }, []);

  useEffect(() => {
    void loadTab(activeTab);
  }, [activeTab, loadTab]);

  const runAction = useCallback(
    async (action: () => Promise<unknown>, refreshTab: TabKey, successMessage: string) => {
      try {
        await action();
        toast.success(successMessage);
        await loadTab(refreshTab);
      } catch (error) {
        const status = getErrorStatus(error);
        if (status === 409) {
          toast.error(getErrorMessage(error) || 'Conflict detected. Please refresh and retry.');
          return;
        }
        toast.error(getErrorMessage(error) || t('common.saveError'));
        void error;
      }
    },
    [loadTab, t],
  );

  const scheduleColumns: ColumnsType<DriverSchedule> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: ['driver', 'name'], render: (_, row) => row.driver?.name || row.driver_id },
    { title: 'Date', dataIndex: 'work_date' },
    { title: 'Office', dataIndex: 'office_id' },
    { title: 'Vehicle', dataIndex: 'vehicle_id', render: (_, row) => row.vehicle?.plate_number || row.vehicle_id || '-' },
    { title: 'Start', dataIndex: 'start_time' },
    { title: 'End', dataIndex: 'end_time' },
    { title: 'Shift', dataIndex: 'shift_code' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v || 'draft'}</Tag> },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Space>
          <Button
            size="small"
            disabled={row.status !== 'draft'}
            onClick={async () => {
            await runAction(() => workforceOpsService.submitDriverSchedule(row.id), 'schedule', 'Submitted');
          }}
          >
            Submit
          </Button>
          <Button
            size="small"
            disabled={row.status !== 'submitted'}
            onClick={async () => {
            await runAction(async () => {
              const hos = await workforceOpsService.checkDriverScheduleHos(row.id);
              const allowed = hos.data?.allowed ?? true;
              if (!allowed) {
                throw new Error(hos.data?.reason || 'HOS check failed. Approval blocked.');
              }
              await workforceOpsService.approveDriverSchedule(row.id);
            }, 'schedule', 'Approved');
          }}
          >
            Approve
          </Button>
          <Button
            size="small"
            danger
            disabled={row.status !== 'submitted'}
            onClick={async () => {
            await runAction(() => workforceOpsService.rejectDriverSchedule(row.id), 'schedule', 'Rejected');
          }}
          >
            Reject
          </Button>
          <Button
            size="small"
            disabled={row.status !== 'approved'}
            onClick={async () => {
              await runAction(() => workforceOpsService.lockDriverSchedule(row.id), 'schedule', 'Locked');
            }}
          >
            Lock
          </Button>
          <Button
            size="small"
            disabled={row.status !== 'locked'}
            onClick={async () => {
              await runAction(
                () => workforceOpsService.overrideDriverSchedule(row.id, reason || 'Manual override by admin'),
                'schedule',
                'Overridden',
              );
            }}
          >
            Override
          </Button>
          <Button
            size="small"
            onClick={() => {
              setEditingScheduleId(row.id);
              form.setFieldsValue({
                driver_id: row.driver_id,
                office_id: row.office_id,
                work_date: row.work_date ? dayjs(row.work_date) : undefined,
                shift_code: row.shift_code,
                start_time: row.start_time ? dayjs(row.start_time, 'HH:mm') : undefined,
                end_time: row.end_time ? dayjs(row.end_time, 'HH:mm') : undefined,
                vehicle_id: row.vehicle_id,
                notes: row.notes,
              });
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            danger
            disabled={row.status === 'locked'}
            onClick={async () => {
              await runAction(() => workforceOpsService.deleteDriverSchedule(row.id), 'schedule', 'Deleted');
            }}
          >
            Delete
          </Button>
        </Space>
      ),
    },
  ];

  const scheduleInitialValues = useMemo(
    () => ({
      shift_code: 'day',
    }),
    [],
  );

  const submitScheduleForm = async () => {
    const values = await form.validateFields();
    const payload = {
      driver_id: values.driver_id,
      office_id: values.office_id,
      work_date: values.work_date?.format('YYYY-MM-DD'),
      shift_code: values.shift_code,
      start_time: values.start_time?.format('HH:mm'),
      end_time: values.end_time?.format('HH:mm'),
      vehicle_id: values.vehicle_id,
      notes: values.notes,
    };
    if (editingScheduleId) {
      await runAction(() => workforceOpsService.updateDriverSchedule(editingScheduleId, payload), 'schedule', 'Updated');
    } else {
      await runAction(() => workforceOpsService.createDriverSchedule(payload), 'schedule', 'Created');
    }
    setEditingScheduleId(null);
    form.resetFields();
  };

  const submitAttendanceCheckIn = async () => {
    const values = await attendanceForm.validateFields(['driver_id', 'check_in_time']);
    await runAction(
      () =>
        workforceOpsService.checkIn({
          driver_id: values.driver_id,
          check_in_time: values.check_in_time.format('YYYY-MM-DD HH:mm:ss'),
        }),
      'attendance',
      'Check-in recorded',
    );
  };

  const submitAttendanceCheckOut = async () => {
    const values = await attendanceForm.validateFields(['driver_id', 'check_out_time']);
    await runAction(
      () =>
        workforceOpsService.checkOut({
          driver_id: values.driver_id,
          check_out_time: values.check_out_time.format('YYYY-MM-DD HH:mm:ss'),
        }),
      'attendance',
      'Check-out recorded',
    );
  };

  const submitAttendanceAdjust = async () => {
    const values = await attendanceForm.validateFields(['attendance_id', 'adjust_reason']);
    await runAction(
      () =>
        workforceOpsService.adjustAttendance(values.attendance_id, {
          reason: values.adjust_reason,
          check_in: values.adjust_check_in ? values.adjust_check_in.format('YYYY-MM-DD HH:mm:ss') : undefined,
          check_out: values.adjust_check_out ? values.adjust_check_out.format('YYYY-MM-DD HH:mm:ss') : undefined,
          status: values.adjust_status,
        }),
      'attendance',
      'Attendance adjusted',
    );
  };

  const submitLeaveForm = async () => {
    const values = await leaveForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createLeave({
          driver_id: values.driver_id,
          leave_type_id: values.leave_type_id,
          from_date: values.from_date.format('YYYY-MM-DD'),
          to_date: values.to_date.format('YYYY-MM-DD'),
          total_days: values.total_days,
          reason: values.reason,
        }),
      'leave',
      'Leave request created',
    );
    leaveForm.resetFields();
  };

  const submitOvertimeForm = async () => {
    const values = await overtimeForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createOvertime({
          driver_id: values.driver_id,
          company_id: values.company_id,
          work_date: values.work_date.format('YYYY-MM-DD'),
          start_time: values.start_time.format('HH:mm:ss'),
          end_time: values.end_time.format('HH:mm:ss'),
          ot_hours: values.ot_hours,
          reason: values.reason,
        }),
      'overtime',
      'Overtime request created',
    );
    overtimeForm.resetFields();
  };

  const submitViolationForm = async () => {
    const values = await violationForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createViolation({
          driver_id: values.driver_id,
          company_id: values.company_id,
          trip_id: values.trip_id,
          type: values.type,
          occurred_at: values.occurred_at.format('YYYY-MM-DD HH:mm:ss'),
          description: values.description,
          penalty_amount: values.penalty_amount,
        }),
      'violations',
      'Violation created',
    );
    violationForm.resetFields();
  };

  const openDetail = async (type: DetailKind, id: number) => {
    setLoading(true);
    try {
      if (type === 'leave') {
        const response = await workforceOpsService.getLeaveById(id);
        setDetailTitle(`Leave #${id}`);
        setDetailKind('leave');
        setDetailData(response.data ?? null);
      } else if (type === 'overtime') {
        const response = await workforceOpsService.getOvertimeById(id);
        setDetailTitle(`Overtime #${id}`);
        setDetailKind('overtime');
        setDetailData(response.data ?? null);
      } else {
        const response = await workforceOpsService.getViolationById(id);
        setDetailTitle(`Violation #${id}`);
        setDetailKind('violations');
        setDetailData(response.data ?? null);
      }
      setDetailOpen(true);
    } catch (error) {
      toast.error(getErrorMessage(error) || t('common.loadError'));
      void error;
    } finally {
      setLoading(false);
    }
  };

  const detailLabels: Record<DetailKind, Record<string, string>> = {
    leave: {
      id: 'ID',
      driver_id: 'Driver ID',
      leave_type_id: 'Leave Type',
      from_date: 'From Date',
      to_date: 'To Date',
      total_days: 'Total Days',
      status: 'Status',
      reason: 'Reason',
      rejection_reason: 'Rejection Reason',
      cancelled_at: 'Cancelled At',
    },
    overtime: {
      id: 'ID',
      driver_id: 'Driver ID',
      company_id: 'Company ID',
      work_date: 'Work Date',
      start_time: 'Start Time',
      end_time: 'End Time',
      ot_hours: 'OT Hours',
      status: 'Status',
      reason: 'Reason',
    },
    violations: {
      id: 'ID',
      driver_id: 'Driver ID',
      company_id: 'Company ID',
      trip_id: 'Trip ID',
      type: 'Type',
      occurred_at: 'Occurred At',
      status: 'Status',
      description: 'Description',
      penalty_amount: 'Penalty Amount',
    },
  };

  const statusFields = new Set(['status']);
  const moneyFields = new Set(['penalty_amount']);
  const dateTimeFields = new Set(['occurred_at', 'cancelled_at']);
  const dateFields = new Set(['from_date', 'to_date', 'work_date']);

  const formatDetailValue = (key: string, value: unknown) => {
    if (value === null || value === undefined || value === '') {
      return '-';
    }
    if (statusFields.has(key)) {
      return <Tag>{String(value)}</Tag>;
    }
    if (moneyFields.has(key) && typeof value === 'number') {
      return value.toLocaleString();
    }
    if ((dateFields.has(key) || dateTimeFields.has(key)) && typeof value === 'string') {
      const parsed = dayjs(value);
      return parsed.isValid()
        ? dateTimeFields.has(key)
          ? parsed.format('YYYY-MM-DD HH:mm:ss')
          : parsed.format('YYYY-MM-DD')
        : value;
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const leaveColumns: ColumnsType<LeaveRequest> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: 'driver_id' },
    { title: 'From', dataIndex: 'from_date' },
    { title: 'To', dataIndex: 'to_date' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => void openDetail('leave', row.id)}>View</Button>
          <Button size="small" onClick={async () => {
            await runAction(() => workforceOpsService.approveLeave(row.id), 'leave', 'Approved');
          }}>Approve</Button>
          <Button size="small" danger onClick={async () => {
            await runAction(() => workforceOpsService.rejectLeave(row.id, reason || 'Rejected by admin'), 'leave', 'Rejected');
          }}>Reject</Button>
          <Button size="small" onClick={async () => {
            await runAction(() => workforceOpsService.cancelLeave(row.id), 'leave', 'Cancelled');
          }}>Cancel</Button>
        </Space>
      ),
    },
  ];

  const overtimeColumns: ColumnsType<OvertimeRequest> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: 'driver_id' },
    { title: 'Date', dataIndex: 'work_date' },
    { title: 'Hours', dataIndex: 'ot_hours' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => void openDetail('overtime', row.id)}>View</Button>
          <Button size="small" onClick={async () => {
            await runAction(() => workforceOpsService.approveOvertime(row.id), 'overtime', 'Approved');
          }}>Approve</Button>
          <Button size="small" danger onClick={async () => {
            await runAction(() => workforceOpsService.rejectOvertime(row.id, reason || 'Rejected by admin'), 'overtime', 'Rejected');
          }}>Reject</Button>
        </Space>
      ),
    },
  ];

  const violationColumns: ColumnsType<ViolationRecord> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: 'driver_id' },
    { title: 'Type', dataIndex: 'type' },
    { title: 'Penalty', dataIndex: 'penalty_amount' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{v}</Tag> },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Space>
          <Button size="small" onClick={() => void openDetail('violations', row.id)}>View</Button>
          <Button size="small" onClick={async () => {
            await runAction(() => workforceOpsService.confirmViolation(row.id), 'violations', 'Confirmed');
          }}>Confirm</Button>
          <Button size="small" onClick={async () => {
            await runAction(
              () => workforceOpsService.disputeViolation(row.id, { reason: reason || 'Disputed by admin' }),
              'violations',
              'Disputed',
            );
          }}>Dispute</Button>
          <Button size="small" onClick={async () => {
            await runAction(
              () =>
                workforceOpsService.resolveViolationDispute(row.id, {
                  resolution: 'upheld',
                  resolution_note: reason || 'Resolved by admin',
                }),
              'violations',
              'Dispute resolved',
            );
          }}>Resolve</Button>
          <Button size="small" danger onClick={async () => {
            await runAction(() => workforceOpsService.waiveViolation(row.id, reason || 'Waived by admin'), 'violations', 'Waived');
          }}>Waive</Button>
        </Space>
      ),
    },
  ];

  const attendanceColumns: ColumnsType<WorkforceAttendanceRecord> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: 'driver_id' },
    { title: 'Date', dataIndex: 'date' },
    { title: 'Check-in', dataIndex: 'check_in' },
    { title: 'Check-out', dataIndex: 'check_out' },
    { title: 'Work Hours', dataIndex: 'work_hours' },
    { title: 'OT Hours', dataIndex: 'overtime_hours' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{String(v || '')}</Tag> },
    {
      title: t('common.actions'),
      render: (_, row) => (
        <Button
          size="small"
          onClick={async () => {
            await runAction(
              () =>
                workforceOpsService.adjustAttendance(row.id, {
                  reason: reason || 'Manual attendance adjustment',
                  check_in: row.check_in || undefined,
                  check_out: row.check_out || undefined,
                  status: row.status || 'present',
                }),
              'attendance',
              'Adjusted',
            );
          }}
        >
          Adjust
        </Button>
      ),
    },
  ];

  return (
    <>
      <PageHeader title="Workforce Ops" />
      <Card>
        <Flex vertical gap={12}>
          <Typography.Text type="secondary">
            Driver schedules, attendance, leave, overtime, and violations powered by new backend APIs.
          </Typography.Text>
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Input
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Reason used for reject actions"
              />
            </Col>
          </Row>
          {activeTab === 'schedule' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <InputNumber
                    placeholder="Driver ID"
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
                  />
                  <InputNumber
                    placeholder="Office ID"
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, office_id: value ?? undefined }))}
                  />
                  <DatePicker
                    placeholder="Work date"
                    onChange={(value) =>
                      setScheduleFilters((prev) => ({ ...prev, work_date: value ? value.format('YYYY-MM-DD') : undefined }))
                    }
                  />
                  <Select
                    allowClear
                    placeholder="Status"
                    style={{ width: 160 }}
                    options={[
                      { label: 'draft', value: 'draft' },
                      { label: 'submitted', value: 'submitted' },
                      { label: 'approved', value: 'approved' },
                      { label: 'locked', value: 'locked' },
                    ]}
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, status: value }))}
                  />
                </Flex>

                <Form form={form} layout="vertical" initialValues={scheduleInitialValues}>
                  <Row gutter={12}>
                    <Col xs={24} md={6}><Form.Item name="driver_id" label="Driver ID" rules={requiredRules('Driver ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="office_id" label="Office ID" rules={requiredRules('Office ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="work_date" label="Work date" rules={requiredRules('Work date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="shift_code" label="Shift code"><Select options={[{ label: 'day', value: 'day' }, { label: 'night', value: 'night' }, { label: 'split', value: 'split' }, { label: 'custom', value: 'custom' }]} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="start_time" label="Start time" rules={requiredRules('Start time')}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="end_time" label="End time" rules={[...requiredRules('End time'), afterTimeRule(() => form.getFieldValue('start_time'), 'Start time', 'End time')]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="vehicle_id" label="Vehicle ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="notes" label="Notes"><Input /></Form.Item></Col>
                  </Row>
                  <Flex gap={8}>
                    <Button type="primary" onClick={() => void submitScheduleForm()}>{editingScheduleId ? 'Update Schedule' : 'Create Schedule'}</Button>
                    {editingScheduleId ? <Button onClick={() => { setEditingScheduleId(null); form.resetFields(); }}>Cancel Edit</Button> : null}
                  </Flex>
                </Form>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'attendance' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <InputNumber
                    placeholder="Driver ID"
                    onChange={(value) => setAttendanceFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
                  />
                  <DatePicker
                    placeholder="Date"
                    onChange={(value) => setAttendanceFilters((prev) => ({ ...prev, date: value ? value.format('YYYY-MM-DD') : undefined }))}
                  />
                  <DatePicker.RangePicker
                    onChange={(value) =>
                      setAttendanceFilters((prev) => ({
                        ...prev,
                        from: value?.[0] ? value[0].format('YYYY-MM-DD') : undefined,
                        to: value?.[1] ? value[1].format('YYYY-MM-DD') : undefined,
                      }))
                    }
                  />
                  <Select
                    allowClear
                    placeholder="Status"
                    style={{ width: 160 }}
                    options={[
                      { label: 'present', value: 'present' },
                      { label: 'late', value: 'late' },
                      { label: 'absent', value: 'absent' },
                      { label: 'partial', value: 'partial' },
                    ]}
                    onChange={(value) => setAttendanceFilters((prev) => ({ ...prev, status: value }))}
                  />
                </Flex>

                <Form form={attendanceForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={6}><Form.Item name="driver_id" label="Driver ID" rules={requiredRules('Driver ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={9}><Form.Item name="check_in_time" label="Check-in time"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={9}><Form.Item name="check_out_time" label="Check-out time"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={8}><Button onClick={() => void submitAttendanceCheckIn()}>Check-in</Button></Col>
                    <Col xs={24} md={8}><Button onClick={() => void submitAttendanceCheckOut()}>Check-out</Button></Col>
                    <Col xs={24} md={8}></Col>
                    <Col xs={24} md={6}><Form.Item name="attendance_id" label="Attendance ID" rules={requiredRules('Attendance ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="adjust_check_in" label="Adjust check-in"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="adjust_check_out" label="Adjust check-out"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="adjust_status" label="Adjust status"><Select allowClear options={[{ label: 'present', value: 'present' }, { label: 'late', value: 'late' }, { label: 'absent', value: 'absent' }, { label: 'partial', value: 'partial' }]} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item name="adjust_reason" label="Adjust reason" rules={requiredRules('Adjust reason')}><Input /></Form.Item></Col>
                    <Col xs={24} md={12}><Button type="primary" onClick={() => void submitAttendanceAdjust()}>Adjust Attendance</Button></Col>
                  </Row>
                </Form>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'leave' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <InputNumber placeholder="Driver ID" onChange={(value) => setLeaveFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))} />
                  <Select
                    allowClear
                    placeholder="Status"
                    style={{ width: 160 }}
                    options={[
                      { label: 'pending', value: 'pending' },
                      { label: 'approved', value: 'approved' },
                      { label: 'rejected', value: 'rejected' },
                      { label: 'cancelled', value: 'cancelled' },
                    ]}
                    onChange={(value) => setLeaveFilters((prev) => ({ ...prev, status: value }))}
                  />
                  <DatePicker.RangePicker
                    onChange={(value) =>
                      setLeaveFilters((prev) => ({
                        ...prev,
                        from: value?.[0] ? value[0].format('YYYY-MM-DD') : undefined,
                        to: value?.[1] ? value[1].format('YYYY-MM-DD') : undefined,
                      }))
                    }
                  />
                </Flex>
                <Form form={leaveForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={6}><Form.Item name="driver_id" label="Driver ID" rules={requiredRules('Driver ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="leave_type_id" label="Leave Type" rules={requiredRules('Leave Type')}><Select options={leaveTypeOptions} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="from_date" label="From date" rules={requiredRules('From date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="to_date" label="To date" rules={[...requiredRules('To date'), afterOrEqualDateRule(() => leaveForm.getFieldValue('from_date'), 'From date', 'To date')]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="total_days" label="Total days" rules={[nonNegativeNumberRule('Total days')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item name="reason" label="Reason"><Input /></Form.Item></Col>
                    <Col xs={24} md={6}><Button type="primary" onClick={() => void submitLeaveForm()}>Create Leave</Button></Col>
                  </Row>
                </Form>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'overtime' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <InputNumber placeholder="Driver ID" onChange={(value) => setOvertimeFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))} />
                  <InputNumber placeholder="Company ID" onChange={(value) => setOvertimeFilters((prev) => ({ ...prev, company_id: value ?? undefined }))} />
                  <DatePicker.RangePicker
                    onChange={(value) =>
                      setOvertimeFilters((prev) => ({
                        ...prev,
                        from: value?.[0] ? value[0].format('YYYY-MM-DD') : undefined,
                        to: value?.[1] ? value[1].format('YYYY-MM-DD') : undefined,
                      }))
                    }
                  />
                </Flex>
                <Form form={overtimeForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={6}><Form.Item name="driver_id" label="Driver ID" rules={requiredRules('Driver ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="company_id" label="Company ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="work_date" label="Work date" rules={requiredRules('Work date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="ot_hours" label="OT Hours" rules={[nonNegativeNumberRule('OT Hours')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="start_time" label="Start time" rules={requiredRules('Start time')}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="end_time" label="End time" rules={[...requiredRules('End time'), afterTimeRule(() => overtimeForm.getFieldValue('start_time'), 'Start time', 'End time')]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                    <Col xs={24} md={12}><Form.Item name="reason" label="Reason"><Input /></Form.Item></Col>
                    <Col xs={24} md={6}><Button type="primary" onClick={() => void submitOvertimeForm()}>Create Overtime</Button></Col>
                  </Row>
                </Form>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'violations' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <InputNumber placeholder="Driver ID" onChange={(value) => setViolationFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))} />
                  <InputNumber placeholder="Company ID" onChange={(value) => setViolationFilters((prev) => ({ ...prev, company_id: value ?? undefined }))} />
                  <Select
                    allowClear
                    placeholder="Status"
                    style={{ width: 160 }}
                    options={[
                      { label: 'pending', value: 'pending' },
                      { label: 'confirmed', value: 'confirmed' },
                      { label: 'disputed', value: 'disputed' },
                      { label: 'resolved', value: 'resolved' },
                    ]}
                    onChange={(value) => setViolationFilters((prev) => ({ ...prev, status: value }))}
                  />
                  <DatePicker.RangePicker
                    onChange={(value) =>
                      setViolationFilters((prev) => ({
                        ...prev,
                        from: value?.[0] ? value[0].format('YYYY-MM-DD') : undefined,
                        to: value?.[1] ? value[1].format('YYYY-MM-DD') : undefined,
                      }))
                    }
                  />
                </Flex>
                <Form form={violationForm} layout="vertical">
                  <Row gutter={12}>
                    <Col xs={24} md={6}><Form.Item name="driver_id" label="Driver ID" rules={requiredRules('Driver ID')}><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="company_id" label="Company ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="trip_id" label="Trip ID"><InputNumber style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={6}><Form.Item name="type" label="Type" rules={requiredRules('Type')}><Input /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="occurred_at" label="Occurred at" rules={requiredRules('Occurred at')}><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="penalty_amount" label="Penalty amount" rules={[nonNegativeNumberRule('Penalty amount')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                    <Col xs={24} md={8}><Form.Item name="description" label="Description"><Input /></Form.Item></Col>
                    <Col xs={24} md={6}><Button type="primary" onClick={() => void submitViolationForm()}>Create Violation</Button></Col>
                  </Row>
                </Form>
              </Flex>
            </Card>
          ) : null}
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
            items={[
              { key: 'schedule', label: 'Driver Schedules' },
              { key: 'attendance', label: 'Attendance' },
              { key: 'leave', label: 'Leave' },
              { key: 'overtime', label: 'Overtime' },
              { key: 'violations', label: 'Violations' },
            ]}
          />

          {activeTab === 'schedule' && <Table rowKey="id" loading={loading} columns={scheduleColumns} dataSource={schedules} />}
          {activeTab === 'attendance' && <Table rowKey="id" loading={loading} columns={attendanceColumns} dataSource={attendance} />}
          {activeTab === 'leave' && <Table rowKey="id" loading={loading} columns={leaveColumns} dataSource={leaveRows} />}
          {activeTab === 'overtime' && <Table rowKey="id" loading={loading} columns={overtimeColumns} dataSource={overtimeRows} />}
          {activeTab === 'violations' && <Table rowKey="id" loading={loading} columns={violationColumns} dataSource={violationRows} />}
          <Modal
            title={detailTitle}
            open={detailOpen}
            onCancel={() => setDetailOpen(false)}
            footer={<Button onClick={() => setDetailOpen(false)}>Close</Button>}
          >
            {detailData && typeof detailData === 'object' ? (
              <Descriptions column={1} size="small">
                {Object.entries(detailData as Record<string, unknown>)
                  .filter(([, value]) => value !== null && value !== undefined && value !== '')
                  .map(([key, value]) => (
                  <Descriptions.Item key={key} label={detailLabels[detailKind][key] || key}>
                    {formatDetailValue(key, value)}
                  </Descriptions.Item>
                  ))}
              </Descriptions>
            ) : null}
          </Modal>
        </Flex>
      </Card>
    </>
  );
}

