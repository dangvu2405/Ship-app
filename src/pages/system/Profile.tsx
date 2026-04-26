import {
  Avatar,
  Button,
  Card,
  Col,
  Divider,
  Flex,
  Form,
  Input,
  Row,
  Space,
  Tag,
  Typography,
  theme,
} from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth.store';
import { useTranslation } from '@/hooks/useTranslation';

export const Profile = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const initial = (user?.username || 'U').charAt(0).toUpperCase();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 1152 }}>
      <div>
        <Typography.Title level={2} style={{ marginBottom: 4 }}>
          {t('profile.title')}
        </Typography.Title>
        <Typography.Text type="secondary">{t('profile.description')}</Typography.Text>
      </div>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={8}>
          <Card>
            <Flex vertical align="center" gap="middle">
              <Avatar size={96} style={{ background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)` }}>
                {initial}
              </Avatar>
              <div style={{ textAlign: 'center' }}>
                <Typography.Title level={4} style={{ marginBottom: 4 }}>
                  {user?.username || t('profile.user')}
                </Typography.Title>
                <Typography.Text type="secondary">{user?.email}</Typography.Text>
              </div>
              <Flex wrap gap="small" justify="center">
                {user?.roles?.length
                  ? user.roles.map((role) => <Tag key={role.id}>{role.name}</Tag>)
                  : <Tag>{t('profile.user')}</Tag>}
              </Flex>
              <Divider style={{ margin: '8px 0' }} />
              <Flex vertical gap="small" style={{ width: '100%' }}>
                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary">{t('profile.status')}</Typography.Text>
                  <Tag bordered={false} color="success">
                    {t('common.active')}
                  </Tag>
                </Flex>
                <Flex justify="space-between" align="center">
                  <Typography.Text type="secondary">{t('profile.memberSince')}</Typography.Text>
                  <Typography.Text strong>2024</Typography.Text>
                </Flex>
              </Flex>
            </Flex>
          </Card>
        </Col>

        <Col xs={24} lg={16}>
          <Card
            title={t('profile.personalInformation.title')}
            extra={<UserOutlined aria-hidden style={{ color: 'var(--ant-color-text-tertiary)' }} />}
          >
            <Typography.Paragraph type="secondary" style={{ marginTop: -8, marginBottom: 24 }}>
              {t('profile.personalInformation.description')}
            </Typography.Paragraph>
            <Form layout="vertical" requiredMark={false}>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label={t('profile.personalInformation.username')}>
                    <Input
                      id="username"
                      defaultValue={user?.username}
                      placeholder={t('profile.personalInformation.usernamePlaceholder')}
                      autoComplete="username"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label={t('profile.personalInformation.email')}>
                    <Input
                      id="email"
                      type="email"
                      defaultValue={user?.email}
                      placeholder={t('profile.personalInformation.emailPlaceholder')}
                      autoComplete="email"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Divider />

              <Typography.Title level={5}>{t('profile.changePassword.title')}</Typography.Title>
              <Row gutter={16}>
                <Col xs={24} sm={12}>
                  <Form.Item label={t('profile.changePassword.currentPassword')}>
                    <Input.Password
                      id="current-password"
                      placeholder={t('profile.changePassword.currentPasswordPlaceholder')}
                      autoComplete="current-password"
                    />
                  </Form.Item>
                </Col>
                <Col xs={24} sm={12}>
                  <Form.Item label={t('profile.changePassword.newPassword')}>
                    <Input.Password
                      id="new-password"
                      placeholder={t('profile.changePassword.newPasswordPlaceholder')}
                      autoComplete="new-password"
                    />
                  </Form.Item>
                </Col>
              </Row>

              <Flex justify="flex-end" gap="small" style={{ marginTop: 8 }}>
                <Button>{t('common.cancel')}</Button>
                <Button type="primary">{t('profile.saveChanges')}</Button>
              </Flex>
            </Form>
          </Card>
        </Col>
      </Row>
    </Space>
  );
};
