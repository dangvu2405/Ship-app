import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { enUS, vi as viLocale } from 'date-fns/locale';
import {
  BellOutlined,
  DeleteOutlined,
  EditOutlined,
  InfoCircleOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { Flex, Typography, theme } from 'antd';
import { useTranslation } from '@/hooks/useTranslation';
import { getResourceShowRoute } from '@/routes';
import type { ActivityLog } from '@/types';

export type NotificationListItemProps = {
  notification: ActivityLog;
  onMarkRead?: () => void;
};

const iconForType = (type: ActivityLog['type']) => {
  switch (type) {
    case 'create':
      return { Icon: PlusOutlined, tone: 'success' as const };
    case 'update':
      return { Icon: EditOutlined, tone: 'info' as const };
    case 'delete':
      return { Icon: DeleteOutlined, tone: 'danger' as const };
    case 'system':
      return { Icon: WarningOutlined, tone: 'warning' as const };
    case 'user':
      return { Icon: UserOutlined, tone: 'default' as const };
    default:
      return { Icon: InfoCircleOutlined, tone: 'default' as const };
  }
};

const toneColor = (token: ReturnType<typeof theme.useToken>['token'], tone: ReturnType<typeof iconForType>['tone']) => {
  switch (tone) {
    case 'success':
      return token.colorSuccess;
    case 'info':
      return token.colorInfo;
    case 'danger':
      return token.colorError;
    case 'warning':
      return token.colorWarning;
    default:
      return token.colorTextSecondary;
  }
};

export function NotificationListItem({ notification, onMarkRead }: NotificationListItemProps) {
  const { locale } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { Icon, tone } = iconForType(notification.type);
  const color = toneColor(token, tone);

  const title =
    notification.action?.trim() ||
    (notification.resource ? `${notification.resource}${notification.resource_id != null ? ` #${notification.resource_id}` : ''}` : '') ||
    'Thông báo';

  const handleClick = () => {
    onMarkRead?.();
    const route =
      notification.resource_id != null
        ? getResourceShowRoute(notification.resource, notification.resource_id)
        : null;
    if (route) navigate(route);
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: locale === 'vi' ? viLocale : enUS,
  });

  const unread = !notification.read;

  return (
    <Flex
      align="flex-start"
      gap={12}
      onClick={handleClick}
      style={{
        padding: '10px 12px',
        borderRadius: token.borderRadiusLG,
        cursor: 'pointer',
        transition: 'background 0.2s',
        background: unread ? token.colorPrimaryBg : undefined,
        border: unread ? `1px solid ${token.colorPrimaryBorder}` : `1px solid transparent`,
        animation: unread ? 'notificationUnreadPulse 2.4s ease-in-out infinite' : undefined,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = token.colorFillSecondary;
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.background = unread ? token.colorPrimaryBg : 'transparent';
      }}
    >
      <style>{`
        @keyframes notificationUnreadPulse {
          0%, 100% { box-shadow: 0 0 0 0 ${token.colorPrimary}44; }
          50% { box-shadow: 0 0 0 6px ${token.colorPrimary}00; }
        }
      `}</style>
      <div style={{ color, marginTop: 2 }}>
        <Icon />
      </div>
      <Flex vertical gap={4} style={{ flex: 1, minWidth: 0 }}>
        <Typography.Text strong style={{ display: 'block' }}>
          {title}
        </Typography.Text>
        <Typography.Paragraph type="secondary" ellipsis={{ rows: 2, tooltip: notification.description }} style={{ fontSize: 13, marginBottom: 0 }}>
          {notification.description}
        </Typography.Paragraph>
        <Flex align="center" gap={8} wrap="wrap">
          {notification.user_name ? (
            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
              {notification.user_name}
            </Typography.Text>
          ) : null}
          <Typography.Text type="secondary" style={{ fontSize: 12 }}>
            {notification.user_name ? '· ' : ''}
            {timeAgo}
          </Typography.Text>
        </Flex>
      </Flex>
      {unread ? (
        <BellOutlined style={{ color: token.colorPrimary, marginTop: 4, fontSize: 12 }} />
      ) : null}
    </Flex>
  );
}
