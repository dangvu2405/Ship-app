import api from './api';
import { ApiResponse, User, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

class UserService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<User>>> {
    const response = await api.get(ENDPOINTS.users.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<User>> {
    const response = await api.get(ENDPOINTS.users.byId(id));
    return response.data;
  }

  async create(data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.post(ENDPOINTS.users.base, data);
    return response.data;
  }

  async update(id: number, data: Partial<User>): Promise<ApiResponse<User>> {
    const response = await api.put(ENDPOINTS.users.byId(id), data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(ENDPOINTS.users.byId(id));
    return response.data;
  }
}

export default new UserService();
