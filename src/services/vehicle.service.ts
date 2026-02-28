import api from './api';
import { ApiResponse, Vehicle, PaginatedResponse } from '@/types';

class VehicleService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    office_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Vehicle>>> {
    const response = await api.get('/vehicles', { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Vehicle>> {
    const response = await api.get(`/vehicles/${id}`);
    return response.data;
  }

  async create(data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const response = await api.post('/vehicles', data);
    return response.data;
  }

  async update(id: number, data: Partial<Vehicle>): Promise<ApiResponse<Vehicle>> {
    const response = await api.put(`/vehicles/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/vehicles/${id}`);
    return response.data;
  }
}

export default new VehicleService();
