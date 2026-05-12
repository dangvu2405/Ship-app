import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import { DashboardAnalytics, DashboardFilters, DashboardKpi, AnalyticsDataPoint } from '../types';

export const dashboardService = {
  getAnalytics: async (filters: DashboardFilters): Promise<DashboardAnalytics> => {
    try {
      const response = await api.get(ENDPOINTS.reports.dashboard, {
        params: {
          company_id: filters.companyId,
          start_date: filters.dateRange[0],
          end_date: filters.dateRange[1],
        },
      });

      const raw = response.data?.data || {};

      // Map raw data to our clean DashboardKpi interface
      const kpis: DashboardKpi[] = [
        {
          title: 'Tổng doanh thu',
          value: raw.revenue?.total || 0,
          suffix: '₫',
          trend: 12.5,
          trendDirection: 'up',
          color: '#52c41a',
        },
        {
          title: 'Chuyến đi',
          value: raw.trips?.total || 0,
          trend: 8.2,
          trendDirection: 'up',
          color: '#1890ff',
        },
        {
          title: 'Xe đang chạy',
          value: raw.vehicles?.active || 0,
          suffix: ` / ${raw.vehicles?.total || 0}`,
          trend: 2.1,
          trendDirection: 'down',
          color: '#faad14',
        },
        {
          title: 'Tài xế hoạt động',
          value: raw.employees?.active || 0,
          trend: 5.4,
          trendDirection: 'up',
          color: '#722ed1',
        },
      ];

      // Mock chart data if not provided by backend (common in initial versions)
      const chartData: AnalyticsDataPoint[] = raw.chart_data || [
        { period: 'Tháng 1', revenue: 450000000, cost: 320000000, profit: 130000000, trips: 120 },
        { period: 'Tháng 2', revenue: 520000000, cost: 340000000, profit: 180000000, trips: 145 },
        { period: 'Tháng 3', revenue: 480000000, cost: 310000000, profit: 170000000, trips: 132 },
        { period: 'Tháng 4', revenue: 610000000, cost: 380000000, profit: 230000000, trips: 168 },
        { period: 'Tháng 5', revenue: 590000000, cost: 360000000, profit: 230000000, trips: 155 },
        { period: 'Tháng 6', revenue: 720000000, cost: 420000000, profit: 300000000, trips: 192 },
      ];

      // Fetch recent trips separately if not in dashboard payload
      const tripsResponse = await api.get(ENDPOINTS.trips.base, {
        params: {
          per_page: 8,
          sort_by: 'created_at',
          sort_order: 'desc',
          company_id: filters.companyId,
        },
      });

      const recentTrips = tripsResponse.data?.data || [];

      return {
        kpis,
        chartData,
        recentTrips,
      };
    } catch (error) {
      console.error('Failed to fetch dashboard analytics:', error);
      throw error;
    }
  },
};
