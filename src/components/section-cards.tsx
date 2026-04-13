import type { CSSProperties, ReactNode } from 'react';
import { RiseOutlined } from '@ant-design/icons';
import { Alert, Button, Card, Flex, Spin, Tag, Typography, theme } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import type { DashboardStats } from '@/types';
import { formatCurrencyVND } from '@/utils/format';

interface SectionCardsProps {
  stats?: DashboardStats;
  loading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  revenue?: {
    total: number | undefined;
    tripCount: number;
    loading: boolean;
    error?: string | null;
    fromApi: boolean;
  };
}

function DashboardStatCard({
  loading,
  loadingLabel,
  description,
  value,
  badgeLabel,
  footerTitle,
  footerSubtitle,
  valueStyle,
}: {
  loading: boolean;
  loadingLabel: string;
  description: string;
  value: ReactNode;
  badgeLabel: string;
  footerTitle: string;
  footerSubtitle: string;
  valueStyle?: CSSProperties;
}) {
  const { token } = theme.useToken();

  return (
    <Card
      style={{
        minHeight: '9.5rem',
        background: `linear-gradient(to top, ${token.colorPrimaryBg}, ${token.colorBgContainer})`,
      }}
    >
      <Flex vertical gap={8} style={{ minHeight: '100%' }}>
        <div style={{ position: 'relative', paddingRight: 120 }}>
          <Typography.Text type="secondary" style={{ display: 'block', lineHeight: 1.4 }}>
            {description}
          </Typography.Text>
          <Typography.Title level={2} style={{ margin: '8px 0 0', fontWeight: 600, ...valueStyle }}>
            {loading ? (
              <span>
                <Spin size="small" /> {loadingLabel}
              </span>
            ) : (
              value
            )}
          </Typography.Title>
          <div style={{ position: 'absolute', right: 0, top: 0, maxWidth: 110 }}>
            <Tag icon={<RiseOutlined />} style={{ maxWidth: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {loading ? loadingLabel : badgeLabel}
            </Tag>
          </div>
        </div>
        <div style={{ marginTop: 'auto', borderTop: `1px solid ${token.colorSplit}`, paddingTop: 12 }}>
          <Flex align="center" gap={8}>
            <Typography.Text strong>{footerTitle}</Typography.Text>
            <RiseOutlined style={{ color: token.colorTextTertiary }} />
          </Flex>
          <Typography.Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 4 }}>
            {footerSubtitle}
          </Typography.Text>
        </div>
      </Flex>
    </Card>
  );
}

export function SectionCards({ stats, loading, error, onRetry, revenue }: SectionCardsProps) {
  const { t } = useTranslation();
  const loadingLabel = t('common.loading');
  const revenueValueStyle: CSSProperties = { fontSize: 'clamp(1.25rem, 2.5vw, 2rem)', wordBreak: 'break-word' };

  return (
    <div style={{ padding: '0 16px' }}>
      <Flex vertical gap={16}>
        {error ? (
          <Alert
            type="error"
            message={t('common.loadError')}
            description={
              <Flex vertical gap={12} align="flex-start">
                <span>{error}</span>
                {onRetry ? (
                  <Button size="small" onClick={() => void onRetry()}>
                    {t('dashboard.statsRetry')}
                  </Button>
                ) : null}
              </Flex>
            }
            showIcon
          />
        ) : null}
        <div
          style={{
            display: 'grid',
            gap: 12,
            gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 200px), 1fr))',
          }}
        >
          <DashboardStatCard
            loading={!!loading}
            loadingLabel={loadingLabel}
            description={t('dashboard.cards.totalCompanies')}
            value={stats?.companies?.total ?? 0}
            badgeLabel={`${stats?.companies?.active ?? 0} ${t('common.active')}`}
            footerTitle={t('dashboard.cards.totalCompanies')}
            footerSubtitle={t('dashboard.cards.activeCompanies')}
          />
          <DashboardStatCard
            loading={!!loading}
            loadingLabel={loadingLabel}
            description={t('dashboard.cards.totalEmployees')}
            value={stats?.employees?.total ?? 0}
            badgeLabel={`${stats?.employees?.active ?? 0} ${t('common.active')}`}
            footerTitle={t('dashboard.cards.totalEmployees')}
            footerSubtitle={t('dashboard.cards.activeEmployees')}
          />
          <DashboardStatCard
            loading={!!loading}
            loadingLabel={loadingLabel}
            description={t('dashboard.cards.totalVehicles')}
            value={stats?.vehicles?.total ?? 0}
            badgeLabel={`${stats?.vehicles?.active ?? 0} ${t('common.active')}`}
            footerTitle={t('dashboard.cards.totalVehicles')}
            footerSubtitle={t('dashboard.cards.activeVehicles')}
          />
          <DashboardStatCard
            loading={!!loading}
            loadingLabel={loadingLabel}
            description={t('dashboard.cards.totalTrips')}
            value={stats?.trips?.total ?? 0}
            badgeLabel={`${stats?.trips?.completed ?? 0} ${t('dashboard.cards.completed')}`}
            footerTitle={t('dashboard.cards.totalTrips')}
            footerSubtitle={t('dashboard.cards.completedTrips')}
          />
          {revenue ? (
            <DashboardStatCard
              loading={!!revenue.loading}
              loadingLabel={loadingLabel}
              description={t('dashboard.cards.totalRevenue')}
              value={formatCurrencyVND(revenue.total)}
              badgeLabel={
                revenue.fromApi
                  ? `${stats?.trips?.completed ?? 0} ${t('dashboard.cards.completed')}`
                  : `${revenue.tripCount} ${t('dashboard.cards.completed')}`
              }
              footerTitle={t('dashboard.cards.totalRevenue')}
              footerSubtitle={
                revenue.error
                  ? revenue.error
                  : revenue.fromApi
                    ? t('dashboard.cards.revenueFromReport')
                    : t('dashboard.cards.revenueFromTripsHint')
              }
              valueStyle={revenueValueStyle}
            />
          ) : null}
        </div>
      </Flex>
    </div>
  );
}
