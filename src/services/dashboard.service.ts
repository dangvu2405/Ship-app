import api from './api';
import axios from 'axios';
import { ApiResponse } from '@/types';
import type { DashboardStats } from '@/types';
import { ENDPOINTS } from './endpoints';

function mapLegacyDashboardPayload(raw: Record<string, unknown>): DashboardStats {
  const companiesCount = Number(raw.companies_count ?? 0);
  const payrollsCount = Number(raw.payrolls_count ?? 0);
  const base: DashboardStats = {
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

  const revenueCandidates = [raw.revenue_total, raw.trips_revenue, raw.trip_revenue_total, raw.sales_total];
  for (const c of revenueCandidates) {
    const n = typeof c === 'number' ? c : Number(c);
    if (Number.isFinite(n)) {
      base.revenue = { total: n };
      break;
    }
  }
  if (!base.revenue && typeof raw.revenue === 'number') {
    base.revenue = { total: raw.revenue };
  } else if (!base.revenue && raw.revenue && typeof raw.revenue === 'object' && raw.revenue !== null) {
    const r = raw.revenue as Record<string, unknown>;
    const t = r.total ?? r.amount ?? r.value;
    const n = typeof t === 'number' ? t : Number(t);
    if (Number.isFinite(n)) base.revenue = { total: n };
  }

  return base;
}

class DashboardService {
  private overviewUnavailable = false;

  async getStats(month?: number, year?: number, companyId?: number): Promise<ApiResponse<DashboardStats>> {
    if (this.overviewUnavailable) {
      return {
        success: true,
        data: mapLegacyDashboardPayload({}),
      } as ApiResponse<DashboardStats>;
    }

    const m = month ?? new Date().getMonth() + 1;
    const y = year ?? new Date().getFullYear();
    try {
      const response = await api.get(ENDPOINTS.reports.dashboard, {
        params: {
          month: m,
          year: y,
          ...(companyId != null ? { company_id: companyId } : {}),
        },
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
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const status = error.response?.status;
        if (status === 403 || status === 404) {
          this.overviewUnavailable = true;
          return {
            success: true,
            data: mapLegacyDashboardPayload({}),
          } as ApiResponse<DashboardStats>;
        }
      }
      throw error;
    }
  }
}

export default new DashboardService();
