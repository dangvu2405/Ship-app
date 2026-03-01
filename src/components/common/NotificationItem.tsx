import { useNavigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { vi as viLocale, enUS } from 'date-fns/locale';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EditIcon from 'lucide-react/dist/esm/icons/edit';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import BellIcon from 'lucide-react/dist/esm/icons/bell';
import UserIcon from 'lucide-react/dist/esm/icons/user';
import { cn } from '@/lib/utils';
import { useTranslation } from '@/hooks/useTranslation';
import type { ActivityLog } from '@/types';

interface NotificationItemProps {
  notification: ActivityLog;
  onClick?: () => void;
}

const getNotificationIcon = (type: ActivityLog['type']) => {
  switch (type) {
    case 'create':
      return PlusIcon;
    case 'update':
      return EditIcon;
    case 'delete':
      return Trash2Icon;
    case 'system':
      return BellIcon;
    case 'user':
      return UserIcon;
    default:
      return BellIcon;
  }
};

const getNotificationColor = (type: ActivityLog['type']) => {
  switch (type) {
    case 'create':
      return 'text-green-600 dark:text-green-400';
    case 'update':
      return 'text-blue-600 dark:text-blue-400';
    case 'delete':
      return 'text-red-600 dark:text-red-400';
    case 'system':
      return 'text-yellow-600 dark:text-yellow-400';
    case 'user':
      return 'text-purple-600 dark:text-purple-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

const getResourceRoute = (resource: string, resourceId?: number): string | null => {
  if (!resourceId) return null;

  const routes: Record<string, string> = {
    company: `/admin/companies/edit/${resourceId}`,
    companies: `/admin/companies/edit/${resourceId}`,
    employee: `/admin/employees/edit/${resourceId}`,
    employees: `/admin/employees/edit/${resourceId}`,
    vehicle: `/admin/vehicles/edit/${resourceId}`,
    vehicles: `/admin/vehicles/edit/${resourceId}`,
    trip: `/admin/trips/edit/${resourceId}`,
    trips: `/admin/trips/edit/${resourceId}`,
    payroll: `/admin/payrolls/edit/${resourceId}`,
    payrolls: `/admin/payrolls/edit/${resourceId}`,
    user: `/admin/users/edit/${resourceId}`,
    users: `/admin/users/edit/${resourceId}`,
  };

  return routes[resource.toLowerCase()] || null;
};

export function NotificationItem({ notification, onClick }: NotificationItemProps) {
  const { locale } = useTranslation();
  const navigate = useNavigate();
  const Icon = getNotificationIcon(notification.type);
  const iconColor = getNotificationColor(notification.type);

  const handleClick = () => {
    if (onClick) {
      onClick();
    }

    // Navigate to resource if available
    const route = getResourceRoute(notification.resource, notification.resource_id);
    if (route) {
      navigate(route);
    }
  };

  const timeAgo = formatDistanceToNow(new Date(notification.created_at), {
    addSuffix: true,
    locale: locale === 'vi' ? viLocale : enUS,
  });

  return (
    <div
      className={cn(
        'flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors',
        'hover:bg-accent',
        !notification.read && 'bg-accent/50 font-medium'
      )}
      onClick={handleClick}
    >
      <div className={cn('flex-shrink-0 mt-0.5', iconColor)}>
        <Icon className="h-4 w-4" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm text-foreground line-clamp-2">{notification.description}</p>
        <div className="flex items-center gap-2 mt-1">
          {notification.user_name && (
            <span className="text-xs text-muted-foreground">{notification.user_name}</span>
          )}
          <span className="text-xs text-muted-foreground">•</span>
          <span className="text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </div>
      {!notification.read && (
        <div className="flex-shrink-0 w-2 h-2 rounded-full bg-primary mt-2" />
      )}
    </div>
  );
}
