import { Alert, Button, Card, Col, Flex, Row, Typography, theme } from 'antd';
import { AppstoreOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '@/routes';

const { Text, Title } = Typography;

interface DashboardTodaySummaryProps {
  dailySummary: any;
  todayKpis: any;
  unreadCount: number;
  unassignedCount: number;
}

export function DashboardTodaySummary({
  dailySummary,
  todayKpis,
  unreadCount,
  unassignedCount,
}: DashboardTodaySummaryProps) {
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <Card
      title={
        <Flex align="center" gap="small">
          <AppstoreOutlined style={{ color: token.colorPrimary }} />
          <span>Tổng quan hôm nay</span>
        </Flex>
      }
      style={{ borderRadius: token.borderRadiusLG, height: '100%' }}
      styles={{ body: { padding: token.paddingLG } }}
    >
      <Row gutter={[token.marginSM, token.marginSM]}>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: token.paddingSM } }}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Chưa phân công</Text>
            <Title level={4} style={{ margin: 0 }}>{dailySummary?.unassigned ?? unassignedCount}</Title>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: token.paddingSM } }}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Đang chạy</Text>
            <Title level={4} style={{ margin: 0 }}>{dailySummary?.in_transit ?? todayKpis.runningCount}</Title>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: token.paddingSM } }}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Tài xế bận / sẵn sàng</Text>
            <Title level={4} style={{ margin: 0 }}>
              {dailySummary?.busy_drivers ?? '—'} / {dailySummary?.available_drivers ?? '—'}
            </Title>
          </Card>
        </Col>
        <Col span={12}>
          <Card size="small" styles={{ body: { padding: token.paddingSM } }}>
            <Text type="secondary" style={{ fontSize: token.fontSizeSM }}>Xe bận / sẵn sàng</Text>
            <Title level={4} style={{ margin: 0 }}>
              {dailySummary?.busy_vehicles ?? '—'} / {dailySummary?.available_vehicles ?? '—'}
            </Title>
          </Card>
        </Col>
        {unreadCount > 0 && (
          <Col span={24}>
            <Alert
              type="info"
              showIcon
              message={`Bạn có ${unreadCount} thông báo chưa đọc`}
              action={
                <Button
                  size="small"
                  type="link"
                  onClick={() => navigate(ROUTES.admin.notifications)}
                  style={{ padding: 0 }}
                >
                  Xem
                </Button>
              }
            />
          </Col>
        )}
      </Row>
    </Card>
  );
}
