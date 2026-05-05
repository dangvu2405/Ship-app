import api from './api';
import { ApiResponse, MySalaryPayload, Payroll, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';
import { downloadBlobFile, extractFilenameFromContentDisposition } from './api';

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

  /** Download server blob — dùng nội bộ cho các loại export. */
  private async downloadBlob(url: string, fallbackName: string): Promise<void> {
    const response = await api.get(url, { responseType: 'blob' });
    const blob = response.data as Blob;
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const fileName = extractFilenameFromContentDisposition(contentDisposition) ?? fallbackName;
    downloadBlobFile(blob, fileName);
  }

  /** Xuất bảng lương tổng hợp (CSV/xlsx). */
  async downloadExport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.export(id), `payroll-${id}-export.csv`);
  }

  /** Xuất khai báo BHXH D02-TS (xlsx). */
  async downloadBhxhReport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportBhxh(id), `payroll-${id}-bhxh-D02TS.xlsx`);
  }

  /** Xuất tờ khai thuế TNCN 05/KK-TNCN (xlsx). */
  async downloadPitReport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportPit(id), `payroll-${id}-pit-05KKTNCN.xlsx`);
  }

  /** Xuất phiếu lương (PDF zip). */
  async downloadPayslips(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportPayslips(id), `payroll-${id}-payslips.zip`);
  }

  async getMySalary(month?: number, year?: number): Promise<ApiResponse<MySalaryPayload>> {
    const response = await api.get(ENDPOINTS.payrolls.mySalary, { params: { month, year } });
    return response.data;
  }
}

export default new PayrollService();
