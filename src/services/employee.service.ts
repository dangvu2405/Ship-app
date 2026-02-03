import api from './api';
import { ApiResponse, Employee, PaginatedResponse } from '@/types';

class EmployeeService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    search?: string;
    type?: string;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Employee>>> {
    const response = await api.get('/employees', { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Employee>> {
    const response = await api.get(`/employees/${id}`);
    return response.data;
  }

  async create(data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const response = await api.post('/employees', data);
    return response.data;
  }

  async update(id: number, data: Partial<Employee>): Promise<ApiResponse<Employee>> {
    const response = await api.put(`/employees/${id}`, data);
    return response.data;
  }

  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await api.delete(`/employees/${id}`);
    return response.data;
  }
}

export default new EmployeeService();
