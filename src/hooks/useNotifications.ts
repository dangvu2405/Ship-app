import { useCallback, useEffect, useState } from 'react';
import activityService from '@/services/activity.service';
import type { ActivityLog } from '@/types';

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
	const { enablePolling = true, pollingInterval = 30000 } = options || {};
	const [activityLogs, setActivityLogs] = useState<ActivityLog[]>([]);
	const [activityLoading, setActivityLoading] = useState(false);
	const [unreadCount, setUnreadCount] = useState(0);

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
			console.error('Failed to fetch activity logs', error);
		} finally {
			setActivityLoading(false);
		}
	}, []);

	const fetchUnreadCount = useCallback(async () => {
		try {
			const response = await activityService.getUnreadCount();
			if (response.success && response.data) {
				setUnreadCount(response.data.count);
			}
		} catch (error) {
			console.error('Failed to fetch unread notification count', error);
		}
	}, []);

	const refreshNotifications = useCallback(async () => {
		await Promise.all([fetchActivityLogs(), fetchUnreadCount()]);
	}, [fetchActivityLogs, fetchUnreadCount]);

	useEffect(() => {
		void refreshNotifications();
	}, [refreshNotifications]);

	useEffect(() => {
		if (!enablePolling) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			void refreshNotifications();
		}, pollingInterval);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [enablePolling, pollingInterval, refreshNotifications]);

	const markAsRead = useCallback(
		async (id: number) => {
			await activityService.markAsRead(id);
			let decremented = false;

			setActivityLogs((prev) =>
				prev.map((log) => {
					if (log.id !== id || log.read) {
						return log;
					}

					decremented = true;
					return { ...log, read: true };
				})
			);

			if (decremented) {
				setUnreadCount((prev) => Math.max(0, prev - 1));
			}

			void fetchUnreadCount();
		},
		[fetchUnreadCount]
	);

	const markAllAsRead = useCallback(async () => {
		await activityService.markAllAsRead();
		setActivityLogs((prev) => prev.map((log) => ({ ...log, read: true })));
		setUnreadCount(0);
	}, []);

	return {
		activityLogs,
		activityLoading,
		unreadCount,
		refetchActivityLogs: refreshNotifications,
		markAsRead,
		markAllAsRead,
	};
};
