import { useMemo } from 'react';
import { Button, Card, Flex, Table, Tag, Typography, theme } from 'antd';
import { RightOutlined, TruckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { getTripConventionDisplay } from '@/utils/tripStatus';
import type { Trip } from '@/types';

const { Text } = Typography;

interface DashboardRecentTripsProps {
  trips: Trip[];
  loading: boolean;
}

export function DashboardRecentTrips({ trips, loading }: DashboardRecentTripsProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const recentTripColumns = useMemo<ColumnsType<Trip>>(
    () => [
      {
        title: t('trips.code'),
        dataIndex: 'code',
        key: 'code',
        width: 120,
        render: (v: string) => <Text strong style={{ fontSize: token.fontSizeSM }}>{v}</Text>,
      },
      {
        title: t('customers.title'),
        dataIndex: ['customer', 'name'],
        key: 'customer',
        ellipsis: true,
        render: (v: string) => <Text>{v ?? '—'}</Text>,
      },
      {
        title: t('trips.route'),
        key: 'route',
        ellipsis: true,
        render: (_: unknown, row: Trip) => (
          <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
            {row.start_point} → {row.end_point}
          </Text>
        ),
      },
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value: string) => {
          const { label, color, style } = getTripConventionDisplay(value, t);
          return (
            <Tag color={color} style={{ ...style, fontSize: token.fontSizeSM }}>
              {label}
            </Tag>
          );
        },
      },
    ],
    [t, token.fontSizeSM],
  );

  return (
    <Card
      title={
        <Flex align="center" gap="small">
          <TruckOutlined style={{ color: token.colorPrimary }} />
          <span>{t('dashboard.recentTrips')}</span>
        </Flex>
      }
      extra={
        <Button
          type="link"
          size="small"
          icon={<RightOutlined />}
          onClick={() => navigate(ROUTES.admin.trips.list)}
          style={{ padding: 0 }}
        >
          {t('common.viewAll' as never) || 'Xem tất cả'}
        </Button>
      }
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <Table<Trip>
        rowKey="id"
        columns={recentTripColumns}
        dataSource={trips}
        loading={loading}
        pagination={false}
        size="small"
        scroll={{ x: 560 }}
        onRow={(record) => ({
          style: { cursor: 'pointer' },
          onClick: () => navigate(ROUTES.admin.trips.showById(record.id)),
        })}
        locale={{ emptyText: t('common.noData') }}
      />
    </Card>
  );
}
