import {
  ArrowLeftOutlined,
  CalendarOutlined,
  CarOutlined,
  EditOutlined,
  HistoryOutlined,
  IdcardOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Table, Tag, Tabs, Typography } from 'antd';
import { useNavigation, useOne, useList } from '@refinedev/core';
import { useParams } from 'react-router-dom';

import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver, VehicleAssignment, Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatMoney } from '@/utils/displayFormat';

interface WorkScheduleRow {
  id?: number;
  date?: string;
  shift_type?: string;
  status?: string;
  notes?: string;
}

const { Text } = Typography;

const AVAILABLE_COLOR: Record<string, string> = {
  available: 'green',
  busy: 'orange',
  offline: 'default',
};
const AVAILABLE_LABEL: Record<string, string> = {
  available: 'Sẵn sàng',
  busy: 'Đang chạy',
  offline: 'Nghỉ',
};

const TRIP_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  assigned: 'blue',
  driver_accepted: 'blue',
  en_route_pickup: 'gold',
  picked_up: 'gold',
  in_transit: 'gold',
  delayed: 'gold',
  arrived: 'purple',
  delivered: 'purple',
  completed: 'green',
  cancelled: 'red',
  emergency: 'red',
};
const TRIP_STATUS_LABEL: Record<string, string> = {
  pending: 'Mới',
  assigned: 'Đã phân công',
  driver_accepted: 'Tài xế nhận đơn',
  en_route_pickup: 'Đang đến lấy hàng',
  picked_up: 'Đã lấy hàng',
  in_transit: 'Đang vận chuyển',
  delayed: 'Chậm trễ',
  arrived: 'Đã đến điểm giao',
  delivered: 'Đã giao hàng',
  completed: 'Hoàn thành',
  cancelled: 'Đã hủy',
  emergency: 'Sự cố',
};

export function DriverDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Driver>({
    resource: 'drivers',
    id: resolvedId ?? '',
    queryOptions: { enabled: !!resolvedId },
  });

  const { data: assignmentsData, isLoading: assignmentsLoading } = useList<VehicleAssignment>({
    resource: 'vehicle_assignments',
    filters: [{ field: 'driver_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
  });

  const { data: tripsData, isLoading: tripsLoading } = useList<Trip>({
    resource: 'trips',
    filters: [{ field: 'driver_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
    pagination: { pageSize: 20 },
    sorters: [{ field: 'created_at', order: 'desc' }],
  });

  const { data: schedulesData, isLoading: schedulesLoading } = useList<WorkScheduleRow>({
    resource: 'driver-work-schedules',
    filters: [
      { field: 'driver_id', operator: 'eq', value: resolvedId },
    ],
    queryOptions: { enabled: !!resolvedId, retry: false },
    pagination: { pageSize: 100 },
  });

  const driver = data?.data;
  const assignments = assignmentsData?.data ?? [];
  const trips = tripsData?.data ?? [];

  const currentAssignment = assignments.find((a) => !a.to_date);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!driver) {
    return <Empty description="Không tìm thấy tài xế" />;
  }

  const displayName = driver.name ?? driver.employee?.name ?? `Tài xế #${driver.id}`;

  const tabItems = [
    {
      key: 'info',
      label: (
        <span>
          <UserOutlined /> Thông tin
        </span>
      ),
      children: (
        <Card>
          <Descriptions bordered column={{ xs: 1, sm: 2, lg: 3 }} size="middle">
            <Descriptions.Item label="Họ và tên">
              <Text strong>{displayName}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Mã tài xế">{driver.code ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Trạng thái">
              <Tag color={AVAILABLE_COLOR[driver.available_status ?? ''] ?? 'default'}>
                {AVAILABLE_LABEL[driver.available_status ?? ''] ?? (driver.available_status ?? '—')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{driver.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{driver.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Số GPLX">{driver.license_no}</Descriptions.Item>
            <Descriptions.Item label="Hạng GPLX">{driver.license_class ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày hết hạn GPLX">
              {driver.expired_date ? (
                <Text type={
                  new Date(driver.expired_date) < new Date() ? 'danger' :
                  new Date(driver.expired_date) < new Date(Date.now() + 30 * 86400000) ? 'warning' : undefined
                }>
                  {formatDate(driver.expired_date)}
                </Text>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Số CCCD/CMND">{driver.id_card_no ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày cấp CCCD">{formatDate(driver.id_card_issue_date)}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ thường trú" span={2}>
              {driver.permanent_address ?? driver.address ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Xe đang phụ trách">
              {currentAssignment
                ? (currentAssignment.vehicle as { plate_number?: string })?.plate_number ?? `ID: ${currentAssignment.vehicle_id}`
                : <Text type="secondary">Chưa có xe</Text>}
            </Descriptions.Item>
            <Descriptions.Item label="Bảo hiểm">
              {driver.insurance_policy_no ?? driver.driver_insurance_no ?? '—'}
            </Descriptions.Item>
            <Descriptions.Item label="HH bảo hiểm">
              {formatDate(driver.insurance_expiry_date ?? driver.driver_insurance_expired_date)}
            </Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'documents',
      label: (
        <span>
          <IdcardOutlined /> Giấy tờ
        </span>
      ),
      children: (
        <Card>
          <Descriptions bordered column={1} size="middle" title="Giấy tờ cá nhân">
            <Descriptions.Item label="CCCD — mặt trước">
              {driver.id_card_front_url ? (
                <a href={driver.id_card_front_url} target="_blank" rel="noreferrer">Xem ảnh</a>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="CCCD — mặt sau">
              {driver.id_card_back_url ? (
                <a href={driver.id_card_back_url} target="_blank" rel="noreferrer">Xem ảnh</a>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="GPLX">
              {driver.license_image_url ? (
                <a href={driver.license_image_url} target="_blank" rel="noreferrer">Xem ảnh</a>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Giấy tờ bảo hiểm">
              {driver.insurance_doc_url ? (
                <a href={driver.insurance_doc_url} target="_blank" rel="noreferrer">Xem file</a>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Giấy khám sức khỏe">
              {driver.health_certificate_no ? (
                <Text>{driver.health_certificate_no} — HH: {formatDate(driver.health_certificate_expired_date)}</Text>
              ) : '—'}
            </Descriptions.Item>
            <Descriptions.Item label="Ngân hàng">{(driver as unknown as Record<string, string>)['bank_name'] ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Số tài khoản">{(driver as unknown as Record<string, string>)['bank_account_no'] ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Chủ tài khoản">{(driver as unknown as Record<string, string>)['bank_account_name'] ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ghi chú">{driver.profile_notes ?? '—'}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'vehicles',
      label: (
        <span>
          <CarOutlined /> Xe phụ trách
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          {currentAssignment ? (
            <Card
              size="small"
              style={{ borderColor: '#52c41a' }}
              title={<Text style={{ color: '#52c41a' }}>Xe hiện tại</Text>}
            >
              <Descriptions size="small" column={2}>
                <Descriptions.Item label="Biển số">
                  {(currentAssignment.vehicle as { plate_number?: string })?.plate_number ?? `ID: ${currentAssignment.vehicle_id}`}
                </Descriptions.Item>
                <Descriptions.Item label="Từ ngày">{formatDate(currentAssignment.from_date)}</Descriptions.Item>
              </Descriptions>
            </Card>
          ) : (
            <Card size="small">
              <Text type="secondary">Hiện chưa phụ trách xe nào</Text>
            </Card>
          )}
          <Card title="Lịch sử xe phụ trách" size="small">
            <Table<VehicleAssignment>
              dataSource={assignments.filter((a) => !!a.to_date)}
              loading={assignmentsLoading}
              rowKey="id"
              size="small"
              pagination={false}
              scroll={{ x: 'max-content' }}
              locale={{ emptyText: 'Chưa có lịch sử' }}
              columns={[
                {
                  title: 'Biển số',
                  key: 'vehicle',
                  render: (_, r) =>
                    (r.vehicle as { plate_number?: string })?.plate_number ?? `ID: ${r.vehicle_id}`,
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
      key: 'schedule',
      label: (
        <span>
          <CalendarOutlined /> Lịch làm việc tháng
        </span>
      ),
      children: (
        <Card>
          <Table<WorkScheduleRow>
            dataSource={schedulesData?.data ?? []}
            loading={schedulesLoading}
            rowKey={(r) => `${r.id ?? r.date}`}
            size="small"
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: 'Chưa có lịch làm việc tháng này' }}
            columns={[
              { title: 'Ngày', dataIndex: 'date', key: 'date', render: (v) => formatDate(v) },
              { title: 'Ca', dataIndex: 'shift_type', key: 'shift_type', render: (v) => v ?? '—' },
              {
                title: 'Trạng thái',
                dataIndex: 'status',
                key: 'status',
                render: (v: string) => (
                  <Tag color={v === 'approved' ? 'green' : v === 'submitted' ? 'blue' : 'default'}>{v ?? 'draft'}</Tag>
                ),
              },
              { title: 'Ghi chú', dataIndex: 'notes', key: 'notes', render: (v) => v ?? '—' },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử chuyến{trips.length > 0 && <Tag style={{ marginLeft: 4 }}>{trips.length}</Tag>}
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
            locale={{ emptyText: 'Chưa có chuyến nào' }}
            columns={[
              { title: 'Mã đơn', dataIndex: 'code', key: 'code' },
              { title: 'Điểm lấy', dataIndex: 'start_point', key: 'start_point', ellipsis: true },
              { title: 'Điểm giao', dataIndex: 'end_point', key: 'end_point', ellipsis: true },
              {
                title: 'Doanh thu',
                dataIndex: 'total_revenue',
                key: 'total_revenue',
                render: (v: number) => formatMoney(v),
                align: 'right' as const,
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
        title={displayName}
        breadcrumb={[
          { label: t('drivers.title'), path: ROUTES.admin.drivers.list },
          { label: displayName },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('drivers')}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit('drivers', driver.id)}
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
