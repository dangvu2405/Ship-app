/* Auto-generated API hook + DTO skeletons for missing endpoints.
 * WARNING: These are lightweight stubs to be replaced by real models and hooks.
 * They use the project's `api` Axios instance and `@tanstack/react-query`.
 */

import api from '@/services/api';
import { useQuery, useMutation, QueryFunction } from '@tanstack/react-query';

// Generic typed response envelope
export type ApiEnvelope<T> = { success: boolean; data?: T; message?: string };

// Example: Activity Logs
export type ActivityLog = any; // TODO: replace `any` with actual DTO fields
export const fetchActivityLogs = async (params?: Record<string, unknown>) => {
  const resp = await api.get<ApiEnvelope<ActivityLog[]>>('/activity-logs', { params });
  return resp.data;
};
export const useActivityLogs = (params?: Record<string, unknown>) => {
  return useQuery(['activity-logs', params], () => fetchActivityLogs(params));
};

// Generic generator for simple GET list endpoints
const makeListHook = <T,>(path: string) => {
  const fetcher: QueryFunction<ApiEnvelope<T[]>> = async ({ queryKey }) => {
    const resp = await api.get<ApiEnvelope<T[]>>(path);
    return resp.data;
  };
  // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
  return (key = []) => useQuery<ApiEnvelope<T[]>>(key.length ? key : [path], fetcher as any);
};

export const useCustomers = makeListHook<any>('/customers');
export const useVehicleTypes = makeListHook<any>('/vehicle-types');
export const useTrips = makeListHook<any>('/trips');

// More hooks can be added here for other missing endpoints.
// TODO: generate mutations (create/update/delete) and strongly-typed DTOs from Laravel FormRequests/Resources.
