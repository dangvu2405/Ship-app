import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse } from '@/types';
import type { TripListParams, TripListResponse, TripMutationResponse, TripDetailResponse } from '@/types/api/trip';
import type { AssignTripRequest, CancelTripRequest, StoreTripRequest, UpdateTripRequest } from '@/types/requests/trip';
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
  async assign(id: number, data: AssignTripRequest): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.assign(id), data);
    return response.data;
  }

  /** Không có PATCH riêng trên `api.php` — cập nhật qua PUT resource. */
  async accept(id: number): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status: 'driver_accepted' });
    return response.data;
  }

  /** Tài xế bắt đầu đến điểm đón (assigned/driver_accepted → en_route_pickup). */
  async start(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.start(id));
    return response.data;
  }

  /** Không có PATCH riêng — PUT status. */
  async pickup(id: number): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status: 'picked_up' });
    return response.data;
  }

  /** Không có PATCH riêng — PUT status. */
  async transit(id: number): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status: 'in_transit' });
    return response.data;
  }

  /** Theo trip id: PUT status. Điểm dừng: dùng `arriveStop(stopId)` → `PATCH /stops/:id/arrive`. */
  async arrive(id: number): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status: 'arrived' });
    return response.data;
  }

  async arriveStop(stopId: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.tripStops.arrive(stopId));
    return response.data;
  }

  async completeStop(stopId: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.tripStops.complete(stopId));
    return response.data;
  }

  /** PATCH `/trips/:id/deliver` — khớp workflow backend khi tách khỏi `arrive`. */
  async deliver(id: number): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.deliver(id));
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

  /** Không có PATCH delay — PUT status + lý do tùy backend. */
  async delay(id: number, reason?: string): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), {
      status: 'delayed',
      cancellation_reason: reason,
    });
    return response.data;
  }

  async emergency(id: number, reason: string): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), {
      status: 'emergency',
      cancellation_reason: reason,
    });
    return response.data;
  }

  async resume(id: number): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status: 'in_transit' });
    return response.data;
  }

  async changeVehicle(id: number, payload: { vehicle_id: number }): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.changeVehicle(id), payload);
    return response.data;
  }

  async changeDriver(id: number, payload: { driver_id: number }): Promise<TripMutationResponse> {
    const response = await api.patch<TripMutationResponse>(ENDPOINTS.trips.changeDriver(id), payload);
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
    payload?: { reason?: string; vehicle_id?: number; driver_id?: number },
  ): Promise<TripMutationResponse> {
    switch (action) {
      case 'assign':
        if (payload?.driver_id == null || payload?.vehicle_id == null) {
          throw new Error('assign requires driver_id and vehicle_id');
        }
        return this.assign(id, { driver_id: Number(payload.driver_id), vehicle_id: Number(payload.vehicle_id) });
      case 'accept':    return this.accept(id);
      case 'start':     return this.start(id);
      case 'pickup':    return this.pickup(id);
      case 'transit':   return this.transit(id);
      case 'arrive':    return this.arrive(id);
      case 'deliver':   return this.deliver(id);
      case 'complete':  return this.complete(id);
      case 'cancel':    return this.cancel(id, payload?.reason ?? '');
      case 'delay':     return this.delay(id, payload?.reason);
      case 'emergency': return this.emergency(id, payload?.reason ?? '');
      case 'resume':    return this.resume(id);
      default:
        if (action === 'change-vehicle' && payload && 'vehicle_id' in payload) {
          return this.changeVehicle(id, { vehicle_id: Number(payload.vehicle_id) });
        }
        if (action === 'change-driver' && payload && 'driver_id' in payload) {
          return this.changeDriver(id, { driver_id: Number(payload.driver_id) });
        }
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
