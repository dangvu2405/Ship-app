/**
 * OvertimeService — Overtime request CRUD operations.
 * 
 * **Public API:** This service is directly imported by:
 * - dedicated overtime management components
 * - overtime request approval workflows
 * 
 * **Also wrapped by:** WorkforceOpsService (convenience facade for dashboard/orchestration)
 * 
 * **Import from:**
 * - `overtime.service` for overtime-focused components (recommended)
 * - `workforce-ops.service` for multi-resource orchestration (approveOvertime, rejectOvertime, etc.)
 * 
 * See: src/services/workforce-ops.service.ts for facade pattern explanation.
 */
import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, OvertimeRequest } from '@/types';

class OvertimeService {
  async create(payload: Partial<OvertimeRequest>): Promise<ApiResponse<OvertimeRequest>> {
    const res = await api.post(ENDPOINTS.overtimeOps.base, payload);
    return res.data;
  }

  async getById(id: number): Promise<ApiResponse<OvertimeRequest>> {
    const res = await api.get(ENDPOINTS.overtimeOps.byId(id));
    return res.data;
  }

  async approve(id: number): Promise<ApiResponse<OvertimeRequest>> {
    const res = await api.patch(ENDPOINTS.overtimeOps.approve(id));
    return res.data;
  }

  async reject(id: number, rejection_reason: string): Promise<ApiResponse<OvertimeRequest>> {
    const res = await api.patch(ENDPOINTS.overtimeOps.reject(id), { rejection_reason });
    return res.data;
  }
}

export default new OvertimeService();
