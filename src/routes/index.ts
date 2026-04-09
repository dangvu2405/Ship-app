type RouteParam = string | number;

const ADMIN_PREFIX = '/admin';

const createCrudRoutes = (segment: string) => ({
  list: `${ADMIN_PREFIX}/${segment}`,
  create: `${ADMIN_PREFIX}/${segment}/create`,
  edit: `${ADMIN_PREFIX}/${segment}/edit/:id`,
  editById: (id: RouteParam) => `${ADMIN_PREFIX}/${segment}/edit/${id}`,
  show: `${ADMIN_PREFIX}/${segment}/show/:id`,
  showById: (id: RouteParam) => `${ADMIN_PREFIX}/${segment}/show/${id}`,
} as const);

export const ROUTES = {
  root: '/',
  login: '/login',
  register: '/register',
  dashboard: '/dashboard',
  admin: {
    root: ADMIN_PREFIX,
    companies: createCrudRoutes('companies'),
    offices: createCrudRoutes('offices'),
    departments: createCrudRoutes('departments'),
    positions: createCrudRoutes('positions'),
    employees: createCrudRoutes('employees'),
    vehicles: createCrudRoutes('vehicles'),
    trips: createCrudRoutes('trips'),
    trip_bonus_rules: createCrudRoutes('trip_bonus_rules'),
    customers: createCrudRoutes('customers'),
    drivers: createCrudRoutes('drivers'),
    invoices: createCrudRoutes('invoices'),
    vehicle_assignments: createCrudRoutes('vehicle_assignments'),
    vehicle_expenses: createCrudRoutes('vehicle_expenses'),
    payrolls: createCrudRoutes('payrolls'),
    reports: {
      list: `${ADMIN_PREFIX}/reports`,
    },
    users: createCrudRoutes('users'),
    allowances: createCrudRoutes('allowances'),
    deductions: createCrudRoutes('deductions'),
    attendances: createCrudRoutes('attendances'),
    roles: createCrudRoutes('roles'),
    profile: `${ADMIN_PREFIX}/profile`,
    settings: `${ADMIN_PREFIX}/settings`,
    billing: `${ADMIN_PREFIX}/billing`,
    notifications: `${ADMIN_PREFIX}/notifications`,
  },
  notFound: '*',
} as const;

const RESOURCE_ALIASES = {
  company: 'companies',
  companies: 'companies',
  office: 'offices',
  offices: 'offices',
  department: 'departments',
  departments: 'departments',
  position: 'positions',
  positions: 'positions',
  employee: 'employees',
  employees: 'employees',
  vehicle: 'vehicles',
  vehicles: 'vehicles',
  trip: 'trips',
  trips: 'trips',
  customer: 'customers',
  customers: 'customers',
  driver: 'drivers',
  drivers: 'drivers',
  invoice: 'invoices',
  invoices: 'invoices',
  vehicle_assignment: 'vehicle_assignments',
  vehicle_assignments: 'vehicle_assignments',
  vehicle_expense: 'vehicle_expenses',
  vehicle_expenses: 'vehicle_expenses',
  allowance: 'allowances',
  allowances: 'allowances',
  deduction: 'deductions',
  deductions: 'deductions',
  attendance: 'attendances',
  attendances: 'attendances',
  role: 'roles',
  roles: 'roles',
  payroll: 'payrolls',
  payrolls: 'payrolls',
  user: 'users',
  users: 'users',
} as const;

const RESOURCE_ROUTE_GROUPS = {
  companies: ROUTES.admin.companies,
  offices: ROUTES.admin.offices,
  departments: ROUTES.admin.departments,
  positions: ROUTES.admin.positions,
  employees: ROUTES.admin.employees,
  vehicles: ROUTES.admin.vehicles,
  trips: ROUTES.admin.trips,
  trip_bonus_rules: ROUTES.admin.trip_bonus_rules,
  customers: ROUTES.admin.customers,
  drivers: ROUTES.admin.drivers,
  invoices: ROUTES.admin.invoices,
  vehicle_assignments: ROUTES.admin.vehicle_assignments,
  vehicle_expenses: ROUTES.admin.vehicle_expenses,
  payrolls: ROUTES.admin.payrolls,
  users: ROUTES.admin.users,
  allowances: ROUTES.admin.allowances,
  deductions: ROUTES.admin.deductions,
  attendances: ROUTES.admin.attendances,
  roles: ROUTES.admin.roles,
} as const;

type ResourceAliasKey = keyof typeof RESOURCE_ALIASES;
type ManagedResourceKey = keyof typeof RESOURCE_ROUTE_GROUPS;

const resolveManagedResource = (resource: string): ManagedResourceKey | null => {
  const normalizedResource = resource.toLowerCase() as ResourceAliasKey;
  return RESOURCE_ALIASES[normalizedResource] ?? null;
};

export const getResourceEditRoute = (resource: string, id: RouteParam) => {
  const routeKey = resolveManagedResource(resource);
  return routeKey ? RESOURCE_ROUTE_GROUPS[routeKey].editById(id) : null;
};

export const getResourceShowRoute = (resource: string, id: RouteParam) => {
  const routeKey = resolveManagedResource(resource);
  return routeKey ? RESOURCE_ROUTE_GROUPS[routeKey].showById(id) : null;
};

export const LEGACY_ROUTES = {
  LOGIN: ROUTES.login,
  REGISTER: ROUTES.register,
  DASHBOARD: ROUTES.dashboard,
  COMPANIES: ROUTES.admin.companies.list,
  EMPLOYEES: ROUTES.admin.employees.list,
  DRIVERS: `${ADMIN_PREFIX}/drivers`,
  VEHICLES: ROUTES.admin.vehicles.list,
  TRIPS: ROUTES.admin.trips.list,
  PAYROLLS: ROUTES.admin.payrolls.list,
  REPORTS: ROUTES.admin.reports.list,
  USERS: ROUTES.admin.users.list,
  PROFILE: ROUTES.admin.profile,
  SETTINGS: ROUTES.admin.settings,
  BILLING: ROUTES.admin.billing,
  NOTIFICATIONS: ROUTES.admin.notifications,
} as const;