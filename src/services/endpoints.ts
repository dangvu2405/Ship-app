export const ENDPOINTS = {
  public: {
    root: '/'
  },
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    me: '/user',
  },
  payrolls: {
    base: '/payrolls',
    byId: (id: number | string) => `/payrolls/${id}`,
    approve: (id: number | string) => `/payrolls/${id}/approve`,
    lock: (id: number | string) => `/payrolls/${id}/lock`,
    export: (id: number | string) => `/payrolls/${id}/export`,
    mySalary: '/payrolls/my-salary',
  },
  reports: {
    dashboard: '/reports/dashboard',
    payrollSummary: '/reports/payroll-summary',
  },
  roles: {
    permissions: '/permissions',
    permissionById: (id: number | string) => `/permissions/${id}`,
    syncRolePermissions: (roleId: number | string) => `/roles/${roleId}/permissions`,
  },
} as const;
