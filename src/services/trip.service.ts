import api from './api';
import { ApiResponse, Trip, PaginatedResponse } from '@/types';

class TripService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
    driver_id?: number;
    vehicle_id?: number;
  }): Promise<ApiResponse<PaginatedResponse<Trip>>> {
    const response = await api.get('/trips', { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Trip>> {
    const response = await api.get(`/trips/${id}`);
    return response.data;
  }

  async create(data: Partial<Trip>): Promise<ApiResponse<Trip>> {
    const response = await api.post('/trips', data);
    return response.data;
  }

  async update(id: number, data: Partial<Trip>): Promise<ApiResponse<Trip>> {
    const response = await api.put(`/trips/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/trips/${id}`);
    return response.data;
  }
}

export default new TripService();
