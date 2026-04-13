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
  RegisterForm: lazyWithMinDelay(() => import('@/pages/auth/register-form').then((m) => ({ default: m.RegisterForm }))),
  ForgotPasswordForm: lazyWithMinDelay(() =>
    import('@/pages/auth/forgot-password-form').then((m) => ({ default: m.ForgotPasswordForm })),
  ),
  ForgotPasswordVerifyForm: lazyWithMinDelay(() =>
    import('@/pages/auth/forgot-password-verify-form').then((m) => ({ default: m.ForgotPasswordVerifyForm })),
  ),
  Dashboard: lazyWithMinDelay(() => import('@/pages/dashboard/dashboard')),
  NotFound: lazyWithMinDelay(() => import('@/pages/404').then((m) => ({ default: m.NotFound }))),
};

const CompaniesList = lazyWithMinDelay(() => import('@/pages/companies/CompaniesList').then((m) => ({ default: m.CompaniesList })));
const CompanyFormDialog = lazyWithMinDelay(() => import('@/pages/companies/CompanyFormDialog').then((m) => ({ default: m.CompanyFormDialog })));
const OfficesList = lazyWithMinDelay(() => import('@/pages/offices/OfficesList').then((m) => ({ default: m.OfficesList })));
const OfficeFormDialog = lazyWithMinDelay(() => import('@/pages/offices/OfficeFormDialog').then((m) => ({ default: m.OfficeFormDialog })));
const DepartmentsList = lazyWithMinDelay(() => import('@/pages/departments/DepartmentsList').then((m) => ({ default: m.DepartmentsList })));
const DepartmentFormDialog = lazyWithMinDelay(() => import('@/pages/departments/DepartmentFormDialog').then((m) => ({ default: m.DepartmentFormDialog })));
const PositionsList = lazyWithMinDelay(() => import('@/pages/positions/PositionsList').then((m) => ({ default: m.PositionsList })));
const PositionFormDialog = lazyWithMinDelay(() => import('@/pages/positions/PositionFormDialog').then((m) => ({ default: m.PositionFormDialog })));
const VehiclesList = lazyWithMinDelay(() => import('@/pages/vehicles/VehiclesList').then((m) => ({ default: m.VehiclesList })));
const VehicleFormDialog = lazyWithMinDelay(() => import('@/pages/vehicles/VehicleFormDialog').then((m) => ({ default: m.VehicleFormDialog })));
const TripsList = lazyWithMinDelay(() => import('@/pages/trips/TripsList').then((m) => ({ default: m.TripsList })));
const TripFormDialog = lazyWithMinDelay(() => import('@/pages/trips/TripFormDialog').then((m) => ({ default: m.TripFormDialog })));
const TripBonusRulesList = lazyWithMinDelay(() => import('@/pages/trip_bonus_rules/TripBonusRulesList').then((m) => ({ default: m.TripBonusRulesList })));
const TripBonusRuleFormDialog = lazyWithMinDelay(() => import('@/pages/trip_bonus_rules/TripBonusRuleFormDialog').then((m) => ({ default: m.TripBonusRuleFormDialog })));
const CustomersList = lazyWithMinDelay(() => import('@/pages/customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerFormDialog = lazyWithMinDelay(() => import('@/pages/customers/CustomerFormDialog').then((m) => ({ default: m.CustomerFormDialog })));
const DriversList = lazyWithMinDelay(() => import('@/pages/drivers/DriversList').then((m) => ({ default: m.DriversList })));
const DriverFormDialog = lazyWithMinDelay(() => import('@/pages/drivers/DriverFormDialog').then((m) => ({ default: m.DriverFormDialog })));
const DriverSchedulePage = lazyWithMinDelay(() => import('@/pages/drivers/DriverSchedulePage').then((m) => ({ default: m.DriverSchedulePage })));
const InvoicesList = lazyWithMinDelay(() => import('@/pages/invoices/InvoicesList').then((m) => ({ default: m.InvoicesList })));
const InvoiceFormDialog = lazyWithMinDelay(() => import('@/pages/invoices/InvoiceFormDialog').then((m) => ({ default: m.InvoiceFormDialog })));
const VehicleAssignmentsList = lazyWithMinDelay(() => import('@/pages/vehicle_assignments/VehicleAssignmentsList').then((m) => ({ default: m.VehicleAssignmentsList })));
const VehicleAssignmentFormDialog = lazyWithMinDelay(() => import('@/pages/vehicle_assignments/VehicleAssignmentFormDialog').then((m) => ({ default: m.VehicleAssignmentFormDialog })));
const VehicleExpensesList = lazyWithMinDelay(() => import('@/pages/vehicle_expenses/VehicleExpensesList').then((m) => ({ default: m.VehicleExpensesList })));
const VehicleExpenseFormDialog = lazyWithMinDelay(() => import('@/pages/vehicle_expenses/VehicleExpenseFormDialog').then((m) => ({ default: m.VehicleExpenseFormDialog })));
const AllowancesList = lazyWithMinDelay(() => import('@/pages/allowances/AllowancesList').then((m) => ({ default: m.AllowancesList })));
const AllowanceFormDialog = lazyWithMinDelay(() => import('@/pages/allowances/AllowanceFormDialog').then((m) => ({ default: m.AllowanceFormDialog })));
const DeductionsList = lazyWithMinDelay(() => import('@/pages/deductions/DeductionsList').then((m) => ({ default: m.DeductionsList })));
const DeductionFormDialog = lazyWithMinDelay(() => import('@/pages/deductions/DeductionFormDialog').then((m) => ({ default: m.DeductionFormDialog })));
const PayrollsList = lazyWithMinDelay(() => import('@/pages/payrolls/PayrollsList').then((m) => ({ default: m.PayrollsList })));
const PayrollFormDialog = lazyWithMinDelay(() => import('@/pages/payrolls/PayrollFormDialog').then((m) => ({ default: m.PayrollFormDialog })));
const Reports = lazyWithMinDelay(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })));
const UsersList = lazyWithMinDelay(() => import('@/pages/users/UsersList').then((m) => ({ default: m.UsersList })));
const UserFormDialog = lazyWithMinDelay(() => import('@/pages/users/UserFormDialog').then((m) => ({ default: m.UserFormDialog })));
const RolesList = lazyWithMinDelay(() => import('@/pages/roles/RolesList').then((m) => ({ default: m.RolesList })));
const RoleFormDialog = lazyWithMinDelay(() => import('@/pages/roles/RoleFormDialog').then((m) => ({ default: m.RoleFormDialog })));
const Notifications = lazyWithMinDelay(() => import('@/pages/system/Notifications').then((m) => ({ default: m.Notifications })));
const Profile = lazyWithMinDelay(() => import('@/pages/system/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazyWithMinDelay(() => import('@/pages/system/Settings').then((m) => ({ default: m.Settings })));
const Billing = lazyWithMinDelay(() => import('@/pages/system/Billing').then((m) => ({ default: m.Billing })));
const SystemUsersHub = lazyWithMinDelay(() => import('@/pages/system/Users').then((m) => ({ default: m.Users })));
const WorkforceOps = lazyWithMinDelay(() => import('@/pages/system/WorkforceOps').then((m) => ({ default: m.WorkforceOps })));

export const crudRoutes: CrudRouteConfig[] = [
  { key: 'companies', routes: ROUTES.admin.companies, List: CompaniesList, Form: CompanyFormDialog },
  { key: 'offices', routes: ROUTES.admin.offices, List: OfficesList, Form: OfficeFormDialog },
  { key: 'departments', routes: ROUTES.admin.departments, List: DepartmentsList, Form: DepartmentFormDialog },
  { key: 'positions', routes: ROUTES.admin.positions, List: PositionsList, Form: PositionFormDialog },
  { key: 'vehicles', routes: ROUTES.admin.vehicles, List: VehiclesList, Form: VehicleFormDialog, requiredRole: 'admin' },
  { key: 'trips', routes: ROUTES.admin.trips, List: TripsList, Form: TripFormDialog, requiredRole: 'admin' },
  {
    key: 'trip_bonus_rules',
    routes: ROUTES.admin.trip_bonus_rules,
    List: TripBonusRulesList,
    Form: TripBonusRuleFormDialog,
    requiredRole: 'admin',
  },
  { key: 'customers', routes: ROUTES.admin.customers, List: CustomersList, Form: CustomerFormDialog },
  { key: 'drivers', routes: ROUTES.admin.drivers, List: DriversList, Form: DriverFormDialog, requiredRole: 'admin' },
  { key: 'invoices', routes: ROUTES.admin.invoices, List: InvoicesList, Form: InvoiceFormDialog },
  { key: 'vehicle_assignments', routes: ROUTES.admin.vehicle_assignments, List: VehicleAssignmentsList, Form: VehicleAssignmentFormDialog },
  { key: 'vehicle_expenses', routes: ROUTES.admin.vehicle_expenses, List: VehicleExpensesList, Form: VehicleExpenseFormDialog },
  { key: 'allowances', routes: ROUTES.admin.allowances, List: AllowancesList, Form: AllowanceFormDialog },
  { key: 'deductions', routes: ROUTES.admin.deductions, List: DeductionsList, Form: DeductionFormDialog },
  { key: 'payrolls', routes: ROUTES.admin.payrolls, List: PayrollsList, Form: PayrollFormDialog },
  { key: 'users', routes: ROUTES.admin.users, List: UsersList, Form: UserFormDialog, requiredRole: 'admin' },
  { key: 'roles', routes: ROUTES.admin.roles, List: RolesList, Form: RoleFormDialog, requiredRole: 'admin' },
];

export const singleRoutes: SingleRouteConfig[] = [
  { key: 'reports', path: ROUTES.admin.reports.list, Component: Reports },
  { key: 'notifications', path: ROUTES.admin.notifications, Component: Notifications },
  { key: 'profile', path: ROUTES.admin.profile, Component: Profile },
  { key: 'settings', path: ROUTES.admin.settings, Component: Settings },
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
    key: 'workforce_ops',
    path: ROUTES.admin.workforceOps,
    Component: WorkforceOps,
    requiredRole: 'admin',
  },
];

export const renderCrudElement = (config: CrudRouteConfig, type: 'list' | 'create' | 'show' | 'edit') => {
  const element =
    type === 'list' ? (
      <config.List />
    ) : (
      <>
        <config.List />
        <config.Form />
      </>
    );

  return withRoleGuard(element, config.requiredRole);
};

export const renderSingleElement = (config: SingleRouteConfig) => {
  const Element = config.Component;
  return withRoleGuard(<Element />, config.requiredRole);
};
