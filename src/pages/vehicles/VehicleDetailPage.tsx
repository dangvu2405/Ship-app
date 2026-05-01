import { useMemo } from 'react';
import {
  ArrowLeftOutlined,
  CarOutlined,
  EditOutlined,
  FileTextOutlined,
  HistoryOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Table, Tag, Tabs, Typography } from 'antd';
import { useNavigation, useOne } from '@refinedev/core';
import { useList } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle, VehicleAssignment, VehicleExpense, Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatDateTime, formatMoney } from '@/utils/displayFormat';

const { Text } = Typography;

const STATUS_COLOR: Record<string, string> = {
  active: 'green',
  maintenance: 'orange',
  inactive: 'default',
  broken: 'red',
};
const STATUS_LABEL: Record<string, string> = {
  active: 'Hoạt động',
  maintenance: 'Bảo dưỡng',
  inactive: 'Không hoạt động',
  broken: 'Hỏng',
};

const TRIP_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  in_progress: 'blue',
  completed: 'green',
  cancelled: 'red',
};
const TRIP_STATUS_LABEL: Record<string, string> = {
  pending: 'Mới',
  in_progress: 'Đang vận chuyển',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
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

  const { data: assignmentsData, isLoading: assignmentsLoading } = useList<VehicleAssignment>({
    resource: 'vehicle_assignments',
    filters: [{ field: 'vehicle_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
  });

  const { data: expensesData, isLoading: expensesLoading } = useList<VehicleExpense>({
    resource: 'vehicle_expenses',
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

  const currentAssignment = useMemo(() => {
    const rows = assignmentsData?.data ?? [];
    return rows.find((a) => !a.to_date);
  }, [assignmentsData?.data]);

  const historyAssignments = useMemo(() => {
    const rows = assignmentsData?.data ?? [];
    return rows.filter((a) => !!a.to_date).sort(
      (a, b) => new Date(b.from_date).getTime() - new Date(a.from_date).getTime(),
    );
  }, [assignmentsData?.data]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!vehicle) {
    return <Empty description={t('vehicles.detailNotFound')} />;
  }

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <CarOutlined /> Thông tin
        </span>
      ),
      children: (
        <Card>
          <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
            <Descriptions.Item label="Biển số xe">
              <Text strong>{vehicle.plate_number}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại xe">{vehicle.type}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={STATUS_COLOR[vehicle.status] ?? 'default'}>
                {STATUS_LABEL[vehicle.status] ?? vehicle.status}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Hãng xe">{vehicle.brand ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Model">{vehicle.model ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Năm sản xuất">{vehicle.year ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Tải trọng">
              {vehicle.capacity ? `${vehicle.capacity} tấn` : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Tài xế phụ trách">
              {currentAssignment
                ? (currentAssignment.driver as { name?: string })?.name ?? `ID: ${currentAssignment.driver_id}`
                : <Text type="secondary">Chưa phân công</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">
              {formatDateTime(vehicle.created_at)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'expenses',
      label: (
        <span>
          <FileTextOutlined /> Chi phí xe
        </span>
      ),
      children: (
        <Card>
          <Table<VehicleExpense>
            dataSource={expenses}
            loading={expensesLoading}
            rowKey="id"
            size="small"
            pagination={{ pageSize: 10, size: 'small' }}
            locale={{ emptyText: 'Chưa có chi phí' }}
            columns={[
              { title: 'Loại chi phí', dataIndex: 'type', key: 'type' },
              {
                title: 'Số tiền',
                dataIndex: 'amount',
                key: 'amount',
                render: (v: number) => formatMoney(v),
                align: 'right',
              },
              { title: 'Ngày', dataIndex: 'expense_date', key: 'expense_date', render: (v) => formatDate(v) },
              { title: 'Ghi chú', dataIndex: 'note', key: 'note', render: (v) => v ?? '—' },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'assignments',
      label: (
        <span>
          <UserOutlined /> Tài xế phụ trách
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {currentAssignment ? (
            <Card
              size="small"
              style={{ borderColor: '#52c41a' }}
              title={<Text style={{ color: '#52c41a' }}>Đang phụ trách</Text>}
            >
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Tài xế">
                  {(currentAssignment.driver as { name?: string })?.name ?? `ID: ${currentAssignment.driver_id}`}
                </Descriptions.Item>
                <Descriptions.Item label="Từ ngày">{formatDate(currentAssignment.from_date)}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <Card size="small">
              <Text type="secondary">Hiện chưa có tài xế phụ trách</Text>
            </Card>
          )}
          <Card title="Lịch sử phụ trách" size="small">
            <Table<VehicleAssignment>
              dataSource={historyAssignments}
              loading={assignmentsLoading}
              rowKey="id"
              size="small"
              pagination={false}
              locale={{ emptyText: 'Chưa có lịch sử' }}
              columns={[
                {
                  title: 'Tài xế',
                  key: 'driver',
                  render: (_, r) => (r.driver as { name?: string })?.name ?? `ID: ${r.driver_id}`,
                },
                { title: 'Từ ngày', dataIndex: 'from_date', key: 'from_date', render: (v) => formatDate(v) },
                { title: 'Đến ngày', dataIndex: 'to_date', key: 'to_date', render: (v) => formatDate(v) },
              ]}
            />
          </Card>
        </Space>
      ),
    },
    {
      key: 'maintenance',
      label: (
        <span>
          <ToolOutlined /> Bảo dưỡng
        </span>
      ),
      children: (
        <Card>
          <Empty description="Chức năng bảo dưỡng sẽ được bổ sung" />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử chuyến{' '}
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
            locale={{ emptyText: 'Chưa có chuyến nào' }}
            columns={[
              { title: 'Mã đơn', dataIndex: 'code', key: 'code' },
              { title: 'Điểm lấy', dataIndex: 'start_point', key: 'start_point', ellipsis: true },
              { title: 'Điểm giao', dataIndex: 'end_point', key: 'end_point', ellipsis: true },
              {
                title: 'Doanh thu',
                dataIndex: 'price',
                key: 'price',
                render: (v: number) => formatMoney(v),
                align: 'right',
              },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={TRIP_STATUS_COLOR[v] ?? 'default'}>
                    {TRIP_STATUS_LABEL[v] ?? v}
                  </Tag>
                ),
              },
              { title: 'Ngày tạo', dataIndex: 'created_at', key: 'created_at', render: (v) => formatDate(v) },
            ]}
          />
        </Card>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={`Xe ${vehicle.plate_number}`}
        breadcrumb={[
          { label: t('vehicles.title'), path: ROUTES.admin.vehicles.list },
          { label: vehicle.plate_number },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('vehicles')}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit('vehicles', vehicle.id)}
            >
              {t('common.edit')}
            </Button>
          </Space>
        }
      />
      <Tabs items={tabItems} defaultActiveKey="info" />
    </div>
  );
}
