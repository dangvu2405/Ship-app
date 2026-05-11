import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';
import type { ApiResponse, ApplyOfficeScheduleResult, WorkScheduleTemplate } from '@/types';

export interface ApplyOfficeSchedulePayload {
  schedule_id: number;
  start_date: string;
  end_date: string;
  notes?: string;
  replace_drafts?: boolean;
}

class WorkScheduleService {
  async listTemplates(companyId: number): Promise<WorkScheduleTemplate[]> {
    const response = await api.get<ApiResponse<{ templates?: WorkScheduleTemplate[] }>>(
      ENDPOINTS.driverSchedules.base,
      { params: { company_id: companyId } },
    );
    const body = response.data;
    if (!body?.success || !body.data) return [];
    const templates = body.data.templates;
    return Array.isArray(templates) ? templates : [];
  }

  async applyToOffice(
    officeId: number,
    payload: ApplyOfficeSchedulePayload,
  ): Promise<ApiResponse<ApplyOfficeScheduleResult>> {
    const response = await api.patch<ApiResponse<ApplyOfficeScheduleResult>>(
      ENDPOINTS.offices.applySchedule(officeId),
      payload,
    );
    return response.data;
  }
}

export default new WorkScheduleService();
