import {
  ArrowLeftOutlined,
  DollarOutlined,
  EditOutlined,
  HistoryOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { Button, Card, Descriptions, Empty, Space, Spin, Statistic, Table, Tag, Tabs, Typography } from 'antd';
import { useNavigation, useOne, useList } from '@refinedev/core';
import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Trip } from '@/types';
import { ROUTES } from '@/routes';
import { formatDate, formatMoney } from '@/utils/displayFormat';

const { Text } = Typography;

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

export function CustomerDetailPage() {
  const { t } = useTranslation();
  const { id } = useParams<{ id?: string }>();
  const { list, edit } = useNavigation();
  const resolvedId = id ? Number(id) : undefined;

  const { data, isLoading } = useOne<Customer>({
    resource: 'customers',
    id: resolvedId ?? '',
    queryOptions: { enabled: !!resolvedId },
  });

  const { data: tripsData, isLoading: tripsLoading } = useList<Trip>({
    resource: 'trips',
    filters: [{ field: 'customer_id', operator: 'eq', value: resolvedId }],
    queryOptions: { enabled: !!resolvedId },
    pagination: { pageSize: 50 },
    sorters: [{ field: 'created_at', order: 'desc' }],
  });

  const customer = data?.data;
  const trips = tripsData?.data ?? [];

  const totalRevenue = trips
    .filter((t) => t.status === 'completed')
    .reduce((sum, t) => sum + (t.price ?? 0), 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spin size="large" />
      </div>
    );
  }

  if (!customer) {
    return <Empty description="Không tìm thấy khách hàng" />;
  }

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
            <Descriptions.Item label="Tên KH">
              <Text strong>{customer.name}</Text>
            </Descriptions.Item>
            <Descriptions.Item label="Loại">
              <Tag color={customer.type === 'company' ? 'blue' : 'purple'}>
                {customer.type === 'company' ? t('customers.typeCompany') : t('customers.typeIndividual')}
              </Tag>
            </Descriptions.Item>
            <Descriptions.Item label="Mã số thuế">{customer.tax_code ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Điện thoại">{customer.phone ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Email">{customer.email ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Người liên hệ">{customer.contact_person ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Địa chỉ" span={3}>{customer.address ?? '—'}</Descriptions.Item>
            <Descriptions.Item label="Ngày tạo">{formatDate(customer.created_at)}</Descriptions.Item>
          </Descriptions>
        </Card>
      ),
    },
    {
      key: 'price',
      label: (
        <span>
          <DollarOutlined /> Bảng giá
        </span>
      ),
      children: (
        <Card>
          <Empty description="Chức năng bảng giá sẽ được bổ sung" />
        </Card>
      ),
    },
    {
      key: 'trips',
      label: (
        <span>
          <HistoryOutlined /> Lịch sử đơn hàng{' '}
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
            pagination={{ pageSize: 15, size: 'small' }}
            locale={{ emptyText: 'Chưa có đơn hàng' }}
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
              {
                title: 'Ngày tạo',
                dataIndex: 'created_at',
                key: 'created_at',
                render: (v) => formatDate(v),
              },
            ]}
          />
        </Card>
      ),
    },
    {
      key: 'debt',
      label: (
        <span>
          <DollarOutlined /> Công nợ
        </span>
      ),
      children: (
        <Space direction="vertical" style={{ width: '100%' }} size="middle">
          <Card>
            <Space size="large">
              <Statistic
                title="Tổng doanh thu (đã hoàn thành)"
                value={totalRevenue}
                formatter={(v) => formatMoney(Number(v))}
                valueStyle={{ color: '#3f8600' }}
              />
              <Statistic
                title="Tổng số chuyến"
                value={trips.length}
                suffix="chuyến"
              />
              <Statistic
                title="Chuyến hoàn thành"
                value={trips.filter((t) => t.status === 'completed').length}
                suffix="chuyến"
                valueStyle={{ color: '#3f8600' }}
              />
              <Statistic
                title="Chuyến đang chạy"
                value={trips.filter((t) => t.status === 'in_progress').length}
                suffix="chuyến"
                valueStyle={{ color: '#1677ff' }}
              />
            </Space>
          </Card>
          <Card title="Chi tiết công nợ">
            <Empty description="Chức năng đối soát và thanh toán sẽ được bổ sung" />
          </Card>
        </Space>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title={customer.name}
        breadcrumb={[
          { label: t('customers.title'), path: ROUTES.admin.customers.list },
          { label: customer.name },
        ]}
        actions={
          <Space>
            <Button icon={<ArrowLeftOutlined />} onClick={() => list('customers')}>
              {t('common.back')}
            </Button>
            <Button
              type="primary"
              icon={<EditOutlined />}
              onClick={() => edit('customers', customer.id)}
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
