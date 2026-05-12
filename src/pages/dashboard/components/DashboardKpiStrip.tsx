import { Col, Row, theme } from 'antd';
import {
  CheckCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';
import { formatMoney } from '@/utils/displayFormat';
import { KpiCard } from './KpiCard';

interface DashboardKpiStripProps {
  todayKpis: {
    newCount: number;
    runningCount: number;
    completedCount: number;
    revenueToday: number;
    loading: boolean;
  };
}

export function DashboardKpiStrip({ todayKpis }: DashboardKpiStripProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();

  return (
    <Row gutter={[token.margin, token.margin]}>
      <Col xs={24} sm={12} xl={6}>
        <KpiCard
          title={t('dashboard.todayNewOrders')}
          value={todayKpis.newCount}
          loading={todayKpis.loading}
          icon={<FileTextOutlined />}
          iconBg={token.colorInfoBg}
          iconColor={token.colorInfo}
          description="Đơn mới trong ngày"
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <KpiCard
          title={t('dashboard.todayInProgress')}
          value={todayKpis.runningCount}
          loading={todayKpis.loading}
          icon={<TruckOutlined />}
          iconBg={token.colorWarningBg}
          iconColor={token.colorWarning}
          description="Chuyến đang vận chuyển"
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <KpiCard
          title={t('dashboard.todayCompleted')}
          value={todayKpis.completedCount}
          loading={todayKpis.loading}
          icon={<CheckCircleOutlined />}
          iconBg={token.colorSuccessBg}
          iconColor={token.colorSuccess}
          description="Chuyến hoàn thành hôm nay"
        />
      </Col>
      <Col xs={24} sm={12} xl={6}>
        <KpiCard
          title={t('dashboard.todayRevenue')}
          value={todayKpis.revenueToday}
          loading={todayKpis.loading}
          icon={<DollarCircleOutlined />}
          iconBg={token.colorPrimaryBg}
          iconColor={token.colorPrimary}
          formatter={(v) => formatMoney(v, { withCurrency: true })}
          description="Doanh thu trong ngày"
        />
      </Col>
    </Row>
  );
}
