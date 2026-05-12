import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Card, Col, Flex, Row, Tag, Typography, theme, Avatar } from 'antd';
import { BankOutlined, LogoutOutlined, ArrowRightOutlined } from '@ant-design/icons';
import { useAuthStore } from '@/stores/auth.store';
import { ROUTES } from '@/routes';
import type { Tenant } from '@/types';

const { Title, Text } = Typography;

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

  const tenants = pendingTenants || [];

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
        background: `linear-gradient(135deg, ${token.colorFillAlter} 0%, ${token.colorFillSecondary} 100%)`,
        ['--tenantHoverShadow' as any]: token.boxShadowSecondary,
      }}
    >
      <div style={{ width: '100%', maxWidth: 800 }}>
        <Flex vertical gap={48} align="center">
          <Flex vertical align="center" gap={16}>
             <div
              style={{
                width: 64,
                height: 64,
                borderRadius: 20,
                background: `linear-gradient(135deg, ${token.colorPrimary} 0%, ${token.colorPrimaryActive} 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 28,
                boxShadow: `0 10px 20px ${token.colorPrimary}40`
              }}
            >
              S
            </div>
            <div style={{ textAlign: 'center' }}>
              <Title level={2} style={{ marginBottom: 8, fontWeight: 800 }}>Chào mừng trở lại</Title>
              <Text type="secondary" style={{ fontSize: 16 }}>
                Vui lòng chọn tổ chức bạn muốn làm việc hôm nay.
              </Text>
            </div>
          </Flex>

          <Row gutter={[24, 24]} style={{ width: '100%' }}>
            {tenants.map((tenant) => (
              <Col xs={24} sm={12} key={tenant.id}>
                <Card
                  hoverable
                  onClick={() => handleSelect(tenant)}
                  style={{ 
                    height: '100%', 
                    cursor: 'pointer',
                    borderRadius: 20,
                    border: 'none',
                    boxShadow: '0 4px 15px rgba(0,0,0,0.05)',
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                  }}
                  styles={{ body: { padding: 24 } }}
                  className="tenant-card"
                >
                  <Flex vertical gap={24}>
                    <Flex justify="space-between" align="flex-start">
                      <Avatar
                        size={56}
                        shape="square"
                        src={tenant.logo_url}
                        icon={<BankOutlined />}
                        style={{ 
                          borderRadius: 14, 
                          background: token.colorPrimaryBg,
                          color: token.colorPrimary,
                          fontSize: 24
                        }}
                      />
                      <Tag
                        color={tenant.status === 'active' ? 'success' : 'default'}
                        style={{ 
                          borderRadius: 20, 
                          paddingInline: 12, 
                          margin: 0, 
                          fontWeight: 600,
                          textTransform: 'uppercase',
                          fontSize: 10
                        }}
                      >
                        {tenant.status === 'active' ? 'Hoạt động' : tenant.status}
                      </Tag>
                    </Flex>
                    
                    <Flex vertical gap={4}>
                      <Title level={4} style={{ margin: 0, fontWeight: 700 }} ellipsis>
                        {tenant.name}
                      </Title>
                      <Text type="secondary" style={{ fontSize: 13, letterSpacing: 0.5 }}>
                        {tenant.code}
                      </Text>
                    </Flex>

                    <Flex justify="flex-end">
                       <Button 
                         type="text" 
                         icon={<ArrowRightOutlined />} 
                         style={{ color: token.colorPrimary }}
                       >
                         Truy cập
                       </Button>
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
            style={{ 
              color: token.colorTextSecondary, 
              fontWeight: 600,
              fontSize: 14
            }}
          >
            Đăng xuất khỏi hệ thống
          </Button>
        </Flex>
      </div>
      <style>{`
        .tenant-card:hover {
          transform: translateY(-8px);
          box-shadow: var(--tenantHoverShadow);
        }
      `}</style>
    </div>
  );
}
