export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

// Versioned localStorage keys - bump version on schema changes
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth-token:v1',
} as const;

// Development mode: Auto-login without authentication
export const AUTO_LOGIN_ENABLED = import.meta.env.VITE_AUTO_LOGIN === 'true' || import.meta.env.DEV;

// Demo credentials
export const DEMO_EMAIL = 'admin@abctransport.com';
export const DEMO_PASSWORD = 'password';

export const ROUTES = {
  LOGIN: '/login',
  REGISTER: '/register',
  DASHBOARD: '/dashboard',
  COMPANIES: '/admin/companies',
  EMPLOYEES: '/admin/employees',
  DRIVERS: '/admin/drivers',
  VEHICLES: '/admin/vehicles',
  TRIPS: '/admin/trips',
  PAYROLLS: '/admin/payrolls',
  REPORTS: '/admin/reports',
  USERS: '/admin/users',
} as const;

export const ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  DRIVER: 'driver',
} as const;

export const PERMISSIONS = {
  PAYROLL_VIEW: 'payroll.view',
  PAYROLL_CREATE: 'payroll.create',
  PAYROLL_APPROVE: 'payroll.approve',
  EMPLOYEE_VIEW: 'employee.view',
  EMPLOYEE_CREATE: 'employee.create',
  TRIP_VIEW: 'trip.view',
  TRIP_CREATE: 'trip.create',
} as const;
