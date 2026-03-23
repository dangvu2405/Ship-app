import { useCallback, useEffect, useState } from 'react';
import dashboardService from '@/services/dashboard.service';
import type { DashboardStats } from '@/types';

interface UseDashboardStatsReturn {
	stats: DashboardStats | undefined;
	statsLoading: boolean;
	refetchStats: () => Promise<void>;
}

export const useDashboardStats = (options?: {
	enablePolling?: boolean;
	pollingInterval?: number;
}): UseDashboardStatsReturn => {
	const { enablePolling = true, pollingInterval = 60000 } = options || {};
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
			console.error('Failed to fetch dashboard stats', error);
		} finally {
			setStatsLoading(false);
		}
	}, []);

	useEffect(() => {
		void fetchStats();
	}, [fetchStats]);

	useEffect(() => {
		if (!enablePolling) {
			return undefined;
		}

		const intervalId = window.setInterval(() => {
			void fetchStats();
		}, pollingInterval);

		return () => {
			window.clearInterval(intervalId);
		};
	}, [enablePolling, pollingInterval, fetchStats]);

	return {
		stats,
		statsLoading,
		refetchStats: fetchStats,
	};
};
