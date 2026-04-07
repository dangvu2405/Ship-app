import api from './api';
import { ApiResponse, Company, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

class CompanyService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Company>>> {
    const response = await api.get(ENDPOINTS.companies.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Company>> {
    const response = await api.get(ENDPOINTS.companies.byId(id));
    return response.data;
  }

  async create(data: Partial<Company>): Promise<ApiResponse<Company>> {
    const response = await api.post(ENDPOINTS.companies.base, data);
    return response.data;
  }

  async update(id: number, data: Partial<Company>): Promise<ApiResponse<Company>> {
    const response = await api.put(ENDPOINTS.companies.byId(id), data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(ENDPOINTS.companies.byId(id));
    return response.data;
  }
}

export default new CompanyService();
