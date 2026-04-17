import api from './api';
import { ApiResponse } from '@/types';
import type { Payroll } from '@/types';
import { ENDPOINTS } from './endpoints';

export interface PayrollSummaryData {
  payroll: Payroll;
  total_net: number;
  employees_count: number;
}

export interface RevenueSummaryData {
  total_revenue?: number;
  trips_completed?: number;
  total?: number;
  completed?: number;
}

class ReportsService {
  async getDashboard(month?: number, year?: number): Promise<ApiResponse<Record<string, unknown>>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get(ENDPOINTS.reports.dashboard, { params: { month: m, year: y } });
    return response.data;
  }

  async getPayrollSummary(
    companyId: number,
    month?: number,
    year?: number
  ): Promise<ApiResponse<PayrollSummaryData | null>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get(ENDPOINTS.reports.payrollSummary, {
      params: { company_id: companyId, month: m, year: y },
    });
    return response.data;
  }

  async getRevenueSummary(
    companyId?: number,
    month?: number,
    year?: number,
  ): Promise<ApiResponse<RevenueSummaryData | null>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get(ENDPOINTS.reports.revenueSummary, {
      params: {
        ...(companyId != null ? { company_id: companyId } : {}),
        month: m,
        year: y,
      },
    });
    return response.data;
  }
}

export default new ReportsService();
