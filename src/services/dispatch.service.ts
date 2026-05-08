import api from './api';
import { ENDPOINTS } from './endpoints';
import type { DispatchBoardResponse, UnassignedTripsResponse } from '@/types/api/dispatch';
import type { ApiResponse } from '@/types';

export interface DispatchDailySummary {
  date: string;
  total_trips?: number;
  pending?: number;
  in_progress?: number;
  completed?: number;
  cancelled?: number;
  unassigned?: number;
  total_drivers?: number;
  busy_drivers?: number;
  available_drivers?: number;
  total_vehicles?: number;
  busy_vehicles?: number;
  available_vehicles?: number;
  maintenance_vehicles?: number;
  on_leave_drivers?: number;
}

const dispatchService = {
  async getBoard(date?: string) {
    const res = await api.get<DispatchBoardResponse>(ENDPOINTS.dispatch.board, {
      params: date ? { date } : undefined,
    });
    return res.data;
  },

  async getUnassigned(date?: string, params?: { vehicle_type?: string; priority?: string }) {
    try {
      const res = await api.get<UnassignedTripsResponse>(ENDPOINTS.dispatch.unassignedTrips, {
        params: { ...(date ? { date } : {}), ...(params ?? {}) },
        skipErrorToast: true,
      } as Parameters<typeof api.get>[1]);
      return res.data;
    } catch {
      return { success: false, data: [] } as UnassignedTripsResponse;
    }
  },

  async getDailySummary(date?: string): Promise<ApiResponse<DispatchDailySummary>> {
    try {
      const res = await api.get<ApiResponse<DispatchDailySummary>>(ENDPOINTS.dispatch.dailySummary, {
        params: date ? { date } : undefined,
        skipErrorToast: true,
      } as Parameters<typeof api.get>[1]);
      return res.data;
    } catch {
      return { success: false, data: { date: date ?? '' } as DispatchDailySummary } as ApiResponse<DispatchDailySummary>;
    }
  },
};

export default dispatchService;
