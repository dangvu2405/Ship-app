import { Avatar, Card, Empty, Flex, Progress, Typography, theme } from 'antd';
import { TruckOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/utils/displayFormat';

const { Text } = Typography;

interface DashboardTopDriversProps {
  topDrivers: any[];
  loading: boolean;
  period: { month: number; year: number };
}

export function DashboardTopDrivers({ topDrivers, loading, period }: DashboardTopDriversProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  const maxTopDriverRevenue = topDrivers.reduce((max, d) => Math.max(max, d.revenue), 0);

  return (
    <Card
      title={
        <Flex align="center" gap="small">
          <TruckOutlined style={{ color: token.colorPrimary }} />
          <span>Top tài xế tháng {period.month}/{period.year}</span>
        </Flex>
      }
      style={{ borderRadius: token.borderRadiusLG, height: '100%' }}
      styles={{ body: { padding: token.paddingLG } }}
      loading={loading}
    >
      {topDrivers.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
      ) : (
        <Flex vertical gap="middle">
          {topDrivers.map((row, idx) => (
            <Flex vertical gap="small" key={row.driverId}>
              <Flex justify="space-between" align="center">
                <Flex align="center" gap="small">
                  <Avatar
                    size={28}
                    style={{
                      background: idx === 0 ? token.colorWarningBg : token.colorFillAlter,
                      color: idx === 0 ? token.colorWarning : token.colorTextSecondary,
                      fontWeight: 600,
                    }}
                  >
                    {idx + 1}
                  </Avatar>
                  <Flex vertical>
                    <Text strong>{row.driverName}</Text>
                    <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>
                      {row.trips} chuyến
                    </Text>
                  </Flex>
                </Flex>
                <Text strong style={{ color: token.colorPrimary }}>
                  {formatMoney(row.revenue, { withCurrency: true })}
                </Text>
              </Flex>
              <Progress
                percent={maxTopDriverRevenue > 0 ? Math.round((row.revenue / maxTopDriverRevenue) * 100) : 0}
                size="small"
                showInfo={false}
                strokeColor={token.colorPrimary}
              />
            </Flex>
          ))}
        </Flex>
      )}
    </Card>
  );
}
