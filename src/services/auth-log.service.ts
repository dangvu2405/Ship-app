import api from './api';
import type { ApiResponse } from '@/types';

export type AuthLogAuditRow = {
  id: string;
  username: string;
  action: string;
  resource?: string | null;
  tableName?: string | null;
  recordId?: number | string | null;
  entityType?: string | null;
  statusCode?: number | null;
  performedBy: string;
  createdAt: string;
};

export type AuthSessionStatus = 'active' | 'logged_out' | 'expired';

export type AuthSessionRow = {
  id: string;
  device: string;
  ip: string;
  lastLogin: string;
  logoutTime: string | null;
  status: AuthSessionStatus;
};

export type AuthLogsPaginatedPayload = {
  logs: AuthSessionRow[];
  total: number;
};

export type AuthSummary = {
  activeSessions: number;
  failedLogins: number;
};

const PAGE_SIZE_DEFAULT = 10;

const authLogService = {
  async listAuthLogs(filters: {
    username?: string;
    action?: string;
    from?: string;
    to?: string;
    status_code?: number;
  }): Promise<ApiResponse<AuthLogAuditRow[]>> {
    const response = await api.get('/auth/actions', {
      params: filters,
    });
    return response.data;
  },

  async listAuthLogsPaginated(page: number, pageSize: number = PAGE_SIZE_DEFAULT): Promise<ApiResponse<AuthLogsPaginatedPayload>> {
    const response = await api.get('/auth/sessions', {
      params: {
        page,
        per_page: pageSize,
      },
    });
    return response.data;
  },

  async getSummary(): Promise<ApiResponse<AuthSummary>> {
    const response = await api.get('/auth/sessions/summary');
    return response.data;
  },

  async revokeSession(sessionId: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/auth/sessions/${sessionId}/revoke`);
    return response.data;
  },

  async lockAccountForSession(sessionId: string): Promise<ApiResponse<null>> {
    const response = await api.post(`/auth/sessions/${sessionId}/lock-account`);
    return response.data;
  },
};

export default authLogService;
