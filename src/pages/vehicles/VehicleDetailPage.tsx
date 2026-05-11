import { useMemo } from 'react';
import {
  ArrowLeftOutlined,
  CarOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  IdcardOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Table, Tag, Tabs, Typography } from 'antd';
import { useNavigation, useOne } from '@refinedev/core';
import { useList } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle, Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatDateTime, formatMoney } from '@/utils/displayFormat';
import { normalizeTripStatusKey } from '@/utils/tripStatus';
import { VehicleDocuments } from './VehicleDocuments';
import { VehicleAssignments } from './VehicleAssignments';
import { VehicleMaintenanceTab } from './VehicleMaintenanceTab';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  maintenance: 'orange',
  inactive: 'default',
  broken: 'red',
  out_of_service: 'default',
};

const TRIP_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  en_route_pickup: 'gold',
  picked_up: 'gold',
  in_transit: 'gold',
  delayed: 'gold',
  arrived: 'purple',
  completed: 'green',
  cancelled: 'red',
  emergency: 'red',
};

export function VehicleDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Vehicle>({
    resource: 'vehicles',
    id: resolvedId ?? '',
    queryOptions: { enabled: !!resolvedId },
  });

  const { data: expensesData, isLoading: expensesLoading } = useList({
    resource: 'trip-costs',
    filters: [{ field: 'vehicle_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
    pagination: { pageSize: 20 },
  });

  const { data: tripsData, isLoading: tripsLoading } = useList<Trip>({
    resource: 'trips',
    filters: [{ field: 'vehicle_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
    pagination: { pageSize: 20 },
    sorters: [{ field: 'created_at', order: 'desc' }],
  });

  const vehicle = data?.data;
  const expenses = expensesData?.data ?? [];
  const trips = tripsData?.data ?? [];

  const tripStatusLabel = useMemo(
    () => ({
      pending:         t('trips.statusPending'),
      assigned:        t('trips.statusAssigned'),
      en_route_pickup: t('trips.statusEnRoutePickup'),
      picked_up:       t('trips.statusPickedUp'),
      in_transit:      t('trips.statusInTransit'),
      delayed:         t('trips.statusDelayed'),
      arrived:         t('trips.statusArrived'),
      completed:       t('trips.statusCompleted'),
      cancelled:       t('trips.statusCancelled'),
      emergency:       t('trips.statusEmergency'),
      draft:           t('trips.statusDraft'),
    }),
    [t],
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle || resolvedId == null) {
    return <Empty description={t('vehicles.detailNotFound')} />;
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <CarOutlined /> {t('vehicles.tabInfo')}
        </span>
      ),
      children: (
        <Card>
          <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
            <Descriptions.Item label={t('vehicles.plateNumber')}>
              <Text strong>{vehicle.plate_number}</Text>
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.vehicleTypeCatalog')}>
              {vehicle.vehicle_type?.name ?? vehicle.vehicle_type_id ?? vehicle.type}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.status')}>
              <Tag color={STATUS_COLOR[vehicle.status] ?? 'default'}>
                {t(`vehicles.status.${vehicle.status}`, { defaultValue: vehicle.status })}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.brand')}>{vehicle.brand ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('vehicles.model')}>{vehicle.model ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('vehicles.year')}>{vehicle.year ?? '—'}</Descriptions.Item>
            <Descriptions.Item label={t('vehicles.maxLoadTon')}>
              {vehicle.max_load_ton ?? vehicle.capacity ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('vehicles.currentOdometer')}>
              {vehicle.current_odometer_km ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label={t('common.createdAt')}>{formatDateTime(vehicle.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <IdcardOutlined /> {t('vehicles.tabDocuments')}
        </span>
      ),
      children: (
        <Card>
          <VehicleDocuments vehicleId={resolvedId} />
        </Card>
      ),
    },
    {
      key: 'maintenance_schedules',
      label: (
        <span>
          <ToolOutlined /> Lịch bảo dưỡng
        </span>
      ),
      children: (
        <Card>
          <VehicleMaintenanceTab vehicleId={resolvedId} currentOdometerKm={vehicle.current_odometer_km} mode="schedules" />
        </Card>
      ),
    },
    {
      key: 'maintenance_records',
      label: (
        <span>
          <ToolOutlined /> Lịch sử bảo dưỡng
        </span>
      ),
      children: (
        <Card>
          <VehicleMaintenanceTab vehicleId={resolvedId} currentOdometerKm={vehicle.current_odometer_km} mode="records" />
        </Card>
      ),
    },
    {
      key: 'assignments',
      label: (
        <span>
          <UserOutlined /> {t('vehicles.tabAssignments')}
        </span>
      ),
      children: (
        <Card>
          <VehicleAssignments vehicleId={resolvedId} />
        </Card>
      ),
    },
    {
      key: 'expenses',
      label: (
        <span>
          <FileTextOutlined /> {t('vehicles.tabExpenses')}
        </span>
      ),
      children: (
        <Card>
          <Table
            dataSource={expenses}
            loading={expensesLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có chi phí nào' }}
            columns={[
              { title: 'Mã chi phí', dataIndex: 'code', key: 'code', render: (v: string) => v ?? '—' },
              { title: 'Loại chi phí', dataIndex: ['cost_category', 'name'], key: 'category', render: (_: unknown, row: Record<string, unknown>) => (row['cost_category'] as Record<string,string> | null)?.name ?? (row['cost_category_id'] as string) ?? '—' },
              {
                title: 'Số tiền',
                dataIndex: 'amount',
                key: 'amount',
                render: (v: number) => formatMoney(v),
                align: 'right' as const,
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => <Tag color={v === 'approved' ? 'green' : v === 'pending_approval' ? 'orange' : 'default'}>{v ?? '—'}</Tag>,
              },
              { title: 'Ngày', dataIndex: 'expense_date', key: 'expense_date', render: (v: string) => formatDate(v) },
              { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (v: string | null) => v ?? '—' },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <HistoryOutlined /> {t('vehicles.tabTrips')}{' '}
          {trips.length > 0 && <Tag>{trips.length}</Tag>}
        </span>
      ),
      children: (
        <Card>
          <Table<Trip>
            dataSource={trips}
            loading={tripsLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, size: 'small' }}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: t('vehicles.tripsEmpty') }}
            columns={[
              { title: t('trips.code'), dataIndex: 'code', key: 'code' },
              { title: t('trips.startPoint'), dataIndex: 'start_point', key: 'start_point', ellipsis: true },
              { title: t('trips.endPoint'), dataIndex: 'end_point', key: 'end_point', ellipsis: true },
              { title: 'Doanh thu', dataIndex: 'total_revenue', key: 'total_revenue', render: (v: number) => formatMoney(v), align: 'right' as const },
              {
                title: t('common.status'),
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={TRIP_STATUS_COLOR[normalizeTripStatusKey(v) || 'pending'] ?? 'default'}>
                    {tripStatusLabel[normalizeTripStatusKey(v) || 'pending' as keyof typeof tripStatusLabel] ?? v}
                  </Tag>
                ),
              },
              { title: t('common.createdAt'), dataIndex: 'created_at', key: 'created_at', render: (v: string) => formatDate(v) },
            ]}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`${t('vehicles.title')} ${vehicle.plate_number}`}
        breadcrumb={[
          { label: t('vehicles.title'), path: ROUTES.admin.vehicles.list },
          { label: vehicle.plate_number },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('vehicles')}>
              {t('common.back')}
            </Button>
            <Button type="primary" icon={<EditOutlined />} onClick={() => edit('vehicles', vehicle.id)}>
              {t('common.edit')}
            </Button>
          </Space>
        }
      />
      <Tabs items={tabItems} defaultActiveKey="info" />
    </div>
  );
}
