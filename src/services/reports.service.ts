import api from './api';
import { ApiResponse } from '@/types';
import type { Payroll } from '@/types';
import { ENDPOINTS } from './endpoints';
import payrollService from './payroll.service';
import dashboardService from './dashboard.service';

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

function sumPayrollNet(details: Payroll['details']): number {
  return (details ?? []).reduce((total, detail) => total + Number(detail.net_salary ?? 0), 0);
}

export interface ReportFilter {
  date_from?: string;
  date_to?: string;
  month?: number;
  year?: number;
  company_id?: number;
  customer_id?: number;
  payment_status?: string;
  cost_category_id?: number;
  status?: string;
}

class ReportsService {
  async getDashboard(month?: number, year?: number): Promise<ApiResponse<Record<string, unknown>>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get(ENDPOINTS.reports.dashboard, { params: { month: m, year: y } });
    return response.data;
  }

  async getRevenue(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.revenue, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getCosts(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.costs, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getTrips(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.trips, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getProfit(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.profit, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getVehicles(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.vehicles, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getDrivers(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.drivers, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getMaintenance(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.maintenance, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async getDebt(filter: ReportFilter = {}): Promise<ApiResponse<unknown>> {
    const response = await api.get(ENDPOINTS.reports.debt, {
      params: filter,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async export(payload: {
    type: 'trips' | 'revenue' | 'costs' | 'profit' | 'vehicles' | 'drivers' | 'maintenance' | 'debt';
    format?: 'csv' | 'xlsx';
    filter?: ReportFilter;
  }): Promise<ApiResponse<{ url?: string; file?: string }>> {
    const response = await api.post(ENDPOINTS.reports.export, payload, {
      skipErrorToast: true,
    } as Parameters<typeof api.post>[2]);
    return response.data;
  }

  async getPayrollSummary(
    companyId: number,
    month?: number,
    year?: number
  ): Promise<ApiResponse<PayrollSummaryData | null>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await payrollService.getAll({
      page: 1,
      per_page: 25,
      company_id: companyId,
      month: m,
      year: y,
    });

    if (!response.success || !response.data) {
      return response as unknown as ApiResponse<PayrollSummaryData | null>;
    }

    const payroll =
      response.data.data.find((item) => item.company_id === companyId && item.month === m && item.year === y) ??
      response.data.data[0] ??
      null;

    if (!payroll) {
      return { success: true, message: response.message, data: null };
    }

    let detailedPayroll = payroll;
    if (!detailedPayroll.details || detailedPayroll.details.length === 0) {
      const detailResponse = await payrollService.getById(detailedPayroll.id);
      if (detailResponse.success && detailResponse.data) {
        detailedPayroll = detailResponse.data;
      }
    }

    const details = detailedPayroll.details ?? [];
    return {
      success: true,
      message: response.message,
      data: {
        payroll: detailedPayroll,
        total_net: sumPayrollNet(details),
        employees_count: details.length,
      },
    };
  }

  async getRevenueSummary(
    companyId?: number,
    month?: number,
    year?: number,
  ): Promise<ApiResponse<RevenueSummaryData | null>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await dashboardService.getStats(m, y, companyId);
    if (!response.success || !response.data) {
      return { success: false, message: response.message, data: null };
    }

    return {
      success: true,
      message: response.message,
      data: {
        total_revenue: response.data.revenue?.total ?? 0,
        trips_completed: response.data.trips.completed ?? 0,
        total: response.data.revenue?.total ?? 0,
        completed: response.data.trips.completed ?? 0,
      },
    };
  }
}

export default new ReportsService();
