import api from './api';
import { ApiResponse, MySalaryPayload, Payroll, PaginatedResponse } from '@/types';
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

  async markPaid(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.markPaid(id));
    return response.data;
  }

  /** Download server-provided payroll export as blob/CSV. */
  async downloadExport(id: number): Promise<void> {
    const response = await api.get(ENDPOINTS.payrolls.export(id), { responseType: 'blob' });
    const blob = response.data as Blob;
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const matchedFileName = contentDisposition?.match(/filename\*?=(?:UTF-8''|")?([^";]+)/i)?.[1];
    const fileName = matchedFileName ? decodeURIComponent(matchedFileName.replace(/"/g, '')) : `payroll-${id}-export.csv`;
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async getMySalary(month?: number, year?: number): Promise<ApiResponse<MySalaryPayload>> {
    const response = await api.get(ENDPOINTS.payrolls.mySalary, { params: { month, year } });
    return response.data;
  }
}

export default new PayrollService();
