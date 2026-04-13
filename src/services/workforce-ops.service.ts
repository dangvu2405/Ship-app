import api from './api';
import { ENDPOINTS } from './endpoints';
import { unwrapEnvelope } from './http';
import type { ApiListPayload } from './http/types';
import type {
  ApiResponse,
  DriverSchedule,
  LeaveRequest,
  OvertimeRequest,
  ViolationRecord,
  WorkforceAttendanceRecord,
} from '@/types';

type ListResult<T> = { data: T[]; total: number };

const getListData = <T>(body: unknown): ListResult<T> => {
  const payload = unwrapEnvelope<ApiListPayload<T>>(body);
  if (!payload || !Array.isArray(payload.data)) {
    throw new Error('Invalid API list payload.');
  }
  return { data: payload.data, total: payload.meta?.total ?? payload.data.length };
};

class WorkforceOpsService {
  async createDriverSchedule(payload: Partial<DriverSchedule>): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.base, payload);
    return response.data;
  }

  async updateDriverSchedule(id: number, payload: Partial<DriverSchedule>): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.patch(ENDPOINTS.driverSchedules.byId(id), payload);
    return response.data;
  }

  async deleteDriverSchedule(id: number): Promise<ApiResponse<null>> {
    const response = await api.delete(ENDPOINTS.driverSchedules.byId(id));
    return response.data;
  }

  async listDriverSchedules(params: Record<string, unknown> = {}): Promise<ListResult<DriverSchedule>> {
    const response = await api.get(ENDPOINTS.driverSchedules.base, { params });
    return getListData<DriverSchedule>(response.data);
  }

  async submitDriverSchedule(id: number): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.submit(id));
    return response.data;
  }

  async approveDriverSchedule(id: number): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.approve(id));
    return response.data;
  }

  async rejectDriverSchedule(id: number): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.reject(id));
    return response.data;
  }

  async lockDriverSchedule(id: number): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.lock(id));
    return response.data;
  }

  async overrideDriverSchedule(id: number, override_reason: string): Promise<ApiResponse<DriverSchedule>> {
    const response = await api.post(ENDPOINTS.driverSchedules.override(id), { override_reason });
    return response.data;
  }

  async checkDriverScheduleHos(
    id: number,
  ): Promise<ApiResponse<{ allowed: boolean; reason?: string; driving_hours_today?: number }>> {
    const response = await api.get(ENDPOINTS.driverSchedules.hosCheck(id));
    return response.data;
  }

  async listAttendance(params: Record<string, unknown> = {}): Promise<ListResult<WorkforceAttendanceRecord>> {
    const response = await api.get(ENDPOINTS.attendanceOps.list, { params });
    return getListData<WorkforceAttendanceRecord>(response.data);
  }

  async checkIn(payload: { driver_id: number; check_in_time: string }): Promise<ApiResponse<WorkforceAttendanceRecord>> {
    const response = await api.post(ENDPOINTS.attendanceOps.checkIn, payload);
    return response.data;
  }

  async checkOut(payload: { driver_id: number; check_out_time: string }): Promise<ApiResponse<WorkforceAttendanceRecord>> {
    const response = await api.post(ENDPOINTS.attendanceOps.checkOut, payload);
    return response.data;
  }

  async adjustAttendance(
    id: number,
    payload: { reason: string; check_in?: string; check_out?: string; status?: string },
  ): Promise<ApiResponse<WorkforceAttendanceRecord>> {
    const response = await api.patch(ENDPOINTS.attendanceOps.adjust(id), payload);
    return response.data;
  }

  async listLeave(params: Record<string, unknown> = {}): Promise<ListResult<LeaveRequest>> {
    const response = await api.get(ENDPOINTS.leaveOps.base, { params });
    return getListData<LeaveRequest>(response.data);
  }

  async listLeaveTypes(): Promise<ApiResponse<Array<{ id: number; name: string; code?: string }>>> {
    const response = await api.get(ENDPOINTS.leaveOps.types);
    return response.data;
  }

  async createLeave(payload: Partial<LeaveRequest> & { attachment_urls?: string[] }): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.post(ENDPOINTS.leaveOps.base, payload);
    return response.data;
  }

  async getLeaveById(id: number): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.get(ENDPOINTS.leaveOps.byId(id));
    return response.data;
  }

  async approveLeave(id: number): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.post(ENDPOINTS.leaveOps.approve(id));
    return response.data;
  }

  async rejectLeave(id: number, rejection_reason: string): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.post(ENDPOINTS.leaveOps.reject(id), { rejection_reason });
    return response.data;
  }

  async cancelLeave(id: number): Promise<ApiResponse<LeaveRequest>> {
    const response = await api.post(ENDPOINTS.leaveOps.cancel(id));
    return response.data;
  }

  async listOvertime(params: Record<string, unknown> = {}): Promise<ListResult<OvertimeRequest>> {
    const response = await api.get(ENDPOINTS.overtimeOps.base, { params });
    return getListData<OvertimeRequest>(response.data);
  }

  async createOvertime(payload: Partial<OvertimeRequest>): Promise<ApiResponse<OvertimeRequest>> {
    const response = await api.post(ENDPOINTS.overtimeOps.base, payload);
    return response.data;
  }

  async getOvertimeById(id: number): Promise<ApiResponse<OvertimeRequest>> {
    const response = await api.get(ENDPOINTS.overtimeOps.byId(id));
    return response.data;
  }

  async approveOvertime(id: number): Promise<ApiResponse<OvertimeRequest>> {
    const response = await api.post(ENDPOINTS.overtimeOps.approve(id));
    return response.data;
  }

  async rejectOvertime(id: number, rejection_reason: string): Promise<ApiResponse<OvertimeRequest>> {
    const response = await api.post(ENDPOINTS.overtimeOps.reject(id), { rejection_reason });
    return response.data;
  }

  async listViolations(params: Record<string, unknown> = {}): Promise<ListResult<ViolationRecord>> {
    const response = await api.get(ENDPOINTS.violationOps.base, { params });
    return getListData<ViolationRecord>(response.data);
  }

  async createViolation(payload: Partial<ViolationRecord> & { evidence_urls?: string[] }): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.post(ENDPOINTS.violationOps.base, payload);
    return response.data;
  }

  async getViolationById(id: number): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.get(ENDPOINTS.violationOps.byId(id));
    return response.data;
  }

  async confirmViolation(id: number): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.post(ENDPOINTS.violationOps.confirm(id));
    return response.data;
  }

  async disputeViolation(id: number, payload: { reason: string; evidence_urls?: string[] }): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.post(ENDPOINTS.violationOps.dispute(id), payload);
    return response.data;
  }

  async resolveViolationDispute(
    id: number,
    payload: { resolution: 'upheld' | 'overturned'; resolution_note?: string },
  ): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.post(ENDPOINTS.violationOps.resolveDispute(id), payload);
    return response.data;
  }

  async waiveViolation(id: number, waive_reason: string): Promise<ApiResponse<ViolationRecord>> {
    const response = await api.post(ENDPOINTS.violationOps.waive(id), { waive_reason });
    return response.data;
  }
}

export default new WorkforceOpsService();
