import api from './api';
import { ENDPOINTS } from './endpoints';
import type { TripListParams, TripListResponse, TripMutationResponse, TripDetailResponse } from '@/types/api/trip';
import type { AssignTripRequest, StoreTripRequest, UpdateTripRequest } from '@/types/requests/trip';
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

  async assign(id: number, body?: AssignTripRequest): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.assign(id), body ?? {});
    return response.data;
  }

  async accept(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.accept(id));
    return response.data;
  }

  async start(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.start(id), {});
    return response.data;
  }

  async pickup(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.pickup(id));
    return response.data;
  }

  async transit(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.transit(id));
    return response.data;
  }

  async arrive(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.arrive(id));
    return response.data;
  }

  async deliver(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.deliver(id), {});
    return response.data;
  }

  async complete(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.complete(id), {});
    return response.data;
  }

  async cancel(id: number, cancellationReason: string): Promise<TripMutationResponse> {
    const payload = { reason: cancellationReason };
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.cancel(id), payload);
    return response.data;
  }

  async delay(id: number, reason?: string): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.delay(id), { reason });
    return response.data;
  }

  async emergency(id: number, reason: string): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.emergency(id), { reason });
    return response.data;
  }

  async resume(id: number): Promise<TripMutationResponse> {
    const response = await api.post<TripMutationResponse>(ENDPOINTS.trips.resume(id));
    return response.data;
  }

  async dispatchAction(
    id: number,
    action: string,
    payload?: { reason?: string },
  ): Promise<TripMutationResponse> {
    switch (action) {
      case 'assign':
        return this.assign(id, payload as AssignTripRequest | undefined);
      case 'accept':
        return this.accept(id);
      case 'start':
        return this.start(id);
      case 'pickup':
        return this.pickup(id);
      case 'transit':
        return this.transit(id);
      case 'arrive':
        return this.arrive(id);
      case 'deliver':
        return this.deliver(id);
      case 'complete':
        return this.complete(id);
      case 'cancel':
        return this.cancel(id, payload?.reason ?? '');
      case 'delay':
        return this.delay(id, payload?.reason);
      case 'emergency':
        return this.emergency(id, payload?.reason ?? '');
      case 'resume':
        return this.resume(id);
      default:
        return this.update(id, { status: action as TripStatus });
    }
  }

  async updateStatus(id: number, status: 'in_progress' | 'completed' | 'cancelled'): Promise<TripMutationResponse> {
    const response = await api.put<TripMutationResponse>(ENDPOINTS.trips.byId(id), { status });
    return response.data;
  }

  async priceLookup(payload: {
    customer_id?: number;
    route_template_id?: number;
    vehicle_id?: number;
    vehicle_type_id?: number;
    distance_km?: number;
    cargo_type_id?: number;
    cargo_weight_ton?: number;
  }) {
    try {
      const response = await api.post(ENDPOINTS.priceLookup, payload, {
        skipErrorToast: true,
      } as Parameters<typeof api.post>[2]);
      return response.data as { success: boolean; data?: { base_price?: number; suggested_price?: number; price?: number } };
    } catch {
      return { success: false } as { success: boolean; data?: { base_price?: number; suggested_price?: number; price?: number } };
    }
  }
}

export default new TripService();
