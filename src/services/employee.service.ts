import api from './api';
import { ApiResponse, Employee, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

class EmployeeService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    const response = await api.get(ENDPOINTS.employees.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Employee>> {
    const response = await api.get(ENDPOINTS.employees.byId(id));
    return response.data;
  }

  async create(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const response = await api.post(ENDPOINTS.employees.base, data);
    return response.data;
  }

  async update(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const response = await api.put(ENDPOINTS.employees.byId(id), data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(ENDPOINTS.employees.byId(id));
    return response.data;
  }
}

export default new EmployeeService();
