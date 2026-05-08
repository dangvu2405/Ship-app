import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { Badge, Button, Empty, Flex, Popover, Spin, Typography, theme } from 'antd';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { NotificationListItem } from './NotificationListItem';

export type NotificationBellProps = {
  children?: React.ReactNode;
};

export function NotificationBell({ children }: NotificationBellProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const {
    activityLogs,
    activityLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    enablePolling: true,
    pollingInterval: open ? 30000 : 60000,
    fetchList: open,
  });

  const previewRows = useMemo(() => {
    return [...activityLogs]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5);
  }, [activityLogs]);

  const handleViewAll = () => {
    setOpen(false);
    navigate(ROUTES.admin.notifications);
  };

  const panel = (
    <div
      style={{
        width: 'min(380px, calc(100vw - 1rem))',
        background: token.colorBgElevated,
        borderRadius: token.borderRadiusLG,
        boxShadow: token.boxShadowSecondary,
        overflow: 'hidden',
      }}
    >
      <Flex align="center" justify="space-between" style={{ padding: 16, borderBottom: `1px solid ${token.colorSplit}` }}>
        <Flex align="center" gap={8}>
          <Typography.Title level={5} style={{ margin: 0 }}>
            {t('notifications.title')}
          </Typography.Title>
          {unreadCount > 0 ? (
            <Badge count={unreadCount > 99 ? '99+' : unreadCount} showZero={false} />
          ) : null}
        </Flex>
        {unreadCount > 0 ? (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => void markAllAsRead()}>
            {t('notifications.markAllRead')}
          </Button>
        ) : null}
      </Flex>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {activityLoading ? (
          <Flex justify="center" style={{ padding: 24 }}>
            <Spin />
          </Flex>
        ) : previewRows.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notifications.empty')} style={{ padding: 24 }} />
        ) : (
          <Flex vertical gap={8} style={{ padding: 8 }}>
            {previewRows.map((notification) => (
              <NotificationListItem
                key={notification.id}
                notification={notification}
                onMarkRead={() => void markAsRead(notification.id)}
              />
            ))}
          </Flex>
        )}
      </div>

      <div style={{ padding: 8, borderTop: `1px solid ${token.colorSplit}` }}>
        <Button type="default" block onClick={handleViewAll}>
          {t('notifications.viewAll')}
        </Button>
      </div>
    </div>
  );

  return (
    <Popover
      open={open}
      onOpenChange={setOpen}
      placement="bottomRight"
      trigger={['click']}
      content={panel}
    >
      {children || (
        <Badge count={unreadCount > 0 ? (unreadCount > 99 ? 99 : unreadCount) : 0} size="small" offset={[-2, 2]}>
          <Button
            type="text"
            icon={<BellOutlined />}
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
          />
        </Badge>
      )}
    </Popover>
  );
}

export const NotificationPopup = NotificationBell;
