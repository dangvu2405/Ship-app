import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, LateAttendanceNotification } from '@/types';

class AttendanceNotificationsService {
  async listLateAttendances(date: string): Promise<ApiResponse<LateAttendanceNotification[]>> {
    const response = await api.get(ENDPOINTS.attendanceLate.list, {
      params: { date },
    });
    return response.data;
  }

  async notifyLateAttendances(date?: string): Promise<ApiResponse<unknown>> {
    const response = await api.post(ENDPOINTS.attendanceLate.notify, date ? { date } : {});
    return response.data;
  }
}

export default new AttendanceNotificationsService();