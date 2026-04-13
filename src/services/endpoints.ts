type Id = number | string;
import { AUTH_FORGOT_PASSWORD } from '@/utils/constants';

const crud = (base: string) => ({
  base,
  byId: (id: Id) => `${base}/${id}`,
});

export const ENDPOINTS = {
  public: {
    root: '/',
    health: '/health',
    docs: '/documentation',
  },
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    register: '/auth/register',
    forgotPassword: AUTH_FORGOT_PASSWORD.sendPath,
    /** Đặt mật khẩu mới (body `{ email, token, password, password_confirmation }`). */
    forgotPasswordReset: AUTH_FORGOT_PASSWORD.verifyPath,
    me: '/auth/me',
  },
  companies: crud('/companies'),
  offices: crud('/offices'),
  departments: crud('/departments'),
  positions: crud('/positions'),
  employees: crud('/employees'),
  drivers: crud('/drivers'),
  users: crud('/users'),
  roles: {
    ...crud('/roles'),
    syncRolePermissions: (roleId: Id) => `/roles/${roleId}/permissions`,
    permissions: '/permissions',
    permissionById: (permissionId: Id) => `/permissions/${permissionId}`,
  },
  vehicles: crud('/vehicles'),
  vehicleAssignments: crud('/vehicle_assignments'),
  vehicleExpenses: crud('/vehicle_expenses'),
  customers: crud('/customers'),
  trips: crud('/trips'),
  chat: {
    messages: '/chat/messages',
    messagesStream: '/chat/messages/stream',
    sessions: '/chat/sessions',
    sessionById: (sessionId: Id) => `/chat/sessions/${sessionId}`,
  },
  attendanceLate: {
    list: '/attendances/late/list',
    notify: '/attendances/late/notify',
  },
  tripBonusRules: crud('/trip_bonus_rules'),
  invoices: crud('/invoices'),
  allowances: crud('/allowances'),
  deductions: crud('/deductions'),
  attendances: crud('/attendances'),
  payrolls: {
    ...crud('/payrolls'),
    approve: (id: Id) => `/payrolls/${id}/approve`,
    lock: (id: Id) => `/payrolls/${id}/lock`,
    export: (id: Id) => `/payrolls/${id}/export`,
    mySalary: '/payrolls/my-salary',
  },
  reports: {
    dashboard: '/reports/dashboard',
    payrollSummary: '/reports/payroll-summary',
  },
  v2: {
    employees: {
      base: '/v2/employees',
      byId: (id: Id) => `/v2/employees/${id}`,
    },
  },
} as const;
