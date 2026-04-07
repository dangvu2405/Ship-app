import api from './api';
import { ApiResponse, Vehicle, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

class VehicleService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    office_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Vehicle>>> {
    const response = await api.get(ENDPOINTS.vehicles.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Vehicle>> {
    const response = await api.get(ENDPOINTS.vehicles.byId(id));
    return response.data;
  }

  async create(data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const response = await api.post(ENDPOINTS.vehicles.base, data);
    return response.data;
  }

  async update(id: number, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const response = await api.put(ENDPOINTS.vehicles.byId(id), data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(ENDPOINTS.vehicles.byId(id));
    return response.data;
  }
}

export default new VehicleService();
