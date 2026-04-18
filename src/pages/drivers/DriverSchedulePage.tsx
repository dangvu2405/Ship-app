import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import {
  Alert,
  Button,
  Calendar,
  Card,
  Col,
  DatePicker,
  Descriptions,
  Empty,
  Flex,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Tag,
  Tabs,
  TimePicker,
  Typography,
  type CalendarProps,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PlusOutlined, UnorderedListOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { AbsenceRecord, Company, Driver, DriverSchedule, LeaveRequest, Office, PublicHoliday, Vehicle } from '@/types';
import toast from 'react-hot-toast';
import workforceOpsService from '@/services/workforce-ops.service';
import { useAuth } from '@/hooks/useAuth';
import { useDriverDayMap } from '@/hooks/use-driver-day-map';
import { ScheduleDayCell } from '@/components/drivers/ScheduleDayCell';
import { getErrorMessage } from '@/utils/errorHandler';
import { LeaveList } from '@/pages/leave/LeaveList';
import { OvertimeList } from '@/pages/overtime/OvertimeList';
import { ViolationsList } from '@/pages/violations/ViolationsList';
import { ROUTES } from '@/routes';

// ─── Schedule status helpers ──────────────────────────────────────────────────

const SCHEDULE_STATUS_COLOR: Record<string, string> = {
  draft:     'default',
  submitted: 'gold',
  approved:  'success',
  locked:    'purple',
  rejected:  'error',
};

const BULK_STATUS_COLOR: Record<string, string> = {
  locked:   'blue',
  conflict: 'red',
  rejected: 'red',
  approved: 'green',
  submitted:'gold',
};

function scheduleStatusLabel(s: string) {
  const m: Record<string, string> = { draft: 'Nháp', submitted: 'Đã nộp', approved: 'Đã duyệt', locked: 'Đã khóa', rejected: 'Từ chối' };
  return m[s] ?? s;
}

type WorkStatusFilter = 'all' | 'working' | 'leave' | 'absent';

const SHIFT_OPTIONS = [
  { label: 'Ca ngày (day)',        value: 'day' },
  { label: 'Ca đêm (night)',       value: 'night' },
  { label: 'Ca tách (split)',      value: 'split' },
  { label: 'Ca sáng (morning)',    value: 'morning' },
  { label: 'Ca chiều (afternoon)', value: 'afternoon' },
  { label: 'Tuỳ chỉnh (custom)',  value: 'custom' },
];

function toFiniteNumber(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

/** Resolve office id from list payload (shape varies by API / includes). */
function driverOfficeId(d: Driver): number | undefined {
  const row = d as unknown as Record<string, unknown>;
  const top = toFiniteNumber(row.office_id);
  if (top != null) return top;
  const emp = d.employee as Record<string, unknown> | undefined;
  if (!emp) return undefined;
  const fromFlat = toFiniteNumber(emp.office_id ?? emp.officeId);
  if (fromFlat != null) return fromFlat;
  const office = emp.office as { id?: unknown } | undefined;
  return toFiniteNumber(office?.id);
}

// ─── StatCard ─────────────────────────────────────────────────────────────────

function StatCard({ label, value, danger }: { label: string; value: number; danger?: boolean }) {
  return (
    <Card size="small" styles={{ body: { padding: 12 } }}>
      <Typography.Title level={3} style={{ margin: 0, color: danger ? '#cf1322' : undefined }}>
        {value}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>{label}</Typography.Text>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DriverSchedulePage() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const canManage = hasRole('admin') || hasRole('manager') || hasRole('dispatcher');

  // ── Gate state ──
  const [selectedCompanyId, setSelectedCompanyId] = useState<number | null>(null);
  const [selectedOfficeId, setSelectedOfficeId]   = useState<number | null>(null);
  const [activeTab, setActiveTab] = useState('schedule');
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);

  const driversListFilters = useMemo(
    () =>
      selectedOfficeId != null
        ? [{ field: 'office_id', operator: 'eq' as const, value: selectedOfficeId }]
        : [],
    [selectedOfficeId],
  );

  // ── Remote data ──
  const { data: companiesData } = useList<Company>({ resource: 'companies', pagination: { current: 1, pageSize: 200 } });
  const { data: officesData }   = useList<Office>({ resource: 'offices', pagination: { current: 1, pageSize: 200 } });
  const { data, isLoading }     = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'asc' }],
    filters: driversListFilters,
  });
  const { data: vehiclesData }  = useList<Vehicle>({ resource: 'vehicles', pagination: { current: 1, pageSize: 200 } });

  const companies = useMemo(() => companiesData?.data ?? [], [companiesData?.data]);
  const offices   = useMemo(() => officesData?.data ?? [], [officesData?.data]);
  const drivers   = useMemo(() => data?.data ?? [], [data?.data]);

  useEffect(() => {
    if (selectedOfficeId != null || offices.length === 0) {
      return;
    }
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
    () => companies
      .map((c) => {
        const id = toFiniteNumber(c.id);
        return id == null ? null : { label: c.name, value: id };
      })
      .filter((o): o is { label: string; value: number } => o != null),
    [companies],
  );
  const officeSelectOptions = useMemo(() => {
    if (selectedCompanyId == null) {
      return [];
    }
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
    if (selectedOfficeId == null) {
      return [];
    }
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

  // Drivers in selected office
  const officeDrivers = useMemo(() => {
    if (selectedOfficeId == null) {
      return drivers;
    }
    const oid = selectedOfficeId;
    return drivers.filter((d) => driverOfficeId(d) === oid);
  }, [drivers, selectedOfficeId]);

  const driverOptions = useMemo(
    () => officeDrivers
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
      if (c == null) {
        return;
      }
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
      if (o == null) {
        return;
      }
      setSelectedOfficeId(o);
      const row = offices.find((x) => toFiniteNumber(x.id) === o);
      const co = toFiniteNumber(row?.company_id);
      if (co != null) {
        setSelectedCompanyId(co);
      }
      setSelectedDriverId(null);
      setSchedules([]);
    },
    [offices],
  );

  useEffect(() => {
    if (selectedDriverId == null) {
      return;
    }
    if (!selectedOfficeId) {
      setSelectedDriverId(null);
      return;
    }
    const stillInOffice = drivers.some(
      (d) => toFiniteNumber(d.id) === selectedDriverId && driverOfficeId(d) === selectedOfficeId,
    );
    if (!stillInOffice) {
      setSelectedDriverId(null);
    }
  }, [drivers, selectedDriverId, selectedOfficeId]);

  // ── Schedule calendar state ──
  const [currentMonth, setCurrentMonth]         = useState<Dayjs>(dayjs());
  const [selectedShift, setSelectedShift]       = useState<string>('all');
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<WorkStatusFilter>('all');
  const [schedules, setSchedules]               = useState<DriverSchedule[]>([]);
  const [leaveRequests, setLeaveRequests]        = useState<LeaveRequest[]>([]);
  const [absences, setAbsences]                 = useState<AbsenceRecord[]>([]);
  const [publicHolidays, setPublicHolidays]     = useState<PublicHoliday[]>([]);
  const [scheduleLoading, setScheduleLoading]   = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Schedule detail modal
  const [detailSchedule, setDetailSchedule] = useState<DriverSchedule | null>(null);
  const [actionLoading, setActionLoading]   = useState<string | null>(null);
  const [hosWarning, setHosWarning]         = useState<string | null>(null);
  const [rejectOpen, setRejectOpen]         = useState(false);
  const [rejectReason, setRejectReason]     = useState('');
  const [overrideOpen, setOverrideOpen]     = useState(false);
  const [overrideReason, setOverrideReason] = useState('');

  // Create modal
  const [createOpen, setCreateOpen]   = useState(false);
  const [createLoading, setCreateLoading] = useState(false);
  const [createForm] = Form.useForm();

  // ── Derived stats ──
  const shiftOptions = useMemo(() => {
    const codes = [...new Set(schedules.map((s) => s.shift_code).filter((c): c is string => Boolean(c)))];
    return [
      { label: t('drivers.scheduleAllShifts'), value: 'all' },
      ...codes.map((c) => ({ label: c, value: c })),
    ];
  }, [schedules, t]);

  const workStatusOptions = useMemo(() => [
    { label: t('drivers.scheduleStatusFilterAll'),     value: 'all' as const },
    { label: t('drivers.scheduleStatusFilterWorking'), value: 'working' as const },
    { label: t('drivers.scheduleStatusFilterLeave'),   value: 'leave' as const },
    { label: t('drivers.scheduleStatusFilterAbsent'),  value: 'absent' as const },
  ], [t]);

  const statCards = useMemo(() => [
    { label: t('drivers.scheduleStatsAssigned'),  value: schedules.length },
    { label: t('drivers.scheduleStatsConfirmed'), value: schedules.filter((s) => s.status === 'approved').length },
    { label: t('drivers.scheduleStatsDrivers'),   value: new Set(schedules.map((s) => s.driver_id)).size },
    { label: t('drivers.scheduleStatsConflicts'), value: schedules.filter((s) => s.status === 'rejected' || s.status === 'conflict').length, danger: true },
  ], [schedules, t]);

  const scheduleStatus = useMemo(() => {
    if (!schedules.length) return { color: 'default' as const, label: t('common.noData') };
    const statuses = schedules.map((s) => s.status ?? 'draft');
    const find = (s: string) => statuses.some((x) => x === s);
    if (statuses.every((s) => s === 'locked')) return { color: BULK_STATUS_COLOR.locked,   label: t('drivers.scheduleStatusLocked') };
    if (find('rejected') || find('conflict'))  return { color: BULK_STATUS_COLOR.conflict,  label: t('drivers.scheduleStatusConflict') };
    if (find('approved'))                      return { color: BULK_STATUS_COLOR.approved,  label: t('drivers.scheduleStatusApproved') };
    if (find('submitted'))                     return { color: BULK_STATUS_COLOR.submitted, label: t('drivers.scheduleStatusSubmitted') };
    return                                            { color: 'default' as const,           label: t('drivers.scheduleStatusDraft') };
  }, [schedules, t]);

  const submittedIds = useMemo(() => schedules.filter((s) => s.status === 'submitted').map((s) => s.id), [schedules]);
  const approvedIds  = useMemo(() => schedules.filter((s) => s.status === 'approved').map((s) => s.id), [schedules]);

  const dayMap = useDriverDayMap({ schedules, leaveRequests, absences, publicHolidays });

  // ── Data loading ──
  const loadSchedules = useCallback(async () => {
    if (!selectedOfficeId || selectedDriverId == null) {
      setSchedules([]);
      setScheduleLoading(false);
      return;
    }
    setScheduleLoading(true);
    try {
      const result = await workforceOpsService.listDriverSchedules({
        from:      currentMonth.startOf('month').format('YYYY-MM-DD'),
        to:        currentMonth.endOf('month').format('YYYY-MM-DD'),
        per_page:  200,
        office_id: selectedOfficeId,
        driver_id: selectedDriverId,
        ...(selectedShift !== 'all' && { shift_code: selectedShift }),
      });
      setSchedules(result.data);
    } catch {
      toast.error(t('common.loadError'));
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedOfficeId, selectedDriverId, currentMonth, selectedShift, t]);

  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  useEffect(() => {
    if (!selectedOfficeId || selectedDriverId == null) {
      setLeaveRequests([]);
      setAbsences([]);
      setPublicHolidays([]);
      return;
    }
    const from = currentMonth.startOf('month').format('YYYY-MM-DD');
    const to   = currentMonth.endOf('month').format('YYYY-MM-DD');
    const driverParam = { driver_id: selectedDriverId };
    void Promise.all([
      workforceOpsService.listLeaveRequests({ ...driverParam, from, to, status: 'approved', per_page: 200 }),
      workforceOpsService.listAbsences({ ...driverParam, from, to, per_page: 200 }),
      workforceOpsService.listPublicHolidays({ year: currentMonth.year() }),
    ]).then(([lr, ab, ph]) => {
      setLeaveRequests(lr.data);
      setAbsences(ab.data);
      setPublicHolidays(ph.data);
    }).catch(() => { /* silent */ });
  }, [selectedOfficeId, currentMonth, selectedDriverId]);

  // ── Bulk actions ──
  const executeBulkAction = useCallback(async (ids: number[], action: 'approve' | 'lock') => {
    if (!ids.length) return;
    setBulkActionLoading(true);
    try {
      await Promise.all(ids.map((id) =>
        action === 'approve' ? workforceOpsService.approveDriverSchedule(id) : workforceOpsService.lockDriverSchedule(id),
      ));
      toast.success(action === 'approve' ? t('drivers.scheduleBulkApproveSuccess') : t('drivers.scheduleBulkLockSuccess'));
      await loadSchedules();
    } catch {
      toast.error(action === 'approve' ? t('drivers.scheduleBulkApproveError') : t('drivers.scheduleBulkLockError'));
    } finally {
      setBulkActionLoading(false);
    }
  }, [loadSchedules, t]);

  // ── Single schedule actions ──
  const runScheduleAction = useCallback(async (key: string, action: () => Promise<unknown>, successMsg: string) => {
    setActionLoading(key);
    try {
      await action();
      toast.success(successMsg);
      setDetailSchedule(null);
      setHosWarning(null);
      await loadSchedules();
    } catch (err) {
      toast.error(getErrorMessage(err) ?? 'Thao tác thất bại');
    } finally {
      setActionLoading(null);
    }
  }, [loadSchedules]);

  const handleApprove = useCallback(async () => {
    if (!detailSchedule) return;
    const id = detailSchedule.id;
    setActionLoading('hos');
    try {
      const res = await workforceOpsService.checkDriverScheduleHos(id);
      if (res.data && !res.data.allowed) {
        setHosWarning(res.data.reason ?? 'Tài xế vượt giới hạn 12 giờ lái xe/ngày (HOS)');
        setActionLoading(null);
        return;
      }
    } catch { /* HOS unavailable — proceed */ }
    setActionLoading(null);
    void runScheduleAction('approve', () => workforceOpsService.approveDriverSchedule(id), 'Đã duyệt lịch');
  }, [detailSchedule, runScheduleAction]);

  const handleApproveOverrideHos = useCallback(() => {
    if (!detailSchedule) return;
    // Instead of silently approving, open override modal which requires a reason for audit trail
    setHosWarning(null);
    setOverrideOpen(true);
  }, [detailSchedule]);

  const handleCreateSchedule = useCallback(async () => {
    try {
      const values = await createForm.validateFields() as {
        driver_id: number; work_date: Dayjs; shift_code: string;
        start_time?: Dayjs; end_time?: Dayjs; vehicle_id?: number; notes?: string;
      };
      const driver = drivers.find((d) => d.id === values.driver_id);
      setCreateLoading(true);
      await workforceOpsService.createDriverSchedule({
        driver_id: values.driver_id,
        office_id: driver ? driverOfficeId(driver) ?? selectedOfficeId ?? undefined : selectedOfficeId ?? undefined,
        work_date: values.work_date.format('YYYY-MM-DD'),
        shift_code: values.shift_code,
        start_time: values.start_time?.format('HH:mm'),
        end_time: values.end_time?.format('HH:mm'),
        vehicle_id: values.vehicle_id,
        notes: values.notes,
      });
      toast.success('Đã tạo lịch công tác');
      setCreateOpen(false);
      createForm.resetFields();
      await loadSchedules();
    } catch (err) {
      if (err && typeof err === 'object' && 'errorFields' in err) return;
      toast.error(getErrorMessage(err) ?? 'Tạo lịch thất bại');
    } finally {
      setCreateLoading(false);
    }
  }, [createForm, drivers, selectedOfficeId, loadSchedules]);

  // ── Calendar cell render ──
  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
    if (mode === 'month') setCurrentMonth(value);
  };

  const cellRender: CalendarProps<Dayjs>['cellRender'] = (date, info) => {
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
    const handleClick = dayInfo.kind === 'working' && dayInfo.schedule
      ? () => { setDetailSchedule(dayInfo.schedule!); setHosWarning(null); }
      : undefined;
    return <ScheduleDayCell date={date} info={dayInfo} onClick={handleClick} />;
  };

  // ── Main render ──
  return (
    <>
      <PageHeader
        title={t('drivers.scheduleTitle')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('drivers.scheduleTitle') },
        ]}
        actions={
          canManage ? (
            <>
              <Link to={ROUTES.admin.driversScheduleBulk}>
                <Button icon={<UnorderedListOutlined />}>Tạo lịch theo lô</Button>
              </Link>
              <Button
                type="primary"
                icon={<PlusOutlined />}
                onClick={() => {
                  createForm.resetFields();
                  if (selectedDriverId != null) createForm.setFieldValue('driver_id', selectedDriverId);
                  setCreateOpen(true);
                }}
              >
                Tạo lịch
              </Button>
            </>
          ) : null
        }
      />

      <Card styles={{ body: { padding: 0 } }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          style={{ padding: '0 16px' }}
          items={[
            {
              key: 'schedule',
              label: 'Lịch làm việc',
              children: (

                <div style={{ padding: '0 0 16px' }}>

                  {/* Controls */}
                  <Flex justify="space-between" align="center" wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
                    <Space size={8} wrap>
                      <Button size="small" onClick={() => setCurrentMonth((p) => p.subtract(1, 'month'))}>{'<'}</Button>
                      <Typography.Text strong>
                        {t('drivers.scheduleMonthLabel', { month: currentMonth.format('M'), year: currentMonth.format('YYYY') })}
                      </Typography.Text>
                      <Button size="small" onClick={() => setCurrentMonth((p) => p.add(1, 'month'))}>{'>'}</Button>
                    </Space>
                    <Space wrap>
                      <Typography.Text type="secondary">{t('payrolls.company')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('companies.title')}
                        options={companySelectOptions}
                        value={selectedCompanyId ?? undefined}
                        onChange={(id) => applyCompanyFilter(id)}
                      />
                      <Typography.Text type="secondary">{t('offices.title')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('offices.title')}
                        options={officeSelectOptions}
                        value={selectedOfficeId ?? undefined}
                        disabled={selectedCompanyId == null}
                        onChange={(id) => applyOfficeFilter(id)}
                      />
                      <Typography.Text type="secondary">{t('drivers.title')}:</Typography.Text>
                      <Select<number>
                        showSearch
                        allowClear
                        optionFilterProp="label"
                        style={{ minWidth: 220 }}
                        placeholder={t('drivers.title')}
                        options={driverToolbarOptions}
                        value={selectedDriverId ?? undefined}
                        disabled={selectedOfficeId == null}
                        onChange={(v) => {
                          if (v == null) {
                            setSelectedDriverId(null);
                            return;
                          }
                          const id = toFiniteNumber(v);
                          setSelectedDriverId(id ?? null);
                        }}
                      />
                      <Tag bordered={false} color={scheduleStatus.color}>{scheduleStatus.label}</Tag>
                      {canManage && (
                        <Button loading={bulkActionLoading} disabled={!submittedIds.length} onClick={() => void executeBulkAction(submittedIds, 'approve')}>
                          {t('drivers.scheduleConfirmAll')} ({submittedIds.length})
                        </Button>
                      )}
                      <Button loading={bulkActionLoading} disabled={!approvedIds.length || !canManage} onClick={() => void executeBulkAction(approvedIds, 'lock')}>
                        {t('drivers.scheduleLock')} ({approvedIds.length})
                      </Button>
                    </Space>
                  </Flex>

                  {selectedDriverId == null ? (
                    <Empty style={{ margin: '32px 0' }} description={t('drivers.scheduleSelectDriverToView')} />
                  ) : (
                    <>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12, marginBottom: 16 }}>
                        {statCards.map((s) => <StatCard key={s.label} {...s} />)}
                        <Card size="small" styles={{ body: { padding: 12 } }}>
                          <Typography.Title level={3} style={{ margin: 0 }}>{dayMap.size}</Typography.Title>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>{t('drivers.scheduleLegendWorking')}</Typography.Text>
                        </Card>
                      </div>

                      <Flex gap={8} wrap="wrap" style={{ marginBottom: 12 }}>
                        <Select value={selectedShift}      onChange={setSelectedShift}      options={shiftOptions}      style={{ minWidth: 140 }} />
                        <Select value={selectedWorkStatus} onChange={setSelectedWorkStatus} options={workStatusOptions} style={{ minWidth: 220 }} />
                      </Flex>

                      <Card size="small" styles={{ body: { padding: 8 } }}>
                        <Space wrap style={{ marginBottom: 8 }}>
                          {[
                            { color: '#E6F1FB', border: '#85B7EB', label: t('drivers.scheduleLegendWorking') },
                            { color: '#EAF3DE', border: '#97C459', label: t('drivers.scheduleLegendLeave') },
                            { color: '#FCEBEB', border: '#F09595', label: t('drivers.scheduleLegendNoLeave') },
                            { color: '#EEEDFE', border: '#AFA9EC', label: t('drivers.scheduleLegendHoliday') },
                            { color: '#F5F5F5', border: '#D9D9D9', label: t('drivers.scheduleLegendWeekend') },
                          ].map((item) => (
                            <Space key={item.label} size={4}>
                              <div style={{ width: 12, height: 12, borderRadius: 3, background: item.color, border: `1px solid ${item.border}` }} />
                              <Typography.Text style={{ fontSize: 11 }}>{item.label}</Typography.Text>
                            </Space>
                          ))}
                          <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                            · Nhấn vào ô lịch để xem & quản lý
                          </Typography.Text>
                        </Space>
                        {isLoading || scheduleLoading ? (
                          <TableSkeleton rows={6} columns={1} />
                        ) : (
                          <Calendar value={currentMonth} onPanelChange={onPanelChange} cellRender={cellRender} headerRender={() => null} className="driver-attendance-calendar" />
                        )}
                      </Card>
                    </>
                  )}
                </div>
              ),
            },
            {
              key: 'leave',
              label: 'Nghỉ phép',
              children: (
                <LeaveList
                  companyId={selectedCompanyId ?? undefined}
                  officeId={selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
            {
              key: 'overtime',
              label: 'Tăng ca',
              children: (
                <OvertimeList
                  companyId={selectedCompanyId ?? undefined}
                  officeId={selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
            {
              key: 'violations',
              label: 'Vi phạm',
              children: (
                <ViolationsList
                  companyId={selectedCompanyId ?? undefined}
                  officeId={selectedOfficeId ?? undefined}
                  embedded
                />
              ),
            },
          ]}
        />
      </Card>

      {/* ── Create schedule modal ─────────────────────────────── */}
      <Modal title="Tạo lịch công tác" open={createOpen} onCancel={() => setCreateOpen(false)} onOk={() => void handleCreateSchedule()} okText="Tạo lịch" confirmLoading={createLoading} width={600} destroyOnHidden>
        <Form form={createForm} layout="vertical">
          <Row gutter={12}>
            <Col xs={24} md={12}>
              <Form.Item name="driver_id" label="Tài xế" rules={[{ required: true, message: 'Chọn tài xế' }]}>
                <Select showSearch optionFilterProp="label" placeholder="Chọn tài xế" options={driverOptions} />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="work_date" label="Ngày làm việc" rules={[{ required: true, message: 'Chọn ngày' }]}>
                <DatePicker style={{ width: '100%' }} format="DD/MM/YYYY" />
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
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
              </Form.Item>
            </Col>
            <Col xs={24} md={12}>
              <Form.Item name="end_time" label="Giờ kết thúc">
                <TimePicker style={{ width: '100%' }} format="HH:mm" />
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

      {/* ── Schedule detail modal ─────────────────────────────── */}
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
        open={!!detailSchedule}
        onCancel={() => {
          setDetailSchedule(null);
          setHosWarning(null);
        }}
        footer={null}
        width={520}
        destroyOnHidden
      >
        {detailSchedule ? (
          <Flex vertical gap={16}>
            {hosWarning && (
              <Alert type="warning" message="Vi phạm HOS" showIcon
                description={<Flex vertical gap={8}><span>{hosWarning}</span>
                  <Space>
                    <Button size="small" danger loading={actionLoading === 'approve'} onClick={handleApproveOverrideHos}>Duyệt mặc dù vi phạm</Button>
                    <Button size="small" onClick={() => setHosWarning(null)}>Huỷ</Button>
                  </Space>
                </Flex>}
              />
            )}
            <Descriptions column={1} size="small" bordered>
              <Descriptions.Item label="Ngày">{dayjs(detailSchedule.work_date).format('DD/MM/YYYY (dddd)')}</Descriptions.Item>
              <Descriptions.Item label="Tài xế">{driverOptions.find((d) => d.value === detailSchedule.driver_id)?.label ?? `#${detailSchedule.driver_id}`}</Descriptions.Item>
              <Descriptions.Item label="Ca">{detailSchedule.shift_code ?? '-'}</Descriptions.Item>
              <Descriptions.Item label="Giờ">{detailSchedule.start_time ?? '-'} – {detailSchedule.end_time ?? '-'}</Descriptions.Item>
              {detailSchedule.vehicle_id && <Descriptions.Item label="Xe">{vehicleOptions.find((v) => v.value === detailSchedule.vehicle_id)?.label ?? `#${detailSchedule.vehicle_id}`}</Descriptions.Item>}
              {detailSchedule.notes && <Descriptions.Item label="Ghi chú">{detailSchedule.notes}</Descriptions.Item>}
              {detailSchedule.override_reason && <Descriptions.Item label="Override">{detailSchedule.override_reason}</Descriptions.Item>}
            </Descriptions>
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              Luồng: <strong>Nháp</strong> → <strong>Đã nộp</strong> → <strong>Đã duyệt</strong> → <strong>Đã khóa</strong>
            </Typography.Text>
            {canManage && !hosWarning && (
              <Flex gap={8} wrap="wrap">
                {(detailSchedule.status === 'draft' || !detailSchedule.status) && (
                  <Button type="primary" loading={actionLoading === 'submit'}
                    onClick={() => void runScheduleAction('submit', () => workforceOpsService.submitDriverSchedule(detailSchedule.id), 'Đã nộp lịch')}>
                    Nộp lịch
                  </Button>
                )}
                {detailSchedule.status === 'submitted' && (
                  <>
                    <Button type="primary" loading={actionLoading === 'approve' || actionLoading === 'hos'} onClick={() => void handleApprove()}>Duyệt</Button>
                    <Button danger onClick={() => setRejectOpen(true)}>Từ chối</Button>
                  </>
                )}
                {detailSchedule.status === 'approved' && (
                  <Button loading={actionLoading === 'lock'} onClick={() => void runScheduleAction('lock', () => workforceOpsService.lockDriverSchedule(detailSchedule.id), 'Đã khóa lịch')}>
                    Khóa lịch
                  </Button>
                )}
                {detailSchedule.status === 'locked' && (
                  <Button onClick={() => setOverrideOpen(true)}>Override lịch</Button>
                )}
              </Flex>
            )}
          </Flex>
        ) : null}
      </Modal>

      {/* ── Reject modal ─────────────────────────────────────── */}
      <Modal title="Từ chối lịch công tác" open={rejectOpen} onCancel={() => { setRejectOpen(false); setRejectReason(''); }}
        onOk={() => { void runScheduleAction('reject', () => workforceOpsService.rejectDriverSchedule(detailSchedule!.id), 'Đã từ chối lịch'); setRejectOpen(false); setRejectReason(''); }}
        okText="Từ chối" okButtonProps={{ danger: true }} confirmLoading={actionLoading === 'reject'}>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Lịch #{detailSchedule?.id} · {detailSchedule?.work_date} · {detailSchedule?.shift_code}
        </Typography.Text>
        <Input.TextArea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} placeholder="Lý do từ chối..." rows={3} maxLength={500} />
      </Modal>

      {/* ── Override modal ────────────────────────────────────── */}
      <Modal title="Override lịch đã khóa" open={overrideOpen} onCancel={() => { setOverrideOpen(false); setOverrideReason(''); }}
        onOk={() => { const r = overrideReason.trim(); void runScheduleAction('override', () => workforceOpsService.overrideDriverSchedule(detailSchedule!.id, r), 'Đã override lịch'); setOverrideOpen(false); setOverrideReason(''); }}
        okText="Override" okButtonProps={{ disabled: !overrideReason.trim() }} confirmLoading={actionLoading === 'override'}>
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
          Lịch #{detailSchedule?.id} đã khóa. Cần lý do để ghi nhận.
        </Typography.Text>
        <Input.TextArea value={overrideReason} onChange={(e) => setOverrideReason(e.target.value)} placeholder="Lý do override..." rows={3} maxLength={500} />
      </Modal>
    </>
  );
  
}
