import { memo } from 'react';
import { Button, Empty, List, Skeleton, Tabs, Tag, Tooltip, Typography } from 'antd';
import { ExclamationCircleOutlined, StopOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import { useDriverExpiringDocuments, useVehicleExpiringDocuments } from '@/hooks/useExpiringDocuments';
import { ROUTES } from '@/routes';
import type { DriverExpiringDocument, VehicleExpiringDocument } from '@/types';

// Document types that trigger R03 stop-risk warning (GPLX / driver license)
const GPLX_TYPES = new Set(['GPLX', 'gplx', 'license', 'driver_license', 'bang_lai_xe']);

function getDocumentLabel(docType: string, fallbackLabel?: string): string {
  if (fallbackLabel) return fallbackLabel;
  const map: Record<string, string> = {
    GPLX: 'GPLX',
    gplx: 'GPLX',
    license: 'GPLX',
    driver_license: 'GPLX',
    bang_lai_xe: 'GPLX',
    CCCD: 'CCCD',
    cccd: 'CCCD',
    id_card: 'CCCD',
    health_certificate: 'Giấy khám SK',
    driver_insurance: 'BH tài xế',
    dang_kiem: 'Đăng kiểm',
    bao_hiem_tnds: 'BH TNDS',
    bao_hiem_vo: 'BH vật chất',
    registration: 'Đăng kiểm',
    insurance: 'Bảo hiểm',
  };
  return map[docType] ?? docType;
}

function severityColor(days: number): string {
  if (days <= 0) return 'red';
  if (days < 7) return 'red';
  return 'orange';
}

function normalizeArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const nested = (value as { data?: unknown }).data;
    if (Array.isArray(nested)) return nested as T[];
  }
  return [];
}

function DaysTag({ days }: { days: number }) {
  if (days <= 0) return <Tag color="red">Đã hết hạn</Tag>;
  return <Tag color={severityColor(days)}>Còn {days} ngày</Tag>;
}

// ─── Driver list ────────────────────────────────────────────────────────────

interface DriverListProps {
  data: DriverExpiringDocument[];
  isLoading: boolean;
}

const DriverList = memo(function DriverList({ data, isLoading }: DriverListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1 }} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Typography.Text type="secondary">
            Tất cả giấy tờ tài xế còn hiệu lực. Tốt lắm!
          </Typography.Text>
        }
      />
    );
  }

  return (
    <List
      dataSource={data}
      size="small"
      renderItem={(item) => {
        const isGplx = GPLX_TYPES.has(item.document_type);
        const label = getDocumentLabel(item.document_type, item.document_label);
        return (
          <List.Item
            actions={[
              <Button
                key="detail"
                size="small"
                type="link"
                onClick={() => navigate(ROUTES.admin.drivers.showById(item.driver_id))}
              >
                Xem chi tiết
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex flex-wrap items-center gap-1.5">
                  <Typography.Text strong>{item.driver_name}</Typography.Text>
                  <Tag color="blue">{label}</Tag>
                  <DaysTag days={item.days_remaining} />
                  {isGplx && (
                    <Tooltip title="R03: GPLX hết hạn — tài xế không được phép vận hành">
                      <Tag icon={<StopOutlined />} color="error">
                        Nguy cơ dừng hoạt động
                      </Tag>
                    </Tooltip>
                  )}
                </div>
              }
              description={
                <Typography.Text type="secondary" className="text-xs">
                  Hết hạn: {dayjs(item.expiry_date).format('DD/MM/YYYY')}
                  {item.license_class ? ` · Hạng ${item.license_class}` : ''}
                </Typography.Text>
              }
            />
          </List.Item>
        );
      }}
    />
  );
});

// ─── Vehicle list ────────────────────────────────────────────────────────────

interface VehicleListProps {
  data: VehicleExpiringDocument[];
  isLoading: boolean;
}

const VehicleList = memo(function VehicleList({ data, isLoading }: VehicleListProps) {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-3 p-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} active paragraph={{ rows: 1 }} />
        ))}
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <Empty
        image={Empty.PRESENTED_IMAGE_SIMPLE}
        description={
          <Typography.Text type="secondary">
            Tất cả giấy tờ phương tiện còn hiệu lực. Tốt lắm!
          </Typography.Text>
        }
      />
    );
  }

  return (
    <List
      dataSource={data}
      size="small"
      renderItem={(item) => {
        const label = getDocumentLabel(item.document_type, item.document_label);
        return (
          <List.Item
            actions={[
              <Button
                key="detail"
                size="small"
                type="link"
                onClick={() => navigate(ROUTES.admin.vehicles.showById(item.vehicle_id))}
              >
                Xem chi tiết
              </Button>,
            ]}
          >
            <List.Item.Meta
              title={
                <div className="flex flex-wrap items-center gap-1.5">
                  <Typography.Text strong>{item.plate_number}</Typography.Text>
                  <Tag color="purple">{label}</Tag>
                  <DaysTag days={item.days_remaining} />
                </div>
              }
              description={
                <Typography.Text type="secondary" className="text-xs">
                  Hết hạn: {dayjs(item.expiry_date).format('DD/MM/YYYY')}
                </Typography.Text>
              }
            />
          </List.Item>
        );
      }}
    />
  );
});

// ─── Main component ──────────────────────────────────────────────────────────

export const ExpirationAlerts = memo(function ExpirationAlerts() {
  const { data: driverDocs, isLoading: driverLoading } = useDriverExpiringDocuments();
  const { data: vehicleDocs, isLoading: vehicleLoading } = useVehicleExpiringDocuments();

  const drivers = normalizeArray<DriverExpiringDocument>(driverDocs);
  const vehicles = normalizeArray<VehicleExpiringDocument>(vehicleDocs);

  const driverCount = drivers.length;
  const vehicleCount = vehicles.length;

  const tabItems = [
    {
      key: 'drivers',
      label: (
        <span className="flex items-center gap-1">
          Cảnh báo Tài xế
          {driverCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
              {driverCount}
            </span>
          )}
        </span>
      ),
      children: <DriverList data={drivers} isLoading={driverLoading} />,
    },
    {
      key: 'vehicles',
      label: (
        <span className="flex items-center gap-1">
          Cảnh báo Xe
          {vehicleCount > 0 && (
            <span className="ml-1 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1 text-xs text-white">
              {vehicleCount}
            </span>
          )}
        </span>
      ),
      children: <VehicleList data={vehicles} isLoading={vehicleLoading} />,
    },
  ];

  const totalAlerts = driverCount + vehicleCount;

  return (
    <div className="rounded-xl border bg-white">
      <div className="flex items-center gap-2 border-b px-4 pt-4 pb-0">
        <ExclamationCircleOutlined className="text-orange-500" />
        <Typography.Title level={5} style={{ margin: 0 }}>
          Cảnh báo hết hạn giấy tờ
        </Typography.Title>
        {totalAlerts > 0 && (
          <Tag color="warning" className="ml-1">
            {totalAlerts} mục cần chú ý
          </Tag>
        )}
      </div>
      <div className="px-4 pb-4">
        <Tabs items={tabItems} size="small" />
      </div>
    </div>
  );
});
