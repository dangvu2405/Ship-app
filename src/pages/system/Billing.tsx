import { Card, Space, Typography } from 'antd';
import { CreditCardOutlined } from '@ant-design/icons';
import { useTranslation } from '@/hooks/useTranslation';

export const Billing = () => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%', maxWidth: 768 }}>
      <div>
        <Space align="center" size="small">
          <CreditCardOutlined style={{ fontSize: 20, color: 'var(--ant-color-primary)' }} aria-hidden />
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('billing.title')}
          </Typography.Title>
        </Space>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0, marginTop: 8 }}>
          {t('billing.description')}
        </Typography.Paragraph>
      </div>

      <Card title={t('billing.comingSoonTitle')}>
        <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }}>
          {t('billing.comingSoonDescription')}
        </Typography.Paragraph>
        <Typography.Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
          {t('billing.placeholder')}
        </Typography.Text>
      </Card>
    </Space>
  );
};
