import { memo } from 'react';
import { Card, Empty, Table, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import type { DispatchTrip } from '@/types/api/dispatch';

const { Text } = Typography;

export interface UnassignedTripListProps {
  trips: DispatchTrip[];
  loading?: boolean;
  onSelectTrip: (trip: DispatchTrip) => void;
}

function formatCustomer(trip: DispatchTrip): string {
  const c = trip.customer;
  if (!c) return '—';
  const code = c.code ? `${c.code} — ` : '';
  return `${code}${c.name ?? ''}`.trim() || '—';
}

function formatAppointment(trip: DispatchTrip): string {
  const from = trip.scheduled_time_from ? String(trip.scheduled_time_from).slice(0, 5) : '';
  const to = trip.scheduled_time_to ? String(trip.scheduled_time_to).slice(0, 5) : '';
  if (from && to) return `${from} – ${to}`;
  if (from) return from;
  return '—';
}

const buildColumns = (onSelect: (trip: DispatchTrip) => void): ColumnsType<DispatchTrip> => [
  {
    title: 'Mã đơn',
    dataIndex: 'code',
    key: 'code',
    width: 120,
    render: (code: string, record) => (
      <button type="button" className="text-left font-medium text-blue-600 hover:underline" onClick={() => onSelect(record)}>
        {code}
      </button>
    ),
  },
  {
    title: 'Khách hàng',
    key: 'customer',
    ellipsis: true,
    render: (_, record) => <Text type="secondary">{formatCustomer(record)}</Text>,
  },
  {
    title: 'Nhận → Giao',
    key: 'route',
    ellipsis: true,
    render: (_, record) => (
      <Text type="secondary" className="text-xs">
        {record.start_point ?? '—'} → {record.end_point ?? '—'}
      </Text>
    ),
  },
  {
    title: 'Giờ hẹn',
    key: 'time',
    width: 110,
    render: (_, record) => <Text>{formatAppointment(record)}</Text>,
  },
];

function UnassignedTripListComponent({ trips, loading, onSelectTrip }: UnassignedTripListProps) {
  const columns = buildColumns(onSelectTrip);

  return (
    <Card
      title="Pool đơn chưa phân công"
      className="h-full min-h-[320px] rounded-2xl border border-slate-200/80 shadow-sm"
      styles={{ body: { padding: 0 } }}
    >
      {trips.length === 0 && !loading ? (
        <Empty className="py-12" description="Không có chuyến chờ điều phối" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Table<DispatchTrip>
          size="small"
          loading={loading}
          pagination={false}
          rowKey="id"
          scroll={{ x: 520 }}
          columns={columns}
          dataSource={trips}
          onRow={(record) => ({
            onClick: () => onSelectTrip(record),
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </Card>
  );
}

export const UnassignedTripList = memo(UnassignedTripListComponent);
