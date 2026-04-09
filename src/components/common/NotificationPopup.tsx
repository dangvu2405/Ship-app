import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { NotificationItem } from './NotificationItem';
import { TableSkeleton } from './TableSkeleton';
import { useNotifications } from '@/hooks/useNotifications';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import type { ActivityLog } from '@/types';
import BellIcon from 'lucide-react/dist/esm/icons/bell';
import CheckCheckIcon from 'lucide-react/dist/esm/icons/check-check';

type NotificationTab = 'all' | 'activity' | 'system' | 'user';

const NOTIFICATION_TAB_VALUES: NotificationTab[] = ['all', 'activity', 'system', 'user'];

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
    pollingInterval: open ? 30000 : 60000, // 30s when open, 60s when closed
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

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        {children || (
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 relative"
            title={t('header.notifications')}
            aria-label={t('header.notifications')}
          >
            <BellIcon className="h-4 w-4" aria-hidden />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-4 w-4 flex items-center justify-center p-0 text-[10px]"
              >
                {unreadCount > 99 ? '99+' : unreadCount}
              </Badge>
            )}
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[350px] p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <h3 className="font-semibold">{t('notifications.title')}</h3>
            {unreadCount > 0 && (
              <Badge variant="secondary" className="text-xs">
                {unreadCount} {t('notifications.unread')}
              </Badge>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllAsRead}
              className="h-7 text-xs"
            >
              <CheckCheckIcon className="h-3 w-3 mr-1" aria-hidden />
              {t('notifications.markAllRead')}
            </Button>
          )}
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as NotificationTab)} className="w-full">
          <TabsList className="w-full min-w-0 rounded-none border-b flex overflow-x-auto overflow-y-hidden">
            <TabsTrigger
              value="all"
              className="min-w-0 flex-1 truncate px-2 text-xs sm:text-sm"
              title={t('notifications.all')}
            >
              {t('notifications.all')}
            </TabsTrigger>
            <TabsTrigger
              value="activity"
              className="min-w-0 flex-1 truncate px-2 text-xs sm:text-sm"
              title={t('notifications.activity')}
            >
              {t('notifications.activity')}
            </TabsTrigger>
            <TabsTrigger
              value="system"
              className="min-w-0 flex-1 truncate px-2 text-xs sm:text-sm"
              title={t('notifications.system')}
            >
              {t('notifications.system')}
            </TabsTrigger>
            <TabsTrigger
              value="user"
              className="min-w-0 flex-1 truncate px-2 text-xs sm:text-sm"
              title={t('notifications.user')}
            >
              {t('notifications.user')}
            </TabsTrigger>
          </TabsList>

          {NOTIFICATION_TAB_VALUES.map((tab) => {
            const logs = filterLogsForTab(tab, activityLogs);
            return (
              <TabsContent key={tab} value={tab} className="m-0">
                <div className="max-h-[400px] overflow-y-auto">
                  {activityLoading ? (
                    <div className="p-4">
                      <TableSkeleton rows={5} columns={1} />
                    </div>
                  ) : logs.length === 0 ? (
                    <div className="flex flex-col items-center justify-center p-8 text-center">
                      <BellIcon className="h-12 w-12 text-muted-foreground mb-2" aria-hidden />
                      <p className="text-sm text-muted-foreground">{t('notifications.empty')}</p>
                    </div>
                  ) : (
                    <div className="p-2">
                      {logs.map((notification) => (
                        <NotificationItem
                          key={notification.id}
                          notification={notification}
                          onClick={() => handleMarkAsRead(notification.id)}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>

        {filteredLogs.length > 0 && (
          <>
            <Separator />
            <div className="p-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewAll}
                className="w-full"
              >
                {t('notifications.viewAll')}
              </Button>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
