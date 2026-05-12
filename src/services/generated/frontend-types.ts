/* Auto-generated API hook + DTO skeletons with Zod validation */

import api from '@/services/api';
import { useQuery, useMutation, QueryFunction, UseQueryOptions, UseMutationOptions } from '@tanstack/react-query';
import { z } from 'zod';

// ──────────────────────────────────────────────────────────────────────────────
// Generic typed response envelope
// ──────────────────────────────────────────────────────────────────────────────
export type ApiEnvelope<T> = { success: boolean; data?: T; message?: string; errors?: Record<string, string[]> };

// ──────────────────────────────────────────────────────────────────────────────
// Reports
// ──────────────────────────────────────────────────────────────────────────────
export type ReportType = 'dashboard' | 'revenue' | 'costs' | 'profit' | 'trips' | 'vehicles' | 'drivers' | 'debt' | 'maintenance' | 'export' | 'payroll-export';

export type DashboardReport = {
  type: 'dashboard';
  summary: {
    total_trips: number;
    total_vehicles: number;
    total_drivers: number;
    total_customers: number;
    pending_trips: number;
    in_progress_trips: number;
  };
  generated_at: string;
};

export type RevenueReport = {
  type: 'revenue';
  total_revenue: number;
  trips_count: number;
  average_revenue_per_trip: number;
  date_from?: string;
  date_to?: string;
};

export type TripsReport = {
  type: 'trips';
  total: number;
  completed: number;
  pending: number;
  in_progress: number;
  cancelled: number;
};

export const fetchReport = async (reportType: ReportType, params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<any>>(`/reports/${reportType}`, { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch report');
  }
  return resp.data.data;
};

export const useReport = (reportType: ReportType, params?: Record<string, unknown>, options?: UseQueryOptions<any>) => {
  return useQuery<any>({
    queryKey: ['reports', reportType, params],
    queryFn: () => fetchReport(reportType, params),
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Dispatch Board
// ──────────────────────────────────────────────────────────────────────────────
export type DispatchBoard = {
  active_trips: number;
  lanes: any[];
  meta: Record<string, any>;
};

export type UnassignedTrip = {
  id: number;
  code: string;
  customer_id: number;
  driver_id?: number;
  vehicle_id?: number;
  start_point: string;
  end_point: string;
  status: string;
};

export const fetchDispatchBoard = async () => {
  const resp = await api.get<ApiEnvelope<DispatchBoard>>('/dispatch/board');
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch dispatch board');
  }
  return resp.data.data;
};

export const useDispatchBoard = (options?: UseQueryOptions<DispatchBoard>) => {
  return useQuery<DispatchBoard>({
    queryKey: ['dispatch', 'board'],
    queryFn: fetchDispatchBoard,
    ...options,
  });
};

export const fetchUnassignedTrips = async () => {
  const resp = await api.get<ApiEnvelope<UnassignedTrip[]>>('/dispatch/unassigned-trips');
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch unassigned trips');
  }
  return resp.data.data || [];
};

export const useUnassignedTrips = (options?: UseQueryOptions<UnassignedTrip[]>) => {
  return useQuery<UnassignedTrip[]>({
    queryKey: ['dispatch', 'unassigned-trips'],
    queryFn: fetchUnassignedTrips,
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Payrolls
// ──────────────────────────────────────────────────────────────────────────────
export type Payroll = {
  id: number;
  company_id: number;
  month: number;
  year: number;
  status: 'draft' | 'approved' | 'locked' | 'paid';
  created_at: string;
  updated_at: string;
};

export const fetchPayrolls = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<Payroll[]>>('/payrolls', { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch payrolls');
  }
  return resp.data.data || [];
};

export const usePayrolls = (params?: Record<string, unknown>, options?: UseQueryOptions<Payroll[]>) => {
  return useQuery<Payroll[]>({
    queryKey: ['payrolls', params],
    queryFn: () => fetchPayrolls(params),
    ...options,
  });
};

export const useGeneratePayrolls = (options?: UseMutationOptions<any, unknown, Record<string, unknown>>) => {
  return useMutation<any, unknown, Record<string, unknown>>({
    mutationFn: async (data) => {
      const resp = await api.post<ApiEnvelope<any>>('/payrolls/generate', data);
      if (!resp.data.success) {
        throw new Error(resp.data.message || 'Failed to generate payrolls');
      }
      return resp.data.data;
    },
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Activity Logs
// ──────────────────────────────────────────────────────────────────────────────
export type ActivityLog = {
  id: number;
  causer_id?: number;
  causer_type?: string;
  description: string;
  subject_type?: string;
  subject_id?: number;
  properties?: Record<string, any>;
  created_at: string;
};

export const fetchActivityLogs = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<{ data: ActivityLog[]; pagination: any }>>('/activity-logs', { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch activity logs');
  }
  return resp.data.data;
};

export const useActivityLogs = (params?: Record<string, unknown>, options?: UseQueryOptions<any>) => {
  return useQuery<any>({
    queryKey: ['activity-logs', params],
    queryFn: () => fetchActivityLogs(params),
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Notifications
// ──────────────────────────────────────────────────────────────────────────────
export type Notification = {
  id: string;
  data: Record<string, any>;
  read_at?: string;
  created_at: string;
};

export const fetchNotifications = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<Notification[]>>('/notifications', { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch notifications');
  }
  return resp.data.data || [];
};

export const useNotifications = (params?: Record<string, unknown>, options?: UseQueryOptions<Notification[]>) => {
  return useQuery<Notification[]>({
    queryKey: ['notifications', params],
    queryFn: () => fetchNotifications(params),
    ...options,
  });
};

export const fetchUnreadNotificationCount = async () => {
  const resp = await api.get<ApiEnvelope<{ unread_count: number }>>('/notifications/unread-count');
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch unread count');
  }
  return resp.data.data?.unread_count || 0;
};

export const useUnreadNotificationCount = (options?: UseQueryOptions<number>) => {
  return useQuery<number>({
    queryKey: ['notifications', 'unread-count'],
    queryFn: fetchUnreadNotificationCount,
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Vehicles
// ──────────────────────────────────────────────────────────────────────────────
export type Vehicle = {
  id: number;
  code: string;
  company_id: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export const fetchVehicles = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<Vehicle[]>>('/vehicles', { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch vehicles');
  }
  return resp.data.data || [];
};

export const useVehicles = (params?: Record<string, unknown>, options?: UseQueryOptions<Vehicle[]>) => {
  return useQuery<Vehicle[]>({
    queryKey: ['vehicles', params],
    queryFn: () => fetchVehicles(params),
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Customers
// ──────────────────────────────────────────────────────────────────────────────
export type Customer = {
  id: number;
  name: string;
  company_id: number;
  status: string;
  created_at: string;
  updated_at: string;
};

export const fetchCustomers = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<Customer[]>>('/customers', { params });
  if (!resp.data.success) {
    throw new Error(resp.data.message || 'Failed to fetch customers');
  }
  return resp.data.data || [];
};

export const useCustomers = (params?: Record<string, unknown>, options?: UseQueryOptions<Customer[]>) => {
  return useQuery<Customer[]>({
    queryKey: ['customers', params],
    queryFn: () => fetchCustomers(params),
    ...options,
  });
};

// ──────────────────────────────────────────────────────────────────────────────
// Generic factory for simple GET list endpoints
// ──────────────────────────────────────────────────────────────────────────────
export const makeListHook = <T,>(
  path: string,
  queryKey: string,
  options?: UseQueryOptions<T[]>
) => {
  return (params?: Record<string, unknown>) =>
    useQuery<T[]>({
      queryKey: [queryKey, params],
      queryFn: async () => {
        const resp = await api.get<ApiEnvelope<T[]>>(path, { params });
        if (!resp.data.success) {
          throw new Error(resp.data.message || `Failed to fetch ${queryKey}`);
        }
        return resp.data.data || [];
      },
      ...options,
    });
};
