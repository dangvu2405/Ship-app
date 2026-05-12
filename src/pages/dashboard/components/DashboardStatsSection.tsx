import { useMemo } from 'react';
import { Alert, Button, Card, Empty, Flex, Progress, Skeleton, Typography, theme } from 'antd';
import {
  AppstoreOutlined,
  CarOutlined,
  CheckCircleOutlined,
  DollarCircleOutlined,
  RightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { formatMoney } from '@/utils/displayFormat';
import type { Vehicle } from '@/types';
import { VehicleChip } from './VehicleChip';

const { Text, Title } = Typography;

interface DashboardStatsSectionProps {
  stats: any;
  statsLoading: boolean;
  period: { month: number; year: number };
  activeVehicles: Vehicle[];
  activeVehiclesLoading: boolean;
  unassignedCount: number;
}

export function DashboardStatsSection({
  stats,
  statsLoading,
  period,
  activeVehicles,
  activeVehiclesLoading,
  unassignedCount,
}: DashboardStatsSectionProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  const completionRate = useMemo(() => {
    const total = stats?.trips?.total ?? 0;
    const completed = stats?.trips?.completed ?? 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [stats]);

  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
      styles={{ body: { padding: token.paddingLG, height: '100%' } }}
      loading={statsLoading}
    >
      <Flex vertical gap="middle" style={{ height: '100%' }}>
        <Flex align="center" gap="small" style={{ marginBlockEnd: token.marginSM }}>
          <AppstoreOutlined style={{ color: token.colorPrimary }} />
          <Text strong>
            Tháng {period.month}/{period.year}
          </Text>
        </Flex>

        <Flex vertical gap="middle" style={{ flex: 1 }}>
          <Flex justify="space-between" align="center">
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Tổng chuyến</Text>
            <Title level={4} style={{ margin: 0 }}>{(stats?.trips?.total ?? 0).toLocaleString('vi-VN')}</Title>
          </Flex>

          <Flex vertical gap="small">
            <Flex justify="space-between" align="center">
              <Flex align="center" gap="small">
                <CheckCircleOutlined style={{ color: token.colorSuccess }} />
                <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Hoàn thành</Text>
              </Flex>
              <Text strong>{(stats?.trips?.completed ?? 0).toLocaleString('vi-VN')}</Text>
            </Flex>
            <Progress
              percent={completionRate}
              size="small"
              strokeColor={token.colorSuccess}
              trailColor={token.colorFillAlter}
              format={(p) => <Text style={{ fontSize: token.fontSizeSM }}>{p}%</Text>}
            />
          </Flex>

          <Flex vertical gap="small">
            <Flex align="center" gap="small">
              <DollarCircleOutlined style={{ color: token.colorWarning }} />
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Doanh thu tháng</Text>
            </Flex>
            <Title level={4} style={{ margin: 0 }}>
              {formatMoney(stats?.revenue?.total ?? 0, { withCurrency: true })}
            </Title>
          </Flex>

          {unassignedCount > 0 && (
            <Alert
              type="warning"
              showIcon
              message={`${unassignedCount} chuyến chờ phân công`}
              action={
                <Button
                  size="small"
                  type="link"
                  icon={<RightOutlined />}
                  onClick={() => navigate(ROUTES.admin.dispatch.board)}
                  style={{ padding: 0 }}
                >
                  Phân công
                </Button>
              }
            />
          )}

          <div style={{ marginTop: 'auto' }}>
            <Flex align="center" gap="small" style={{ marginBlockEnd: token.marginSM }}>
              <CarOutlined style={{ color: token.colorPrimary }} />
              <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Xe đang hoạt động ({activeVehicles.length})</Text>
            </Flex>
            {activeVehiclesLoading ? (
              <Skeleton active paragraph={{ rows: 3, width: '100%' }} title={false} />
            ) : activeVehicles.length === 0 ? (
              <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
            ) : (
              <Flex vertical gap="small">
                {activeVehicles.slice(0, 4).map((v) => (
                  <VehicleChip key={v.id} vehicle={v} />
                ))}
                {activeVehicles.length > 4 && (
                  <Button
                    type="link"
                    size="small"
                    style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                    onClick={() => navigate(ROUTES.admin.vehicles.list)}
                  >
                    Xem thêm {activeVehicles.length - 4} xe khác
                  </Button>
                )}
              </Flex>
            )}
          </div>
        </Flex>
      </Flex>
    </Card>
  );
}
