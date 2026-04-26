import { Alert, Card, Typography } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';

export function AttendanceLatePanel() {
  const { t } = useTranslation();

  return (
    <Card>
      <Typography.Title level={5}>Đi muộn</Typography.Title>
      <Alert
        type="info"
        showIcon
        message={t('common.noData')}
        description="Tính năng đang được cập nhật."
      />
    </Card>
  );
}
