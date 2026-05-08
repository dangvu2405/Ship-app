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
  /** Optional inline tags / status badges next to the title (Tag, Badge, etc). */
  tags?: ReactNode;
}

export const PageHeader = ({ title, description, breadcrumb, actions, tags }: PageHeaderProps) => {
  const { token } = theme.useToken();

  const breadcrumbItems = breadcrumb
    ? [
        {
          key: 'crumb__home',
          title: (
            <Link to={ROUTES.dashboard}>
              <HomeOutlined />
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
    <div style={{ marginBottom: 20 }}>
      {/* Breadcrumb strip */}
      {breadcrumbItems && (
        <div style={{ marginBottom: 12 }}>
          <Breadcrumb items={breadcrumbItems} />
        </div>
      )}

      {/* Title row */}
      <Flex
        justify="space-between"
        align="flex-start"
        gap={16}
        wrap="wrap"
        style={{
          paddingBottom: 16,
          borderBottom: `1px solid ${token.colorBorderSecondary}`,
        }}
      >
        <div>
          <Flex align="center" gap={8} wrap="wrap">
            <Typography.Title level={4} style={{ margin: 0, lineHeight: 1.3 }}>
              {title}
            </Typography.Title>
            {tags}
          </Flex>
          {description && (
            <Typography.Text type="secondary" style={{ marginTop: 4, display: 'block', fontSize: 13 }}>
              {description}
            </Typography.Text>
          )}
        </div>
        {actions && (
          <Flex gap={8} wrap="wrap" align="center" style={{ flexShrink: 0 }}>
            {actions}
          </Flex>
        )}
      </Flex>
    </div>
  );
};
