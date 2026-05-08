import { memo, useMemo } from 'react';
import { Badge, Card, Col, Empty, List, Row, Tag, Typography } from 'antd';
import { CarOutlined, UserOutlined } from '@ant-design/icons';
import type { DispatchBoardDriver, DispatchVehicle } from '@/types/api/dispatch';

const { Text } = Typography;

export type ResourceBucket = 'available' | 'busy' | 'offline';

export interface DriverRowItem extends DispatchBoardDriver {
  bucket: ResourceBucket;
}

export interface VehicleRowItem extends DispatchVehicle {
  bucket: ResourceBucket;
}

export interface ResourceStatusBoardProps {
  drivers: DriverRowItem[];
  vehicles: VehicleRowItem[];
  loading?: boolean;
}

const BUCKET_LABEL: Record<ResourceBucket, string> = {
  available: 'Sẵn sàng',
  busy: 'Đang làm việc',
  offline: 'Ngoại tuyến',
};

const BUCKET_COLOR: Record<ResourceBucket, string> = {
  available: 'success',
  busy: 'processing',
  offline: 'default',
};

interface MemoDriverRowProps {
  item: DriverRowItem;
}

const MemoDriverRow = memo(function MemoDriverRowInner({ item }: MemoDriverRowProps) {
  return (
    <List.Item className="!px-3 !py-2">
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Text strong className="text-xs">
            {item.name ?? item.code ?? `#${item.id}`}
          </Text>
          <div className="text-[11px] text-slate-500">
            GPLX {item.license_no ?? '—'}
            {item.expired_date ? ` · Hết hạn ${item.expired_date}` : ''}
          </div>
        </div>
        <Tag color={BUCKET_COLOR[item.bucket]} className="m-0 shrink-0 text-[10px]">
          {BUCKET_LABEL[item.bucket]}
        </Tag>
      </div>
    </List.Item>
  );
});

interface MemoVehicleRowProps {
  item: VehicleRowItem;
}

const MemoVehicleRow = memo(function MemoVehicleRowInner({ item }: MemoVehicleRowProps) {
  return (
    <List.Item className="!px-3 !py-2">
      <div className="flex w-full min-w-0 items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <Text strong className="text-xs">
            {item.plate_number}
          </Text>
          <div className="text-[11px] text-slate-500">{item.type ?? 'Xe'}{item.office_id != null ? ` · Đội ${item.office_id}` : ''}</div>
        </div>
        <Tag color={BUCKET_COLOR[item.bucket]} className="m-0 shrink-0 text-[10px]">
          {BUCKET_LABEL[item.bucket]}
        </Tag>
      </div>
    </List.Item>
  );
});

function groupByBucket<T extends { bucket: ResourceBucket }>(items: T[]): Record<ResourceBucket, T[]> {
  const out: Record<ResourceBucket, T[]> = { available: [], busy: [], offline: [] };
  for (const it of items) {
    out[it.bucket].push(it);
  }
  return out;
}

function ResourceStatusBoardComponent({ drivers, vehicles, loading }: ResourceStatusBoardProps) {
  const driversBy = useMemo(() => groupByBucket(drivers), [drivers]);
  const vehiclesBy = useMemo(() => groupByBucket(vehicles), [vehicles]);

  const order: ResourceBucket[] = ['available', 'busy', 'offline'];

  return (
    <Card
      title={
        <span className="flex items-center gap-2">
          <Badge status="processing" />
          Trạng thái nguồn lực
        </span>
      }
      className="h-full min-h-[320px] rounded-2xl border border-slate-200/80 shadow-sm"
      loading={loading}
    >
      {drivers.length === 0 && vehicles.length === 0 && !loading ? (
        <Empty description="Không có tài xế / xe hiển thị" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <Row gutter={[16, 16]}>
          <Col span={24}>
            <Text className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <UserOutlined /> Tài xế
            </Text>
            {order.map((bucket) => (
              <div key={`d-${bucket}`} className="mb-3">
                <Text type="secondary" className="mb-1 block text-[11px]">
                  {BUCKET_LABEL[bucket]} ({driversBy[bucket].length})
                </Text>
                <List
                  size="small"
                  bordered
                  className="rounded-lg bg-white/60"
                  dataSource={driversBy[bucket]}
                  locale={{ emptyText: '—' }}
                  renderItem={(item) => <MemoDriverRow item={item} />}
                />
              </div>
            ))}
          </Col>
          <Col span={24}>
            <Text className="mb-1 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CarOutlined /> Xe
            </Text>
            {order.map((bucket) => (
              <div key={`v-${bucket}`} className="mb-3">
                <Text type="secondary" className="mb-1 block text-[11px]">
                  {BUCKET_LABEL[bucket]} ({vehiclesBy[bucket].length})
                </Text>
                <List
                  size="small"
                  bordered
                  className="rounded-lg bg-white/60"
                  dataSource={vehiclesBy[bucket]}
                  locale={{ emptyText: '—' }}
                  renderItem={(item) => <MemoVehicleRow item={item} />}
                />
              </div>
            ))}
          </Col>
        </Row>
      )}
    </Card>
  );
}

export const ResourceStatusBoard = memo(ResourceStatusBoardComponent);
