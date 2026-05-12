import type { ComponentType, ReactNode } from 'react';
import { lazyWithMinDelay } from '@/utils/lazyWithMinDelay';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
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
  List: ComponentType<Record<string, unknown>>;
  Form?: ComponentType<Record<string, unknown>>;
  Show?: ComponentType<Record<string, unknown>>;
  requiredRole?: 'admin';
};

type SingleRouteConfig = {
  key: string;
  path: string;
  Component: ComponentType<Record<string, unknown>>;
  requiredRole?: 'admin';
};

import { AppLoadingSpin } from '@/components/common/AppLoadingSpin';

const ProtectedRoute = ({ children, requiredRole }: { children: ReactNode; requiredRole: string }) => {
  const { isAuthenticated, isLoading, hasRole } = useAuth();
  
  if (isLoading) return <AppLoadingSpin variant="page" />;
  if (!isAuthenticated) return <Navigate to={ROUTES.login} replace />;
  if (requiredRole && !hasRole(requiredRole)) return <Navigate to={ROUTES.dashboard} replace />;
  
  return <>{children}</>;
};

const withRoleGuard = (node: ReactNode, role?: 'admin') => {
  if (!role) return node;
  return <ProtectedRoute requiredRole={role}>{node}</ProtectedRoute>;
};

export const AppPages = {
  LoginForm: lazyWithMinDelay(() => import('@/pages/auth/login-form').then((m) => ({ default: m.LoginForm }))),
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
const VehicleDetailPage = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleDetailPage').then((m) => ({ default: m.VehicleDetailPage })));

const TripsList = lazyWithMinDelay(() => import('@/pages/trips/TripsList').then((m) => ({ default: m.TripsList })));
const TripFormDialog = lazyWithMinDelay(() => import('@/pages/trips/TripFormDialog').then((m) => ({ default: m.TripFormDialog })));
const TripDetailPage = lazyWithMinDelay(() => import('@/pages/trips/TripDetailPage').then((m) => ({ default: m.TripDetailPage })));

const TripBonusRulesList = lazyWithMinDelay(() => import('@/pages/operations/TripBonusRulesPage').then((m) => ({ default: m.TripBonusRulesPage })));

const CustomersList = lazyWithMinDelay(() => import('@/pages/customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerFormDialog = lazyWithMinDelay(() => import('@/pages/customers/CustomerFormDialog').then((m) => ({ default: m.CustomerFormDialog })));

const DriversList = lazyWithMinDelay(() => import('@/pages/drivers/DriversList').then((m) => ({ default: m.DriversList })));
const DriverFormDialog = lazyWithMinDelay(() => import('@/pages/drivers/DriverFormDialog').then((m) => ({ default: m.DriverFormDialog })));
const DriverDetailPage = lazyWithMinDelay(() => import('@/pages/drivers/DriverDetailPage').then((m) => ({ default: m.DriverDetailPage })));
const DriverSchedulePage = lazyWithMinDelay(() => import('@/pages/drivers/DriverSchedulePage').then((m) => ({ default: m.DriverSchedulePage })));

const InvoicesList = lazyWithMinDelay(() => import('@/pages/invoices/InvoicesList').then((m) => ({ default: m.InvoicesList })));
const InvoiceFormDialog = lazyWithMinDelay(() => import('@/pages/invoices/InvoiceFormDialog').then((m) => ({ default: m.InvoiceFormDialog })));
const InvoiceDetailPage = lazyWithMinDelay(() => import('@/pages/invoices/InvoiceDetailPage').then((m) => ({ default: m.InvoiceDetailPage })));

const VehicleAssignmentsList = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleAssignmentsPage').then((m) => ({ default: m.VehicleAssignmentsPage })));
const VehicleExpensesList = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleCostsPage').then((m) => ({ default: m.VehicleCostsPage })));

const AllowancesList = lazyWithMinDelay(() => import('@/pages/payroll/AllowancesPage').then((m) => ({ default: m.AllowancesPage })));
const DeductionsList = lazyWithMinDelay(() => import('@/pages/payroll/DeductionsPage').then((m) => ({ default: m.DeductionsPage })));
const PayrollsList = lazyWithMinDelay(() => import('@/pages/payroll/PayrollListPage').then((m) => ({ default: m.PayrollListPage })));
const AdjustmentsList = lazyWithMinDelay(() => import('@/pages/payroll/PayrollAdjustmentsList').then((m) => ({ default: m.PayrollAdjustmentsList })));

const AccountingRevenuePage = lazyWithMinDelay(() => import('@/pages/accounting/RevenuePage').then((m) => ({ default: m.RevenuePage })));
const AccountingCostsPage = lazyWithMinDelay(() => import('@/pages/accounting/CostsPage').then((m) => ({ default: m.CostsPage })));
const AccountingDebtPage = lazyWithMinDelay(() => import('@/pages/accounting/DebtPage').then((m) => ({ default: m.DebtPage })));
const AccountingReconciliationPage = lazyWithMinDelay(() => import('@/pages/accounting/ReconciliationPage').then((m) => ({ default: m.ReconciliationPage })));

const Reports = lazyWithMinDelay(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })));
const UsersList = lazyWithMinDelay(() => import('@/pages/users/UsersList').then((m) => ({ default: m.UsersList })));
const UserFormDialog = lazyWithMinDelay(() => import('@/pages/users/UserFormDialog').then((m) => ({ default: m.UserFormDialog })));

const Notifications = lazyWithMinDelay(() => import('@/pages/system/Notifications').then((m) => ({ default: m.Notifications })));
const Profile = lazyWithMinDelay(() => import('@/pages/system/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazyWithMinDelay(() => import('@/pages/system/Settings').then((m) => ({ default: m.Settings })));
const Billing = lazyWithMinDelay(() => import('@/pages/system/Billing').then((m) => ({ default: m.Billing })));
const SystemUsersHub = lazyWithMinDelay(() => import('@/pages/system/Users').then((m) => ({ default: m.Users })));

const ViolationsList = lazyWithMinDelay(() => import('@/pages/violations/ViolationsPage').then((m) => ({ default: m.ViolationsPage })));
const OvertimeList = lazyWithMinDelay(() => import('@/pages/overtime/OvertimePage').then((m) => ({ default: m.OvertimePage })));
const LeaveList = lazyWithMinDelay(() => import('@/pages/leave/LeaveList').then((m) => ({ default: m.LeaveList })));
const DriverScheduleBulkPage = lazyWithMinDelay(() => import('@/pages/drivers/DriverScheduleBulkPage').then((m) => ({ default: m.DriverScheduleBulkPage })));
const DispatchBoardPage = lazyWithMinDelay(() => import('@/pages/dispatch/DispatchBoardPage').then((m) => ({ default: m.DispatchBoardPage })));

export const crudRoutes: CrudRouteConfig[] = [
  { key: 'companies', routes: ROUTES.admin.companies, List: CompaniesList, Form: CompanyFormDialog },
  { key: 'vehicles', routes: ROUTES.admin.vehicles, List: VehiclesList, Form: VehicleFormDialog, Show: VehicleDetailPage, requiredRole: 'admin' },
  { key: 'trips', routes: ROUTES.admin.trips, List: TripsList, Form: TripFormDialog, Show: TripDetailPage, requiredRole: 'admin' },
  {
    key: 'trip_bonus_rules',
    routes: ROUTES.admin.trip_bonus_rules,
    List: TripBonusRulesList,
    requiredRole: 'admin',
  },
  { key: 'customers', routes: ROUTES.admin.customers, List: CustomersList, Form: CustomerFormDialog },
  { key: 'drivers', routes: ROUTES.admin.drivers, List: DriversList, Form: DriverFormDialog, Show: DriverDetailPage, requiredRole: 'admin' },
  { key: 'invoices', routes: ROUTES.admin.invoices, List: InvoicesList, Form: InvoiceFormDialog, Show: InvoiceDetailPage },
  { key: 'vehicle_assignments', routes: ROUTES.admin.vehicle_assignments, List: VehicleAssignmentsList },
  { key: 'vehicle_expenses', routes: ROUTES.admin.vehicle_expenses, List: VehicleExpensesList },
  { key: 'allowances', routes: ROUTES.admin.allowances, List: AllowancesList },
  { key: 'deductions', routes: ROUTES.admin.deductions, List: DeductionsList },
  { key: 'payrolls', routes: ROUTES.admin.payrolls, List: PayrollsList },
  { key: 'payroll_adjustments', routes: ROUTES.admin.payroll_adjustments, List: AdjustmentsList },
  { key: 'users', routes: ROUTES.admin.users, List: UsersList, Form: UserFormDialog, requiredRole: 'admin' },
];

export const singleRoutes: SingleRouteConfig[] = [
  { key: 'accounting_revenue', path: ROUTES.admin.accounting.revenue, Component: AccountingRevenuePage },
  { key: 'accounting_costs', path: ROUTES.admin.accounting.costs, Component: AccountingCostsPage },
  { key: 'accounting_debt', path: ROUTES.admin.accounting.debt, Component: AccountingDebtPage },
  { key: 'accounting_reconciliation', path: ROUTES.admin.accounting.reconciliation, Component: AccountingReconciliationPage },
  { key: 'reports', path: ROUTES.admin.reports.list, Component: Reports },
  { key: 'notifications', path: ROUTES.admin.notifications, Component: Notifications },
  { key: 'profile', path: ROUTES.admin.profile, Component: Profile },
  { key: 'settings', path: ROUTES.admin.settings.root, Component: Settings },
  { key: 'billing', path: ROUTES.admin.billing, Component: Billing },
  {
    key: 'system_users_hub',
    path: ROUTES.admin.systemUsers,
    Component: SystemUsersHub,
    requiredRole: 'admin',
  },
  {
    key: 'drivers_schedule',
    path: ROUTES.admin.driversSchedule,
    Component: DriverSchedulePage,
    requiredRole: 'admin',
  },
  {
    key: 'drivers_schedule_bulk',
    path: ROUTES.admin.driversScheduleBulk,
    Component: DriverScheduleBulkPage,
    requiredRole: 'admin',
  },
  {
    key: 'violations',
    path: ROUTES.admin.violations,
    Component: ViolationsList,
    requiredRole: 'admin',
  },
  {
    key: 'overtime',
    path: ROUTES.admin.overtime,
    Component: OvertimeList,
    requiredRole: 'admin',
  },
  {
    key: 'leave',
    path: ROUTES.admin.leave,
    Component: LeaveList,
    requiredRole: 'admin',
  },
  {
    key: 'dispatch',
    path: ROUTES.admin.dispatch.board,
    Component: DispatchBoardPage,
    requiredRole: 'admin',
  },
];

export const renderCrudElement = (config: CrudRouteConfig, type: 'list' | 'create' | 'show' | 'edit') => {
  const element = type === 'list'
    ? <config.List />
    : type === 'show' && config.Show
      ? <config.Show />
      : config.Form
        ? (
          <>
            <config.List />
            <config.Form />
          </>
        )
        : <config.List />;

  return withRoleGuard(element, config.requiredRole);
};

export const renderSingleElement = (config: SingleRouteConfig) => {
  const Element = config.Component;
  return withRoleGuard(<Element />, config.requiredRole);
};
