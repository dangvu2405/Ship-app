import { useMemo } from 'react';
import { Alert, Button, Card, Flex, Progress, Space, Spin, Typography, theme, Empty } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { useTopDrivers } from '@/hooks/useTopDrivers';

function formatVnd(value: number): string {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value);
}

export function ChartAreaInteractive({
  companyId,
  month,
  year,
}: {
  companyId?: number
  month: number
  year: number
}) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { rows, loading, error, refetch } = useTopDrivers({ companyId, month, year, limit: 8 });

  const enrichedRows = useMemo(() => {
    const maxTrips = Math.max(1, ...rows.map((row) => row.trips));
    const maxRevenue = Math.max(1, ...rows.map((row) => row.revenue));
    return rows.map((row, index) => ({
      ...row,
      rank: index + 1,
      tripPercent: Math.max(8, Math.round((row.trips / maxTrips) * 100)),
      revenuePercent: Math.max(8, Math.round((row.revenue / maxRevenue) * 100)),
    }));
  }, [rows]);

  return (
    <Card
      title={t('dashboard.topDrivers')}
      extra={
        <Button size="small" icon={<ReloadOutlined />} onClick={() => void refetch()}>
          {t('common.refresh')}
        </Button>
      }
    >
      <Space direction="vertical" size="middle" style={{ width: '100%' }}>
        <Typography.Text type="secondary">
          {month}/{year} · {t('dashboard.cards.completedTrips')} và {t('dashboard.cards.totalRevenue')}
        </Typography.Text>

        {loading ? (
          <Flex justify="center" align="center" style={{ padding: token.paddingXL, width: '100%' }}>
            <Spin />
          </Flex>
        ) : error ? (
          <Alert type="error" showIcon message={t('common.loadError')} description={error} />
        ) : enrichedRows.length === 0 ? (
          <Empty description={t('common.noData')} />
        ) : (
          <Space direction="vertical" size="middle" style={{ width: '100%' }}>
            {enrichedRows.map((row) => (
              <Card key={String(row.driverId)} size="small" style={{ width: '100%' }}>
                <Flex vertical gap="small">
                  <Flex justify="space-between" align="center" gap="middle">
                    <Flex vertical>
                      <Typography.Text strong>
                        {row.rank}. {row.driverName}
                      </Typography.Text>
                      <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                        {row.trips} chuyến · {formatVnd(row.revenue)}
                      </Typography.Text>
                    </Flex>
                    <Typography.Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {row.tripPercent}%
                    </Typography.Text>
                  </Flex>
                  <Flex vertical gap={token.marginXXS}>
                    <Progress percent={row.tripPercent} showInfo={false} strokeColor={token.colorPrimary} />
                    <Progress percent={row.revenuePercent} showInfo={false} strokeColor={token.colorInfo} />
                  </Flex>
                </Flex>
              </Card>
            ))}
          </Space>
        )}
      </Space>
    </Card>
  );
}
