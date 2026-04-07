import api from './api';
import { ApiResponse, Payroll, PayrollDetail, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';

class PayrollService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    month?: number;
    year?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Payroll>>> {
    const response = await api.get(ENDPOINTS.payrolls.base, { params });
    return response.data;
  }

  async getById(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.get(ENDPOINTS.payrolls.byId(id));
    return response.data;
  }

  async generate(companyId: number, month: number, year: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.base, { company_id: companyId, month, year });
    return response.data;
  }

  async approve(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.approve(id));
    return response.data;
  }

  async lock(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.lock(id));
    return response.data;
  }

  /** Backend returns JSON payload (not file stream); trigger browser download of .json */
  async downloadExport(id: number): Promise<void> {
    const response = await api.get(ENDPOINTS.payrolls.export(id));
    const payload = response.data;
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `payroll-${id}-export.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getMySalary(month?: number, year?: number): Promise<ApiResponse<PayrollDetail[]>> {
    const response = await api.get(ENDPOINTS.payrolls.mySalary, { params: { month, year } });
    return response.data;
  }
}

export default new PayrollService();
