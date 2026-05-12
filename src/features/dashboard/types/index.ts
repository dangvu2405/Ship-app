import { Trip } from '@/types';

export interface DashboardKpi {
  title: string;
  value: number | string;
  suffix?: string;
  trend?: number; // percentage change
  trendDirection?: 'up' | 'down' | 'neutral';
  color?: string;
  icon?: string;
  loading?: boolean;
}

export interface AnalyticsDataPoint {
  period: string;
  revenue: number;
  cost: number;
  profit: number;
  trips: number;
}

export interface DashboardAnalytics {
  kpis: DashboardKpi[];
  chartData: AnalyticsDataPoint[];
  recentTrips: Trip[];
}

export interface DashboardFilters {
  companyId?: number;
  dateRange: [string, string]; // ISO strings
}
