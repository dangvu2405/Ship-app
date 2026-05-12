import React from 'react';
import { Card, Col, Row, Statistic, theme, Typography, Flex, Skeleton } from 'antd';
import { ArrowDownOutlined, ArrowUpOutlined } from '@ant-design/icons';
import { DashboardKpi } from '../types';

const { Text } = Typography;

interface KpiCardGridProps {
  kpis?: DashboardKpi[];
  loading?: boolean;
}

export const KpiCardGrid: React.FC<KpiCardGridProps> = ({ kpis = [], loading }) => {
  const { token } = theme.useToken();

  if (loading) {
    return (
      <Row gutter={[16, 16]}>
        {[1, 2, 3, 4].map((i) => (
          <Col xs={24} sm={12} lg={6} key={i}>
            <Card variant="borderless">
              <Skeleton active paragraph={{ rows: 1 }} />
            </Card>
          </Col>
        ))}
      </Row>
    );
  }

  return (
    <Row gutter={[16, 16]}>
      {kpis.map((kpi, index) => (
        <Col xs={24} sm={12} lg={6} key={index}>
          <Card
            variant="borderless"
            style={{
              height: '100%',
              boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
              borderRadius: token.borderRadiusLG,
              transition: 'all 0.3s ease',
            }}
            hoverable
          >
            <Statistic
              title={
                <Flex align="center" gap={8}>
                  <Text type="secondary" style={{ fontSize: 14 }}>{kpi.title}</Text>
                </Flex>
              }
              value={kpi.value}
              precision={typeof kpi.value === 'number' ? 0 : undefined}
              suffix={<span style={{ fontSize: 16, marginLeft: 4 }}>{kpi.suffix}</span>}
              valueStyle={{ color: kpi.color || token.colorTextHeading, fontWeight: 800, fontSize: 28 }}
            />
            {kpi.trend !== undefined && (
              <div style={{ marginTop: 12 }}>
                <Flex align="center" gap={4}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '2px 8px',
                      borderRadius: 12,
                      background: kpi.trendDirection === 'up' ? '#f6ffed' : '#fff1f0',
                      color: kpi.trendDirection === 'up' ? token.colorSuccess : token.colorError,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    {kpi.trendDirection === 'up' ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
                    {Math.abs(kpi.trend)}%
                  </div>
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    so với kỳ trước
                  </Text>
                </Flex>
              </div>
            )}
          </Card>
        </Col>
      ))}
    </Row>
  );
};
