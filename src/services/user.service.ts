import api from './api';
import { ApiResponse, User, PaginatedResponse } from '@/types';

class UserService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await api.get('/users', { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<User>> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async create(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.post('/users', data);
    return response.data;
  }

  async update(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
}

export default new UserService();
