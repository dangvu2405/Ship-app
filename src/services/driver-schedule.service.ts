import api from './api';
import { ENDPOINTS } from './endpoints';
import { unwrapEnvelope } from './http';
import type { ApiListPayload } from './http/types';
import type { AbsenceRecord, ApiResponse, DriverSchedule, LeaveRequest, PublicHoliday } from '@/types';

type ListResult<T> = { data: T[]; total: number };

const NAGER_BASE = 'https://date.nager.at/api/v3/PublicHolidays';

interface NagerRow {
  date: string;
  localName: string;
  name: string;
  countryCode: string;
  types?: string[];
  counties?: string[] | null;
}

function stableId(date: string, index: number): number {
  let h = 0;
  for (let i = 0; i < date.length; i += 1) h = (Math.imul(31, h) + date.charCodeAt(i)) | 0;
  return (Math.abs(h) * 10007 + index) % 2_000_000_000 + 1;
}

function mapNagerRows(rows: NagerRow[]): PublicHoliday[] {
  return rows.map((row, index) => {
    const types = row.types ?? [];
    const hasCounties = Array.isArray(row.counties) && row.counties.length > 0;
    const holiday_type: PublicHoliday['holiday_type'] = hasCounties
      ? 'regional'
      : types.includes('Bank') || types.includes('School')
        ? 'compensatory'
        : 'national';
    const dateKey = String(row.date).slice(0, 10);
    return { id: stableId(dateKey, index), date: dateKey, name: (row.localName?.trim()) || row.name, holiday_type };
  });
}

const getListCompat = <T>(body: unknown): ListResult<T> => {
  try {
    const payload = unwrapEnvelope<ApiListPayload<T>>(body);
    if (!payload || !Array.isArray(payload.data)) throw new Error();
    return { data: payload.data, total: payload.meta?.total ?? payload.data.length };
  } catch {
    const direct = body as { data?: T[]; meta?: { total?: number } } | undefined;
    const rows = Array.isArray(direct?.data) ? direct.data : [];
    return { data: rows, total: direct?.meta?.total ?? rows.length };
  }
};

class DriverScheduleService {
  async create(payload: Partial<DriverSchedule>): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.post(ENDPOINTS.driverSchedules.base, payload);
    return res.data;
  }

  async update(id: number, payload: Partial<DriverSchedule>): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.patch(ENDPOINTS.driverSchedules.byId(id), payload);
    return res.data;
  }

  async remove(id: number): Promise<ApiResponse<null>> {
    const res = await api.delete(ENDPOINTS.driverSchedules.byId(id));
    return res.data;
  }

  async list(params: Record<string, unknown> = {}): Promise<ListResult<DriverSchedule>> {
    try {
      const res = await api.get(ENDPOINTS.workSchedules.base, {
        params,
        skipErrorToast: true,
      } as Parameters<typeof api.get>[1]);
      return getListCompat<DriverSchedule>(res.data);
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) throw err;
      const fallback = await api.get(ENDPOINTS.workforce.driverSchedules, { params });
      return getListCompat<DriverSchedule>(fallback.data);
    }
  }

  async generate(payload: {
    driver_ids?: number[];
    office_id?: number;
    from: string;
    to: string;
    template_id?: number;
    shift_code?: string;
    skip_weekends?: boolean;
  }): Promise<ApiResponse<{ created?: number; skipped?: number }>> {
    try {
      const res = await api.post(ENDPOINTS.workSchedules.generate, payload, {
        skipErrorToast: true,
      } as Parameters<typeof api.post>[2]);
      return res.data;
    } catch (err) {
      const status = (err as { response?: { status?: number } })?.response?.status;
      if (status !== 404) throw err;
      return { success: false, message: 'Endpoint chưa sẵn sàng', data: {} } as ApiResponse<{ created?: number; skipped?: number }>;
    }
  }

  async submit(id: number): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.post(ENDPOINTS.driverSchedules.submit(id));
    return res.data;
  }

  async approve(id: number): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.put(ENDPOINTS.workforce.approveDriverSchedule(id));
    return res.data;
  }

  async reject(id: number): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.post(ENDPOINTS.driverSchedules.reject(id));
    return res.data;
  }

  async lock(id: number): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.put(ENDPOINTS.workforce.lockDriverSchedule(id));
    return res.data;
  }

  async override(id: number, override_reason: string): Promise<ApiResponse<DriverSchedule>> {
    const res = await api.post(ENDPOINTS.driverSchedules.override(id), { override_reason });
    return res.data;
  }

  async checkHos(id: number): Promise<ApiResponse<{ allowed: boolean; reason?: string; driving_hours_today?: number }>> {
    const res = await api.get(ENDPOINTS.driverSchedules.hosCheck(id));
    return res.data;
  }

  async listLeaveRequests(params: { driver_id?: number; from: string; to: string; status: 'approved'; per_page: number }): Promise<{ data: LeaveRequest[] }> {
    const res = await api.get(ENDPOINTS.workforce.leaveRequests, { params });
    const result = getListCompat<LeaveRequest>(res.data);
    return { data: result.data };
  }

  async listAbsences(params: { driver_id?: number; from: string; to: string; per_page: number }): Promise<{ data: AbsenceRecord[] }> {
    const res = await api.get(ENDPOINTS.workforce.absences, { params });
    const result = getListCompat<AbsenceRecord>(res.data);
    return { data: result.data };
  }

  async listPublicHolidays(params: { year: number; country_code?: string }): Promise<{ data: PublicHoliday[] }> {
    const country = (params.country_code ?? 'VN').toUpperCase();
    try {
      const res = await fetch(`${NAGER_BASE}/${params.year}/${country}`, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`Nager HTTP ${res.status}`);
      const rows = await res.json() as unknown;
      if (!Array.isArray(rows)) throw new Error('invalid JSON');
      return { data: mapNagerRows(rows as NagerRow[]) };
    } catch {
      const res = await api.get(ENDPOINTS.publicHolidays.list, { params });
      const body = res.data as { data?: PublicHoliday[] };
      return { data: Array.isArray(body?.data) ? body.data : [] };
    }
  }
}

export default new DriverScheduleService();
