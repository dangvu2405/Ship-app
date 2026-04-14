import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Descriptions, Flex, Form, Input, InputNumber, Modal, Row, Select, Space, Table, Tabs, Tag, TimePicker, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useList } from '@refinedev/core';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import workforceOpsService from '@/services/workforce-ops.service';
import type { DriverSchedule, LeaveRequest, OvertimeRequest, ViolationRecord, WorkforceAttendanceRecord } from '@/types';
import { formatDate, formatDateTime, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import { getErrorMessage, getErrorStatus } from '@/utils/errorHandler';
import { nonNegativeNumberRule, requiredRule } from '@/utils/validation';
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
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [violationModalOpen, setViolationModalOpen] = useState(false);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailKind, setDetailKind] = useState<DetailKind>('leave');
  const [detailData, setDetailData] = useState<unknown>(null);
  const scheduleFormOfficeId = Form.useWatch('office_id', form) as number | undefined;

  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [attendance, setAttendance] = useState<WorkforceAttendanceRecord[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveRequest[]>([]);
  const [overtimeRows, setOvertimeRows] = useState<OvertimeRequest[]>([]);
  const [violationRows, setViolationRows] = useState<ViolationRecord[]>([]);
  const requiredRules = (label: string) => [requiredRule(label)];
  const { data: driversData } = useList<{ id: number; name?: string; code?: string; office_id?: number; company_id?: number }>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 200 },
  });
  const { data: officesData } = useList<{ id: number; name?: string; code?: string; company_id?: number }>({
    resource: 'offices',
    pagination: { current: 1, pageSize: 200 },
  });
  const { data: companiesData } = useList<{ id: number; name?: string; code?: string }>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 200 },
  });
  const { data: vehiclesData } = useList<{ id: number; plate_number?: string }>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 200 },
  });
  const { data: tripsData } = useList<{ id: number; code?: string }>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 200 },
  });

  const drivers = useMemo(() => driversData?.data ?? [], [driversData?.data]);
  const offices = useMemo(() => officesData?.data ?? [], [officesData?.data]);
  const driverOptions = useMemo(
    () => drivers.map((item) => ({ value: item.id, label: item.name || item.code || `Driver #${item.id}` })),
    [drivers],
  );
  const officeOptions = useMemo(
    () => offices.map((item) => ({ value: item.id, label: item.name || item.code || `Office #${item.id}` })),
    [offices],
  );
  const companyOptions = useMemo(
    () => (companiesData?.data ?? []).map((item) => ({ value: item.id, label: item.name || item.code || `Company #${item.id}` })),
    [companiesData?.data],
  );
  const vehicleOptions = useMemo(
    () => (vehiclesData?.data ?? []).map((item) => ({ value: item.id, label: item.plate_number || `Vehicle #${item.id}` })),
    [vehiclesData?.data],
  );
  const tripOptions = useMemo(
    () => (tripsData?.data ?? []).map((item) => ({ value: item.id, label: item.code || `Trip #${item.id}` })),
    [tripsData?.data],
  );
  const attendanceOptions = useMemo(
    () => attendance.map((item) => ({ value: item.id, label: `#${item.id} - Driver ${item.driver_id} - ${item.date}` })),
    [attendance],
  );
  const filterOfficeOptions = useCallback((companyId?: number) => {
    if (!companyId) return officeOptions;
    return offices
      .filter((office) => !office.company_id || office.company_id === companyId)
      .map((office) => ({ value: office.id, label: office.name || office.code || `Office #${office.id}` }));
  }, [officeOptions, offices]);
  const filterDriverOptions = useCallback((companyId?: number, officeId?: number) => {
    return drivers
      .filter((driver) => {
        if (companyId && driver.company_id && driver.company_id !== companyId) return false;
        if (officeId && driver.office_id && driver.office_id !== officeId) return false;
        return true;
      })
      .map((driver) => ({ value: driver.id, label: driver.name || driver.code || `Driver #${driver.id}` }));
  }, [drivers]);
  const sanitizeHierarchicalFilters = useCallback((raw: Record<string, unknown>) => {
    const next = { ...raw } as Record<string, unknown>;
    const companyId = typeof next.company_id === 'number' ? next.company_id : undefined;
    const officeId = typeof next.office_id === 'number' ? next.office_id : undefined;
    const driverId = typeof next.driver_id === 'number' ? next.driver_id : undefined;

    if (officeId && companyId) {
      const office = offices.find((item) => item.id === officeId);
      if (office?.company_id && office.company_id !== companyId) {
        delete next.office_id;
      }
    }

    if (driverId) {
      const driver = drivers.find((item) => item.id === driverId);
      if (companyId && driver?.company_id && driver.company_id !== companyId) {
        delete next.driver_id;
      }
      const effectiveOfficeId = typeof next.office_id === 'number' ? next.office_id : undefined;
      if (effectiveOfficeId && driver?.office_id && driver.office_id !== effectiveOfficeId) {
        delete next.driver_id;
      }
    }

    return next;
  }, [drivers, offices]);
  const sanitizeAndSyncFilters = useCallback(
    (setFilters: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void) => {
      setFilters((prev) => {
        const sanitized = sanitizeHierarchicalFilters(prev);
        return JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized;
      });
    },
    [sanitizeHierarchicalFilters],
  );

  const loadTab = useCallback(async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'schedule') {
        const data = await workforceOpsService.listDriverSchedules({ per_page: 50, ...sanitizeHierarchicalFilters(scheduleFilters) });
        setSchedules(data.data);
      } else if (tab === 'attendance') {
        const data = await workforceOpsService.listAttendance({ per_page: 50, ...sanitizeHierarchicalFilters(attendanceFilters) });
        setAttendance(data.data);
      } else if (tab === 'leave') {
        const data = await workforceOpsService.listLeave({ per_page: 50, ...sanitizeHierarchicalFilters(leaveFilters) });
        setLeaveRows(data.data);
      } else if (tab === 'overtime') {
        const data = await workforceOpsService.listOvertime({ per_page: 50, ...sanitizeHierarchicalFilters(overtimeFilters) });
        setOvertimeRows(data.data);
      } else {
        const data = await workforceOpsService.listViolations({ per_page: 50, ...sanitizeHierarchicalFilters(violationFilters) });
        setViolationRows(data.data);
      }
    } catch (error) {
      toast.error(t('common.loadError'));
      void error;
    } finally {
      setLoading(false);
    }
  }, [t, scheduleFilters, attendanceFilters, leaveFilters, overtimeFilters, violationFilters, sanitizeHierarchicalFilters]);

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
  useEffect(() => {
    sanitizeAndSyncFilters(setScheduleFilters);
    sanitizeAndSyncFilters(setAttendanceFilters);
    sanitizeAndSyncFilters(setLeaveFilters);
    sanitizeAndSyncFilters(setOvertimeFilters);
    sanitizeAndSyncFilters(setViolationFilters);
  }, [sanitizeAndSyncFilters, drivers, offices]);

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
    { title: 'Date', dataIndex: 'work_date', render: (value) => formatDate(value) },
    { title: 'Office', dataIndex: 'office_id', render: (value) => value ?? '-' },
    { title: 'Vehicle', dataIndex: 'vehicle_id', render: (_, row) => row.vehicle?.plate_number || row.vehicle_id || '-' },
    { title: 'Start', dataIndex: 'start_time', render: (value) => formatDateTime(value) },
    { title: 'End', dataIndex: 'end_time', render: (value) => formatDateTime(value) },
    { title: 'Shift', dataIndex: 'shift_code' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{formatStatusLabel(v || 'draft')}</Tag> },
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
              setScheduleModalOpen(true);
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
    setScheduleModalOpen(false);
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
    setAttendanceModalOpen(false);
    attendanceForm.resetFields(['check_in_time']);
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
    setAttendanceModalOpen(false);
    attendanceForm.resetFields(['check_out_time']);
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
    setAttendanceModalOpen(false);
    attendanceForm.resetFields(['attendance_id', 'adjust_check_in', 'adjust_check_out', 'adjust_status', 'adjust_reason']);
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
    setLeaveModalOpen(false);
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
    setOvertimeModalOpen(false);
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
    setViolationModalOpen(false);
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
      return <Tag>{formatStatusLabel(value)}</Tag>;
    }
    if (moneyFields.has(key)) {
      return formatMoney(value);
    }
    if (dateTimeFields.has(key)) {
      return formatDateTime(value);
    }
    if (dateFields.has(key)) {
      return formatDate(value);
    }
    if (typeof value === 'object') {
      return JSON.stringify(value);
    }
    return String(value);
  };

  const leaveColumns: ColumnsType<LeaveRequest> = [
    { title: 'ID', dataIndex: 'id', width: 72 },
    { title: 'Driver', dataIndex: 'driver_id' },
    { title: 'From', dataIndex: 'from_date', render: (value) => formatDate(value) },
    { title: 'To', dataIndex: 'to_date', render: (value) => formatDate(value) },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{formatStatusLabel(v)}</Tag> },
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
    { title: 'Date', dataIndex: 'work_date', render: (value) => formatDate(value) },
    { title: 'Hours', dataIndex: 'ot_hours' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{formatStatusLabel(v)}</Tag> },
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
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{formatStatusLabel(v)}</Tag> },
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
    { title: 'Date', dataIndex: 'date', render: (value) => formatDate(value) },
    { title: 'Check-in', dataIndex: 'check_in', render: (value) => formatDateTime(value) },
    { title: 'Check-out', dataIndex: 'check_out', render: (value) => formatDateTime(value) },
    { title: 'Work Hours', dataIndex: 'work_hours' },
    { title: 'OT Hours', dataIndex: 'overtime_hours' },
    { title: 'Status', dataIndex: 'status', render: (v) => <Tag>{formatStatusLabel(String(v || ''))}</Tag> },
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

  const scheduleCompanyId = typeof scheduleFilters.company_id === 'number' ? scheduleFilters.company_id : undefined;
  const scheduleOfficeId = typeof scheduleFilters.office_id === 'number' ? scheduleFilters.office_id : undefined;
  const attendanceCompanyId = typeof attendanceFilters.company_id === 'number' ? attendanceFilters.company_id : undefined;
  const attendanceOfficeId = typeof attendanceFilters.office_id === 'number' ? attendanceFilters.office_id : undefined;
  const leaveCompanyId = typeof leaveFilters.company_id === 'number' ? leaveFilters.company_id : undefined;
  const leaveOfficeId = typeof leaveFilters.office_id === 'number' ? leaveFilters.office_id : undefined;
  const overtimeCompanyId = typeof overtimeFilters.company_id === 'number' ? overtimeFilters.company_id : undefined;
  const overtimeOfficeId = typeof overtimeFilters.office_id === 'number' ? overtimeFilters.office_id : undefined;
  const violationCompanyId = typeof violationFilters.company_id === 'number' ? violationFilters.company_id : undefined;
  const violationOfficeId = typeof violationFilters.office_id === 'number' ? violationFilters.office_id : undefined;
  const scheduleOfficeOptions = useMemo(() => filterOfficeOptions(scheduleCompanyId), [filterOfficeOptions, scheduleCompanyId]);
  const scheduleDriverOptions = useMemo(() => filterDriverOptions(scheduleCompanyId, scheduleOfficeId), [filterDriverOptions, scheduleCompanyId, scheduleOfficeId]);
  const attendanceOfficeOptions = useMemo(() => filterOfficeOptions(attendanceCompanyId), [filterOfficeOptions, attendanceCompanyId]);
  const attendanceDriverOptions = useMemo(() => filterDriverOptions(attendanceCompanyId, attendanceOfficeId), [filterDriverOptions, attendanceCompanyId, attendanceOfficeId]);
  const leaveOfficeOptions = useMemo(() => filterOfficeOptions(leaveCompanyId), [filterOfficeOptions, leaveCompanyId]);
  const leaveDriverOptions = useMemo(() => filterDriverOptions(leaveCompanyId, leaveOfficeId), [filterDriverOptions, leaveCompanyId, leaveOfficeId]);
  const overtimeOfficeOptions = useMemo(() => filterOfficeOptions(overtimeCompanyId), [filterOfficeOptions, overtimeCompanyId]);
  const overtimeDriverOptions = useMemo(() => filterDriverOptions(overtimeCompanyId, overtimeOfficeId), [filterDriverOptions, overtimeCompanyId, overtimeOfficeId]);
  const violationOfficeOptions = useMemo(() => filterOfficeOptions(violationCompanyId), [filterOfficeOptions, violationCompanyId]);
  const violationDriverOptions = useMemo(() => filterDriverOptions(violationCompanyId, violationOfficeId), [filterDriverOptions, violationCompanyId, violationOfficeId]);
  const scheduleFormDriverOptions = useMemo(
    () => filterDriverOptions(undefined, typeof scheduleFormOfficeId === 'number' ? scheduleFormOfficeId : undefined),
    [filterDriverOptions, scheduleFormOfficeId],
  );

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
                  <Select
                    allowClear
                    showSearch
                    placeholder="Company"
                    style={{ width: 180 }}
                    value={scheduleCompanyId}
                    options={companyOptions}
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, company_id: value ?? undefined, office_id: undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Office"
                    style={{ width: 180 }}
                    value={scheduleOfficeId}
                    options={scheduleOfficeOptions}
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, office_id: value ?? undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Driver"
                    style={{ width: 180 }}
                    options={scheduleDriverOptions}
                    value={typeof scheduleFilters.driver_id === 'number' ? scheduleFilters.driver_id : undefined}
                    onChange={(value) => setScheduleFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
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

                <Button
                  type="primary"
                  onClick={() => {
                    form.resetFields();
                    form.setFieldsValue({ ...scheduleInitialValues });
                    setEditingScheduleId(null);
                    setScheduleModalOpen(true);
                  }}
                >
                  Create Schedule
                </Button>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'attendance' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Company"
                    style={{ width: 180 }}
                    value={attendanceCompanyId}
                    options={companyOptions}
                    onChange={(value) => setAttendanceFilters((prev) => ({ ...prev, company_id: value ?? undefined, office_id: undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Office"
                    style={{ width: 180 }}
                    value={attendanceOfficeId}
                    options={attendanceOfficeOptions}
                    onChange={(value) => setAttendanceFilters((prev) => ({ ...prev, office_id: value ?? undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Driver"
                    style={{ width: 180 }}
                    options={attendanceDriverOptions}
                    value={typeof attendanceFilters.driver_id === 'number' ? attendanceFilters.driver_id : undefined}
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

                <Button type="primary" onClick={() => setAttendanceModalOpen(true)}>
                  Attendance Actions
                </Button>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'leave' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Company"
                    style={{ width: 180 }}
                    value={leaveCompanyId}
                    options={companyOptions}
                    onChange={(value) => setLeaveFilters((prev) => ({ ...prev, company_id: value ?? undefined, office_id: undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Office"
                    style={{ width: 180 }}
                    value={leaveOfficeId}
                    options={leaveOfficeOptions}
                    onChange={(value) => setLeaveFilters((prev) => ({ ...prev, office_id: value ?? undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Driver"
                    style={{ width: 180 }}
                    options={leaveDriverOptions}
                    value={typeof leaveFilters.driver_id === 'number' ? leaveFilters.driver_id : undefined}
                    onChange={(value) => setLeaveFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
                  />
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
                <Button type="primary" onClick={() => setLeaveModalOpen(true)}>Create Leave</Button>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'overtime' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Company"
                    style={{ width: 180 }}
                    value={overtimeCompanyId}
                    options={companyOptions}
                    onChange={(value) => setOvertimeFilters((prev) => ({ ...prev, company_id: value ?? undefined, office_id: undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Office"
                    style={{ width: 180 }}
                    value={overtimeOfficeId}
                    options={overtimeOfficeOptions}
                    onChange={(value) => setOvertimeFilters((prev) => ({ ...prev, office_id: value ?? undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Driver"
                    style={{ width: 180 }}
                    options={overtimeDriverOptions}
                    value={typeof overtimeFilters.driver_id === 'number' ? overtimeFilters.driver_id : undefined}
                    onChange={(value) => setOvertimeFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
                  />
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
                <Button type="primary" onClick={() => setOvertimeModalOpen(true)}>Create Overtime</Button>
              </Flex>
            </Card>
          ) : null}
          {activeTab === 'violations' ? (
            <Card size="small">
              <Flex vertical gap={10}>
                <Flex wrap="wrap" gap={8}>
                  <Select
                    allowClear
                    showSearch
                    placeholder="Company"
                    style={{ width: 180 }}
                    value={violationCompanyId}
                    options={companyOptions}
                    onChange={(value) => setViolationFilters((prev) => ({ ...prev, company_id: value ?? undefined, office_id: undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Office"
                    style={{ width: 180 }}
                    value={violationOfficeId}
                    options={violationOfficeOptions}
                    onChange={(value) => setViolationFilters((prev) => ({ ...prev, office_id: value ?? undefined, driver_id: undefined }))}
                  />
                  <Select
                    allowClear
                    showSearch
                    placeholder="Driver"
                    style={{ width: 180 }}
                    options={violationDriverOptions}
                    value={typeof violationFilters.driver_id === 'number' ? violationFilters.driver_id : undefined}
                    onChange={(value) => setViolationFilters((prev) => ({ ...prev, driver_id: value ?? undefined }))}
                  />
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
                <Button type="primary" onClick={() => setViolationModalOpen(true)}>Create Violation</Button>
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
            title={editingScheduleId ? 'Update Schedule' : 'Create Schedule'}
            open={scheduleModalOpen}
            onCancel={() => {
              setScheduleModalOpen(false);
              setEditingScheduleId(null);
              form.resetFields();
            }}
            onOk={() => void submitScheduleForm()}
            okText={editingScheduleId ? 'Update' : 'Create'}
            width={900}
          >
            <Form
              form={form}
              layout="vertical"
              initialValues={scheduleInitialValues}
              onValuesChange={(changedValues) => {
                if (Object.prototype.hasOwnProperty.call(changedValues, 'office_id')) {
                  form.setFieldValue('driver_id', undefined);
                }
              }}
            >
              <Row gutter={12}>
                <Col xs={24} md={12}><FormItemSelect name="driver_id" label="Driver ID" options={scheduleFormDriverOptions} showSearch rules={requiredRules('Driver ID')} /></Col>
                <Col xs={24} md={12}><FormItemSelect name="office_id" label="Office ID" options={officeOptions} showSearch rules={requiredRules('Office ID')} /></Col>
                <Col xs={24} md={12}><Form.Item name="work_date" label="Work date" rules={requiredRules('Work date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><FormItemSelect name="shift_code" label="Shift code" options={[{ label: 'day', value: 'day' }, { label: 'night', value: 'night' }, { label: 'split', value: 'split' }, { label: 'custom', value: 'custom' }]} /></Col>
                <Col xs={24} md={12}><Form.Item name="start_time" label="Start time" rules={requiredRules('Start time')}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="end_time" label="End time" rules={[...requiredRules('End time'), { validator: async (_, value) => { const start = form.getFieldValue('start_time'); if (!start || !value) return; if (value.isSameOrBefore?.(start, 'minute')) throw new Error(t('validation.checkOutAfterCheckIn')); } }]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                <Col xs={24} md={12}><FormItemSelect name="vehicle_id" label="Vehicle ID" options={vehicleOptions} showSearch /></Col>
                <Col xs={24} md={12}><Form.Item name="notes" label="Notes"><Input /></Form.Item></Col>
              </Row>
            </Form>
          </Modal>
          <Modal
            title="Attendance Actions"
            open={attendanceModalOpen}
            onCancel={() => setAttendanceModalOpen(false)}
            footer={null}
            width={900}
          >
            <Form form={attendanceForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={6}><FormItemSelect name="driver_id" label="Driver ID" options={driverOptions} showSearch rules={requiredRules('Driver ID')} /></Col>
                <Col xs={24} md={9}><Form.Item name="check_in_time" label="Check-in time"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={9}><Form.Item name="check_out_time" label="Check-out time"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={8}><Button onClick={() => void submitAttendanceCheckIn()}>Check-in</Button></Col>
                <Col xs={24} md={8}><Button onClick={() => void submitAttendanceCheckOut()}>Check-out</Button></Col>
                <Col xs={24} md={8}></Col>
                <Col xs={24} md={6}><FormItemSelect name="attendance_id" label="Attendance ID" options={attendanceOptions} showSearch rules={requiredRules('Attendance ID')} /></Col>
                <Col xs={24} md={6}><Form.Item name="adjust_check_in" label="Adjust check-in"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={6}><Form.Item name="adjust_check_out" label="Adjust check-out"><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={6}><FormItemSelect name="adjust_status" label="Adjust status" options={[{ label: 'present', value: 'present' }, { label: 'late', value: 'late' }, { label: 'absent', value: 'absent' }, { label: 'partial', value: 'partial' }]} /></Col>
                <Col xs={24} md={12}><Form.Item name="adjust_reason" label="Adjust reason" rules={requiredRules('Adjust reason')}><Input /></Form.Item></Col>
                <Col xs={24} md={12}><Button type="primary" onClick={() => void submitAttendanceAdjust()}>Adjust Attendance</Button></Col>
              </Row>
            </Form>
          </Modal>
          <Modal title="Create Leave" open={leaveModalOpen} onCancel={() => setLeaveModalOpen(false)} onOk={() => void submitLeaveForm()} width={900}>
            <Form form={leaveForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}><FormItemSelect name="driver_id" label="Driver ID" options={driverOptions} showSearch rules={requiredRules('Driver ID')} /></Col>
                <Col xs={24} md={12}><FormItemSelect name="leave_type_id" label="Leave Type" options={leaveTypeOptions} rules={requiredRules('Leave Type')} /></Col>
                <Col xs={24} md={12}><Form.Item name="from_date" label="From date" rules={requiredRules('From date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="to_date" label="To date" rules={[...requiredRules('To date'), { validator: async (_, value) => { const from = leaveForm.getFieldValue('from_date'); if (!from || !value) return; if (value.isBefore?.(from, 'day')) throw new Error(t('validation.dueDateAfterIssuedAt')); } }]}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="total_days" label="Total days" rules={[nonNegativeNumberRule('Total days')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="reason" label="Reason"><Input /></Form.Item></Col>
              </Row>
            </Form>
          </Modal>
          <Modal title="Create Overtime" open={overtimeModalOpen} onCancel={() => setOvertimeModalOpen(false)} onOk={() => void submitOvertimeForm()} width={900}>
            <Form form={overtimeForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}><FormItemSelect name="driver_id" label="Driver ID" options={driverOptions} showSearch rules={requiredRules('Driver ID')} /></Col>
                <Col xs={24} md={12}><FormItemSelect name="company_id" label="Company ID" options={companyOptions} showSearch /></Col>
                <Col xs={24} md={12}><Form.Item name="work_date" label="Work date" rules={requiredRules('Work date')}><DatePicker style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="ot_hours" label="OT Hours" rules={[nonNegativeNumberRule('OT Hours')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="start_time" label="Start time" rules={requiredRules('Start time')}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="end_time" label="End time" rules={[...requiredRules('End time'), { validator: async (_, value) => { const start = overtimeForm.getFieldValue('start_time'); if (!start || !value) return; if (value.isSameOrBefore?.(start, 'minute')) throw new Error(t('validation.checkOutAfterCheckIn')); } }]}><TimePicker style={{ width: '100%' }} format="HH:mm" /></Form.Item></Col>
                <Col xs={24}><Form.Item name="reason" label="Reason"><Input /></Form.Item></Col>
              </Row>
            </Form>
          </Modal>
          <Modal title="Create Violation" open={violationModalOpen} onCancel={() => setViolationModalOpen(false)} onOk={() => void submitViolationForm()} width={900}>
            <Form form={violationForm} layout="vertical">
              <Row gutter={12}>
                <Col xs={24} md={12}><FormItemSelect name="driver_id" label="Driver ID" options={driverOptions} showSearch rules={requiredRules('Driver ID')} /></Col>
                <Col xs={24} md={12}><FormItemSelect name="company_id" label="Company ID" options={companyOptions} showSearch /></Col>
                <Col xs={24} md={12}><FormItemSelect name="trip_id" label="Trip ID" options={tripOptions} showSearch /></Col>
                <Col xs={24} md={12}><Form.Item name="type" label="Type" rules={requiredRules('Type')}><Input /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="occurred_at" label="Occurred at" rules={requiredRules('Occurred at')}><DatePicker showTime style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24} md={12}><Form.Item name="penalty_amount" label="Penalty amount" rules={[nonNegativeNumberRule('Penalty amount')]}><InputNumber min={0} style={{ width: '100%' }} /></Form.Item></Col>
                <Col xs={24}><Form.Item name="description" label="Description"><Input /></Form.Item></Col>
              </Row>
            </Form>
          </Modal>
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

