type Id = number | string;

const crud = (base: string) => ({
  base,
  byId: (id: Id) => `${base}/${id}`,
});

export const ENDPOINTS = {
  public: {
    /** Trong `/api/v1` */
    root: '/',
    health: '/health',
    /** Swagger: `/api/documentation` — gọi với axios `{ useApiRoot: true }`. */
    docs: '/documentation',
  },
  auth: {
    login: '/auth/login',
    logout: '/auth/logout',
    refresh: '/auth/refresh',
    register: '/auth/register',
    /** Chuẩn REST; `/user` vẫn có trên BE để tương thích. */
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
  /**
   * Contract paths from FRONTEND_MUST_HAVE_SCHEMA_HANDOFF — enable when backend exposes routes.
   */
  planned: {
    leaveTypes: crud('/leave-types'),
    leaveRequests: {
      ...crud('/leave-requests'),
      submit: (id: Id) => `/leave-requests/${id}/submit`,
      approve: (id: Id) => `/leave-requests/${id}/approve`,
      reject: (id: Id) => `/leave-requests/${id}/reject`,
      cancel: (id: Id) => `/leave-requests/${id}/cancel`,
    },
    leaveBalanceByEmployee: (employeeId: Id, balanceId: Id) => `/employees/${employeeId}/leave-balances/${balanceId}`,
    taxBrackets: crud('/tax-brackets'),
    insuranceRates: crud('/insurance-rates'),
    payrollDetailEarnings: (payrollDetailId: Id) => `/payroll-details/${payrollDetailId}/earnings`,
    payrollEarningById: (id: Id) => `/payroll-earnings/${id}`,
    payrollDetailDeductions: (payrollDetailId: Id) => `/payroll-details/${payrollDetailId}/deductions`,
    payslips: {
      ...crud('/payslips'),
      issue: (id: Id) => `/payslips/${id}/issue`,
    },
    chartOfAccounts: crud('/chart-of-accounts'),
    journalEntries: {
      ...crud('/journal-entries'),
      post: (id: Id) => `/journal-entries/${id}/post`,
    },
  },
} as const;
