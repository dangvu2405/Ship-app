import api from './api';
import { ApiResponse } from '@/types';
import type { DashboardStats } from '@/types';

function mapLegacyDashboardPayload(raw: Record<string, unknown>): DashboardStats {
  const companiesCount = Number(raw.companies_count ?? 0);
  const payrollsCount = Number(raw.payrolls_count ?? 0);
  return {
    companies:
      raw.companies && typeof raw.companies === 'object'
        ? (raw.companies as DashboardStats['companies'])
        : { total: companiesCount, active: companiesCount },
    employees:
      raw.employees && typeof raw.employees === 'object'
        ? (raw.employees as DashboardStats['employees'])
        : { total: 0, active: 0 },
    vehicles:
      raw.vehicles && typeof raw.vehicles === 'object'
        ? (raw.vehicles as DashboardStats['vehicles'])
        : { total: 0, active: 0 },
    trips:
      raw.trips && typeof raw.trips === 'object'
        ? (raw.trips as DashboardStats['trips'])
        : { total: 0, pending: 0, completed: 0 },
    payrolls:
      raw.payrolls && typeof raw.payrolls === 'object'
        ? (raw.payrolls as DashboardStats['payrolls'])
        : { total: payrollsCount, pending: payrollsCount, completed: 0 },
  };
}

class DashboardService {
  async getStats(month?: number, year?: number): Promise<ApiResponse<DashboardStats>> {
    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    const response = await api.get('/reports/dashboard', {
      params: { month: m, year: y },
    });
    const body = response.data as ApiResponse<Record<string, unknown>>;
    if (body.success && body.data && typeof body.data === 'object') {
      return {
        success: true,
        message: body.message,
        data: mapLegacyDashboardPayload(body.data as Record<string, unknown>),
      };
    }
    return body as unknown as ApiResponse<DashboardStats>;
  }
}

export default new DashboardService();
