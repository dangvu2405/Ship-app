export type AuthLogAuditRow = {
  id: string;
  username: string;
  loginTime?: string;
  logoutTime?: string | null;
  action: string;
  performedBy: string;
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

const mockAuditLogs = (date: string): AuthLogAuditRow[] => {
  void date;
  return [
  {
    id: '1',
    username: 'user1',
    loginTime: '2026-04-13T08:00:00.000Z',
    logoutTime: '2026-04-13T16:00:00.000Z',
    action: 'Login',
    performedBy: 'System',
  },
  {
    id: '2',
    username: 'user2',
    loginTime: '2026-04-13T09:00:00.000Z',
    logoutTime: null,
    action: 'Account Locked',
    performedBy: 'Admin',
  },
];
};

const mockSessions: AuthSessionRow[] = [
  {
    id: 's1',
    device: 'Chrome on Windows',
    ip: '192.168.1.10',
    lastLogin: '2026-04-13T07:30:00.000Z',
    logoutTime: null,
    status: 'active',
  },
  {
    id: 's2',
    device: 'Safari on iPhone',
    ip: '10.0.0.5',
    lastLogin: '2026-04-12T18:00:00.000Z',
    logoutTime: '2026-04-12T22:00:00.000Z',
    status: 'logged_out',
  },
  {
    id: 's3',
    device: 'Firefox on Linux',
    ip: '172.16.0.2',
    lastLogin: '2026-04-11T09:15:00.000Z',
    logoutTime: null,
    status: 'expired',
  },
];

const authLogService = {
  async listAuthLogs(date: string) {
    return {
      success: true as const,
      message: 'Logs fetched successfully',
      data: mockAuditLogs(date),
    };
  },

  async listAuthLogsPaginated(page: number, pageSize: number = PAGE_SIZE_DEFAULT) {
    const start = (page - 1) * pageSize;
    const logs = mockSessions.slice(start, start + pageSize);
    return {
      success: true as const,
      message: 'Sessions fetched successfully',
      data: {
        logs,
        total: mockSessions.length,
      } satisfies AuthLogsPaginatedPayload,
    };
  },

  async getSummary() {
    return {
      success: true as const,
      data: {
        activeSessions: mockSessions.filter((s) => s.status === 'active').length,
        failedLogins: 2,
      } satisfies AuthSummary,
    };
  },

  async revokeSession(sessionId: string) {
    void sessionId;
    return { success: true as const, message: 'Session revoke requested' };
  },

  async lockAccountForSession(sessionId: string) {
    void sessionId;
    return { success: true as const, message: 'Account lock requested' };
  },
};

export default authLogService;
