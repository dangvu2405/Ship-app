import api from './api';
import { ApiResponse, Trip, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

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
}

export default new TripService();
