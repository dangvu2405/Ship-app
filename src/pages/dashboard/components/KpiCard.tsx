import { Avatar, Card, Flex, Skeleton, Typography, theme } from 'antd';

const { Text, Title } = Typography;

interface KpiCardProps {
  title: string;
  value: number;
  loading?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  formatter?: (v: number) => string;
  description?: string;
}

export function KpiCard({ title, value, loading, icon, iconBg, iconColor, formatter, description }: KpiCardProps) {
  const { token } = theme.useToken();
  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
      styles={{ body: { padding: token.paddingLG } }}
    >
      <Flex align="flex-start" gap="middle">
        <Avatar
          size={52}
          style={{ background: iconBg, color: iconColor, flexShrink: 0, borderRadius: token.borderRadiusLG }}
          icon={icon}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: token.fontSizeSM, display: 'block', marginBlockEnd: token.marginXXS }}>
            {title}
          </Text>
          {loading ? (
            <Skeleton active title={{ width: 100, style: { margin: 0, height: 28 } }} paragraph={false} />
          ) : (
            <Title level={4} style={{ margin: 0 }}>
              {formatter ? formatter(value) : value.toLocaleString('vi-VN')}
            </Title>
          )}
          {description && (
            <Text type="secondary" style={{ fontSize: token.fontSizeSM, marginBlockStart: token.marginXXS, display: 'block' }}>
              {description}
            </Text>
          )}
        </div>
      </Flex>
    </Card>
  );
}
