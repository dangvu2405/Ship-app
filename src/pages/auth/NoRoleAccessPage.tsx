import { Button, Card, Flex, Typography, theme } from 'antd';
import { LockOutlined, LogoutOutlined, MailOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';

export function NoRoleAccessPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const logout = useAuthStore((state) => state.logout);

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: token.paddingLG,
        background: token.colorFillAlter,
      }}
    >
      <div style={{ width: '100%', maxWidth: 560 }}>
        <Card style={{ borderRadius: token.borderRadiusLG, boxShadow: token.boxShadowSecondary }}>
          <Flex vertical align="center" gap={token.marginMD}>
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: token.colorWarningBg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <LockOutlined style={{ fontSize: 28, color: token.colorWarning }} />
            </div>

            <Typography.Title level={3} style={{ margin: 0, textAlign: 'center' }}>
              {t('auth.noRoleTitle')}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ textAlign: 'center', margin: 0 }}>
              {t('auth.noRoleDescription')}
            </Typography.Paragraph>

            <Flex align="center" gap={token.marginXS}>
              <MailOutlined style={{ color: token.colorTextDescription }} />
              <Typography.Text>{t('auth.noRoleContactAdmin')}</Typography.Text>
            </Flex>

            <Button type="primary" icon={<LogoutOutlined />} onClick={() => void logout()}>
              {t('auth.logout')}
            </Button>
          </Flex>
        </Card>
      </div>
    </div>
  );
}
