import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, LeaveRequest } from '@/types';

export interface LeaveType {
  id: number;
  code?: string;
  name: string;
  is_paid?: boolean;
}

class LeaveService {
  async listTypes(): Promise<ApiResponse<LeaveType[]>> {
    const res = await api.get(ENDPOINTS.leaveOps.types);
    return res.data;
  }

  async getBalance(driverId: number, leaveTypeId: number): Promise<ApiResponse<{ total: number; used: number; pending: number; available: number }>> {
    const res = await api.get(ENDPOINTS.leaveOps.balance, { params: { driver_id: driverId, leave_type_id: leaveTypeId } });
    return res.data;
  }

  async create(payload: Partial<LeaveRequest> & { attachment_urls?: string[] }): Promise<ApiResponse<LeaveRequest>> {
    const res = await api.post(ENDPOINTS.leaveOps.base, payload);
    return res.data;
  }

  async getById(id: number): Promise<ApiResponse<LeaveRequest>> {
    const res = await api.get(ENDPOINTS.leaveOps.byId(id));
    return res.data;
  }

  async approve(id: number): Promise<ApiResponse<LeaveRequest>> {
    const res = await api.patch(ENDPOINTS.leaveOps.approve(id));
    return res.data;
  }

  async reject(id: number, rejection_reason: string): Promise<ApiResponse<LeaveRequest>> {
    const res = await api.patch(ENDPOINTS.leaveOps.reject(id), { rejection_reason });
    return res.data;
  }

  async cancel(id: number): Promise<ApiResponse<LeaveRequest>> {
    const res = await api.patch(ENDPOINTS.leaveOps.cancel(id));
    return res.data;
  }
}

export default new LeaveService();
