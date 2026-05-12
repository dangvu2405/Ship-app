import { Button, Card, Flex, Typography, theme } from 'antd';
import { ClockCircleOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { ExpirationAlerts } from './ExpirationAlerts';

const { Text } = Typography;

export function DashboardAlertsSection() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();

  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
      styles={{ body: { padding: 0 } }}
    >
      <div style={{ paddingBlock: token.padding, paddingInline: token.paddingLG }}>
        <Flex align="center" justify="space-between">
          <Flex align="center" gap="small">
            <ClockCircleOutlined style={{ color: token.colorWarning }} />
            <Text strong>
              {t('dashboard.alertsTitle')}
            </Text>
          </Flex>
          <Button
            type="link"
            size="small"
            icon={<RightOutlined />}
            onClick={() => navigate(ROUTES.admin.dispatch.board)}
            style={{ padding: 0 }}
          >
            Điều phối
          </Button>
        </Flex>
      </div>
      <div style={{ paddingInline: token.paddingLG, paddingBlockEnd: token.paddingLG }}>
        <ExpirationAlerts />
      </div>
    </Card>
  );
}
