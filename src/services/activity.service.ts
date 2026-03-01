import api from './api';
import { ApiResponse, PaginatedResponse } from '@/types';
import type { ActivityLog } from '@/types';

class ActivityService {
  async getAll(params?: {
    page?: number;
    per_page?: number;
    type?: 'create' | 'update' | 'delete' | 'system' | 'user';
    resource?: string;
    unread_only?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> {
    const response = await api.get('/activity-logs', { params });
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<{ count: number }>> {
    const response = await api.get('/activity-logs/unread-count');
    return response.data;
  }

  async markAsRead(id: number): Promise<ApiResponse<void>> {
    const response = await api.patch(`/activity-logs/${id}/read`);
    return response.data;
  }

  async markAllAsRead(): Promise<ApiResponse<void>> {
    const response = await api.patch('/activity-logs/read-all');
    return response.data;
  }
}

export default new ActivityService();
