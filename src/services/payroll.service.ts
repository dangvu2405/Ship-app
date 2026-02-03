import api from './api';
import { ApiResponse, Payroll, PayrollDetail, PaginatedResponse } from '@/types';

class PayrollService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    month?: number;
    year?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Payroll>>> {
    const response = await api.get('/payrolls', { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.get(`/payrolls/${id}`);
    return response.data;
  }

  async generate(companyId: number, month: number, year: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post('/payrolls', { company_id: companyId, month, year });
    return response.data;
  }

  async approve(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(`/payrolls/${id}/approve`);
    return response.data;
  }

  async lock(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(`/payrolls/${id}/lock`);
    return response.data;
  }

  async export(id: number): Promise<Blob> {
    const response = await api.get(`/payrolls/${id}/export`, {
      responseType: 'blob',
    });
    return response.data;
  }

  async getMySalary(month?: number, year?: number): Promise<ApiResponse<PayrollDetail[]>> {
    const response = await api.get('/payrolls/my-salary', { params: { month, year } });
    return response.data;
  }
}

export default new PayrollService();
