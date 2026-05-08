import api from './api';
import { ApiResponse, MySalaryPayload, Payroll, PaginatedResponse } from '@/types';
import { ENDPOINTS } from './endpoints';
import { downloadBlobFile, extractFilenameFromContentDisposition } from './api';
import { throwIfEnvelopeFailed, unwrapEnvelope } from './http';

function parsePayrollArrayBody(body: unknown): { list: Payroll[]; total: number } {
  throwIfEnvelopeFailed(body);
  const raw = unwrapEnvelope<unknown>(body);
  if (Array.isArray(raw)) {
    return { list: raw as Payroll[], total: (body as { meta?: { total?: number } }).meta?.total ?? raw.length };
  }
  if (raw && typeof raw === 'object' && Array.isArray((raw as { data: Payroll[] }).data)) {
    const box = raw as { data: Payroll[]; meta?: { total?: number }; total?: number };
    return {
      list: box.data,
      total: box.meta?.total ?? box.total ?? box.data.length,
    };
  }
  return { list: [], total: 0 };
}

class PayrollService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    company_id?: number;
    month?: number;
    year?: number;
    driver_id?: number;
    status?: string;
  }): Promise<ApiResponse<PaginatedResponse<Payroll>>> {
    try {
      const response = await api.get(ENDPOINTS.payrolls.base, { params });
      const { list, total } = parsePayrollArrayBody(response.data);
      return {
        success: true,
        message: (response.data as { message?: string }).message ?? 'OK',
        data: { data: list, total },
      };
    } catch {
      return {
        success: false,
        message: 'Failed to load payrolls',
        data: { data: [], total: 0 },
      };
    }
  }

  async getById(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.get(ENDPOINTS.payrolls.byId(id));
    const body = response.data;
    try {
      throwIfEnvelopeFailed(body);
      const data = unwrapEnvelope<Payroll>(body);
      return { success: true, message: 'OK', data };
    } catch {
      return { success: false, message: 'Failed to load payroll', data: undefined as never };
    }
  }

  async generatePayroll(input: {
    month: number;
    year: number;
    company_id?: number;
  }): Promise<ApiResponse<Payroll | null>> {
    const response = await api.post(ENDPOINTS.payrolls.generate, input);
    const body = response.data;
    throwIfEnvelopeFailed(body);
    const data = unwrapEnvelope<Payroll | null>(body);
    return {
      success: true,
      message: (body as { message?: string }).message ?? 'OK',
      data: data ?? null,
    };
  }

  /** @deprecated Prefer generatePayroll (POST /payrolls/generate). */
  async generate(companyId: number, month: number, year: number): Promise<ApiResponse<Payroll>> {
    const r = await this.generatePayroll({ company_id: companyId, month, year });
    if (!r.success) return r as ApiResponse<Payroll>;
    return { ...r, data: r.data as Payroll };
  }

  async approve(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.approve(id));
    return response.data as ApiResponse<Payroll>;
  }

  async lock(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.lock(id));
    return response.data as ApiResponse<Payroll>;
  }

  async markPaid(id: number): Promise<ApiResponse<Payroll>> {
    const response = await api.post(ENDPOINTS.payrolls.markPaid(id));
    return response.data as ApiResponse<Payroll>;
  }

  private async downloadBlob(url: string, fallbackName: string, params?: Record<string, unknown>): Promise<void> {
    const response = await api.get(url, { params, responseType: 'blob' });
    const blob = response.data as Blob;
    const contentDisposition = response.headers['content-disposition'] as string | undefined;
    const fileName = extractFilenameFromContentDisposition(contentDisposition) ?? fallbackName;
    downloadBlobFile(blob, fileName);
  }

  async downloadPayrollAggregateExport(params: {
    month: number;
    year: number;
    company_id?: number;
    driver_id?: number;
  }): Promise<void> {
    const fallback = `payroll-${params.year}-${String(params.month).padStart(2, '0')}.xlsx`;
    return this.downloadBlob(ENDPOINTS.payrolls.exportAggregate, fallback, params as Record<string, unknown>);
  }

  async downloadExport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.export(id), `payroll-${id}-export.csv`);
  }

  async downloadBhxhReport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportBhxh(id), `payroll-${id}-bhxh-D02TS.xlsx`);
  }

  async downloadPitReport(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportPit(id), `payroll-${id}-pit-05KKTNCN.xlsx`);
  }

  async downloadPayslips(id: number): Promise<void> {
    return this.downloadBlob(ENDPOINTS.payrolls.exportPayslips(id), `payroll-${id}-payslips.zip`);
  }

  async getMySalary(month?: number, year?: number): Promise<ApiResponse<MySalaryPayload>> {
    try {
      const response = await api.get(ENDPOINTS.payrolls.mySalary, { params: { month, year } });
      const body = response.data;
      throwIfEnvelopeFailed(body);
      const data = unwrapEnvelope<MySalaryPayload>(body);
      return { success: true, message: 'OK', data };
    } catch {
      return { success: false, message: 'Failed to load salary', data: undefined as never };
    }
  }
}

export default new PayrollService();
