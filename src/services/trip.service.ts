import api from './api';
import { ApiResponse, Trip, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';
import type { TripStatus } from '@/utils/tripStatus';

class TripService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    driver_id?: number;
    vehicle_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Trip>>> {
    const response = await api.get(ENDPOINTS.trips.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.get(ENDPOINTS.trips.byId(id));
    return response.data;
  }

  async create(data: Partial<Trip>): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.base, data);
    return response.data;
  }

  async update(id: number, data: Partial<Trip>): Promise<ApiResponse<Trip>> {
    const response = await api.put(ENDPOINTS.trips.byId(id), data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(ENDPOINTS.trips.byId(id));
    return response.data;
  }

  /** Gán tài xế + xe cho chuyến (pending → assigned). */
  async assign(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.assign(id));
    return response.data;
  }

  /** Tài xế xác nhận nhận chuyến (assigned → driver_accepted). */
  async accept(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.accept(id));
    return response.data;
  }

  /** Tài xế bắt đầu đến điểm đón (assigned/driver_accepted → en_route_pickup). */
  async start(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.start(id));
    return response.data;
  }

  /** Đón khách thành công (en_route_pickup → picked_up). */
  async pickup(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.pickup(id));
    return response.data;
  }

  /** Bắt đầu hành trình (picked_up → in_transit). */
  async transit(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.transit(id));
    return response.data;
  }

  /** Đến điểm đến (in_transit → arrived). */
  async arrive(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.arrive(id));
    return response.data;
  }

  /** Hoàn thành chuyến (arrived → completed). */
  async complete(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.complete(id));
    return response.data;
  }

  /** Hủy chuyến (bất kỳ trạng thái active → cancelled). */
  async cancel(id: number, reason: string): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.cancel(id), { reason });
    return response.data;
  }

  /** Báo trễ (bất kỳ trạng thái active → delayed). */
  async delay(id: number, reason?: string): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.delay(id), { reason });
    return response.data;
  }

  /** Báo khẩn cấp. */
  async emergency(id: number, reason: string): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.emergency(id), { reason });
    return response.data;
  }

  /** Tiếp tục sau trễ (delayed → in_transit). */
  async resume(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.post(ENDPOINTS.trips.resume(id));
    return response.data;
  }

  /** Dispatch action theo tên — dùng trong generic action handler. */
  async dispatchAction(
    id: number,
    action: string,
    payload?: { reason?: string },
  ): Promise<ApiResponse<Trip>> {
    switch (action) {
      case 'assign':    return this.assign(id);
      case 'accept':    return this.accept(id);
      case 'start':     return this.start(id);
      case 'pickup':    return this.pickup(id);
      case 'transit':   return this.transit(id);
      case 'arrive':    return this.arrive(id);
      case 'complete':  return this.complete(id);
      case 'cancel':    return this.cancel(id, payload?.reason ?? '');
      case 'delay':     return this.delay(id, payload?.reason);
      case 'emergency': return this.emergency(id, payload?.reason ?? '');
      case 'resume':    return this.resume(id);
      default:
        return this.update(id, { status: action as TripStatus });
    }
  }

  /** @deprecated Dùng dispatchAction thay thế */
  async updateStatus(id: number, status: 'in_progress' | 'completed' | 'cancelled'): Promise<ApiResponse<Trip>> {
    const response = await api.put(ENDPOINTS.trips.byId(id), { status });
    return response.data;
  }
}

export default new TripService();
