import api from './api';
import { ENDPOINTS } from './endpoints';
import type { ApiResponse, ViolationRecord } from '@/types';

class ViolationService {
  async create(payload: Partial<ViolationRecord> & { evidence_urls?: string[] }): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.post(ENDPOINTS.violationOps.base, payload);
    return res.data;
  }

  async getById(id: number): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.get(ENDPOINTS.violationOps.byId(id));
    return res.data;
  }

  async confirm(id: number): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.patch(ENDPOINTS.violationOps.confirm(id));
    return res.data;
  }

  async dispute(id: number, payload: { reason: string; evidence_urls?: string[] }): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.patch(ENDPOINTS.violationOps.dispute(id), payload);
    return res.data;
  }

  async resolveDispute(id: number, payload: { resolution: 'upheld' | 'overturned'; resolution_note?: string }): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.patch(ENDPOINTS.violationOps.resolveDispute(id), payload);
    return res.data;
  }

  async waive(id: number, waive_reason: string): Promise<ApiResponse<ViolationRecord>> {
    const res = await api.patch(ENDPOINTS.violationOps.waive(id), { waive_reason });
    return res.data;
  }
}

export default new ViolationService();
