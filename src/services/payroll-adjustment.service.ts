import api from './api';
import { ENDPOINTS } from './endpoints';
import { ApiResponse, PayrollAdjustment } from '@/types';

class PayrollAdjustmentService {
  async approve(id: number | string): Promise<ApiResponse<PayrollAdjustment>> {
    const response = await api.post(ENDPOINTS.payrollAdjustments.approve(id));
    return response.data;
  }

  async reject(id: number | string, reason: string): Promise<ApiResponse<PayrollAdjustment>> {
    const response = await api.post(ENDPOINTS.payrollAdjustments.reject(id), { rejection_reason: reason });
    return response.data;
  }
}

export default new PayrollAdjustmentService();
