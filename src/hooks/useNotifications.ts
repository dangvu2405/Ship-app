import { useCallback, useEffect, useRef, useState } from 'react';
import type { ActivityLog } from '@/types';
import notificationService from '@/services/notification.service';

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
}): UseNotificationsReturn => {
  const { enablePolling = false, pollingInterval = 60000 } = options ?? {};

  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const pollTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await notificationService.getList({ per_page: 50 });
      if (res.data?.data) {
        setActivityLogs(res.data.data);
      }
    } catch {
      // silently fail — notifications are non-critical
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    try {
      const res = await notificationService.getUnreadCount();
      if (typeof res.data?.count === 'number') {
        setUnreadCount(res.data.count);
      }
    } catch {
      // silently fail
    }
  }, []);

  const refetchActivityLogs = useCallback(async () => {
    setActivityLoading(true);
    try {
      await Promise.all([fetchNotifications(), fetchUnreadCount()]);
    } finally {
      setActivityLoading(false);
    }
  }, [fetchNotifications, fetchUnreadCount]);

  // Initial fetch
  useEffect(() => {
    void refetchActivityLogs();
  }, [refetchActivityLogs]);

  // Polling — only schedule unread count to keep traffic low
  useEffect(() => {
    if (!enablePolling) return;

    const schedule = () => {
      pollTimer.current = setTimeout(() => {
        void fetchUnreadCount();
        schedule();
      }, pollingInterval);
    };

    schedule();
    return () => {
      if (pollTimer.current !== null) clearTimeout(pollTimer.current);
    };
  }, [enablePolling, pollingInterval, fetchUnreadCount]);

  const markAsRead = useCallback(async (id: number | string) => {
    try {
      await notificationService.markRead(id);
      setActivityLogs((prev) =>
        prev.map((log) => (log.id === id ? { ...log, read: true } : log)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch {
      // silently fail
    }
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await notificationService.markAllRead();
      setActivityLogs((prev) => prev.map((log) => ({ ...log, read: true })));
      setUnreadCount(0);
    } catch {
      // silently fail
    }
  }, []);

  return {
    activityLogs,
    activityLoading,
    unreadCount,
    refetchActivityLogs,
    markAsRead,
    markAllAsRead,
  };
};
