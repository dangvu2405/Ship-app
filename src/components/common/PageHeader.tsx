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
  description?: ReactNode;
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
            marginBottom: 10,
            padding: '8px 12px',
            borderRadius: token.borderRadiusLG,
            border: `1px solid ${token.colorBorder}`,
            background: token.colorBgContainer,
          }}
        >
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}
      <div
        style={{
          borderRadius: token.borderRadiusLG,
          border: `1px solid ${token.colorBorder}`,
          padding: 18,
          background: token.colorBgContainer,
          boxShadow: token.boxShadowSecondary,
        }}
      >
        <Flex justify="space-between" align="flex-start" gap={16} wrap="wrap">
          <div>
            <Typography.Title level={3} style={{ margin: 0 }}>
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
