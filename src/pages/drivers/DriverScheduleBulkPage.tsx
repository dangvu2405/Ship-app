import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import {
  Alert,
  Button,
  Card,
  Checkbox,
  Col,
  DatePicker,
  Flex,
  Progress,
  Row,
  Select,
  Space,
  Tag,
  TimePicker,
  Typography,
} from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, Office } from '@/types';
import workforceOpsService from '@/services/workforce-ops.service';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';

const { RangePicker } = DatePicker;

// ─── Shift config ─────────────────────────────────────────────────────────────

const SHIFT_OPTIONS = [
  { label: 'Ca ngày (day)',       value: 'day' },
  { label: 'Ca sáng (morning)',   value: 'morning' },
  { label: 'Ca chiều (afternoon)',value: 'afternoon' },
  { label: 'Ca đêm (night)',      value: 'night' },
  { label: 'Ca tách (split)',     value: 'split' },
  { label: 'Tuỳ chỉnh (custom)', value: 'custom' },
];

const SHIFT_DEFAULTS: Record<string, { start: string; end: string }> = {
  day:       { start: '07:00', end: '17:00' },
  morning:   { start: '06:00', end: '14:00' },
  afternoon: { start: '14:00', end: '22:00' },
  night:     { start: '22:00', end: '06:00' },
  split:     { start: '06:00', end: '18:00' },
  custom:    { start: '07:00', end: '17:00' },
};

// Days of week — index matches dayjs().day() (0=Sun … 6=Sat)
const WEEK_DAYS = [
  { label: 'T2', value: 1 },
  { label: 'T3', value: 2 },
  { label: 'T4', value: 3 },
  { label: 'T5', value: 4 },
  { label: 'T6', value: 5 },
  { label: 'T7', value: 6 },
  { label: 'CN', value: 0 },
];

// ─── Types ────────────────────────────────────────────────────────────────────

interface PositionGroup {
  positionKey: string;    // String(position_id) or 'unknown'
  positionName: string;
  drivers: Driver[];
  shift_code: string;
  start_time: string;
  end_time: string;
  selectedIds: Set<number>;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function computeDates(from: Dayjs, to: Dayjs, selectedDays: number[]): string[] {
  const result: string[] = [];
  const daySet = new Set(selectedDays);
  let cursor = from.startOf('day');
  const end = to.endOf('day');
  while (!cursor.isAfter(end)) {
    if (daySet.has(cursor.day())) result.push(cursor.format('YYYY-MM-DD'));
    cursor = cursor.add(1, 'day');
  }
  return result;
}

// ─── Main component ───────────────────────────────────────────────────────────

export function DriverScheduleBulkPage() {
  const { t } = useTranslation();

  // ── Remote data ──
  const { data: officesData } = useList<Office>({
    resource: 'offices',
    pagination: { current: 1, pageSize: 200 },
  });
  const { data: driversData } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
  });

  const offices  = useMemo(() => officesData?.data ?? [], [officesData?.data]);
  const allDrivers = useMemo(() => driversData?.data ?? [], [driversData?.data]);

  // ── Config state ──
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | null>(null);
  const [dateRange, setDateRange]               = useState<[Dayjs, Dayjs] | null>(null);
  const [selectedDays, setSelectedDays]         = useState<number[]>([1, 2, 3, 4, 5]);
  const [groups, setGroups]                     = useState<PositionGroup[]>([]);

  // ── Submit state ──
  const [submitting, setSubmitting]         = useState(false);
  const [submitProgress, setSubmitProgress] = useState(0);
  const [submitTotal, setSubmitTotal]       = useState(0);
  const [resultSummary, setResultSummary]   = useState<{ success: number; failed: number } | null>(null);

  // ── Drivers in selected office ──
  const officeDrivers = useMemo(
    () => selectedOfficeId
      ? allDrivers.filter((d) => d.employee?.office_id === selectedOfficeId)
      : [],
    [allDrivers, selectedOfficeId],
  );

  // ── Rebuild position groups whenever office / drivers change ──
  useEffect(() => {
    if (!officeDrivers.length) {
      setGroups([]);
      return;
    }

    const posMap = new Map<string, { name: string; drivers: Driver[] }>();
    officeDrivers.forEach((d) => {
      const key  = d.employee?.position_id != null ? String(d.employee.position_id) : 'unknown';
      const name = d.employee?.position?.name ?? 'Chưa phân vị trí';
      if (!posMap.has(key)) posMap.set(key, { name, drivers: [] });
      posMap.get(key)!.drivers.push(d);
    });

    setGroups(
      [...posMap.entries()].map(([key, { name, drivers }]) => ({
        positionKey:  key,
        positionName: name,
        drivers,
        shift_code: 'day',
        start_time: '07:00',
        end_time:   '17:00',
        selectedIds: new Set(drivers.map((d) => d.id)),
      })),
    );
    setResultSummary(null);
  }, [officeDrivers]);

  // ── Group update helpers ──
  const updateGroup = useCallback(
    (positionKey: string, updates: Partial<Pick<PositionGroup, 'shift_code' | 'start_time' | 'end_time' | 'selectedIds'>>) => {
      setGroups((prev) => prev.map((g) => g.positionKey === positionKey ? { ...g, ...updates } : g));
    },
    [],
  );

  const onShiftChange = useCallback((positionKey: string, shift: string) => {
    const defaults = SHIFT_DEFAULTS[shift] ?? SHIFT_DEFAULTS.day;
    updateGroup(positionKey, { shift_code: shift, start_time: defaults.start, end_time: defaults.end });
  }, [updateGroup]);

  const toggleDriver = useCallback((positionKey: string, driverId: number, checked: boolean) => {
    setGroups((prev) => prev.map((g) => {
      if (g.positionKey !== positionKey) return g;
      const next = new Set(g.selectedIds);
      checked ? next.add(driverId) : next.delete(driverId);
      return { ...g, selectedIds: next };
    }));
  }, []);

  const toggleAllInGroup = useCallback((positionKey: string, checked: boolean) => {
    setGroups((prev) => prev.map((g) => {
      if (g.positionKey !== positionKey) return g;
      return { ...g, selectedIds: checked ? new Set(g.drivers.map((d) => d.id)) : new Set<number>() };
    }));
  }, []);

  // ── Derived summary ──
  const { dates, selectedDriverCount } = useMemo(() => {
    const allDates = dateRange ? computeDates(dateRange[0], dateRange[1], selectedDays) : [];
    const count = groups.reduce((s, g) => s + g.selectedIds.size, 0);
    return { dates: allDates, selectedDriverCount: count };
  }, [dateRange, selectedDays, groups]);

  const scheduleCount = selectedDriverCount * dates.length;

  // ── Submit ──
  const handleSubmit = useCallback(async () => {
    if (!dateRange || !dates.length || !selectedDriverCount) {
      toast.error('Vui lòng chọn chi nhánh, khoảng thời gian và ít nhất một tài xế');
      return;
    }

    type Task = {
      driver_id: number;
      office_id?: number;
      work_date: string;
      shift_code: string;
      start_time: string;
      end_time: string;
    };

    const tasks: Task[] = [];
    for (const group of groups) {
      for (const driver of group.drivers) {
        if (!group.selectedIds.has(driver.id)) continue;
        for (const date of dates) {
          tasks.push({
            driver_id: driver.id,
            office_id: driver.employee?.office_id,
            work_date: date,
            shift_code: group.shift_code,
            start_time: group.start_time,
            end_time:   group.end_time,
          });
        }
      }
    }

    setSubmitting(true);
    setSubmitProgress(0);
    setSubmitTotal(tasks.length);
    setResultSummary(null);

    let success = 0;
    let failed  = 0;
    const BATCH = 10;

    for (let i = 0; i < tasks.length; i += BATCH) {
      const batch = tasks.slice(i, i + BATCH);
      const results = await Promise.allSettled(
        batch.map((task) => workforceOpsService.createDriverSchedule(task)),
      );
      results.forEach((r) => (r.status === 'fulfilled' ? success++ : failed++));
      setSubmitProgress(Math.min(i + BATCH, tasks.length));
    }

    setSubmitting(false);
    setResultSummary({ success, failed });

    if (failed === 0) toast.success(`Tạo thành công ${success} lịch công tác`);
    else toast.error(`${success} thành công · ${failed} thất bại`);
  }, [dateRange, dates, groups, selectedDriverCount]);

  // ── Options ──
  const officeOptions = useMemo(
    () => offices.map((o) => ({ label: `${o.name}${o.code ? ` (${o.code})` : ''}`, value: o.id })),
    [offices],
  );

  // ── Render ──
  return (
    <>
      <PageHeader
        title="Tạo lịch làm việc theo lô"
        description="Gán lịch làm việc cho nhiều tài xế cùng lúc — theo chi nhánh và vị trí"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('drivers.scheduleTitle'), path: ROUTES.admin.driversSchedule },
          { label: 'Tạo lịch theo lô' },
        ]}
      />

      <Flex vertical gap={16}>

        {/* ── Step 1: Time config ──────────────────────────────────── */}
        <Card title="Bước 1 — Cấu hình thời gian & chi nhánh">
          <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} lg={8}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                Chi nhánh <Typography.Text type="danger">*</Typography.Text>
              </Typography.Text>
              <Select
                showSearch
                optionFilterProp="label"
                placeholder="Chọn chi nhánh"
                options={officeOptions}
                value={selectedOfficeId ?? undefined}
                onChange={(v) => { setSelectedOfficeId(v as number); setResultSummary(null); }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24} sm={12} lg={10}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 6 }}>
                Khoảng thời gian <Typography.Text type="danger">*</Typography.Text>
              </Typography.Text>
              <RangePicker
                format="DD/MM/YYYY"
                value={dateRange}
                onChange={(v) => { setDateRange(v as [Dayjs, Dayjs] | null); setResultSummary(null); }}
                style={{ width: '100%' }}
              />
            </Col>

            <Col xs={24}>
              <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
                Áp dụng các ngày trong tuần
              </Typography.Text>
              <Space wrap>
                {WEEK_DAYS.map(({ label, value }) => (
                  <Checkbox
                    key={value}
                    checked={selectedDays.includes(value)}
                    onChange={(e) => {
                      setSelectedDays((prev) =>
                        e.target.checked ? [...prev, value] : prev.filter((d) => d !== value),
                      );
                      setResultSummary(null);
                    }}
                  >
                    <Tag color={value === 0 || value === 6 ? 'orange' : 'blue'}
                      style={{ minWidth: 30, textAlign: 'center', margin: 0 }}>
                      {label}
                    </Tag>
                  </Checkbox>
                ))}
                {dates.length > 0 && (
                  <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                    → {dates.length} ngày
                  </Typography.Text>
                )}
              </Space>
            </Col>
          </Row>
        </Card>

        {/* ── Step 2: Position groups ──────────────────────────────── */}
        {selectedOfficeId !== null && (
          <Card title="Bước 2 — Phân ca theo vị trí công việc">
            {groups.length === 0 ? (
              <Typography.Text type="secondary">
                Không tìm thấy tài xế nào trong chi nhánh này.
              </Typography.Text>
            ) : (
              <Flex vertical gap={12}>
                {groups.map((group) => {
                  const allChecked   = group.selectedIds.size === group.drivers.length;
                  const noneChecked  = group.selectedIds.size === 0;
                  const indeterminate = !allChecked && !noneChecked;

                  return (
                    <Card
                      key={group.positionKey}
                      size="small"
                      styles={{ header: { padding: '8px 12px' }, body: { padding: '12px 16px' } }}
                      title={
                        <Flex align="center" gap={10}>
                          <Checkbox
                            checked={allChecked}
                            indeterminate={indeterminate}
                            onChange={(e) => toggleAllInGroup(group.positionKey, e.target.checked)}
                          />
                          <Typography.Text strong>{group.positionName}</Typography.Text>
                          <Tag color={group.selectedIds.size > 0 ? 'green' : 'default'}>
                            {group.selectedIds.size} / {group.drivers.length} tài xế
                          </Tag>
                        </Flex>
                      }
                      extra={
                        <Space size={6} wrap>
                          <Typography.Text type="secondary" style={{ fontSize: 12 }}>Ca:</Typography.Text>
                          <Select
                            size="small"
                            value={group.shift_code}
                            options={SHIFT_OPTIONS}
                            style={{ width: 190 }}
                            onChange={(v) => onShiftChange(group.positionKey, v as string)}
                          />
                          <TimePicker
                            size="small"
                            format="HH:mm"
                            value={dayjs(group.start_time, 'HH:mm')}
                            onChange={(v) => v && updateGroup(group.positionKey, { start_time: v.format('HH:mm') })}
                            placeholder="Bắt đầu"
                          />
                          <Typography.Text type="secondary">–</Typography.Text>
                          <TimePicker
                            size="small"
                            format="HH:mm"
                            value={dayjs(group.end_time, 'HH:mm')}
                            onChange={(v) => v && updateGroup(group.positionKey, { end_time: v.format('HH:mm') })}
                            placeholder="Kết thúc"
                          />
                        </Space>
                      }
                    >
                      <Space wrap>
                        {group.drivers.map((driver) => (
                          <Checkbox
                            key={driver.id}
                            checked={group.selectedIds.has(driver.id)}
                            onChange={(e) => toggleDriver(group.positionKey, driver.id, e.target.checked)}
                          >
                            <Typography.Text style={{ fontSize: 13 }}>
                              {driver.employee?.name ?? `#${driver.id}`}
                            </Typography.Text>
                          </Checkbox>
                        ))}
                      </Space>
                    </Card>
                  );
                })}
              </Flex>
            )}
          </Card>
        )}

        {/* ── Step 3: Summary + Submit ─────────────────────────────── */}
        {groups.length > 0 && (
          <Card title="Bước 3 — Xác nhận & tạo lịch">
            <Flex vertical gap={14}>

              {/* Summary tags */}
              <Space wrap>
                <Tag icon={<span>👥</span>} color="blue">
                  {selectedDriverCount} tài xế được chọn
                </Tag>
                <Tag icon={<span>📅</span>} color="blue">
                  {dates.length} ngày làm việc
                  {dateRange && ` (${dateRange[0].format('DD/MM')} → ${dateRange[1].format('DD/MM/YYYY')})`}
                </Tag>
                <Tag color={scheduleCount > 0 ? 'green' : 'default'}
                  style={{ fontSize: 14, padding: '4px 12px', fontWeight: 600 }}>
                  = {scheduleCount} lịch sẽ được tạo
                </Tag>
              </Space>

              {/* Preview table: group summary */}
              {scheduleCount > 0 && (
                <div style={{ background: '#fafafa', border: '1px solid #f0f0f0', borderRadius: 6, padding: '10px 14px' }}>
                  <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginBottom: 8 }}>
                    Tóm tắt phân ca:
                  </Typography.Text>
                  <Flex vertical gap={4}>
                    {groups.filter((g) => g.selectedIds.size > 0).map((group) => (
                      <Flex key={group.positionKey} align="center" gap={8}>
                        <Tag color="purple" style={{ minWidth: 100, textAlign: 'center' }}>
                          {group.shift_code.toUpperCase()}
                        </Tag>
                        <Typography.Text style={{ fontSize: 12 }}>
                          {group.start_time} – {group.end_time}
                        </Typography.Text>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>·</Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                          {group.positionName}: {group.selectedIds.size} tài xế × {dates.length} ngày
                          {' = '}
                          <strong>{group.selectedIds.size * dates.length}</strong> lịch
                        </Typography.Text>
                      </Flex>
                    ))}
                  </Flex>
                </div>
              )}

              {/* Progress bar (shown during submit) */}
              {submitting && (
                <Progress
                  percent={submitTotal ? Math.round((submitProgress / submitTotal) * 100) : 0}
                  status="active"
                  format={() => `${submitProgress} / ${submitTotal}`}
                />
              )}

              {/* Result alert */}
              {resultSummary && (
                <Alert
                  type={resultSummary.failed === 0 ? 'success' : 'warning'}
                  showIcon
                  message={
                    resultSummary.failed === 0
                      ? `Tạo thành công ${resultSummary.success} lịch công tác`
                      : `${resultSummary.success} thành công · ${resultSummary.failed} thất bại (có thể trùng lịch hoặc lỗi server)`
                  }
                  action={
                    resultSummary !== null && (
                      <Button size="small" onClick={() => setResultSummary(null)}>
                        Tạo thêm
                      </Button>
                    )
                  }
                />
              )}

              <Button
                type="primary"
                size="large"
                loading={submitting}
                disabled={scheduleCount === 0}
                onClick={() => void handleSubmit()}
                style={{ alignSelf: 'flex-start' }}
              >
                Tạo {scheduleCount > 0 ? `${scheduleCount} ` : ''}lịch công tác
              </Button>
            </Flex>
          </Card>
        )}

      </Flex>
    </>
  );
}
