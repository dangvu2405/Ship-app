import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Flex,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Space,
  Table,
  Tabs,
  TimePicker,
  Typography,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useList } from '@refinedev/core';
import toast from 'react-hot-toast';
import { PageHeader } from '@/components/common/PageHeader';
import { FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import workforceOpsService from '@/services/workforce-ops.service';
import type {
  DriverSchedule,
  LeaveRequest,
  OvertimeRequest,
  ViolationRecord,
  WorkforceAttendanceRecord,
} from '@/types';
import { formatDate, formatDateTime, formatMoney } from '@/utils/displayFormat';
import { getErrorMessage, getErrorStatus } from '@/utils/errorHandler';
import { nonNegativeNumberRule, requiredRule } from '@/utils/validation';
import dayjs from 'dayjs';
import {
  SCHEDULE_STATUS_COLOR,
  LEAVE_STATUS_COLOR,
  OT_STATUS_COLOR,
  VIOLATION_STATUS_COLOR,
  ATTENDANCE_STATUS_COLOR,
  DEFAULT_ACTION_CONFIRM,
  type ActionConfirmState,
  type DetailKind,
} from '@/components/system/workforce-ops.constants';
import { StatusTag, ActionConfirmModal, DetailDescriptions } from '@/components/system/workforce-ops-ui';

type TabKey = 'schedule' | 'attendance' | 'leave' | 'overtime' | 'violations';

interface WorkforceOpsProps {
  embedded?: boolean;
}

// ─── Main Component ─────────────────────────────────────────────────────────────

export function WorkforceOps({ embedded = false }: WorkforceOpsProps = {}) {
  const { t } = useTranslation();
  const [form] = Form.useForm();
  const [attendanceForm] = Form.useForm();
  const [leaveForm] = Form.useForm();
  const [overtimeForm] = Form.useForm();
  const [violationForm] = Form.useForm();

  const [activeTab, setActiveTab] = useState<TabKey>('schedule');
  const [loading, setLoading] = useState(false);
  const [editingScheduleId, setEditingScheduleId] = useState<number | null>(null);

  // ── Filter states per tab
  const [scheduleFilters, setScheduleFilters] = useState<Record<string, unknown>>({});
  const [attendanceFilters, setAttendanceFilters] = useState<Record<string, unknown>>({});
  const [leaveFilters, setLeaveFilters] = useState<Record<string, unknown>>({});
  const [overtimeFilters, setOvertimeFilters] = useState<Record<string, unknown>>({});
  const [violationFilters, setViolationFilters] = useState<Record<string, unknown>>({});

  // ── Modal open states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [attendanceModalOpen, setAttendanceModalOpen] = useState(false);
  const [leaveModalOpen, setLeaveModalOpen] = useState(false);
  const [overtimeModalOpen, setOvertimeModalOpen] = useState(false);
  const [violationModalOpen, setViolationModalOpen] = useState(false);

  // ── Detail modal
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailTitle, setDetailTitle] = useState('');
  const [detailKind, setDetailKind] = useState<DetailKind>('leave');
  const [detailData, setDetailData] = useState<Record<string, unknown> | null>(null);

  // ── Action confirmation modal (replaces global reason field)
  const [actionConfirm, setActionConfirm] = useState<ActionConfirmState>(DEFAULT_ACTION_CONFIRM);

  // ── Data states
  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [attendance, setAttendance] = useState<WorkforceAttendanceRecord[]>([]);
  const [leaveRows, setLeaveRows] = useState<LeaveRequest[]>([]);
  const [overtimeRows, setOvertimeRows] = useState<OvertimeRequest[]>([]);
  const [violationRows, setViolationRows] = useState<ViolationRecord[]>([]);
  const [leaveTypeOptions, setLeaveTypeOptions] = useState<Array<{ label: string; value: number }>>([]);

  const scheduleFormOfficeId = Form.useWatch('office_id', form) as number | undefined;

  // ── Remote data
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
    () => drivers.map((d) => ({ value: d.id, label: d.name || d.code || `Driver #${d.id}` })),
    [drivers],
  );
  const officeOptions = useMemo(
    () => offices.map((o) => ({ value: o.id, label: o.name || o.code || `Office #${o.id}` })),
    [offices],
  );
  const companyOptions = useMemo(
    () => (companiesData?.data ?? []).map((c) => ({ value: c.id, label: c.name || c.code || `Company #${c.id}` })),
    [companiesData?.data],
  );
  const vehicleOptions = useMemo(
    () => (vehiclesData?.data ?? []).map((v) => ({ value: v.id, label: v.plate_number || `Vehicle #${v.id}` })),
    [vehiclesData?.data],
  );
  const tripOptions = useMemo(
    () => (tripsData?.data ?? []).map((t) => ({ value: t.id, label: t.code || `Trip #${t.id}` })),
    [tripsData?.data],
  );
  const attendanceOptions = useMemo(
    () => attendance.map((a) => ({ value: a.id, label: `#${a.id} – Driver ${a.driver_id} – ${a.date}` })),
    [attendance],
  );

  // ── Hierarchical filter helpers
  const filterOfficeOptions = useCallback(
    (companyId?: number) => {
      if (!companyId) return officeOptions;
      return offices
        .filter((o) => !o.company_id || o.company_id === companyId)
        .map((o) => ({ value: o.id, label: o.name || o.code || `Office #${o.id}` }));
    },
    [officeOptions, offices],
  );

  const filterDriverOptions = useCallback(
    (companyId?: number, officeId?: number) =>
      drivers
        .filter((d) => {
          if (companyId && d.company_id && d.company_id !== companyId) return false;
          if (officeId && d.office_id && d.office_id !== officeId) return false;
          return true;
        })
        .map((d) => ({ value: d.id, label: d.name || d.code || `Driver #${d.id}` })),
    [drivers],
  );

  const sanitizeHierarchicalFilters = useCallback(
    (raw: Record<string, unknown>) => {
      const next = { ...raw };
      const companyId = typeof next.company_id === 'number' ? next.company_id : undefined;
      const officeId = typeof next.office_id === 'number' ? next.office_id : undefined;
      const driverId = typeof next.driver_id === 'number' ? next.driver_id : undefined;
      if (officeId && companyId) {
        const office = offices.find((o) => o.id === officeId);
        if (office?.company_id && office.company_id !== companyId) delete next.office_id;
      }
      if (driverId) {
        const driver = drivers.find((d) => d.id === driverId);
        if (companyId && driver?.company_id && driver.company_id !== companyId) delete next.driver_id;
        const eff = typeof next.office_id === 'number' ? next.office_id : undefined;
        if (eff && driver?.office_id && driver.office_id !== eff) delete next.driver_id;
      }
      return next;
    },
    [drivers, offices],
  );

  const sanitizeAndSyncFilters = useCallback(
    (setFilters: (updater: (prev: Record<string, unknown>) => Record<string, unknown>) => void) => {
      setFilters((prev) => {
        const sanitized = sanitizeHierarchicalFilters(prev);
        return JSON.stringify(prev) === JSON.stringify(sanitized) ? prev : sanitized;
      });
    },
    [sanitizeHierarchicalFilters],
  );

  // ── Data loading
  const loadTab = useCallback(
    async (tab: TabKey) => {
    setLoading(true);
    try {
      if (tab === 'schedule') {
          const d = await workforceOpsService.listDriverSchedules({ per_page: 50, ...sanitizeHierarchicalFilters(scheduleFilters) });
          setSchedules(d.data);
      } else if (tab === 'attendance') {
          const d = await workforceOpsService.listAttendance({ per_page: 50, ...sanitizeHierarchicalFilters(attendanceFilters) });
          setAttendance(d.data);
      } else if (tab === 'leave') {
          const d = await workforceOpsService.listLeave({ per_page: 50, ...sanitizeHierarchicalFilters(leaveFilters) });
          setLeaveRows(d.data);
      } else if (tab === 'overtime') {
          const d = await workforceOpsService.listOvertime({ per_page: 50, ...sanitizeHierarchicalFilters(overtimeFilters) });
          setOvertimeRows(d.data);
      } else {
          const d = await workforceOpsService.listViolations({ per_page: 50, ...sanitizeHierarchicalFilters(violationFilters) });
          setViolationRows(d.data);
      }
      } catch {
      toast.error(t('common.loadError'));
    } finally {
      setLoading(false);
    }
    },
    [t, scheduleFilters, attendanceFilters, leaveFilters, overtimeFilters, violationFilters, sanitizeHierarchicalFilters],
  );

  useEffect(() => {
    const loadLeaveTypes = async () => {
      try {
        const r = await workforceOpsService.listLeaveTypes();
        setLeaveTypeOptions((r.data || []).map((item) => ({ label: item.name || `Type ${item.id}`, value: item.id })));
      } catch {
        // no-op
      }
    };
    void loadLeaveTypes();
  }, []);

  useEffect(() => { void loadTab(activeTab); }, [activeTab, loadTab]);

  useEffect(() => {
    sanitizeAndSyncFilters(setScheduleFilters);
    sanitizeAndSyncFilters(setAttendanceFilters);
    sanitizeAndSyncFilters(setLeaveFilters);
    sanitizeAndSyncFilters(setOvertimeFilters);
    sanitizeAndSyncFilters(setViolationFilters);
  }, [sanitizeAndSyncFilters]);

  // ── Generic action runner
  const runAction = useCallback(
    async (action: () => Promise<unknown>, refreshTab: TabKey, successMessage: string) => {
      try {
        await action();
        toast.success(successMessage);
        await loadTab(refreshTab);
      } catch (error) {
        if (getErrorStatus(error) === 409) {
          toast.error(getErrorMessage(error) || t('common.conflictError' as never));
          return;
        }
        toast.error(getErrorMessage(error) || t('common.saveError'));
      }
    },
    [loadTab, t],
  );

  // ── Action confirm helper: opens modal, executes on confirm
  const confirmThenRun = useCallback(
    (
      title: string,
      action: () => Promise<unknown>,
      refreshTab: TabKey,
      successMessage: string,
      opts?: { requireReason?: boolean; placeholder?: string; actionWithReason?: (r: string) => Promise<unknown> },
    ) => {
      setActionConfirm({
        open: true,
        title,
        requireReason: opts?.requireReason ?? false,
        placeholder: opts?.placeholder,
        onConfirm: async (reason) => {
          const fn = opts?.actionWithReason ? () => opts.actionWithReason!(reason) : action;
          await runAction(fn, refreshTab, successMessage);
        },
      });
    },
    [runAction],
  );

  // ── Detail opener
  const openDetail = useCallback(
    async (type: DetailKind, id: number) => {
      setLoading(true);
      try {
        let data: unknown;
        if (type === 'leave') {
          const r = await workforceOpsService.getLeaveById(id);
          data = r.data;
          setDetailTitle(`${t('workforce.leaveRequest' as never)} #${id}`);
        } else if (type === 'overtime') {
          const r = await workforceOpsService.getOvertimeById(id);
          data = r.data;
          setDetailTitle(`${t('workforce.overtimeRequest' as never)} #${id}`);
        } else if (type === 'violations') {
          const r = await workforceOpsService.getViolationById(id);
          data = r.data;
          setDetailTitle(`${t('workforce.violationRecord' as never)} #${id}`);
        }
        setDetailKind(type);
        setDetailData((data as Record<string, unknown>) ?? null);
        setDetailOpen(true);
      } catch (error) {
        toast.error(getErrorMessage(error) || t('common.loadError'));
      } finally {
        setLoading(false);
      }
    },
    [t],
  );

  // ── Form submits
  const requiredRules = (label: string) => [requiredRule(label)];

  const submitScheduleForm = async () => {
    const values = await form.validateFields();
    const payload = {
      driver_id: values.driver_id as number,
      office_id: values.office_id as number,
      work_date: (values.work_date as dayjs.Dayjs).format('YYYY-MM-DD'),
      shift_code: values.shift_code as string,
      start_time: (values.start_time as dayjs.Dayjs).format('HH:mm'),
      end_time: (values.end_time as dayjs.Dayjs).format('HH:mm'),
      vehicle_id: values.vehicle_id as number | undefined,
      notes: values.notes as string | undefined,
    };
    if (editingScheduleId) {
      await runAction(() => workforceOpsService.updateDriverSchedule(editingScheduleId, payload), 'schedule', t('notifications.updateSuccess' as never));
    } else {
      await runAction(() => workforceOpsService.createDriverSchedule(payload), 'schedule', t('notifications.createSuccess' as never));
    }
    setScheduleModalOpen(false);
    setEditingScheduleId(null);
    form.resetFields();
  };

  const submitAttendanceCheckIn = async () => {
    const values = await attendanceForm.validateFields(['driver_id', 'check_in_time']);
    await runAction(
      () => workforceOpsService.checkIn({ driver_id: values.driver_id as number, check_in_time: (values.check_in_time as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss') }),
      'attendance',
      t('workforce.checkInSuccess' as never),
    );
    setAttendanceModalOpen(false);
    attendanceForm.resetFields();
  };

  const submitAttendanceCheckOut = async () => {
    const values = await attendanceForm.validateFields(['driver_id', 'check_out_time']);
    await runAction(
      () => workforceOpsService.checkOut({ driver_id: values.driver_id as number, check_out_time: (values.check_out_time as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss') }),
      'attendance',
      t('workforce.checkOutSuccess' as never),
    );
    setAttendanceModalOpen(false);
    attendanceForm.resetFields();
  };

  const submitAttendanceAdjust = async () => {
    const values = await attendanceForm.validateFields(['attendance_id', 'adjust_reason']);
    await runAction(
      () =>
        workforceOpsService.adjustAttendance(values.attendance_id as number, {
          reason: values.adjust_reason as string,
          check_in: values.adjust_check_in ? (values.adjust_check_in as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss') : undefined,
          check_out: values.adjust_check_out ? (values.adjust_check_out as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss') : undefined,
          status: values.adjust_status as string | undefined,
        }),
      'attendance',
      t('workforce.adjustAttendanceSuccess' as never),
    );
    setAttendanceModalOpen(false);
    attendanceForm.resetFields();
  };

  const submitLeaveForm = async () => {
    const values = await leaveForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createLeave({
          driver_id: values.driver_id as number,
          leave_type_id: values.leave_type_id as number,
          from_date: (values.from_date as dayjs.Dayjs).format('YYYY-MM-DD'),
          to_date: (values.to_date as dayjs.Dayjs).format('YYYY-MM-DD'),
          total_days: values.total_days as number,
          reason: values.reason as string,
        }),
      'leave',
      t('workforce.createLeaveSuccess' as never),
    );
    setLeaveModalOpen(false);
    leaveForm.resetFields();
  };

  const submitOvertimeForm = async () => {
    const values = await overtimeForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createOvertime({
          driver_id: values.driver_id as number,
          company_id: values.company_id as number,
          work_date: (values.work_date as dayjs.Dayjs).format('YYYY-MM-DD'),
          start_time: (values.start_time as dayjs.Dayjs).format('HH:mm:ss'),
          end_time: (values.end_time as dayjs.Dayjs).format('HH:mm:ss'),
          ot_hours: values.ot_hours as number,
          reason: values.reason as string,
        }),
      'overtime',
      t('workforce.createOvertimeSuccess' as never),
    );
    setOvertimeModalOpen(false);
    overtimeForm.resetFields();
  };

  const submitViolationForm = async () => {
    const values = await violationForm.validateFields();
    await runAction(
      () =>
        workforceOpsService.createViolation({
          driver_id: values.driver_id as number,
          company_id: values.company_id as number,
          trip_id: values.trip_id as number | undefined,
          type: values.type as string,
          occurred_at: (values.occurred_at as dayjs.Dayjs).format('YYYY-MM-DD HH:mm:ss'),
          description: values.description as string,
          penalty_amount: values.penalty_amount as number,
        }),
      'violations',
      t('workforce.createViolationSuccess' as never),
    );
    setViolationModalOpen(false);
    violationForm.resetFields();
  };

  // ─── Column definitions ──────────────────────────────────────────────────────

  const scheduleColumns: ColumnsType<DriverSchedule> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    {
      title: t('drivers.title' as never),
      dataIndex: 'driver_id',
      render: (_, row) => row.driver?.name || `#${row.driver_id}`,
    },
    { title: t('workforce.workDate' as never), dataIndex: 'work_date', render: (v) => formatDate(v) },
    {
      title: t('offices.title' as never),
      dataIndex: 'office_id',
      render: (v) => offices.find((o) => o.id === v)?.name || v || '-',
    },
    {
      title: t('vehicles.title' as never),
      dataIndex: 'vehicle_id',
      render: (_, row) => row.vehicle?.plate_number || (row.vehicle_id ? `#${row.vehicle_id}` : '-'),
    },
    { title: t('workforce.shift' as never), dataIndex: 'shift_code' },
    { title: t('workforce.startTime' as never), dataIndex: 'start_time' },
    { title: t('workforce.endTime' as never), dataIndex: 'end_time' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v ?? 'draft'} colorMap={SCHEDULE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      width: 420,
      render: (_, row) => {
        const s = row.status;
        return (
          <Space wrap>
            {/* Submit: draft only */}
            <Button size="small" disabled={s !== 'draft'} onClick={() => void runAction(() => workforceOpsService.submitDriverSchedule(row.id), 'schedule', t('workforce.scheduleSubmitted' as never))}>
              {t('workforce.submit' as never)}
            </Button>

            {/* Approve: submitted only with HOS check */}
            <Button
              size="small"
              disabled={s !== 'submitted'}
              onClick={async () => {
                await runAction(async () => {
                  const hos = await workforceOpsService.checkDriverScheduleHos(row.id);
                  if (!(hos.data?.allowed ?? true)) throw new Error(hos.data?.reason || t('workforce.hosCheckFailed' as never));
            await workforceOpsService.approveDriverSchedule(row.id);
                }, 'schedule', t('workforce.scheduleApproved' as never));
              }}
            >
              {t('common.approve' as never)}
            </Button>

            {/* Reject: submitted only */}
            <Button
              size="small"
              danger
              disabled={s !== 'submitted'}
              onClick={() =>
                confirmThenRun(t('workforce.rejectSchedule' as never), () => workforceOpsService.rejectDriverSchedule(row.id), 'schedule', t('workforce.scheduleRejected' as never), {
                  requireReason: true,
                  placeholder: t('workforce.rejectReasonPlaceholder' as never),
                  actionWithReason: () => workforceOpsService.rejectDriverSchedule(row.id),
                })
              }
            >
              {t('common.reject' as never)}
            </Button>

            {/* Lock: approved only */}
            <Button size="small" disabled={s !== 'approved'} onClick={() => void runAction(() => workforceOpsService.lockDriverSchedule(row.id), 'schedule', t('workforce.scheduleLocked' as never))}>
              {t('common.lock' as never)}
            </Button>

            {/* Override: locked only, reason required */}
            <Button
              size="small"
              disabled={s !== 'locked'}
              onClick={() =>
                confirmThenRun(t('workforce.overrideLockedSchedule' as never), () => workforceOpsService.overrideDriverSchedule(row.id, ''), 'schedule', t('workforce.scheduleOverridden' as never), {
                  requireReason: true,
                  placeholder: t('workforce.overrideReasonPlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.overrideDriverSchedule(row.id, r || t('workforce.manualOverride' as never)),
                })
              }
            >
              Override
            </Button>

            {/* Edit: disabled when locked */}
            <Button
              size="small"
              disabled={s === 'locked'}
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
              {t('common.edit')}
            </Button>

            {/* Delete: disabled when locked */}
            <Button
              size="small"
              danger
              disabled={s === 'locked'}
              onClick={() =>
                confirmThenRun(t('workforce.deleteSchedule' as never), () => workforceOpsService.deleteDriverSchedule(row.id), 'schedule', t('workforce.scheduleDeleted' as never))
              }
            >
              {t('common.delete')}
            </Button>
        </Space>
        );
      },
    },
  ];

  const attendanceColumns: ColumnsType<WorkforceAttendanceRecord> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (v) => drivers.find((d) => d.id === v)?.name || `#${v}` },
    { title: t('common.date' as never), dataIndex: 'date', render: (v) => formatDate(v) },
    { title: 'Check-in', dataIndex: 'check_in', render: (v) => formatDateTime(v) },
    { title: 'Check-out', dataIndex: 'check_out', render: (v) => formatDateTime(v) },
    { title: t('workforce.workHours' as never), dataIndex: 'work_hours' },
    { title: t('workforce.otHours' as never), dataIndex: 'overtime_hours' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v || ''} colorMap={ATTENDANCE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => (
        // Open attendance modal with pre-filled row data
        <Button
          size="small"
          onClick={() => {
            attendanceForm.setFieldsValue({
              attendance_id: row.id,
              adjust_check_in: row.check_in ? dayjs(row.check_in) : undefined,
              adjust_check_out: row.check_out ? dayjs(row.check_out) : undefined,
              adjust_status: row.status,
              adjust_reason: '',
            });
            setAttendanceModalOpen(true);
          }}
        >
          {t('common.adjust' as never)}
        </Button>
      ),
    },
  ];

  const leaveColumns: ColumnsType<LeaveRequest> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (v) => drivers.find((d) => d.id === v)?.name || `#${v}` },
    { title: t('workforce.leaveType' as never), dataIndex: 'leave_type', render: (_, row) => (row as LeaveRequest & { leave_type?: { name: string } }).leave_type?.name || row.leave_type_id },
    { title: t('workforce.fromDate' as never), dataIndex: 'from_date', render: (v) => formatDate(v) },
    { title: t('workforce.toDate' as never), dataIndex: 'to_date', render: (v) => formatDate(v) },
    { title: t('workforce.totalDays' as never), dataIndex: 'total_days' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={LEAVE_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => {
        const s = row.status;
        const canApprove = ['pending', 'submitted'].includes(s);
        const canReject = ['pending', 'submitted'].includes(s);
        const canCancel = ['pending', 'submitted', 'approved'].includes(s);
        return (
        <Space>
            <Button size="small" onClick={() => void openDetail('leave', row.id)}>
              {t('common.view')}
            </Button>
            <Button
              size="small"
              disabled={!canApprove}
              onClick={() => void runAction(() => workforceOpsService.approveLeave(row.id), 'leave', t('workforce.leaveApproved' as never))}
            >
              {t('common.approve' as never)}
            </Button>
            <Button
              size="small"
              danger
              disabled={!canReject}
              onClick={() =>
                confirmThenRun(t('workforce.rejectLeave' as never), () => workforceOpsService.rejectLeave(row.id, ''), 'leave', t('workforce.rejected' as never), {
                  requireReason: true,
                  placeholder: t('workforce.rejectReasonPlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.rejectLeave(row.id, r || t('workforce.rejectedByManager' as never)),
                })
              }
            >
              {t('common.reject' as never)}
            </Button>
            <Button
              size="small"
              disabled={!canCancel}
              onClick={() => void runAction(() => workforceOpsService.cancelLeave(row.id), 'leave', t('workforce.leaveCancelled' as never))}
            >
              {t('common.cancel' as never)}
            </Button>
        </Space>
        );
      },
    },
  ];

  const overtimeColumns: ColumnsType<OvertimeRequest> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (v) => drivers.find((d) => d.id === v)?.name || `#${v}` },
    { title: t('common.date' as never), dataIndex: 'work_date', render: (v) => formatDate(v) },
    { title: t('workforce.otHours' as never), dataIndex: 'ot_hours' },
    { title: t('workforce.startTime' as never), dataIndex: 'start_time' },
    { title: t('workforce.endTime' as never), dataIndex: 'end_time' },
    { title: t('common.reason' as never), dataIndex: 'reason', ellipsis: true },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={OT_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      render: (_, row) => {
        const s = row.status;
        const canApprove = ['submitted', 'pending', 'draft'].includes(s);
        const canReject = ['submitted', 'pending', 'draft'].includes(s);
        return (
        <Space>
            <Button size="small" onClick={() => void openDetail('overtime', row.id)}>
              {t('common.view')}
            </Button>
            <Button
              size="small"
              disabled={!canApprove}
              onClick={() => void runAction(() => workforceOpsService.approveOvertime(row.id), 'overtime', t('workforce.overtimeApproved' as never))}
            >
              {t('common.approve' as never)}
            </Button>
            <Button
              size="small"
              danger
              disabled={!canReject}
              onClick={() =>
                confirmThenRun(t('workforce.rejectOvertime' as never), () => workforceOpsService.rejectOvertime(row.id, ''), 'overtime', t('workforce.rejected' as never), {
                  requireReason: true,
                  placeholder: t('workforce.rejectReasonPlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.rejectOvertime(row.id, r || t('workforce.rejectedByManager' as never)),
                })
              }
            >
              {t('common.reject' as never)}
            </Button>
        </Space>
        );
      },
    },
  ];

  const violationColumns: ColumnsType<ViolationRecord> = [
    { title: 'ID', dataIndex: 'id', width: 64 },
    { title: t('drivers.title' as never), dataIndex: 'driver_id', render: (v) => drivers.find((d) => d.id === v)?.name || `#${v}` },
    { title: t('workforce.violationType' as never), dataIndex: 'type' },
    { title: t('workforce.occurredAt' as never), dataIndex: 'occurred_at', render: (v) => formatDateTime(v) },
    { title: t('workforce.penaltyAmount' as never), dataIndex: 'penalty_amount', render: (v) => formatMoney(v) },
    {
      title: t('common.status'),
      dataIndex: 'status',
      render: (v: string) => <StatusTag value={v} colorMap={VIOLATION_STATUS_COLOR} />,
    },
    {
      title: t('common.actions'),
      width: 380,
      render: (_, row) => {
        const s = row.status;
        // Workflow: pending/pending_review → confirmed → deducted
        //                                 ↘ disputed → resolved
        // Waive: confirmed or pending
        const canConfirm = ['pending', 'pending_review'].includes(s);
        const canDispute = s === 'confirmed';
        const canResolve = s === 'disputed';
        const canWaive = ['confirmed', 'pending', 'pending_review'].includes(s);
        return (
          <Space wrap>
            <Button size="small" onClick={() => void openDetail('violations', row.id)}>
              {t('common.view')}
            </Button>

            {/* Confirm: SoD required - recorder must differ from approver */}
            <Button
              size="small"
              disabled={!canConfirm}
              onClick={() =>
                confirmThenRun(t('workforce.confirmViolation' as never), () => workforceOpsService.confirmViolation(row.id), 'violations', t('workforce.violationConfirmed' as never))
              }
            >
              {t('workforce.confirm' as never)}
            </Button>

            {/* Dispute: driver or admin can submit dispute */}
            <Button
              size="small"
              disabled={!canDispute}
              onClick={() =>
                confirmThenRun(t('workforce.disputeViolation' as never), () => workforceOpsService.disputeViolation(row.id, { reason: '' }), 'violations', t('workforce.disputeRecorded' as never), {
                  requireReason: true,
                  placeholder: t('workforce.disputeReasonPlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.disputeViolation(row.id, { reason: r }),
                })
              }
            >
              {t('workforce.dispute' as never)}
            </Button>

            {/* Resolve: process dispute */}
            <Button
              size="small"
              disabled={!canResolve}
              onClick={() =>
                confirmThenRun(t('workforce.resolveDispute' as never), () => workforceOpsService.resolveViolationDispute(row.id, { resolution: 'upheld', resolution_note: '' }), 'violations', t('workforce.disputeResolved' as never), {
                  requireReason: true,
                  placeholder: t('workforce.resolutionNotePlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.resolveViolationDispute(row.id, { resolution: 'upheld', resolution_note: r }),
                })
              }
            >
              {t('workforce.resolve' as never)}
            </Button>

            {/* Waive: exempt violation */}
            <Button
              size="small"
              danger
              disabled={!canWaive}
              onClick={() =>
                confirmThenRun(t('workforce.waiveViolation' as never), () => workforceOpsService.waiveViolation(row.id, ''), 'violations', t('workforce.violationWaived' as never), {
                  requireReason: true,
                  placeholder: t('workforce.waiveReasonPlaceholder' as never),
                  actionWithReason: (r) => workforceOpsService.waiveViolation(row.id, r || t('workforce.waivedByManager' as never)),
                })
              }
            >
              {t('workforce.waive' as never)}
            </Button>
          </Space>
        );
      },
    },
  ];

  // ─── Derived filter values ───────────────────────────────────────────────────

  const scheduleCompanyId = scheduleFilters.company_id as number | undefined;
  const scheduleOfficeId = scheduleFilters.office_id as number | undefined;
  const attendanceCompanyId = attendanceFilters.company_id as number | undefined;
  const attendanceOfficeId = attendanceFilters.office_id as number | undefined;
  const leaveCompanyId = leaveFilters.company_id as number | undefined;
  const leaveOfficeId = leaveFilters.office_id as number | undefined;
  const overtimeCompanyId = overtimeFilters.company_id as number | undefined;
  const overtimeOfficeId = overtimeFilters.office_id as number | undefined;
  const violationCompanyId = violationFilters.company_id as number | undefined;
  const violationOfficeId = violationFilters.office_id as number | undefined;

  const scheduleOfficeOpts = useMemo(() => filterOfficeOptions(scheduleCompanyId), [filterOfficeOptions, scheduleCompanyId]);
  const scheduleDriverOpts = useMemo(() => filterDriverOptions(scheduleCompanyId, scheduleOfficeId), [filterDriverOptions, scheduleCompanyId, scheduleOfficeId]);
  const attendanceOfficeOpts = useMemo(() => filterOfficeOptions(attendanceCompanyId), [filterOfficeOptions, attendanceCompanyId]);
  const attendanceDriverOpts = useMemo(() => filterDriverOptions(attendanceCompanyId, attendanceOfficeId), [filterDriverOptions, attendanceCompanyId, attendanceOfficeId]);
  const leaveOfficeOpts = useMemo(() => filterOfficeOptions(leaveCompanyId), [filterOfficeOptions, leaveCompanyId]);
  const leaveDriverOpts = useMemo(() => filterDriverOptions(leaveCompanyId, leaveOfficeId), [filterDriverOptions, leaveCompanyId, leaveOfficeId]);
  const overtimeOfficeOpts = useMemo(() => filterOfficeOptions(overtimeCompanyId), [filterOfficeOptions, overtimeCompanyId]);
  const overtimeDriverOpts = useMemo(() => filterDriverOptions(overtimeCompanyId, overtimeOfficeId), [filterDriverOptions, overtimeCompanyId, overtimeOfficeId]);
  const violationOfficeOpts = useMemo(() => filterOfficeOptions(violationCompanyId), [filterOfficeOptions, violationCompanyId]);
  const violationDriverOpts = useMemo(() => filterDriverOptions(violationCompanyId, violationOfficeId), [filterDriverOptions, violationCompanyId, violationOfficeId]);
  const scheduleFormDriverOpts = useMemo(
    () => filterDriverOptions(undefined, typeof scheduleFormOfficeId === 'number' ? scheduleFormOfficeId : undefined),
    [filterDriverOptions, scheduleFormOfficeId],
  );

  const scheduleInitialValues = useMemo(() => ({ shift_code: 'day' }), []);

  // ─── Filter panel renderers ──────────────────────────────────────────────────

  function HierarchicalFilters({
    filters,
    setFilters,
    officeOpts,
    driverOpts,
    extra,
  }: {
    filters: Record<string, unknown>;
    setFilters: React.Dispatch<React.SetStateAction<Record<string, unknown>>>;
    officeOpts: { value: number; label: string }[];
    driverOpts: { value: number; label: string }[];
    extra?: React.ReactNode;
  }) {
    return (
      <Flex wrap="wrap" gap={8}>
        <Select
          allowClear showSearch placeholder={t('companies.title' as never)} style={{ width: 180 }}
          value={filters.company_id as number | undefined}
          options={companyOptions}
          onChange={(v) => setFilters((p) => ({ ...p, company_id: v ?? undefined, office_id: undefined, driver_id: undefined }))}
        />
        <Select
          allowClear showSearch placeholder={t('offices.title' as never)} style={{ width: 180 }}
          value={filters.office_id as number | undefined}
          options={officeOpts}
          onChange={(v) => setFilters((p) => ({ ...p, office_id: v ?? undefined, driver_id: undefined }))}
        />
        <Select
          allowClear showSearch placeholder={t('drivers.title' as never)} style={{ width: 180 }}
          value={filters.driver_id as number | undefined}
          options={driverOpts}
          onChange={(v) => setFilters((p) => ({ ...p, driver_id: v ?? undefined }))}
        />
        {extra}
      </Flex>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <>
      {!embedded && <PageHeader title={t('workforce.title' as never)} />}

      <Card>
        <Flex vertical gap={12}>
          {/* Filter card per tab */}
          {activeTab === 'schedule' && (
            <Card size="small">
              <Flex vertical gap={10}>
                <HierarchicalFilters
                  filters={scheduleFilters}
                  setFilters={setScheduleFilters}
                  officeOpts={scheduleOfficeOpts}
                  driverOpts={scheduleDriverOpts}
                  extra={
                    <>
                      <DatePicker
                        placeholder={t('workforce.workDate' as never)}
                        onChange={(v) => setScheduleFilters((p) => ({ ...p, work_date: v ? v.format('YYYY-MM-DD') : undefined }))}
                      />
                      <Select
                        allowClear placeholder={t('common.status' as never)} style={{ width: 160 }}
                        options={[
                          { label: 'draft', value: 'draft' },
                          { label: 'submitted', value: 'submitted' },
                          { label: 'approved', value: 'approved' },
                          { label: 'locked', value: 'locked' },
                        ]}
                        onChange={(v) => setScheduleFilters((p) => ({ ...p, status: v }))}
                      />
                    </>
                  }
                />
                <Button
                  type="primary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => {
                    form.resetFields();
                    form.setFieldsValue(scheduleInitialValues);
                    setEditingScheduleId(null);
                    setScheduleModalOpen(true);
                  }}
                >
                  {t('workforce.createSchedule' as never)}
                </Button>
              </Flex>
            </Card>
          )}

          {activeTab === 'attendance' && (
            <Card size="small">
              <Flex vertical gap={10}>
                <HierarchicalFilters
                  filters={attendanceFilters}
                  setFilters={setAttendanceFilters}
                  officeOpts={attendanceOfficeOpts}
                  driverOpts={attendanceDriverOpts}
                  extra={
                    <>
                      <DatePicker
                        placeholder={t('common.date' as never)}
                        onChange={(v) => setAttendanceFilters((p) => ({ ...p, date: v ? v.format('YYYY-MM-DD') : undefined }))}
                      />
                      <DatePicker.RangePicker
                        onChange={(v) =>
                          setAttendanceFilters((p) => ({
                            ...p,
                            from: v?.[0] ? v[0].format('YYYY-MM-DD') : undefined,
                            to: v?.[1] ? v[1].format('YYYY-MM-DD') : undefined,
                          }))
                        }
                      />
                      <Select
                        allowClear placeholder={t('common.status' as never)} style={{ width: 160 }}
                        options={[
                          { label: t('workforce.present' as never), value: 'present' },
                          { label: t('workforce.late' as never), value: 'late' },
                          { label: t('workforce.absent' as never), value: 'absent' },
                          { label: t('workforce.partial' as never), value: 'partial' },
                        ]}
                        onChange={(v) => setAttendanceFilters((p) => ({ ...p, status: v }))}
                      />
                    </>
                  }
                />
                <Button
                  type="primary"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => { attendanceForm.resetFields(); setAttendanceModalOpen(true); }}
                >
                  {t('workforce.attendanceActions' as never)}
                </Button>
              </Flex>
            </Card>
          )}

          {activeTab === 'leave' && (
            <Card size="small">
              <Flex vertical gap={10}>
                <HierarchicalFilters
                  filters={leaveFilters}
                  setFilters={setLeaveFilters}
                  officeOpts={leaveOfficeOpts}
                  driverOpts={leaveDriverOpts}
                  extra={
                    <>
                      <Select
                        allowClear placeholder={t('common.status' as never)} style={{ width: 160 }}
                        options={[
                          { label: 'pending', value: 'pending' },
                          { label: 'submitted', value: 'submitted' },
                          { label: 'approved', value: 'approved' },
                          { label: 'rejected', value: 'rejected' },
                          { label: 'cancelled', value: 'cancelled' },
                        ]}
                        onChange={(v) => setLeaveFilters((p) => ({ ...p, status: v }))}
                      />
                      <DatePicker.RangePicker
                        onChange={(v) =>
                          setLeaveFilters((p) => ({
                            ...p,
                            from: v?.[0] ? v[0].format('YYYY-MM-DD') : undefined,
                            to: v?.[1] ? v[1].format('YYYY-MM-DD') : undefined,
                          }))
                        }
                      />
                    </>
                  }
                />
                <Button type="primary" style={{ alignSelf: 'flex-start' }} onClick={() => setLeaveModalOpen(true)}>
                  {t('workforce.createLeave' as never)}
                </Button>
              </Flex>
            </Card>
          )}

          {activeTab === 'overtime' && (
            <Card size="small">
              <Flex vertical gap={10}>
                <HierarchicalFilters
                  filters={overtimeFilters}
                  setFilters={setOvertimeFilters}
                  officeOpts={overtimeOfficeOpts}
                  driverOpts={overtimeDriverOpts}
                  extra={
                    <>
                      <Select
                        allowClear placeholder={t('common.status' as never)} style={{ width: 160 }}
                        options={[
                          { label: 'draft', value: 'draft' },
                          { label: 'submitted', value: 'submitted' },
                          { label: 'approved', value: 'approved' },
                          { label: 'rejected', value: 'rejected' },
                          { label: 'paid', value: 'paid' },
                        ]}
                        onChange={(v) => setOvertimeFilters((p) => ({ ...p, status: v }))}
                      />
                      <DatePicker.RangePicker
                        onChange={(v) =>
                          setOvertimeFilters((p) => ({
                            ...p,
                            from: v?.[0] ? v[0].format('YYYY-MM-DD') : undefined,
                            to: v?.[1] ? v[1].format('YYYY-MM-DD') : undefined,
                          }))
                        }
                      />
                    </>
                  }
                />
                <Button type="primary" style={{ alignSelf: 'flex-start' }} onClick={() => setOvertimeModalOpen(true)}>
                  {t('workforce.createOvertime' as never)}
                </Button>
              </Flex>
            </Card>
          )}

          {activeTab === 'violations' && (
            <Card size="small">
              <Flex vertical gap={10}>
                <HierarchicalFilters
                  filters={violationFilters}
                  setFilters={setViolationFilters}
                  officeOpts={violationOfficeOpts}
                  driverOpts={violationDriverOpts}
                  extra={
                    <>
                      <Select
                        allowClear placeholder={t('common.status' as never)} style={{ width: 160 }}
                        options={[
                          { label: 'pending', value: 'pending' },
                          { label: 'pending_review', value: 'pending_review' },
                          { label: 'confirmed', value: 'confirmed' },
                          { label: 'disputed', value: 'disputed' },
                          { label: 'resolved', value: 'resolved' },
                          { label: 'waived', value: 'waived' },
                          { label: 'deducted', value: 'deducted' },
                        ]}
                        onChange={(v) => setViolationFilters((p) => ({ ...p, status: v }))}
                      />
                      <DatePicker.RangePicker
                        onChange={(v) =>
                          setViolationFilters((p) => ({
                            ...p,
                            from: v?.[0] ? v[0].format('YYYY-MM-DD') : undefined,
                            to: v?.[1] ? v[1].format('YYYY-MM-DD') : undefined,
                          }))
                        }
                      />
                    </>
                  }
                />
                <Button type="primary" style={{ alignSelf: 'flex-start' }} onClick={() => setViolationModalOpen(true)}>
                  {t('workforce.recordViolation' as never)}
                </Button>
              </Flex>
            </Card>
          )}

          {/* Tab navigation */}
          <Tabs
            activeKey={activeTab}
            onChange={(k) => setActiveTab(k as TabKey)}
            items={[
              { key: 'schedule',   label: t('workforce.tabs.schedule'    as never) },
              { key: 'attendance', label: t('workforce.tabs.attendance'  as never) },
              { key: 'leave',      label: t('workforce.tabs.leave'       as never) },
              { key: 'overtime',   label: t('workforce.tabs.overtime'    as never) },
              { key: 'violations', label: t('workforce.tabs.violations'  as never) },
            ]}
          />

          {activeTab === 'schedule' && <Table rowKey="id" loading={loading} columns={scheduleColumns} dataSource={schedules} scroll={{ x: 'max-content' }} />}
          {activeTab === 'attendance' && <Table rowKey="id" loading={loading} columns={attendanceColumns} dataSource={attendance} scroll={{ x: 'max-content' }} />}
          {activeTab === 'leave' && <Table rowKey="id" loading={loading} columns={leaveColumns} dataSource={leaveRows} scroll={{ x: 'max-content' }} />}
          {activeTab === 'overtime' && <Table rowKey="id" loading={loading} columns={overtimeColumns} dataSource={overtimeRows} scroll={{ x: 'max-content' }} />}
          {activeTab === 'violations' && <Table rowKey="id" loading={loading} columns={violationColumns} dataSource={violationRows} scroll={{ x: 'max-content' }} />}
        </Flex>
      </Card>

      {/* ── Action confirmation modal ─────────────────────────────────── */}
      <ActionConfirmModal state={actionConfirm} onClose={() => setActionConfirm(DEFAULT_ACTION_CONFIRM)} />

      {/* ── Schedule modal ────────────────────────────────────────────── */}
      <Modal
        title={editingScheduleId ? t('workforce.updateSchedule' as never) : t('workforce.createSchedule' as never)}
        open={scheduleModalOpen}
        onCancel={() => { setScheduleModalOpen(false); setEditingScheduleId(null); form.resetFields(); }}
        onOk={() => void submitScheduleForm()}
        okText={editingScheduleId ? t('common.update' as never) : t('common.create' as never)}
        width={840}
      >
        <Form
          form={form}
          layout="vertical"
          initialValues={scheduleInitialValues}
          onValuesChange={(changed) => {
            if (Object.prototype.hasOwnProperty.call(changed, 'office_id')) {
              form.setFieldValue('driver_id', undefined);
            }
          }}
        >
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <FormItemSelect name="office_id" label={t('offices.title' as never)} options={officeOptions} showSearch rules={requiredRules(t('offices.title' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="driver_id" label={t('drivers.title' as never)} options={scheduleFormDriverOpts} showSearch rules={requiredRules(t('drivers.title' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="work_date" label={t('workforce.workDate' as never)} rules={requiredRules(t('workforce.workDate' as never))}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect
                name="shift_code"
                label={t('workforce.shift' as never)}
                options={[
                  { label: t('workforce.shiftDay' as never), value: 'day' },
                  { label: t('workforce.shiftNight' as never), value: 'night' },
                  { label: t('workforce.shiftSplit' as never), value: 'split' },
                  { label: t('workforce.shiftCustom' as never), value: 'custom' },
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="start_time" label={t('workforce.startTime' as never)} rules={requiredRules(t('workforce.startTime' as never))}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="end_time"
                label={t('workforce.endTime' as never)}
                rules={[
                  ...requiredRules(t('workforce.endTime' as never)),
                  {
                    validator: async (_, value) => {
                      const start = form.getFieldValue('start_time') as dayjs.Dayjs | undefined;
                      if (!start || !value) return;
                      if (!(value as dayjs.Dayjs).isAfter(start, 'minute'))
                        throw new Error(t('validation.checkOutAfterCheckIn'));
                    },
                  },
                ]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="vehicle_id" label={t('workforce.vehicleOptional' as never)} options={vehicleOptions} showSearch />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="notes" label={t('workforce.notes' as never)}>
                <Input />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Attendance modal ──────────────────────────────────────────── */}
      <Modal
        title={t('workforce.tabs.attendance' as never)}
        open={attendanceModalOpen}
        onCancel={() => { setAttendanceModalOpen(false); attendanceForm.resetFields(); }}
        footer={null}
        width={840}
      >
        <Form form={attendanceForm} layout="vertical">
          <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
            {t('workforce.checkInOut' as never)}
          </Typography.Text>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <FormItemSelect name="driver_id" label={t('drivers.title' as never)} options={driverOptions} showSearch rules={requiredRules(t('drivers.title' as never))} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="check_in_time" label={t('workforce.checkInTime' as never)}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="check_out_time" label={t('workforce.checkOutTime' as never)}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Button block onClick={() => void submitAttendanceCheckIn()}>Check-in</Button>
            </Col>
            <Col xs={24} md={8}>
              <Button block onClick={() => void submitAttendanceCheckOut()}>Check-out</Button>
            </Col>
          </Row>

          <Typography.Text type="secondary" style={{ display: 'block', margin: '16px 0 8px' }}>
            {t('workforce.adjustAttendance' as never)}
          </Typography.Text>
          <Row gutter={12}>
            <Col xs={24} md={8}>
              <FormItemSelect name="attendance_id" label={t('workforce.attendanceRecord' as never)} options={attendanceOptions} showSearch rules={requiredRules(t('workforce.attendanceRecord' as never))} />
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="adjust_check_in" label={t('workforce.adjustCheckIn' as never)}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <Form.Item name="adjust_check_out" label={t('workforce.adjustCheckOut' as never)}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={8}>
              <FormItemSelect
                name="adjust_status"
                label={t('common.status' as never)}
                options={[
                  { label: t('workforce.present' as never), value: 'present' },
                  { label: t('workforce.late' as never), value: 'late' },
                  { label: t('workforce.absent' as never), value: 'absent' },
                  { label: t('workforce.partial' as never), value: 'partial' },
                ]}
              />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="adjust_reason"
                label={t('workforce.adjustReasonRequired' as never)}
                rules={requiredRules(t('workforce.adjustReason' as never))}
              >
                <Input placeholder={t('workforce.adjustReasonPlaceholder' as never)} />
              </Form.Item>
            </Col>
            <Col xs={24} md={4} style={{ display: 'flex', alignItems: 'flex-end', paddingBottom: 4 }}>
              <Button type="primary" block onClick={() => void submitAttendanceAdjust()}>
                {t('workforce.saveAdjustment' as never)}
              </Button>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Leave modal ───────────────────────────────────────────────── */}
      <Modal
        title={t('workforce.createLeave' as never)}
        open={leaveModalOpen}
        onCancel={() => { setLeaveModalOpen(false); leaveForm.resetFields(); }}
        onOk={() => void submitLeaveForm()}
        okText={t('workforce.createRequest' as never)}
        width={720}
      >
        <Form form={leaveForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <FormItemSelect name="driver_id" label={t('drivers.title' as never)} options={driverOptions} showSearch rules={requiredRules(t('drivers.title' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="leave_type_id" label={t('workforce.leaveType' as never)} options={leaveTypeOptions} rules={requiredRules(t('workforce.leaveType' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="from_date" label={t('workforce.fromDate' as never)} rules={requiredRules(t('workforce.fromDate' as never))}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="to_date"
                label={t('workforce.toDate' as never)}
                rules={[
                  ...requiredRules(t('workforce.toDate' as never)),
                  {
                    validator: async (_, value) => {
                      const from = leaveForm.getFieldValue('from_date') as dayjs.Dayjs | undefined;
                      if (!from || !value) return;
                      if ((value as dayjs.Dayjs).isBefore(from, 'day')) throw new Error(t('validation.dueDateAfterIssuedAt'));
                    },
                  },
                ]}
              >
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="total_days" label={t('workforce.totalDays' as never)} rules={[nonNegativeNumberRule(t('workforce.totalDays' as never))]}>
                <InputNumber min={0} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="reason" label={t('common.reason' as never)}>
                <Input placeholder={t('workforce.leaveReasonPlaceholder' as never)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Overtime modal ────────────────────────────────────────────── */}
      <Modal
        title={t('workforce.createOvertime' as never)}
        open={overtimeModalOpen}
        onCancel={() => { setOvertimeModalOpen(false); overtimeForm.resetFields(); }}
        onOk={() => void submitOvertimeForm()}
        okText={t('workforce.createRequest' as never)}
        width={720}
      >
        <Form form={overtimeForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <FormItemSelect name="driver_id" label={t('drivers.title' as never)} options={driverOptions} showSearch rules={requiredRules(t('drivers.title' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="company_id" label={t('companies.title' as never)} options={companyOptions} showSearch />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="work_date" label={t('workforce.overtimeDate' as never)} rules={requiredRules(t('common.date' as never))}>
                <DatePicker style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="ot_hours" label={t('workforce.overtimeHours' as never)} rules={[nonNegativeNumberRule(t('workforce.overtimeHours' as never))]}>
                <InputNumber min={0} max={24} style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="start_time" label={t('workforce.startTimeOt' as never)} rules={requiredRules(t('workforce.startTime' as never))}>
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item
                name="end_time"
                label={t('workforce.endTimeOt' as never)}
                rules={[
                  ...requiredRules(t('workforce.endTime' as never)),
                  {
                    validator: async (_, value) => {
                      const start = overtimeForm.getFieldValue('start_time') as dayjs.Dayjs | undefined;
                      if (!start || !value) return;
                      if (!(value as dayjs.Dayjs).isAfter(start, 'minute')) throw new Error(t('validation.checkOutAfterCheckIn'));
                    },
                  },
                ]}
              >
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="reason" label={t('workforce.overtimeReason' as never)}>
                <Input placeholder={t('workforce.overtimeReasonPlaceholder' as never)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Violation modal ───────────────────────────────────────────── */}
      <Modal
        title={t('workforce.recordViolation' as never)}
        open={violationModalOpen}
        onCancel={() => { setViolationModalOpen(false); violationForm.resetFields(); }}
        onOk={() => void submitViolationForm()}
        okText={t('workforce.record' as never)}
        width={720}
      >
        <Form form={violationForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <FormItemSelect name="driver_id" label={t('drivers.title' as never)} options={driverOptions} showSearch rules={requiredRules(t('drivers.title' as never))} />
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="company_id" label={t('companies.title' as never)} options={companyOptions} showSearch />
            </Col>
            <Col xs={24} md={12}>
              <FormItemSelect name="trip_id" label={t('workforce.tripOptional' as never)} options={tripOptions} showSearch />
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="type" label={t('workforce.violationType' as never)} rules={requiredRules(t('workforce.violationType' as never))}>
                <Input placeholder="vd: speeding, harsh_brake, route_deviation..." />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="occurred_at" label={t('workforce.occurredAt' as never)} rules={requiredRules(t('workforce.occurredAt' as never))}>
                <DatePicker showTime style={{ width: '100%' }} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="penalty_amount" label={t('workforce.penaltyAmountVnd' as never)} rules={[nonNegativeNumberRule(t('workforce.penaltyAmount' as never))]}>
                <InputNumber min={0} style={{ width: '100%' }} formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')} />
              </Form.Item>
            </Col>
            <Col xs={24}>
              <Form.Item name="description" label={t('workforce.detailDescription' as never)}>
                <Input.TextArea rows={3} placeholder={t('workforce.violationDescriptionPlaceholder' as never)} />
              </Form.Item>
            </Col>
          </Row>
        </Form>
      </Modal>

      {/* ── Detail modal ──────────────────────────────────────────────── */}
      <Modal
        title={detailTitle}
        open={detailOpen}
        onCancel={() => setDetailOpen(false)}
        footer={<Button onClick={() => setDetailOpen(false)}>{t('common.close' as never)}</Button>}
        width={600}
      >
        {detailData ? (
          <DetailDescriptions kind={detailKind} data={detailData} />
        ) : (
          <Typography.Text type="secondary">{t('common.noData' as never)}</Typography.Text>
        )}
      </Modal>
    </>
  );
}