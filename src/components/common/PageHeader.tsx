import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { Breadcrumb, Flex, Typography, theme } from 'antd';
import { HomeOutlined } from '@ant-design/icons';
import { ROUTES } from '@/routes';

export interface BreadcrumbItem {
  label: string;
  path?: string;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  breadcrumb?: BreadcrumbItem[];
  actions?: ReactNode;
}

export const PageHeader = ({ title, description, breadcrumb, actions }: PageHeaderProps) => {
  const { token } = theme.useToken();

  const breadcrumbItems = breadcrumb
    ? [
        {
          key: 'crumb__home',
          title: (
            <Link to={ROUTES.dashboard}>
              <HomeOutlined /> Home
            </Link>
          ),
        },
        ...breadcrumb.map((item, index) => ({
          key: `crumb__${index}__${item.path ?? item.label}`,
          title: item.path ? <Link to={item.path}>{item.label}</Link> : item.label,
        })),
      ]
    : undefined;

  return (
    <div style={{ marginBottom: token.marginLG }}>
      {breadcrumbItems && (
        <div
          style={{
            marginBottom: 12,
            padding: '8px 12px',
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorderSecondary}`,
            background: token.colorBgContainer,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}
      <div
        style={{
          position: 'relative',
          overflow: 'hidden',
          borderRadius: token.borderRadiusLG * 1.25,
          border: `1px solid ${token.colorBorderSecondary}`,
          padding: 20,
          background: `linear-gradient(90deg, ${token.colorBgContainer} 0%, ${token.colorBgContainer} 60%, ${token.colorPrimaryBg} 100%)`,
          boxShadow: token.boxShadowTertiary,
        }}
      >
        <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
          <div>
            <Typography.Title level={2} style={{ margin: 0 }}>
              {title}
            </Typography.Title>
            {description && (
              <Typography.Paragraph type="secondary" style={{ marginTop: 8, marginBottom: 0 }}>
                {description}
              </Typography.Paragraph>
            )}
          </div>
          {actions && (
            <Flex gap={12} wrap="wrap" style={{ marginLeft: 'auto' }}>
              {actions}
            </Flex>
          )}
        </Flex>
      </div>
    </div>
  );
};
