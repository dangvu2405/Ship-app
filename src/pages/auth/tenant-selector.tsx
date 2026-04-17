import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Flex, Row, Tag, Typography, theme } from 'antd';
import { BankOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import type { Tenant } from '@/types';

export function TenantSelector() {
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { isAuthenticated, pendingTenants, currentTenantId, selectTenant, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate(ROUTES.login, { replace: true });
      return;
    }
    if (currentTenantId) {
      navigate(ROUTES.dashboard, { replace: true });
    }
  }, [isAuthenticated, currentTenantId, navigate]);

  const handleSelect = (tenant: Tenant) => {
    selectTenant(tenant.id);
    navigate(ROUTES.dashboard, { replace: true });
  };

  const handleLogout = async () => {
    await logout();
    navigate(ROUTES.login, { replace: true });
  };

  const tenants = pendingTenants.length > 0 ? pendingTenants : [];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        background: token.colorFillAlter,
      }}
    >
      <div style={{ width: '100%', maxWidth: 640 }}>
        <Flex vertical gap={24} align="center">
          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: token.borderRadiusLG,
              background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: token.colorTextLightSolid,
              fontWeight: 700,
              fontSize: 24,
            }}
          >
            S
          </div>

          <div style={{ textAlign: 'center' }}>
            <Typography.Title level={3} style={{ marginBottom: 8 }}>
              Chọn tổ chức
            </Typography.Title>
            <Typography.Text type="secondary">
              Tài khoản của bạn thuộc nhiều tổ chức. Vui lòng chọn tổ chức để tiếp tục.
            </Typography.Text>
          </div>

          <Row gutter={[16, 16]} style={{ width: '100%' }}>
            {tenants.map((tenant) => (
              <Col xs={24} sm={12} key={tenant.id}>
                <Card
                  hoverable
                  onClick={() => handleSelect(tenant)}
                  style={{ height: '100%', cursor: 'pointer' }}
                  styles={{ body: { padding: '20px 24px' } }}
                >
                  <Flex gap={16} align="center">
                    {tenant.logo_url ? (
                      <img
                        src={tenant.logo_url}
                        alt={tenant.name}
                        style={{ width: 40, height: 40, borderRadius: 8, objectFit: 'cover' }}
                      />
                    ) : (
                      <div
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 8,
                          background: token.colorPrimaryBg,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: token.colorPrimary,
                          flexShrink: 0,
                        }}
                      >
                        <BankOutlined style={{ fontSize: 20 }} />
                      </div>
                    )}
                    <Flex vertical gap={4} style={{ minWidth: 0 }}>
                      <Typography.Text strong ellipsis style={{ maxWidth: '100%' }}>
                        {tenant.name}
                      </Typography.Text>
                      <Flex gap={8} align="center" wrap="wrap">
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                          {tenant.code}
                        </Typography.Text>
                        <Tag
                          color={tenant.status === 'active' ? 'success' : 'default'}
                          style={{ margin: 0, fontSize: 11 }}
                        >
                          {tenant.status === 'active' ? 'Hoạt động' : tenant.status}
                        </Tag>
                      </Flex>
                    </Flex>
                  </Flex>
                </Card>
              </Col>
            ))}
          </Row>

          <Button
            type="text"
            icon={<LogoutOutlined />}
            onClick={() => void handleLogout()}
            style={{ color: token.colorTextSecondary }}
          >
            Đăng xuất
          </Button>
        </Flex>
      </div>
    </div>
  );
}
