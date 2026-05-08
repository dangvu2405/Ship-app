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

const ordersCrudRoutes = createCrudRoutes('orders');
const tripsCrudRoutes = ordersCrudRoutes;

export const ROUTES = {
  root: '/',
  login: '/login',
  noRoleAccess: '/no-role-access',
  googleCallback: '/auth/google/callback',
  register: '/register',
  forgotPassword: '/forgot-password',
  forgotPasswordVerify: '/forgot-password/verify',
  selectTenant: '/select-tenant',
  dashboard: '/dashboard',
  admin: {
    root: ADMIN_PREFIX,
    companies: createCrudRoutes('companies'),
    vehicles: createCrudRoutes('vehicles'),
    vehicleMaintenance: `${ADMIN_PREFIX}/vehicles/maintenance`,
    vehicleAssignments: `${ADMIN_PREFIX}/vehicles/assignments`,
    vehicleCosts: `${ADMIN_PREFIX}/vehicles/costs`,
    trips: tripsCrudRoutes,
    dispatch: {
      board: `${ADMIN_PREFIX}/dispatch`,
      today: `${ADMIN_PREFIX}/dispatch/today`,
    },
    orders: {
      list: ordersCrudRoutes.list,
      create: ordersCrudRoutes.create,
      pool: `${ADMIN_PREFIX}/orders/pool`,
    },
    customers: createCrudRoutes('customers'),
    customerPriceList: `${ADMIN_PREFIX}/customers/price-list`,
    drivers: createCrudRoutes('drivers'),
    /** Lịch làm việc tài xế (matrix tuần) — không thuộc CRUD drivers. */
    driversSchedule: `${ADMIN_PREFIX}/drivers/schedule`,
    /** Tạo lịch hàng loạt theo chi nhánh và vị trí. */
    driversScheduleBulk: `${ADMIN_PREFIX}/drivers/bulk-schedule`,
    violations: `${ADMIN_PREFIX}/violations`,
    overtime: `${ADMIN_PREFIX}/overtime`,
    leave: `${ADMIN_PREFIX}/leave`,
    tripBonusRules: `${ADMIN_PREFIX}/trip-bonus-rules`,
    payroll: {
      list: `${ADMIN_PREFIX}/payroll`,
      adjustments: `${ADMIN_PREFIX}/payroll/adjustments`,
      allowances: `${ADMIN_PREFIX}/payroll/allowances`,
      deductions: `${ADMIN_PREFIX}/payroll/deductions`,
    },
    invoices: createCrudRoutes('invoices'),
    accounting: {
      revenue: `${ADMIN_PREFIX}/accounting/revenue`,
      costs: `${ADMIN_PREFIX}/accounting/costs`,
      approvals: `${ADMIN_PREFIX}/accounting/approvals`,
      reconciliation: `${ADMIN_PREFIX}/accounting/reconciliation`,
      debt: `${ADMIN_PREFIX}/accounting/debt`,
    },
    reports: {
      list: `${ADMIN_PREFIX}/reports`,
      overview: `${ADMIN_PREFIX}/reports/overview`,
    },
    users: createCrudRoutes('users'),
    profile: `${ADMIN_PREFIX}/profile`,
    settings: {
      root: `${ADMIN_PREFIX}/settings`,
      categories: `${ADMIN_PREFIX}/settings/categories`,
      users: createCrudRoutes('users').list,
      company: `${ADMIN_PREFIX}/settings/company`,
    },
    billing: `${ADMIN_PREFIX}/billing`,
    notifications: `${ADMIN_PREFIX}/notifications`,
    /** Trang tổng quan / hub người dùng (system/Users.tsx), khác CRUD `/admin/users`. */
    systemUsers: `${ADMIN_PREFIX}/system/users`,
  },
  notFound: '*',
} as const;

const RESOURCE_ALIASES = {
  company: 'companies',
  companies: 'companies',
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
  user: 'users',
  users: 'users',
} as const;

const RESOURCE_ROUTE_GROUPS = {
  companies: ROUTES.admin.companies,
  vehicles: ROUTES.admin.vehicles,
  trips: ROUTES.admin.trips,
  customers: ROUTES.admin.customers,
  drivers: ROUTES.admin.drivers,
  invoices: ROUTES.admin.invoices,
  users: ROUTES.admin.users,
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
  FORGOT_PASSWORD: ROUTES.forgotPassword,
  DASHBOARD: ROUTES.dashboard,
  COMPANIES: ROUTES.admin.companies.list,
  DRIVERS: `${ADMIN_PREFIX}/drivers`,
  VEHICLES: ROUTES.admin.vehicles.list,
  TRIPS: ROUTES.admin.trips.list,
  REPORTS: ROUTES.admin.reports.list,
  USERS: ROUTES.admin.users.list,
  PROFILE: ROUTES.admin.profile,
  SETTINGS: ROUTES.admin.settings.root,
  BILLING: ROUTES.admin.billing,
  NOTIFICATIONS: ROUTES.admin.notifications,
} as const;