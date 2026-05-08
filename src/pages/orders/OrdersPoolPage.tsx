import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, DatePicker, Flex, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { LinkOutlined, ReloadOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import dayjs from 'dayjs';
import { useInvalidate } from '@refinedev/core';
import dispatchService from '@/services/dispatch.service';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { ErrorState } from '@/components/common/ErrorState';
import { QuickAssignModal } from '@/pages/dispatch/components/QuickAssignModal';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import type { DispatchTrip } from '@/types/api/dispatch';
import { formatMoney } from '@/utils/displayFormat';
import { getErrorMessage } from '@/utils/errorHandler';
import { ROUTES } from '@/routes';

const PRIORITY_OPTIONS = [
  { label: 'Tất cả mức ưu tiên', value: '' },
  { label: 'Cao', value: 'high' },
  { label: 'Trung bình', value: 'normal' },
  { label: 'Thấp', value: 'low' },
];

const VEHICLE_TYPE_OPTIONS = [
  { label: 'Tất cả loại xe', value: '' },
  { label: 'Container', value: 'container' },
  { label: 'Tải nhỏ', value: 'small_truck' },
  { label: 'Tải lớn', value: 'large_truck' },
];

const PRIORITY_COLOR: Record<string, string> = {
  high: 'red',
  normal: 'blue',
  low: 'default',
};

export function OrdersPoolPage() {
  const { t } = useTranslation();
  const invalidate = useInvalidate();
  const [date, setDate] = useState(dayjs());
  const [vehicleType, setVehicleType] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [list, setList] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [assignTrip, setAssignTrip] = useState<DispatchTrip | null>(null);

  const dateStr = date.format('YYYY-MM-DD');

  const fetchList = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dispatchService.getUnassigned(dateStr, {
        ...(vehicleType ? { vehicle_type: vehicleType } : {}),
        ...(priority ? { priority } : {}),
      });
      const raw = (res?.data ?? []) as unknown;
      const items: Trip[] = Array.isArray(raw)
        ? (raw as Trip[])
        : raw && typeof raw === 'object' && 'data' in (raw as Record<string, unknown>)
          ? ((raw as { data: Trip[] }).data ?? [])
          : [];
      setList(items);
    } catch (e) {
      setError(getErrorMessage(e) || 'Không tải được danh sách chuyến chưa phân công');
      setList([]);
    } finally {
      setLoading(false);
    }
  }, [dateStr, vehicleType, priority]);

  useEffect(() => {
    void fetchList();
  }, [fetchList]);

  const handleAssignClick = (record: Trip) => {
    setAssignTrip({
      id: record.id,
      code: record.code,
      start_point: record.start_point,
      end_point: record.end_point,
      scheduled_time_from: record.scheduled_time_from,
      scheduled_time_to: record.scheduled_time_to,
      status: record.status,
    } as DispatchTrip);
  };

  const onAssignSuccess = useCallback(() => {
    void invalidate({ resource: 'trips', invalidates: ['list'] });
    void fetchList();
  }, [invalidate, fetchList]);

  const columns = useMemo<ColumnsType<Trip>>(
    () => [
      {
        key: 'code',
        title: t('trips.code'),
        dataIndex: 'code',
        width: 130,
        render: (code: string, r) => (
          <Link to={ROUTES.admin.trips.showById(r.id)}>
            <Typography.Text strong style={{ color: 'inherit' }}>
              {code}
            </Typography.Text>
          </Link>
        ),
      },
      {
        key: 'customer',
        title: t('customers.title'),
        render: (_, r) => r.customer?.name ?? `KH #${r.customer_id}`,
      },
      {
        key: 'route',
        title: t('trips.route'),
        render: (_, r) => (
          <Typography.Text ellipsis={{ tooltip: `${r.start_point} → ${r.end_point}` }} style={{ maxWidth: 200 }}>
            {r.start_point} → {r.end_point}
          </Typography.Text>
        ),
      },
      {
        key: 'scheduled_date',
        title: 'Ngày dự kiến',
        render: (_, r) => (r.scheduled_date ? <DateTimeBadge value={r.scheduled_date} mode="date" /> : '-'),
      },
      {
        key: 'distance_km',
        title: t('trips.distance'),
        render: (_, r) => (r.distance_km ? `${r.distance_km} km` : '-'),
      },
      {
        key: 'price',
        title: t('trips.price'),
        render: (_, r) => (r.price ? formatMoney(r.price) : '-'),
      },
      {
        key: 'priority',
        title: 'Ưu tiên',
        width: 100,
        render: (_, r) => {
          const priorityValue = (r as Trip & { priority?: string }).priority ?? 'normal';
          const labelMap: Record<string, string> = { high: 'Cao', normal: 'Trung bình', low: 'Thấp' };
          return <Tag color={PRIORITY_COLOR[priorityValue] ?? 'default'}>{labelMap[priorityValue] ?? priorityValue}</Tag>;
        },
      },
      {
        key: 'status',
        title: t('common.status'),
        width: 140,
        render: () => <Tag color="blue">Chờ phân công</Tag>,
      },
      {
        key: 'actions',
        title: t('common.actions'),
        fixed: 'right',
        width: 200,
        render: (_, r) => (
          <Space size={4}>
            <Button
              size="small"
              type="primary"
              icon={<ThunderboltOutlined />}
              onClick={() => handleAssignClick(r)}
            >
              Gán nhanh
            </Button>
            <Link to={ROUTES.admin.trips.showById(r.id)}>
              <Button size="small" icon={<LinkOutlined />}>
                Xem
              </Button>
            </Link>
          </Space>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.orderPool')}
        description="Danh sách chuyến xe chờ phân công tài xế và xe — gắn từ /api/dispatch/unassigned-trips"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.orderPool') },
        ]}
        actions={
          <Button icon={<ReloadOutlined />} onClick={() => void fetchList()} loading={loading}>
            {t('common.refresh')}
          </Button>
        }
      />

      <Card>
        <Flex gap={12} wrap="wrap" style={{ marginBottom: 12 }}>
          <DatePicker
            value={date}
            onChange={(v) => v && setDate(v)}
            format="DD/MM/YYYY"
            allowClear={false}
            placeholder="Ngày dự kiến"
          />
          <Select
            value={vehicleType}
            onChange={setVehicleType}
            options={VEHICLE_TYPE_OPTIONS}
            style={{ minWidth: 200 }}
            placeholder="Loại xe"
          />
          <Select
            value={priority}
            onChange={setPriority}
            options={PRIORITY_OPTIONS}
            style={{ minWidth: 200 }}
            placeholder="Mức ưu tiên"
          />
        </Flex>

        {error ? (
          <ErrorState description={error} onRetry={() => void fetchList()} />
        ) : (
          <Table<Trip>
            rowKey="id"
            columns={columns}
            dataSource={list}
            loading={loading}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Không có chuyến xe nào đang chờ phân công' }}
            pagination={{ pageSize: 20, showSizeChanger: false }}
          />
        )}
      </Card>

      <QuickAssignModal
        open={!!assignTrip}
        trip={assignTrip}
        dateStr={dateStr}
        boardTrips={[]}
        excludedDriverIds={new Set()}
        onClose={() => setAssignTrip(null)}
        onSuccess={onAssignSuccess}
      />
    </div>
  );
}
