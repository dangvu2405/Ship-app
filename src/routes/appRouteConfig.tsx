import type { ComponentType, ReactNode } from 'react';
import { lazyWithMinDelay } from '@/utils/lazyWithMinDelay';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { ROUTES } from '@/routes';

type CrudRouteGroup = {
  list: string;
  create: string;
  show: string;
  edit: string;
};

type CrudRouteConfig = {
  key: string;
  routes: CrudRouteGroup;
  List: ComponentType;
  Form: ComponentType;
  Show?: ComponentType;
  requiredRole?: 'admin';
};

type SingleRouteConfig = {
  key: string;
  path: string;
  Component: ComponentType;
  requiredRole?: 'admin';
};

const withRoleGuard = (node: ReactNode, role?: 'admin') => {
  if (!role) return node;
  return <ProtectedRoute requiredRole={role}>{node}</ProtectedRoute>;
};

export const AppPages = {
  LoginForm: lazyWithMinDelay(() => import('@/pages/auth/login-form').then((m) => ({ default: m.LoginForm }))),
  NoRoleAccessPage: lazyWithMinDelay(() => import('@/pages/auth/NoRoleAccessPage').then((m) => ({ default: m.NoRoleAccessPage }))),
  RegisterForm: lazyWithMinDelay(() => import('@/pages/auth/register-form').then((m) => ({ default: m.RegisterForm }))),
  ForgotPasswordForm: lazyWithMinDelay(() =>
    import('@/pages/auth/forgot-password-form').then((m) => ({ default: m.ForgotPasswordForm })),
  ),
  ForgotPasswordVerifyForm: lazyWithMinDelay(() =>
    import('@/pages/auth/forgot-password-verify-form').then((m) => ({ default: m.ForgotPasswordVerifyForm })),
  ),
  TenantSelector: lazyWithMinDelay(() =>
    import('@/pages/auth/tenant-selector').then((m) => ({ default: m.TenantSelector })),
  ),
  Dashboard: lazyWithMinDelay(() => import('@/pages/dashboard/dashboard')),
  NotFound: lazyWithMinDelay(() => import('@/pages/404').then((m) => ({ default: m.NotFound }))),
};

const CompaniesList = lazyWithMinDelay(() => import('@/pages/companies/CompaniesList').then((m) => ({ default: m.CompaniesList })));
const CompanyFormDialog = lazyWithMinDelay(() => import('@/pages/companies/CompanyFormDialog').then((m) => ({ default: m.CompanyFormDialog })));
const VehiclesList = lazyWithMinDelay(() => import('@/pages/vehicles/VehiclesList').then((m) => ({ default: m.VehiclesList })));
const VehicleFormDialog = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleFormDialog').then((m) => ({ default: m.VehicleFormDialog })));
const TripsList = lazyWithMinDelay(() => import('@/pages/trips/TripsList').then((m) => ({ default: m.TripsList })));
const TripFormDialog = lazyWithMinDelay(() => import('@/pages/trips/TripFormDialog').then((m) => ({ default: m.TripFormDialog })));
const TripDetailPage = lazyWithMinDelay(() => import('@/pages/trips/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));
const CustomersList = lazyWithMinDelay(() => import('@/pages/customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerDetailPage = lazyWithMinDelay(() => import('@/pages/customers/CustomerDetailPage').then((m) => ({ default: m.CustomerDetailPage })));
const CustomerFormDialog = lazyWithMinDelay(() => import('@/pages/customers/CustomerFormDialog').then((m) => ({ default: m.CustomerFormDialog })));
const DriversList = lazyWithMinDelay(() => import('@/pages/drivers/DriversList').then((m) => ({ default: m.DriversList })));
const DriverFormDialog = lazyWithMinDelay(() => import('@/pages/drivers/DriverFormDialog').then((m) => ({ default: m.DriverFormDialog })));
const DriverSchedulePage = lazyWithMinDelay(() => import('@/pages/drivers/DriverSchedulePage').then((m) => ({ default: m.DriverSchedulePage })));
const InvoicesList = lazyWithMinDelay(() => import('@/pages/invoices/InvoicesList').then((m) => ({ default: m.InvoicesList })));
const InvoiceFormDialog = lazyWithMinDelay(() => import('@/pages/invoices/InvoiceFormDialog').then((m) => ({ default: m.InvoiceFormDialog })));
const InvoiceDetailPage = lazyWithMinDelay(() => import('@/pages/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })));
const Reports = lazyWithMinDelay(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })));
const UsersList = lazyWithMinDelay(() => import('@/pages/users/UsersList').then((m) => ({ default: m.UsersList })));
const UserFormDialog = lazyWithMinDelay(() => import('@/pages/users/UserFormDialog').then((m) => ({ default: m.UserFormDialog })));
const Notifications = lazyWithMinDelay(() => import('@/pages/system/Notifications').then((m) => ({ default: m.Notifications })));
const Profile = lazyWithMinDelay(() => import('@/pages/system/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazyWithMinDelay(() => import('@/pages/system/Settings').then((m) => ({ default: m.Settings })));
const Billing = lazyWithMinDelay(() => import('@/pages/system/Billing').then((m) => ({ default: m.Billing })));
const SystemUsersHub = lazyWithMinDelay(() => import('@/pages/system/Users').then((m) => ({ default: m.Users })));
const LeaveList = lazyWithMinDelay(() => import('@/pages/leave/LeaveList').then((m) => ({ default: m.LeaveList })));
const DriverScheduleBulkPage = lazyWithMinDelay(() => import('@/pages/drivers/DriverScheduleBulkPage').then((m) => ({ default: m.DriverScheduleBulkPage })));
const VehiclesMaintenancePage = lazyWithMinDelay(() => import('@/pages/vehicles/VehiclesMaintenancePage').then((m) => ({ default: m.VehiclesMaintenancePage })));
const VehicleAssignmentsPage = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleAssignmentsPage').then((m) => ({ default: m.VehicleAssignmentsPage })));
const VehicleCostsPage = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleCostsPage').then((m) => ({ default: m.VehicleCostsPage })));
const DispatchBoardPage = lazyWithMinDelay(() => import('@/pages/dispatch'));
const OrdersPoolPage = lazyWithMinDelay(() => import('@/pages/orders/OrdersPoolPage').then((m) => ({ default: m.OrdersPoolPage })));
const TripBonusRulesPage = lazyWithMinDelay(() => import('@/pages/operations/TripBonusRulesPage').then((m) => ({ default: m.TripBonusRulesPage })));
const PayrollListPage = lazyWithMinDelay(() => import('@/pages/payroll/PayrollListPage').then((m) => ({ default: m.PayrollListPage })));
const PayrollAdjustmentsList = lazyWithMinDelay(() => import('@/pages/payroll/PayrollAdjustmentsList').then((m) => ({ default: m.PayrollAdjustmentsList })));
const AllowancesPage = lazyWithMinDelay(() => import('@/pages/payroll/AllowancesPage').then((m) => ({ default: m.AllowancesPage })));
const DeductionsPage = lazyWithMinDelay(() => import('@/pages/payroll/DeductionsPage').then((m) => ({ default: m.DeductionsPage })));
const CustomerPriceListPage = lazyWithMinDelay(() => import('@/pages/customers/CustomerPriceListPage').then((m) => ({ default: m.CustomerPriceListPage })));
const RevenuePage = lazyWithMinDelay(() => import('@/pages/accounting/RevenuePage').then((m) => ({ default: m.RevenuePage })));
const CostsPage = lazyWithMinDelay(() => import('@/pages/accounting/CostsPage').then((m) => ({ default: m.CostsPage })));
const CostApprovalsPage = lazyWithMinDelay(() => import('@/pages/accounting/CostApprovalsPage').then((m) => ({ default: m.CostApprovalsPage })));
const ReconciliationPage = lazyWithMinDelay(() => import('@/pages/accounting/ReconciliationPage').then((m) => ({ default: m.ReconciliationPage })));
const DebtPage = lazyWithMinDelay(() => import('@/pages/accounting/DebtPage').then((m) => ({ default: m.DebtPage })));
const ViolationsPage = lazyWithMinDelay(() => import('@/pages/violations/ViolationsPage').then((m) => ({ default: m.ViolationsPage })));
const OvertimePage = lazyWithMinDelay(() => import('@/pages/overtime/OvertimePage').then((m) => ({ default: m.OvertimePage })));
const CategoriesPage = lazyWithMinDelay(() => import('@/pages/settings/CategoriesPage').then((m) => ({ default: m.CategoriesPage })));
const CompanySettingsPage = lazyWithMinDelay(() => import('@/pages/settings/CompanySettingsPage').then((m) => ({ default: m.CompanySettingsPage })));

export const crudRoutes: CrudRouteConfig[] = [
  { key: 'companies', routes: ROUTES.admin.companies, List: CompaniesList, Form: CompanyFormDialog },
  { key: 'vehicles', routes: ROUTES.admin.vehicles, List: VehiclesList, Form: VehicleFormDialog },
  { key: 'trips', routes: ROUTES.admin.trips, List: TripsList, Form: TripFormDialog, Show: TripDetailPage },
  { key: 'customers', routes: ROUTES.admin.customers, List: CustomersList, Form: CustomerFormDialog, Show: CustomerDetailPage },
  { key: 'drivers', routes: ROUTES.admin.drivers, List: DriversList, Form: DriverFormDialog },
  { key: 'invoices', routes: ROUTES.admin.invoices, List: InvoicesList, Form: InvoiceFormDialog, Show: InvoiceDetailPage },
  { key: 'users', routes: ROUTES.admin.users, List: UsersList, Form: UserFormDialog },
];

export const singleRoutes: SingleRouteConfig[] = [
  { key: 'reports', path: ROUTES.admin.reports.list, Component: Reports },
  { key: 'notifications', path: ROUTES.admin.notifications, Component: Notifications },
  { key: 'profile', path: ROUTES.admin.profile, Component: Profile },
  { key: 'settings', path: ROUTES.admin.settings.root, Component: Settings },
  { key: 'billing', path: ROUTES.admin.billing, Component: Billing },
  {
    key: 'system_users_hub',
    path: ROUTES.admin.systemUsers,
    Component: SystemUsersHub,
  },
  {
    key: 'drivers_schedule',
    path: ROUTES.admin.driversSchedule,
    Component: DriverSchedulePage,
  },
  {
    key: 'drivers_schedule_bulk',
    path: ROUTES.admin.driversScheduleBulk,
    Component: DriverScheduleBulkPage,
  },
  {
    key: 'leave',
    path: ROUTES.admin.leave,
    Component: LeaveList,
  },
  { key: 'vehicle_maintenance', path: ROUTES.admin.vehicleMaintenance, Component: VehiclesMaintenancePage },
  { key: 'vehicle_assignments', path: ROUTES.admin.vehicleAssignments, Component: VehicleAssignmentsPage },
  { key: 'vehicle_costs', path: ROUTES.admin.vehicleCosts, Component: VehicleCostsPage },
  { key: 'dispatch_board', path: ROUTES.admin.dispatch.board, Component: DispatchBoardPage },
  { key: 'orders_pool', path: ROUTES.admin.orders.pool, Component: OrdersPoolPage },
  { key: 'trip_bonus_rules', path: ROUTES.admin.tripBonusRules, Component: TripBonusRulesPage },
  { key: 'payroll_list', path: ROUTES.admin.payroll.list, Component: PayrollListPage },
  { key: 'payroll_adjustments', path: ROUTES.admin.payroll.adjustments, Component: PayrollAdjustmentsList },
  { key: 'payroll_allowances', path: ROUTES.admin.payroll.allowances, Component: AllowancesPage },
  { key: 'payroll_deductions', path: ROUTES.admin.payroll.deductions, Component: DeductionsPage },
  { key: 'customer_price_list', path: ROUTES.admin.customerPriceList, Component: CustomerPriceListPage },
  { key: 'accounting_revenue', path: ROUTES.admin.accounting.revenue, Component: RevenuePage },
  { key: 'accounting_costs', path: ROUTES.admin.accounting.costs, Component: CostsPage },
  { key: 'accounting_approvals', path: ROUTES.admin.accounting.approvals, Component: CostApprovalsPage },
  { key: 'accounting_reconciliation', path: ROUTES.admin.accounting.reconciliation, Component: ReconciliationPage },
  { key: 'accounting_debt', path: ROUTES.admin.accounting.debt, Component: DebtPage },
  { key: 'violations', path: ROUTES.admin.violations, Component: ViolationsPage },
  { key: 'overtime', path: ROUTES.admin.overtime, Component: OvertimePage },
  { key: 'categories', path: ROUTES.admin.settings.categories, Component: CategoriesPage },
  { key: 'company_settings', path: ROUTES.admin.settings.company, Component: CompanySettingsPage },
];

export const renderCrudElement = (config: CrudRouteConfig, type: 'list' | 'create' | 'show' | 'edit') => {
  switch (type) {
    case 'list':
      return withRoleGuard(<config.List />, config.requiredRole);
    case 'create':
      return withRoleGuard(<config.Form />, config.requiredRole);
    case 'edit':
      return withRoleGuard(<config.Form />, config.requiredRole);
    case 'show':
      return withRoleGuard(config.Show ? <config.Show /> : <config.List />, config.requiredRole);
    default:
      return withRoleGuard(<config.List />, config.requiredRole);
  }
};

export const renderSingleElement = (config: SingleRouteConfig) => {
  const Element = config.Component;
  return withRoleGuard(<Element />, config.requiredRole);
};
