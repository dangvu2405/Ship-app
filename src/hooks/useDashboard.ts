import { useCallback } from 'react';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useNotifications } from '@/hooks/useNotifications';
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

  const { stats, statsLoading, refetchStats } = useDashboardStats({
    enablePolling,
    pollingInterval,
  });

  const {
    activityLogs,
    activityLoading,
    unreadCount,
    refetchActivityLogs,
    markAsRead,
    markAllAsRead,
  } = useNotifications({
    enablePolling,
    pollingInterval,
  });

  const refetchActivity = useCallback(() => {
    void refetchActivityLogs();
  }, [refetchActivityLogs]);

  return {
    stats,
    statsLoading,
    activityLogs,
    activityLoading,
    unreadCount,
    refetchStats,
    refetchActivityLogs: refetchActivity,
    markAsRead,
    markAllAsRead,
  };
};
