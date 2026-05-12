import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import { Form } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import type { CalendarProps } from 'antd';
import type { CellRenderInfo } from 'rc-picker/lib/interface';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type {
  AbsenceRecord,
  Company,
  Driver,
  DriverSchedule,
  LeaveRequest,
  Office,
  PublicHoliday,
  Vehicle,
} from '@/types';
import driverScheduleService from '@/services/driver-schedule.service';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/stores/auth.store';
import { useDriverDayMap } from '@/hooks/useDriverDayMap';
import { ScheduleDayCell } from '@/pages/drivers/components/ScheduleDayCell';
import { getErrorMessage } from '@/utils/errorHandler';
import { useTranslation } from '@/hooks/useTranslation';
import {
  BULK_STATUS_COLOR,
  type WorkStatusFilter,
  driverOfficeId,
  toFiniteNumber,
} from '@/pages/drivers/components/driver-schedule.constants';

export function useDriverSchedulePage() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { hasRole, user } = useAuth();
  const currentTenantId = useAuthStore((s) => s.currentTenantId);
  const canManage = hasRole('admin') || hasRole('manager') || hasRole('dispatcher');

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const driversListFilters = useMemo(
    () =>
      selectedOfficeId != null ? [{ field: 'office_id', operator: 'eq' as const, value: selectedOfficeId }] : [],
    [selectedOfficeId],
  );

  const { data: companiesData } = useList<Company>({ resource: 'companies', pagination: { current: 1, pageSize: 200 } });
  const { data: officesData } = useList<Office>({ resource: 'offices', pagination: { current: 1, pageSize: 200 } });
  const { data, isLoading } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'id', order: 'asc' }],
    filters: driversListFilters,
    queryOptions: { enabled: selectedOfficeId !== null },
  });
  const { data: vehiclesData } = useList<Vehicle>({ resource: 'vehicles', pagination: { current: 1, pageSize: 200 } });

  const companies = useMemo(() => companiesData?.data ?? [], [companiesData?.data]);
  const offices = useMemo(() => officesData?.data ?? [], [officesData?.data]);
  const drivers = useMemo(() => data?.data ?? [], [data?.data]);

  useEffect(() => {
    if (selectedOfficeId != null || offices.length === 0) return;
    const fromUser = user?.employee?.office_id;
    const uid = toFiniteNumber(fromUser);
    const byUser = uid != null ? offices.find((o) => toFiniteNumber(o.id) === uid) : undefined;
    const pick = byUser ?? offices[0];
    if (pick) {
      setSelectedOfficeId(toFiniteNumber(pick.id) ?? null);
      setSelectedCompanyId(toFiniteNumber(pick.company_id) ?? null);
    }
  }, [offices, user?.employee?.office_id, selectedOfficeId]);

  const companySelectOptions = useMemo(
    () =>
      companies
        .map((c) => {
          const id = toFiniteNumber(c.id);
          return id == null ? null : { label: c.name, value: id };
        })
        .filter((o): o is { label: string; value: number } => o != null),
    [companies],
  );

  const officeSelectOptions = useMemo(() => {
    if (selectedCompanyId == null) return [];
    const cid = selectedCompanyId;
    return offices
      .filter((o) => toFiniteNumber(o.company_id) === cid)
      .map((o) => {
        const id = toFiniteNumber(o.id);
        return id == null ? null : { label: o.name, value: id };
      })
      .filter((o): o is { label: string; value: number } => o != null);
  }, [offices, selectedCompanyId]);

  const driverToolbarOptions = useMemo(() => {
    if (selectedOfficeId == null) return [];
    const oid = selectedOfficeId;
    return drivers
      .filter((d) => driverOfficeId(d) === oid)
      .map((d) => {
        const id = toFiniteNumber(d.id);
        if (id == null) return null;
        return { label: d.employee?.name ?? `#${id}`, value: id };
      })
      .filter((o): o is { label: string; value: number } => o != null);
  }, [drivers, selectedOfficeId]);

  const vehicleOptions = useMemo(
    () => (vehiclesData?.data ?? []).map((v) => ({ label: v.plate_number || `#${v.id}`, value: v.id })),
    [vehiclesData],
  );

  const officeDrivers = useMemo(() => {
    if (selectedOfficeId == null) return drivers;
    const oid = selectedOfficeId;
    return drivers.filter((d) => driverOfficeId(d) === oid);
  }, [drivers, selectedOfficeId]);

  const driverOptions = useMemo(
    () =>
      officeDrivers
        .map((d) => {
          const id = toFiniteNumber(d.id);
          return id == null ? null : { label: d.employee?.name ?? `#${id}`, value: id };
        })
        .filter((o): o is { label: string; value: number } => o != null),
    [officeDrivers],
  );

  const applyCompanyFilter = useCallback(
    (cid: unknown) => {
      const c = toFiniteNumber(cid);
      if (c == null) return;
      setSelectedCompanyId(c);
      const firstOff = offices.find((o) => toFiniteNumber(o.company_id) === c);
      setSelectedOfficeId(toFiniteNumber(firstOff?.id) ?? null);
      setSelectedDriverId(null);
      setSchedules([]);
    },
    [offices],
  );

  const applyOfficeFilter = useCallback(
    (oid: unknown) => {
      const o = toFiniteNumber(oid);
      if (o == null) return;
      setSelectedOfficeId(o);
      const row = offices.find((x) => toFiniteNumber(x.id) === o);
      const co = toFiniteNumber(row?.company_id);
      if (co != null) setSelectedCompanyId(co);
      setSelectedDriverId(null);
      setSchedules([]);
    },
    [offices],
  );

  useEffect(() => {
    if (selectedDriverId == null) return;
    if (!selectedOfficeId) {
      setSelectedDriverId(null);
      return;
    }
    const stillInOffice = drivers.some(
      (d) => toFiniteNumber(d.id) === selectedDriverId && driverOfficeId(d) === selectedOfficeId,
    );
    if (!stillInOffice) setSelectedDriverId(null);
  }, [drivers, selectedDriverId, selectedOfficeId]);

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [selectedShift, setSelectedShift] = useState<string>('all');
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<WorkStatusFilter>('all');
  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  const [detailSchedule, setDetailSchedule] = useState<DriverSchedule | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [hosWarning, setHosWarning] = useState<string | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [overrideOpen, setOverrideOpen] = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  const [createOpen, setCreateOpen] = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();
  const [applyScheduleOpen, setApplyScheduleOpen] = useState(false);

  const officesForApplySchedule = useMemo(() => {
    if (selectedCompanyId == null) return [];
    return offices.filter((o) => toFiniteNumber(o.company_id) === selectedCompanyId);
  }, [offices, selectedCompanyId]);

  const companyIdForScheduleTemplates = selectedCompanyId ?? currentTenantId;

  const shiftOptions = useMemo(() => {
    const codes = [...new Set(schedules.map((s) => s.shift_code).filter((c): c is string => Boolean(c)))];
    return [{ label: t('drivers.scheduleAllShifts'), value: 'all' }, ...codes.map((c) => ({ label: c, value: c }))];
  }, [schedules, t]);

  const workStatusOptions = useMemo(
    () => [
      { label: t('drivers.scheduleStatusFilterAll'), value: 'all' as const },
      { label: t('drivers.scheduleStatusFilterWorking'), value: 'working' as const },
      { label: t('drivers.scheduleStatusFilterLeave'), value: 'leave' as const },
      { label: t('drivers.scheduleStatusFilterAbsent'), value: 'absent' as const },
    ],
    [t],
  );

  const statCards = useMemo(
    () => [
      { label: t('drivers.scheduleStatsAssigned'), value: schedules.length },
      { label: t('drivers.scheduleStatsConfirmed'), value: schedules.filter((s) => s.status === 'approved').length },
      { label: t('drivers.scheduleStatsDrivers'), value: new Set(schedules.map((s) => s.driver_id)).size },
      {
        label: t('drivers.scheduleStatsConflicts'),
        value: schedules.filter((s) => s.status === 'rejected' || s.status === 'conflict').length,
        danger: true,
      },
    ],
    [schedules, t],
  );

  const scheduleVehicleConflictDates = useMemo(() => {
    const byDay = new Map<string, number[]>();
    for (const s of schedules) {
      const vid = s.vehicle_id;
      if (vid == null) continue;
      const m = /^(\d{4}-\d{2}-\d{2})/.exec(String(s.work_date ?? '').trim());
      const key = m ? m[1] : '';
      if (!key) continue;
      const arr = byDay.get(key) ?? [];
      arr.push(vid);
      byDay.set(key, arr);
    }
    const dates: string[] = [];
    for (const [key, ids] of byDay) {
      if (new Set(ids).size >= 2) dates.push(key);
    }
    return dates.sort();
  }, [schedules]);

  const scheduleStatus = useMemo(() => {
    if (!schedules.length) return { color: 'default' as const, label: t('common.noData') };
    const statuses = schedules.map((s) => s.status ?? 'draft');
    const find = (s: string) => statuses.some((x) => x === s);
    if (statuses.every((s) => s === 'locked')) return { color: BULK_STATUS_COLOR.locked, label: t('drivers.scheduleStatusLocked') };
    if (find('rejected') || find('conflict')) return { color: BULK_STATUS_COLOR.conflict, label: t('drivers.scheduleStatusConflict') };
    if (find('approved')) return { color: BULK_STATUS_COLOR.approved, label: t('drivers.scheduleStatusApproved') };
    if (find('submitted')) return { color: BULK_STATUS_COLOR.submitted, label: t('drivers.scheduleStatusSubmitted') };
    return { color: 'default' as const, label: t('drivers.scheduleStatusDraft') };
  }, [schedules, t]);

  const submittedIds = useMemo(() => schedules.filter((s) => s.status === 'submitted').map((s) => s.id), [schedules]);
  const approvedIds = useMemo(() => schedules.filter((s) => s.status === 'approved').map((s) => s.id), [schedules]);

  const dayMap = useDriverDayMap({ schedules, leaveRequests, absences, publicHolidays });

  const loadSchedules = useCallback(async () => {
    if (!selectedOfficeId || selectedDriverId == null) {
      setSchedules([]);
      setScheduleLoading(false);
      return;
    }
    setScheduleLoading(true);
    try {
      const result = await driverScheduleService.list({
        from: currentMonth.startOf('month').format('YYYY-MM-DD'),
        to: currentMonth.endOf('month').format('YYYY-MM-DD'),
        per_page: 200,
        office_id: selectedOfficeId,
        driver_id: selectedDriverId,
        ...(selectedShift !== 'all' && { shift_code: selectedShift }),
      });
      setSchedules(result.data);
    } catch {
      feedback.error(t('common.loadError'));
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedOfficeId, selectedDriverId, currentMonth, selectedShift, t, feedback]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  useEffect(() => {
    if (!selectedOfficeId || selectedDriverId == null) {
      setLeaveRequests([]);
      setAbsences([]);
      setPublicHolidays([]);
      return;
    }
    const from = currentMonth.startOf('month').format('YYYY-MM-DD');
    const to = currentMonth.endOf('month').format('YYYY-MM-DD');
    const driverParam = { driver_id: selectedDriverId };
    void Promise.all([
      driverScheduleService.listLeaveRequests({ ...driverParam, from, to, status: 'approved', per_page: 200 }),
      driverScheduleService.listAbsences({ ...driverParam, from, to, per_page: 200 }),
      driverScheduleService.listPublicHolidays({ year: currentMonth.year() }),
    ])
      .then(([lr, ab, ph]) => {
        setLeaveRequests(lr.data);
        setAbsences(ab.data);
        setPublicHolidays(ph.data);
      })
      .catch(() => {});
  }, [selectedOfficeId, currentMonth, selectedDriverId]);

  const executeBulkAction = useCallback(
    async (ids: number[], action: 'approve' | 'lock') => {
      if (!ids.length) return;
      setBulkActionLoading(true);
      try {
        await Promise.all(
          ids.map((id) =>
            action === 'approve'
              ? driverScheduleService.approve(id)
              : driverScheduleService.lock(id),
          ),
        );
        feedback.success(action === 'approve' ? t('drivers.scheduleBulkApproveSuccess') : t('drivers.scheduleBulkLockSuccess'));
        await loadSchedules();
      } catch {
        feedback.error(action === 'approve' ? t('drivers.scheduleBulkApproveError') : t('drivers.scheduleBulkLockError'));
      } finally {
        setBulkActionLoading(false);
      }
    },
    [loadSchedules, t, feedback],
  );

  const runScheduleAction = useCallback(
    async (key: string, action: () => Promise<unknown>, successMsg: string) => {
      setActionLoading(key);
      try {
        await action();
        feedback.success(successMsg);
        setDetailSchedule(null);
        setHosWarning(null);
        await loadSchedules();
      } catch (err) {
        feedback.error(getErrorMessage(err) ?? 'Thao tác thất bại');
      } finally {
        setActionLoading(null);
      }
    },
    [loadSchedules, feedback],
  );

  const handleApprove = useCallback(async () => {
    if (!detailSchedule) return;
    const id = detailSchedule.id;
    setActionLoading('hos');
    try {
      const res = await driverScheduleService.checkHos(id);
      if (res.data && !res.data.allowed) {
        setHosWarning(res.data.reason ?? 'Tài xế vượt giới hạn 12 giờ lái xe/ngày (HOS)');
        setActionLoading(null);
        return;
      }
    } catch {
      /* HOS unavailable */
    }
    setActionLoading(null);
    void runScheduleAction('approve', () => driverScheduleService.approve(id), 'Đã duyệt lịch');
  }, [detailSchedule, runScheduleAction]);

  const handleApproveOverrideHos = useCallback(() => {
    if (!detailSchedule) return;
    setHosWarning(null);
    setOverrideOpen(true);
  }, [detailSchedule]);

  const openCreateModal = useCallback(() => {
    createForm.resetFields();
    if (selectedDriverId != null) createForm.setFieldValue('driver_id', selectedDriverId);
    setCreateOpen(true);
  }, [createForm, selectedDriverId]);

  const handleCreateSchedule = useCallback(async () => {
    try {
      const values = (await createForm.validateFields()) as {
        driver_id: number;
        work_date: Dayjs;
        shift_code: string;
        start_time?: Dayjs;
        end_time?: Dayjs;
        vehicle_id?: number;
        notes?: string;
      };
      const driver = drivers.find((d) => d.id === values.driver_id);
      setCreateLoading(true);
      await driverScheduleService.create({
        driver_id: values.driver_id,
        office_id: driver ? driverOfficeId(driver) ?? selectedOfficeId ?? undefined : selectedOfficeId ?? undefined,
        work_date: values.work_date.format('YYYY-MM-DD'),
        shift_code: values.shift_code,
        start_time: values.start_time?.format('HH:mm'),
        end_time: values.end_time?.format('HH:mm'),
        vehicle_id: values.vehicle_id,
        notes: values.notes,
      });
      feedback.success('Đã tạo lịch công tác');
      setCreateOpen(false);
      createForm.resetFields();
      await loadSchedules();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      feedback.error(getErrorMessage(err) ?? 'Tạo lịch thất bại');
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, drivers, selectedOfficeId, loadSchedules, feedback]);

  const onPanelChange = useCallback((value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
    if (mode === 'month') setCurrentMonth(value);
  }, []);

  const cellRender: CalendarProps<Dayjs>['cellRender'] = useCallback(
    (date: Dayjs, info: CellRenderInfo<Dayjs>) => {
      if (info.type !== 'date') return info.originNode;
      const key = date.format('YYYY-MM-DD');
      const isWeekend = date.day() === 0 || date.day() === 6;
      const dayInfoFromMap = dayMap.get(key);
      const dayInfo = dayInfoFromMap ?? (isWeekend ? { kind: 'weekend' as const } : undefined);
      if (!dayInfo) return null;
      if (selectedWorkStatus !== 'all') {
        const k = selectedWorkStatus === 'absent' ? 'noleave' : selectedWorkStatus;
        if (dayInfo.kind !== k) return null;
      }
      const handleClick =
        dayInfo.kind === 'working' && dayInfo.schedule
          ? () => {
              setDetailSchedule(dayInfo.schedule!);
              setHosWarning(null);
            }
          : undefined;
      return <ScheduleDayCell date={date} info={dayInfo} onClick={handleClick} />;
    },
    [dayMap, selectedWorkStatus],
  );

  const closeDetailModal = useCallback(() => {
    setDetailSchedule(null);
    setHosWarning(null);
  }, []);

  const dismissHosWarning = useCallback(() => {
    setHosWarning(null);
  }, []);

  const onSubmitDraft = useCallback(() => {
    if (!detailSchedule) return;
    void runScheduleAction('submit', () => driverScheduleService.submit(detailSchedule.id), 'Đã nộp lịch');
  }, [detailSchedule, runScheduleAction]);

  const onLock = useCallback(() => {
    if (!detailSchedule) return;
    void runScheduleAction('lock', () => driverScheduleService.lock(detailSchedule.id), 'Đã khóa lịch');
  }, [detailSchedule, runScheduleAction]);

  const onRejectConfirm = useCallback(() => {
    if (!detailSchedule) return;
    void runScheduleAction('reject', () => driverScheduleService.reject(detailSchedule.id), 'Đã từ chối lịch');
    setRejectOpen(false);
    setRejectReason('');
  }, [detailSchedule, runScheduleAction]);

  const onOverrideConfirm = useCallback(() => {
    if (!detailSchedule) return;
    const r = overrideReason.trim();
    void runScheduleAction('override', () => driverScheduleService.override(detailSchedule.id, r), 'Đã override lịch');
    setOverrideOpen(false);
    setOverrideReason('');
  }, [detailSchedule, overrideReason, runScheduleAction]);

  return useMemo(() => ({
    t,
    canManage,
    isLoading,
    selectedCompanyId,
    selectedOfficeId,
    selectedDriverId,
    setSelectedDriverId,
    applyCompanyFilter,
    applyOfficeFilter,
    companySelectOptions,
    officeSelectOptions,
    driverToolbarOptions,
    driverOptions,
    vehicleOptions,
    activeTab,
    setActiveTab,
    currentMonth,
    setCurrentMonth,
    selectedShift,
    setSelectedShift,
    selectedWorkStatus,
    setSelectedWorkStatus,
    shiftOptions,
    workStatusOptions,
    statCards,
    scheduleVehicleConflictDates,
    scheduleStatus,
    submittedIds,
    approvedIds,
    scheduleLoading,
    bulkActionLoading,
    dayMap,
    executeBulkAction,
    loadSchedules,
    createOpen,
    setCreateOpen,
    openCreateModal,
    createForm,
    createLoading,
    handleCreateSchedule,
    applyScheduleOpen,
    setApplyScheduleOpen,
    officesForApplySchedule,
    companyIdForScheduleTemplates,
    detailSchedule,
    hosWarning,
    actionLoading,
    handleApprove,
    handleApproveOverrideHos,
    rejectOpen,
    setRejectOpen,
    rejectReason,
    setRejectReason,
    overrideOpen,
    setOverrideOpen,
    overrideReason,
    setOverrideReason,
    onPanelChange,
    cellRender,
    closeDetailModal,
    dismissHosWarning,
    onSubmitDraft,
    onLock,
    onRejectConfirm,
    onOverrideConfirm,
  }), [
    t,
    canManage,
    isLoading,
    selectedCompanyId,
    selectedOfficeId,
    selectedDriverId,
    applyCompanyFilter,
    applyOfficeFilter,
    companySelectOptions,
    officeSelectOptions,
    driverToolbarOptions,
    driverOptions,
    vehicleOptions,
    activeTab,
    currentMonth,
    selectedShift,
    selectedWorkStatus,
    shiftOptions,
    workStatusOptions,
    statCards,
    scheduleVehicleConflictDates,
    scheduleStatus,
    submittedIds,
    approvedIds,
    scheduleLoading,
    bulkActionLoading,
    dayMap,
    executeBulkAction,
    loadSchedules,
    createOpen,
    openCreateModal,
    createForm,
    createLoading,
    handleCreateSchedule,
    applyScheduleOpen,
    officesForApplySchedule,
    companyIdForScheduleTemplates,
    detailSchedule,
    hosWarning,
    actionLoading,
    handleApprove,
    handleApproveOverrideHos,
    rejectOpen,
    rejectReason,
    overrideOpen,
    overrideReason,
    onPanelChange,
    cellRender,
    closeDetailModal,
    dismissHosWarning,
    onSubmitDraft,
    onLock,
    onRejectConfirm,
    onOverrideConfirm,
  ]);
}
