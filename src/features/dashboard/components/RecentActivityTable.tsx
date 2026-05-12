import React from 'react';
import { Card, Table, Tag, Typography, Button, Skeleton, Flex } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { Trip } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { getTripStatusDisplay } from '@/utils/tripStatus';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';

const { Title, Text } = Typography;

interface RecentActivityTableProps {
  trips?: Trip[];
  loading?: boolean;
}

export const RecentActivityTable: React.FC<RecentActivityTableProps> = ({ trips = [], loading }) => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const columns = [
    {
      title: 'Mã chuyến',
      dataIndex: 'code',
      key: 'code',
      width: 140,
      render: (code: string) => (
        <Text strong style={{ color: '#1677ff' }}>{code}</Text>
      ),
    },
    {
      title: 'Khách hàng',
      dataIndex: 'customer',
      key: 'customer',
      render: (customer: any) => (
        <Text style={{ fontWeight: 500 }}>{customer?.name || '—'}</Text>
      ),
    },
    {
      title: 'Lộ trình',
      key: 'route',
      render: (_: any, record: Trip) => (
        <div style={{ maxWidth: 300 }}>
          <Text ellipsis title={`${record.start_point} → ${record.end_point}`}>
            <Tag color="blue" style={{ marginRight: 4 }}>Từ</Tag>
            {record.start_point}
          </Text>
          <br />
          <Text ellipsis type="secondary" style={{ fontSize: 12 }}>
            <Tag color="orange" style={{ marginRight: 4 }}>Đến</Tag>
            {record.end_point}
          </Text>
        </div>
      ),
    },
    {
      title: 'Ngày dự kiến',
      dataIndex: 'scheduled_date',
      key: 'scheduled_date',
      width: 150,
      render: (date: string) => (
        <Text type="secondary">{date ? formatDate(date) : '—'}</Text>
      ),
    },
    {
      title: 'Cước phí',
      dataIndex: 'price',
      key: 'price',
      align: 'right' as const,
      width: 150,
      render: (price: number) => (
        <Text strong style={{ color: '#52c41a' }}>{formatMoney(price)}</Text>
      ),
    },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (status: string) => {
        const { label, color } = getTripStatusDisplay(status, t);
        return (
          <Tag color={color} style={{ borderRadius: 10, paddingInline: 12, fontWeight: 600 }}>
            {label.toUpperCase()}
          </Tag>
        );
      },
    },
    {
      title: '',
      key: 'action',
      width: 60,
      fixed: 'right' as const,
      render: (_: any, record: Trip) => (
        <Button
          type="text"
          shape="circle"
          icon={<RightOutlined style={{ fontSize: 12 }} />}
          onClick={() => navigate(ROUTES.admin.trips.showById(record.id))}
        />
      ),
    },
  ];

  return (
    <Card
      variant="borderless"
      style={{ boxShadow: '0 4px 12px rgba(0,0,0,0.05)', borderRadius: 12 }}
      title={
        <Flex align="center" gap={8}>
          <div style={{ width: 4, height: 16, backgroundColor: '#1677ff', borderRadius: 2 }} />
          <Title level={5} style={{ margin: 0 }}>Chuyến đi gần đây</Title>
        </Flex>
      }
      extra={
        <Button type="link" onClick={() => navigate(ROUTES.admin.trips.list)} style={{ fontWeight: 600 }}>
          Xem tất cả <RightOutlined style={{ fontSize: 10 }} />
        </Button>
      }
    >
      {loading && !trips.length ? (
        <Skeleton active />
      ) : (
        <Table
          dataSource={trips}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
          scroll={{ x: 1000 }}
          onRow={(record) => ({
            onClick: () => navigate(ROUTES.admin.trips.showById(record.id)),
            style: { cursor: 'pointer' },
          })}
        />
      )}
    </Card>
  );
};
