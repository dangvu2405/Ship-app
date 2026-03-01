import api from './api';
import { ApiResponse } from '@/types';
import type { DashboardStats } from '@/types';

class DashboardService {
  async getStats(): Promise<ApiResponse<DashboardStats>> {
    const response = await api.get('/dashboard/stats');
    return response.data;
  }
}

export default new DashboardService();
