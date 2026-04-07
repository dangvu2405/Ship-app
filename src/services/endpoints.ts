type Id = number | string;

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
    me: '/user',
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
