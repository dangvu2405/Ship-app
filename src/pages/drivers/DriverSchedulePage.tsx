import { useCallback, useEffect, useMemo, useState } from 'react';
import { useList } from '@refinedev/core';
import { Badge, Button, Calendar, Card, Flex, Modal, Select, Space, Typography, type CalendarProps } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, DriverSchedule } from '@/types';
import toast from 'react-hot-toast';
import workforceOpsService from '@/services/workforce-ops.service';
import { formatDateTime, formatStatusLabel } from '@/utils/displayFormat';
import { WorkforceOps } from '@/pages/system/WorkforceOps';
import { useAuth } from '@/hooks/useAuth';

export function DriverSchedulePage() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const isAdmin = hasRole('admin');
  const { data, isLoading } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 500 },
    sorters: [{ field: 'id', order: 'asc' }],
  });
  const drivers = useMemo(() => data?.data ?? [], [data?.data]);
  const [selectedDriverId, setSelectedDriverId] = useState<number | undefined>(undefined);
  const [currentMonth, setCurrentMonth] = useState<Dayjs>(dayjs());
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [schedules, setSchedules] = useState<DriverSchedule[]>([]);
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);

  const driverOptions = useMemo(
    () => drivers.map((driver) => ({ label: driver.employee?.name ?? `#${driver.id}`, value: driver.id })),
    [drivers],
  );

  useEffect(() => {
    if (!selectedDriverId && drivers.length > 0) {
      setSelectedDriverId(drivers[0].id);
    }
  }, [drivers, selectedDriverId]);

  const loadSchedules = useCallback(async () => {
    if (!selectedDriverId) {
      setSchedules([]);
      return;
    }
    setScheduleLoading(true);
    try {
      const monthStart = currentMonth.startOf('month').format('YYYY-MM-DD');
      const monthEnd = currentMonth.endOf('month').format('YYYY-MM-DD');
      const result = await workforceOpsService.listDriverSchedules({
        driver_id: selectedDriverId,
        from: monthStart,
        to: monthEnd,
        per_page: 200,
      });
      setSchedules(result.data);
    } catch (error) {
      toast.error(t('common.loadError'));
      void error;
    } finally {
      setScheduleLoading(false);
    }
  }, [selectedDriverId, currentMonth, t]);

  useEffect(() => {
    void loadSchedules();
  }, [loadSchedules]);

  const scheduleByDate = useMemo(() => {
    const map = new Map<string, DriverSchedule[]>();
    schedules.forEach((item) => {
      const dateKey = dayjs(item.work_date).format('YYYY-MM-DD');
      const prev = map.get(dateKey) ?? [];
      prev.push(item);
      map.set(dateKey, prev);
    });
    return map;
  }, [schedules]);

  const onPanelChange = (value: Dayjs, mode: CalendarProps<Dayjs>['mode']) => {
    if (mode === 'month') setCurrentMonth(value);
  };

  const dateCellRender = (value: Dayjs) => {
    const items = scheduleByDate.get(value.format('YYYY-MM-DD')) ?? [];
    if (!items.length) return null;
    return (
      <Space direction="vertical" size={2}>
        {items.map((item) => (
          <Badge
            key={item.id}
            status={item.status === 'approved' || item.status === 'locked' ? 'success' : item.status === 'rejected' ? 'error' : 'processing'}
            text={`${formatStatusLabel(item.status)} · ${item.shift_code || '-'} · ${formatDateTime(item.start_time)}`}
          />
        ))}
      </Space>
    );
  };

  return (
    <>
      <PageHeader title={t('drivers.scheduleTitle')} />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
        <Flex vertical gap={16}>
          <div>
            <Typography.Title level={4} style={{ marginBottom: 4 }}>
              {t('drivers.scheduleTitle')}
            </Typography.Title>
            <Typography.Text type="secondary">{t('drivers.scheduleWeekHint')}</Typography.Text>
          </div>
          <Space wrap>
            <Select
              showSearch
              placeholder={t('drivers.title')}
              style={{ minWidth: 260 }}
              options={driverOptions}
              value={selectedDriverId}
              onChange={(value) => setSelectedDriverId(value)}
            />
            {isAdmin ? (
              <Button type="primary" onClick={() => setApprovalModalOpen(true)}>
                Duyet don
              </Button>
            ) : null}
          </Space>
        </Flex>
        <div className="mt-4">
          {isLoading || scheduleLoading ? (
            <TableSkeleton rows={6} columns={1} />
          ) : (
            <Calendar value={currentMonth} onPanelChange={onPanelChange} cellRender={(value) => dateCellRender(value as Dayjs)} />
          )}
        </div>
      </Card>
      <Modal
        title="Duyet don Workforce Ops"
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
