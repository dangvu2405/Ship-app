import api from './api';
import { ApiResponse, PaginatedResponse, ActivityLog } from '@/types';
import { ENDPOINTS } from './endpoints';

export interface UnreadCountResponse {
  count: number;
}

class NotificationService {
  async getList(params?: {
    page?: number;
    per_page?: number;
    type?: string;
    read?: boolean;
  }): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> {
    const response = await api.get(ENDPOINTS.notifications.base, { params });
    return response.data;
  }

  async getUnreadCount(): Promise<ApiResponse<UnreadCountResponse>> {
    const response = await api.get(ENDPOINTS.notifications.unreadCount, {
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }

  async markRead(id: number | string): Promise<ApiResponse<ActivityLog>> {
    const response = await api.patch(ENDPOINTS.notifications.markRead(id));
    return response.data;
  }

  async markAllRead(): Promise<ApiResponse<void>> {
    const response = await api.patch(ENDPOINTS.notifications.markAllRead);
    return response.data;
  }

  async getActivityLogs(params?: {
    page?: number;
    per_page?: number;
    type?: string;
    resource?: string;
  }): Promise<ApiResponse<PaginatedResponse<ActivityLog>>> {
    const response = await api.get(ENDPOINTS.activityLogs.base, {
      params,
      skipErrorToast: true,
    } as Parameters<typeof api.get>[1]);
    return response.data;
  }
}

export default new NotificationService();
