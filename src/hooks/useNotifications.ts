import { useCallback, useMemo, useState } from 'react';
import type { ActivityLog } from '@/types';

/**
 * Activity / notification feed. Backend has no `/activity-logs` API yet — keep stable empty state
 * so the header bell UI works without failing requests.
 */
interface UseNotificationsReturn {
	activityLogs: ActivityLog[];
	activityLoading: boolean;
	unreadCount: number;
	refetchActivityLogs: () => Promise<void>;
	markAsRead: (id: number) => Promise<void>;
	markAllAsRead: () => Promise<void>;
}

export const useNotifications = (options?: {
	enablePolling?: boolean;
	pollingInterval?: number;
}): UseNotificationsReturn => {
	void options;
	const [activityLoading] = useState(false);
	const emptyLogs = useMemo<ActivityLog[]>(() => [], []);

	const refetchActivityLogs = useCallback(async () => {
		// No-op until activity-logs API exists
	}, []);

	const markAsRead = useCallback(async (id: number) => {
		void id;
	}, []);

	const markAllAsRead = useCallback(async () => {
		// No-op
	}, []);

	return {
		activityLogs: emptyLogs,
		activityLoading,
		unreadCount: 0,
		refetchActivityLogs,
		markAsRead,
		markAllAsRead,
	};
};
