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
    markPaid: (id: Id) => `/payrolls/${id}/mark-paid`,
    export: (id: Id) => `/payrolls/${id}/export`,
    mySalary: '/payrolls/my-salary',
    driverHistory: (driverId: Id) => `/payrolls/driver/${driverId}`,
  },
  reports: {
    dashboard: '/reports/dashboard',
    payrollSummary: '/reports/payroll-summary',
    revenueSummary: '/reports/revenue-summary',
  },
  driverSchedules: {
    base: '/driver-schedules',
    byId: (id: Id) => `/driver-schedules/${id}`,
    submit: (id: Id) => `/driver-schedules/${id}/submit`,
    approve: (id: Id) => `/driver-schedules/${id}/approve`,
    reject: (id: Id) => `/driver-schedules/${id}/reject`,
    lock: (id: Id) => `/driver-schedules/${id}/lock`,
    override: (id: Id) => `/driver-schedules/${id}/override`,
    hosCheck: (id: Id) => `/driver-schedules/${id}/hos-check`,
  },
  workforce: {
    driverSchedules: '/workforce/driver-schedules',
    approveDriverSchedule: (id: Id) => `/workforce/driver-schedules/${id}/approve`,
    lockDriverSchedule: (id: Id) => `/workforce/driver-schedules/${id}/lock`,
    leaveRequests: '/workforce/leave-requests',
    absences: '/workforce/absences',
  },
  publicHolidays: {
    list: '/public-holidays',
  },
  attendanceOps: {
    list: '/attendance',
    checkIn: '/attendance/check-in',
    checkOut: '/attendance/check-out',
    adjust: (id: Id) => `/attendance/${id}/adjust`,
  },
  leaveOps: {
    types: '/leave/types',
    base: '/leave',
    byId: (id: Id) => `/leave/${id}`,
    approve: (id: Id) => `/leave/${id}/approve`,
    reject: (id: Id) => `/leave/${id}/reject`,
    cancel: (id: Id) => `/leave/${id}/cancel`,
  },
  overtimeOps: {
    base: '/overtime',
    byId: (id: Id) => `/overtime/${id}`,
    approve: (id: Id) => `/overtime/${id}/approve`,
    reject: (id: Id) => `/overtime/${id}/reject`,
  },
  violationOps: {
    base: '/violations',
    byId: (id: Id) => `/violations/${id}`,
    confirm: (id: Id) => `/violations/${id}/confirm`,
    dispute: (id: Id) => `/violations/${id}/dispute`,
    resolveDispute: (id: Id) => `/violations/${id}/resolve-dispute`,
    waive: (id: Id) => `/violations/${id}/waive`,
  },
  v2: {
    employees: {
      base: '/v2/employees',
      byId: (id: Id) => `/v2/employees/${id}`,
    },
  },
} as const;
