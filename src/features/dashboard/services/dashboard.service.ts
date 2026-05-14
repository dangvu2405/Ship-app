import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { DashboardAnalytics, DashboardFilters, DashboardKpi, AnalyticsDataPoint } from '../types';

export const dashboardService = {
  getAnalytics: async (filters: DashboardFilters): Promise<DashboardAnalytics> => {
    try {
      const params: Record<string, unknown> = {
        start_date: filters.dateRange[0],
        end_date: filters.dateRange[1],
      };
      if (filters.companyId) params.company_id = filters.companyId;

      const response = await api.get(ENDPOINTS.reports.dashboard, { params });

      // API returns: { success, data: { type, summary: { total_trips, total_vehicles, ... }, generated_at } }
      const raw = response.data?.data || {};
      const summary = raw.summary || {};

      const kpis: DashboardKpi[] = [
        {
          title: 'Tổng chuyến đi',
          value: summary.total_trips ?? 0,
          trend: undefined,
          trendDirection: 'up',
          color: '#1890ff',
        },
        {
          title: 'Đang vận chuyển',
          value: summary.in_progress_trips ?? 0,
          trend: undefined,
          trendDirection: 'up',
          color: '#52c41a',
        },
        {
          title: 'Tổng xe',
          value: summary.total_vehicles ?? 0,
          trend: undefined,
          trendDirection: 'up',
          color: '#faad14',
        },
        {
          title: 'Tổng tài xế',
          value: summary.total_drivers ?? 0,
          trend: undefined,
          trendDirection: 'up',
          color: '#722ed1',
        },
      ];

      const chartData: AnalyticsDataPoint[] = raw.chart_data || [];

      // Fetch recent trips
      const tripsResponse = await api.get(ENDPOINTS.trips.base, {
        params: {
          per_page: 8,
          sort_by: 'created_at',
          sort_order: 'desc',
          ...(filters.companyId ? { company_id: filters.companyId } : {}),
        },
      });

      // Trips endpoint returns paginated resource: { data: [...], links, meta }
      const recentTrips = tripsResponse.data?.data ?? [];

      return { kpis, chartData, recentTrips };
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
      throw error;
    }
  },
};
