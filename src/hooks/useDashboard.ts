import { useState, useEffect, useCallback } from 'react';
import activityService from '@/services/activity.service';
import dashboardService from '@/services/dashboard.service';
import type { ActivityLog, DashboardStats } from '@/types';

interface UseDashboardReturn {
  stats: DashboardStats | undefined;
  statsLoading: boolean;
  activityLogs: ActivityLog[];
  activityLoading: boolean;
  unreadCount: number;
  refetchStats: () => void;
  refetchActivityLogs: () => void;
  markAsRead: (id: number) => Promise<void>;
  markAllAsRead: () => Promise<void>;
}

export const useDashboard = (options?: {
  enablePolling?: boolean;
  pollingInterval?: number;
}): UseDashboardReturn => {
  const { enablePolling = true, pollingInterval = 30000 } = options || {};
  const [unreadCount, setUnreadCount] = useState(0);

  // Fetch dashboard stats
  const [stats, setStats] = useState<DashboardStats | undefined>(undefined);
  const [statsLoading, setStatsLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      const response = await dashboardService.getStats();
      if (response.success && response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setStatsLoading(false);
    }
  }, []);

  // Fetch activity logs
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);

  const fetchActivityLogs = useCallback(async () => {
    try {
      setActivityLoading(true);
      const response = await activityService.getAll({
        page: 1,
        per_page: 20,
      });
      if (response.success && response.data?.data) {
        setActivityLogs(response.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch activity logs:', error);
    } finally {
      setActivityLoading(false);
    }
  }, []);

  // Fetch unread count
  const fetchUnreadCount = useCallback(async () => {
    try {
      const response = await activityService.getUnreadCount();
      if (response.success && response.data) {
        setUnreadCount(response.data.count);
      }
    } catch (error) {
      console.error('Failed to fetch unread count:', error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchStats();
    fetchActivityLogs();
    fetchUnreadCount();
  }, [fetchStats, fetchActivityLogs, fetchUnreadCount]);

  // Polling for updates
  useEffect(() => {
    if (enablePolling) {
      const statsInterval = setInterval(fetchStats, pollingInterval);
      const activityInterval = setInterval(fetchActivityLogs, pollingInterval);
      const unreadInterval = setInterval(fetchUnreadCount, pollingInterval);
      return () => {
        clearInterval(statsInterval);
        clearInterval(activityInterval);
        clearInterval(unreadInterval);
      };
    }
  }, [enablePolling, pollingInterval, fetchStats, fetchActivityLogs, fetchUnreadCount]);

  // Update unread count when activity logs change
  useEffect(() => {
    if (activityLogs.length > 0) {
      const unread = activityLogs.filter((log) => !log.read).length;
      setUnreadCount(unread);
    }
  }, [activityLogs]);

  const markAsRead = useCallback(
    async (id: number) => {
      try {
        await activityService.markAsRead(id);
        // Update local state
        setActivityLogs((prev) =>
          prev.map((log) => (log.id === id ? { ...log, read: true } : log))
        );
        fetchUnreadCount();
      } catch (error) {
        console.error('Failed to mark as read:', error);
        throw error;
      }
    },
    [fetchUnreadCount]
  );

  const markAllAsRead = useCallback(async () => {
    try {
      await activityService.markAllAsRead();
      setActivityLogs((prev) => prev.map((log) => ({ ...log, read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
      throw error;
    }
  }, []);

  return {
    stats,
    statsLoading,
    activityLogs,
    activityLoading,
    unreadCount,
    refetchStats: fetchStats,
    refetchActivityLogs: () => {
      fetchActivityLogs();
      fetchUnreadCount();
    },
    markAsRead,
    markAllAsRead,
  };
};
