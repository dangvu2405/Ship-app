import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  BellOutlined,
  CheckOutlined,
} from '@ant-design/icons';
import { Badge, Button, Dropdown, Empty, Flex, Segmented, Spin, Typography, theme } from 'antd';
import { NotificationItem } from './NotificationItem';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import type { ActivityLog } from '@/types';

type NotificationTab = 'all' | 'activity' | 'system' | 'user';

function filterLogsForTab(tab: NotificationTab, logs: ActivityLog[]): ActivityLog[] {
  if (tab === 'all') return logs;
  if (tab === 'activity') {
    return logs.filter((log) => ['create', 'update', 'delete'].includes(log.type));
  }
  if (tab === 'system') return logs.filter((log) => log.type === 'system');
  if (tab === 'user') return logs.filter((log) => log.type === 'user');
  return logs;
}

interface NotificationPopupProps {
  children?: React.ReactNode;
}

export function NotificationPopup({ children }: NotificationPopupProps) {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<NotificationTab>('all');

  const {
    activityLogs,
    activityLoading,
    unreadCount,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    enablePolling: true,
    pollingInterval: open ? 30000 : 60000,
  });

  const handleMarkAsRead = async (id: number) => {
    try {
      await markAsRead(id);
    } catch (error) {
      console.error('Failed to mark notification as read', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllAsRead();
    } catch (error) {
      console.error('Failed to mark all notifications as read', error);
    }
  };

  const handleViewAll = () => {
    setOpen(false);
    navigate(ROUTES.admin.notifications);
  };

  const filteredLogs = filterLogsForTab(activeTab, activityLogs);

  const tabOptions = [
    { label: t('notifications.all'), value: 'all' as const },
    { label: t('notifications.activity'), value: 'activity' as const },
    { label: t('notifications.system'), value: 'system' as const },
    { label: t('notifications.user'), value: 'user' as const },
  ];

  const panel = (
    <div
      style={{
        width: 'min(350px, calc(100vw - 1rem))',
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
          {unreadCount > 0 && (
            <Badge count={unreadCount > 99 ? '99+' : unreadCount} showZero={false} />
          )}
        </Flex>
        {unreadCount > 0 && (
          <Button type="link" size="small" icon={<CheckOutlined />} onClick={() => void handleMarkAllAsRead()}>
            {t('notifications.markAllRead')}
          </Button>
        )}
      </Flex>

      <div style={{ padding: '8px 12px 0' }}>
        <Segmented<NotificationTab>
          block
          size="small"
          value={activeTab}
          onChange={(v) => setActiveTab(v)}
          options={tabOptions}
        />
      </div>

      <div style={{ maxHeight: 400, overflowY: 'auto' }}>
        {activityLoading ? (
          <Flex justify="center" style={{ padding: 24 }}>
            <Spin />
          </Flex>
        ) : filteredLogs.length === 0 ? (
          <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('notifications.empty')} style={{ padding: 24 }} />
        ) : (
          <div style={{ padding: 8 }}>
            {filteredLogs.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleMarkAsRead(notification.id)}
              />
            ))}
          </div>
        )}
      </div>

      {filteredLogs.length > 0 && (
        <div style={{ padding: 8, borderTop: `1px solid ${token.colorSplit}` }}>
          <Button type="default" block onClick={handleViewAll}>
            {t('notifications.viewAll')}
          </Button>
        </div>
      )}
    </div>
  );

  return (
    <Dropdown
      open={open}
      onOpenChange={setOpen}
      dropdownRender={() => panel}
      trigger={['click']}
      placement="bottomRight"
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
    </Dropdown>
  );
}
