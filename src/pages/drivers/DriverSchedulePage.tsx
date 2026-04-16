import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import {
  Badge, Button, Calendar, Card, Flex, Modal,
  Select, Space, Tag, Typography, theme,
  type CalendarProps,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { AbsenceRecord, Driver, DriverSchedule, LeaveRequest, PublicHoliday } from '@/types';
import toast from 'react-hot-toast';
import workforceOpsService from '@/services/workforce-ops.service';
import { WorkforceOps } from '@/pages/system/WorkforceOps';
import { useAuth } from '@/hooks/useAuth';
import { useDriverDayMap } from '@/hooks/use-driver-day-map';
import { ScheduleDayCell } from '@/components/drivers/ScheduleDayCell';

// ─── Constants ────────────────────────────────────────────────────────────────

const STATUS_COLOR: Record<string, string> = {
  locked:   'blue',
  conflict: 'red',
  rejected: 'red',
  approved: 'green',
  submitted:'gold',
};

type WorkStatusFilter = 'all' | 'working' | 'leave' | 'absent';

// ─── Sub-components ───────────────────────────────────────────────────────────

interface StatCardProps {
  label: string;
  value: number;
  danger?: boolean;
}

function StatCard({ label, value, danger }: StatCardProps) {
  return (
    <Card size="small" styles={{ body: { padding: 12 } }}>
      <Typography.Title
        level={3}
        style={{ margin: 0, color: danger ? '#cf1322' : undefined }}
      >
        {value}
      </Typography.Title>
      <Typography.Text type="secondary" style={{ fontSize: 12 }}>
        {label}
      </Typography.Text>
    </Card>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DriverSchedulePage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { hasRole } = useAuth();
  const canManage = hasRole('admin') || hasRole('manager') || hasRole('dispatcher');

  // ── Data ──
  const { data, isLoading } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'asc' }],
  });
  const drivers = useMemo(() => data?.data ?? [], [data?.data]);

  // ── State ──
  const [selectedDriverId, setSelectedDriverId] = useState<number | 'all'>('all');
  const [currentMonth, setCurrentMonth]         = useState<Dayjs>(dayjs());
  const [selectedOffice, setSelectedOffice]     = useState<string>('all');
  const [selectedShift, setSelectedShift]       = useState<string>('all');
  const [selectedWorkStatus, setSelectedWorkStatus] = useState<WorkStatusFilter>('all');
  const [schedules, setSchedules]               = useState<DriverSchedule[]>([]);
  const [leaveRequests, setLeaveRequests] = useState<LeaveRequest[]>([]);
  const [absences, setAbsences] = useState<AbsenceRecord[]>([]);
  const [publicHolidays, setPublicHolidays] = useState<PublicHoliday[]>([]);
  const [scheduleLoading, setScheduleLoading]   = useState(false);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  // ── Derived: options ──
  const driverOptions = useMemo(
    () => drivers.map((d) => ({
      label: d.employee?.name ?? `#${d.id}`,
      value: d.id as number | 'all',
    })),
    [drivers],
  );

  const officeOptions = useMemo(() => {
    const ids = [...new Set(
      drivers.map((d) => d.employee?.office_id).filter((x): x is number => typeof x === 'number'),
    )];
    return [
      { label: t('drivers.scheduleAllOffices'), value: 'all' },
      ...ids.map((id) => ({ label: `${t('offices.title')} #${id}`, value: String(id) })),
    ];
  }, [drivers, t]);

  const shiftOptions = useMemo(() => {
    const codes = [...new Set(
      schedules.map((s) => s.shift_code).filter((c): c is string => Boolean(c)),
    )];
    return [
      { label: t('drivers.scheduleAllShifts'), value: 'all' },
      ...codes.map((c) => ({ label: c, value: c })),
    ];
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

  // ── Derived: stats ──
  const statCards = useMemo(() => [
    {
      label: t('drivers.scheduleStatsAssigned'),
      value: schedules.length,
    },
    {
      label: t('drivers.scheduleStatsConfirmed'),
      value: schedules.filter((s) => s.status === 'approved').length,
    },
    {
      label: t('drivers.scheduleStatsDrivers'),
      value: new Set(schedules.map((s) => s.driver_id)).size,
    },
    {
      label: t('drivers.scheduleStatsConflicts'),
      value: schedules.filter((s) => s.status === 'rejected' || s.status === 'conflict').length,
      danger: true,
    },
  ], [schedules, t]);

  const scheduleStatus = useMemo(() => {
    if (!schedules.length) return { color: 'default' as const, label: t('common.noData') };
    const statuses = schedules.map((s) => s.status ?? 'draft');
    const find = (s: string) => statuses.some((x) => x === s);
    if (statuses.every((s) => s === 'locked'))     return { color: STATUS_COLOR.locked, label: t('drivers.scheduleStatusLocked') };
    if (find('rejected') || find('conflict'))      return { color: STATUS_COLOR.conflict, label: t('drivers.scheduleStatusConflict') };
    if (find('approved'))                          return { color: STATUS_COLOR.approved, label: t('drivers.scheduleStatusApproved') };
    if (find('submitted'))                         return { color: STATUS_COLOR.submitted, label: t('drivers.scheduleStatusSubmitted') };
    return                                                { color: 'default' as const,              label: t('drivers.scheduleStatusDraft')    };
  }, [schedules, t]);

  const submittedIds = useMemo(
    () => schedules.filter((s) => s.status === 'submitted').map((s) => s.id),
    [schedules],
  );
  const approvedIds = useMemo(
    () => schedules.filter((s) => s.status === 'approved').map((s) => s.id),
    [schedules],
  );

  const dayMap = useDriverDayMap({
    schedules,
    leaveRequests,
    absences,
    publicHolidays,
  });

  // ── Actions ──
  const loadSchedules = useCallback(async () => {
    setScheduleLoading(true);
    try {
      const params: Record<string, unknown> = {
        from: currentMonth.startOf('month').format('YYYY-MM-DD'),
        to:   currentMonth.endOf('month').format('YYYY-MM-DD'),
        per_page: 200,
        ...(selectedDriverId !== 'all' && { driver_id: selectedDriverId }),
        ...(selectedOffice   !== 'all' && { office_id: Number(selectedOffice) }),
        ...(selectedShift    !== 'all' && { shift_code: selectedShift }),
      };
      const scheduleResult = await workforceOpsService.listDriverSchedules(params);
      setSchedules(scheduleResult.data);
    } catch {
      toast.error(t('common.loadError'));
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedDriverId, currentMonth, selectedOffice, selectedShift, t]);

  useEffect(() => { void loadSchedules(); }, [loadSchedules]);

  const loadSupportingData = useCallback(async () => {
    const from = currentMonth.startOf('month').format('YYYY-MM-DD');
    const to = currentMonth.endOf('month').format('YYYY-MM-DD');
    const driverParam = selectedDriverId !== 'all' ? { driver_id: selectedDriverId } : {};
    try {
      const [leavesRes, absencesRes, holidaysRes] = await Promise.all([
        workforceOpsService.listLeaveRequests({ ...driverParam, from, to, status: 'approved', per_page: 200 }),
        workforceOpsService.listAbsences({ ...driverParam, from, to, per_page: 200 }),
        workforceOpsService.listPublicHolidays({ year: currentMonth.year() }),
      ]);
      setLeaveRequests(leavesRes.data);
      setAbsences(absencesRes.data);
      setPublicHolidays(holidaysRes.data);
    } catch {
      toast.error(t('common.loadError'));
    }
  }, [currentMonth, selectedDriverId, t]);

  useEffect(() => {
    void loadSupportingData();
  }, [loadSupportingData]);

  const executeBulkAction = useCallback(
    async (ids: number[], action: 'approve' | 'lock') => {
      if (!ids.length) return;
      setBulkActionLoading(true);
      try {
        await Promise.all(ids.map((id) =>
          action === 'approve'
            ? workforceOpsService.approveDriverSchedule(id)
            : workforceOpsService.lockDriverSchedule(id),
        ));
        toast.success(action === 'approve'
          ? t('drivers.scheduleBulkApproveSuccess')
          : t('drivers.scheduleBulkLockSuccess'),
        );
        await loadSchedules();
      } catch {
        toast.error(action === 'approve'
          ? t('drivers.scheduleBulkApproveError')
          : t('drivers.scheduleBulkLockError'),
        );
      } finally {
        setBulkActionLoading(false);
      }
    },
    [loadSchedules, t],
  );

  // ── Calendar ──
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
      const selectedKind = selectedWorkStatus === 'absent' ? 'noleave' : selectedWorkStatus;
      if (dayInfo.kind !== selectedKind) {
        return null;
      }
    }
    return <ScheduleDayCell date={date} info={dayInfo} />;
  };

  // ── Render ──
  return (
    <>
      <Card styles={{ body: { padding: 20 } }}>
        <Flex vertical gap={16}>

          {/* Header */}
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Space size={8} wrap>
              <Button
                size="small"
                onClick={() => setCurrentMonth((p) => p.subtract(1, 'month'))}
              >
                {'<'}
              </Button>
              <Typography.Text strong>
                {t('drivers.scheduleMonthLabel', {
                  month: currentMonth.format('M'),
                  year:  currentMonth.format('YYYY'),
                })}
              </Typography.Text>
              <Button
                size="small"
                onClick={() => setCurrentMonth((p) => p.add(1, 'month'))}
              >
                {'>'}
              </Button>
            </Space>

            <Space wrap>
              <Typography.Text type="secondary">{t('drivers.title')}:</Typography.Text>
              <Select
                showSearch
                value={selectedDriverId}
                optionFilterProp="label"
                onChange={setSelectedDriverId}
                options={[
                  { label: t('drivers.scheduleAllDrivers'), value: 'all' as const },
                  ...driverOptions,
                ]}
                style={{ minWidth: 260 }}
              />
              <Tag bordered={false} color={scheduleStatus.color}>
                {scheduleStatus.label}
              </Tag>
              {canManage && (
                <Button
                  loading={bulkActionLoading}
                  disabled={!submittedIds.length}
                  onClick={() => void executeBulkAction(submittedIds, 'approve')}
                >
                  {t('drivers.scheduleConfirmAll')}
                </Button>
              )}
              <Button
                loading={bulkActionLoading}
                disabled={!approvedIds.length || !canManage}
                onClick={() => void executeBulkAction(approvedIds, 'lock')}
              >
                {t('drivers.scheduleLock')}
              </Button>
              <Button disabled={!canManage} onClick={() => setApprovalModalOpen(true)}>
                {t('drivers.scheduleOpenWorkflow')}
              </Button>
            </Space>
          </Flex>

          {/* Stats */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 12 }}>
            {statCards.map((stat) => (
              <StatCard key={stat.label} {...stat} />
            ))}
            <Card size="small" styles={{ body: { padding: 12 } }}>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {dayMap.size}
              </Typography.Title>
              <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                {t('drivers.scheduleLegendWorking')}
              </Typography.Text>
            </Card>
          </div>

          {/* Filters — một hàng ngang */}
          <Flex gap={8} wrap="wrap">
            <Select
              value={selectedOffice}
              onChange={setSelectedOffice}
              options={officeOptions}
              style={{ minWidth: 160 }}
            />
            <Select
              value={selectedShift}
              onChange={setSelectedShift}
              options={shiftOptions}
              style={{ minWidth: 140 }}
            />
            <Select
              value={selectedWorkStatus}
              onChange={setSelectedWorkStatus}
              options={workStatusOptions}
              style={{ minWidth: 220 }}
            />
          </Flex>

          {/* Calendar */}
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
                <Space size={4}>
                  <Badge color={token.colorPrimary} />
                  <Typography.Text style={{ fontSize: 11 }}>{t('drivers.scheduleAllShifts')}</Typography.Text>
                </Space>
                <Space size={4}>
                  <Badge color={token.colorSuccess} />
                  <Typography.Text style={{ fontSize: 11 }}>{t('drivers.scheduleLegendShiftAfternoon')}</Typography.Text>
                </Space>
                <Space size={4}>
                  <Badge color={token.colorInfo} />
                  <Typography.Text style={{ fontSize: 11 }}>{t('drivers.scheduleLegendShiftNight')}</Typography.Text>
                </Space>
              </Space>
              {isLoading || scheduleLoading ? (
                <TableSkeleton rows={6} columns={1} />
              ) : (
                <Calendar
                  value={currentMonth}
                  onPanelChange={onPanelChange}
                  cellRender={cellRender}
                  headerRender={() => null}
                  className="driver-attendance-calendar"
                />
              )}
          </Card>
        </Flex>
      </Card>

      {/* Approval workflow modal */}
      <Modal
        title={t('drivers.scheduleOpenWorkflow')}
        open={approvalModalOpen}
        onCancel={() => setApprovalModalOpen(false)}
        footer={null}
        width="92vw"
        style={{ top: 20 }}
        destroyOnHidden
      >
        <WorkforceOps embedded />
      </Modal>

    </>
  );
}