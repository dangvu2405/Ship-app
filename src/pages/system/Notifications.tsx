import { Space, Typography } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { AuthLogsAndSessionManagement } from '@/components/common/AuthLogsAndSessionManagement';
import { useTranslation } from '@/hooks/useTranslation';

export const Notifications = () => {
  const { t } = useTranslation();

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <div>
        <Space align="center" size="small" wrap>
          <BellOutlined style={{ fontSize: 20, color: 'var(--ant-color-primary)' }} aria-hidden />
          <Typography.Title level={2} style={{ margin: 0 }}>
            {t('notificationCenter.title')}
          </Typography.Title>
        </Space>
        <Typography.Paragraph type="secondary" style={{ maxWidth: 768, marginBottom: 0, marginTop: 8 }}>
          {t('notificationCenter.description')}
        </Typography.Paragraph>
      </div>

      <AuthLogsAndSessionManagement />
    </Space>
  );
};
