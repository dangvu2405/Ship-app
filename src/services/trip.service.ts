import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types';
import type { TripListParams, TripListResponse, TripMutationResponse, TripDetailResponse } from '@/types/api/trip';
import type { CancelTripRequest, StoreTripRequest, UpdateTripRequest } from '@/types/requests/trip';
import type { TripStatus } from '@/utils/tripStatus';

class TripService {
  async getAll(params?: TripListParams): Promise<TripListResponse> {
    const response = await api.get<TripListResponse>(ENDPOINTS.trips.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<TripDetailResponse> {
    const response = await api.get<TripDetailResponse>(ENDPOINTS.trips.byId(id));
    return response.data;
  }

  async create(data: StoreTripRequest): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.base, data);
    return response.data;
  }

  async update(id: number, data: UpdateTripRequest): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), data);
    return response.data;
  }

  async delete(id: number) {
    const response = await api.delete(ENDPOINTS.trips.byId(id));
    return response.data;
  }

  /** Gán tài xế + xe cho chuyến (pending → assigned). */
  async assign(id: number, payload?: { driver_id: number; vehicle_id: number }): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.assign(id), payload);
    return response.data;
  }

  /** Tài xế xác nhận nhận chuyến (assigned → driver_accepted). */
  async accept(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.accept(id));
    return response.data;
  }

  /** Tài xế bắt đầu đến điểm đón (assigned/driver_accepted → en_route_pickup). */
  async start(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.start(id));
    return response.data;
  }

  /** Đón khách thành công (en_route_pickup → picked_up). */
  async pickup(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.pickup(id));
    return response.data;
  }

  /** Bắt đầu hành trình (picked_up → in_transit). */
  async transit(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.transit(id));
    return response.data;
  }

  /** Đến điểm đến (in_transit → arrived). */
  async arrive(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.arrive(id));
    return response.data;
  }

  /** Hoàn thành chuyến (arrived → completed). */
  async complete(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.complete(id));
    return response.data;
  }

  /** Hủy chuyến (bất kỳ trạng thái active → cancelled). */
  async cancel(id: number, reason: string): Promise<TripMutationResponse> {
    const payload: CancelTripRequest = { reason };
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.cancel(id), payload);
    return response.data;
  }

  /** Báo trễ (bất kỳ trạng thái active → delayed). */
  async delay(id: number, reason?: string): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.delay(id), { reason });
    return response.data;
  }

  /** Báo khẩn cấp. */
  async emergency(id: number, reason: string): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.emergency(id), { reason });
    return response.data;
  }

  /** Tiếp tục sau trễ (delayed → in_transit). */
  async resume(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.resume(id));
    return response.data;
  }

  async priceLookup(payload: {
    customer_id: number;
    route_template_id?: number | null;
    vehicle_id?: number | null;
    vehicle_type_id?: number | null;
    distance_km?: number;
    cargo_type_id?: number | null;
    cargo_weight_ton?: number | null;
  }): Promise<ApiResponse<{ base_price?: number; suggested_price?: number; price?: number }>> {
    const response = await api.post<ApiResponse<{ base_price?: number; suggested_price?: number; price?: number }>>(ENDPOINTS.priceLookup, payload);
    return response.data;
  }

  async shippingFeeLookup(payload: {
    origin: string;
    destination: string;
    origin_lat?: number | null;
    origin_lng?: number | null;
    destination_lat?: number | null;
    destination_lng?: number | null;
    vehicle_type_id?: number | null;
  }): Promise<ApiResponse<{ distance_km?: number; shipping_fee?: number }>> {
    const response = await api.post<ApiResponse<{ distance_km?: number; shipping_fee?: number }>>(ENDPOINTS.shippingFeeLookup, payload);
    return response.data;
  }

  /** Dispatch action theo tên — dùng trong generic action handler. */
  async dispatchAction(
    id: number,
    action: string,
    payload?: { reason?: string; driver_id?: number; vehicle_id?: number },
  ): Promise<TripMutationResponse> {
    switch (action) {
      case 'assign':    
        if (payload?.driver_id && payload?.vehicle_id) {
          return this.assign(id, { driver_id: payload.driver_id, vehicle_id: payload.vehicle_id });
        }
        // Fallback for cases where assign doesn't provide payload (should be caught by backend validation)
        return this.assign(id, undefined);
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
  async updateStatus(id: number, status: 'in_progress' | 'completed' | 'cancelled'): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status });
    return response.data;
  }
}

export default new TripService();
