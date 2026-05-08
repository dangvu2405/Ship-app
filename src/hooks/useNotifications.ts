import { useCallback } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { ActivityLog, PaginatedResponse } from '@/types';
import notificationService from '@/services/notification.service';

export const NOTIFICATIONS_LIST_QUERY_KEY = ['notifications', 'list'] as const;
export const NOTIFICATIONS_UNREAD_QUERY_KEY = ['notifications', 'unread-count'] as const;

interface UseNotificationsReturn {
  activityLogs: ActivityLog[];
  activityLoading: boolean;
  unreadCount: number;
  refetchActivityLogs: () => Promise<void>;
  markAsRead: (id: number | string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useNotifications = (options?: {
  enablePolling?: boolean;
  pollingInterval?: number;
  /** When false, skip list fetch (e.g. until header popover opens). Unread count still loads. */
  fetchList?: boolean;
}): UseNotificationsReturn => {
  const { enablePolling = false, pollingInterval = 60000, fetchList = true } = options ?? {};
  const queryClient = useQueryClient();

  const listQuery = useQuery({
    queryKey: NOTIFICATIONS_LIST_QUERY_KEY,
    enabled: fetchList,
    queryFn: async () => {
      const res = await notificationService.getList({ per_page: 50 });
      const page = res.data as PaginatedResponse<ActivityLog> | undefined;
      if (page?.data && Array.isArray(page.data)) return page.data;
      return [];
    },
  });

  const unreadQuery = useQuery({
    queryKey: NOTIFICATIONS_UNREAD_QUERY_KEY,
    queryFn: async () => {
      const res = await notificationService.getUnreadCount();
      return typeof res.data?.count === 'number' ? res.data.count : 0;
    },
    refetchInterval: enablePolling ? pollingInterval : false,
  });

  const refetchActivityLogs = useCallback(async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_LIST_QUERY_KEY }),
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_UNREAD_QUERY_KEY }),
    ]);
  }, [queryClient]);

  const markAsRead = useCallback(
    async (id: number | string) => {
      await notificationService.markRead(id);
      await queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
    [queryClient],
  );

  const markAllAsRead = useCallback(async () => {
    await notificationService.markAllRead();
    await queryClient.invalidateQueries({ queryKey: ['notifications'] });
  }, [queryClient]);

  return {
    activityLogs: listQuery.data ?? [],
    activityLoading: listQuery.isLoading,
    unreadCount: unreadQuery.data ?? 0,
    refetchActivityLogs,
    markAsRead,
    markAllAsRead,
  };
};
