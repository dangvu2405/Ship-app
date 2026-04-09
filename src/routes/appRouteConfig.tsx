import { lazy } from 'react';
import type { ComponentType, ReactNode } from 'react';
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
  LoginForm: lazy(() => import('@/pages/auth/login-form').then((m) => ({ default: m.LoginForm }))),
  RegisterForm: lazy(() => import('@/pages/auth/register-form').then((m) => ({ default: m.RegisterForm }))),
  Dashboard: lazy(() => import('@/pages/dashboard/dashboard')),
  NotFound: lazy(() => import('@/pages/404').then((m) => ({ default: m.NotFound }))),
};

const CompaniesList = lazy(() => import('@/pages/companies/CompaniesList').then((m) => ({ default: m.CompaniesList })));
const CompanyFormDialog = lazy(() => import('@/pages/companies/CompanyFormDialog').then((m) => ({ default: m.CompanyFormDialog })));
const OfficesList = lazy(() => import('@/pages/offices/OfficesList').then((m) => ({ default: m.OfficesList })));
const OfficeFormDialog = lazy(() => import('@/pages/offices/OfficeFormDialog').then((m) => ({ default: m.OfficeFormDialog })));
const DepartmentsList = lazy(() => import('@/pages/departments/DepartmentsList').then((m) => ({ default: m.DepartmentsList })));
const DepartmentFormDialog = lazy(() => import('@/pages/departments/DepartmentFormDialog').then((m) => ({ default: m.DepartmentFormDialog })));
const PositionsList = lazy(() => import('@/pages/positions/PositionsList').then((m) => ({ default: m.PositionsList })));
const PositionFormDialog = lazy(() => import('@/pages/positions/PositionFormDialog').then((m) => ({ default: m.PositionFormDialog })));
const EmployeesList = lazy(() => import('@/pages/employees/EmployeesList').then((m) => ({ default: m.EmployeesList })));
const EmployeeFormDialog = lazy(() => import('@/pages/employees/EmployeeFormDialog').then((m) => ({ default: m.EmployeeFormDialog })));
const VehiclesList = lazy(() => import('@/pages/vehicles/VehiclesList').then((m) => ({ default: m.VehiclesList })));
const VehicleFormDialog = lazy(() => import('@/pages/vehicles/VehicleFormDialog').then((m) => ({ default: m.VehicleFormDialog })));
const TripsList = lazy(() => import('@/pages/trips/TripsList').then((m) => ({ default: m.TripsList })));
const TripFormDialog = lazy(() => import('@/pages/trips/TripFormDialog').then((m) => ({ default: m.TripFormDialog })));
const TripBonusRulesList = lazy(() => import('@/pages/trip_bonus_rules/TripBonusRulesList').then((m) => ({ default: m.TripBonusRulesList })));
const TripBonusRuleFormDialog = lazy(() => import('@/pages/trip_bonus_rules/TripBonusRuleFormDialog').then((m) => ({ default: m.TripBonusRuleFormDialog })));
const CustomersList = lazy(() => import('@/pages/customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerFormDialog = lazy(() => import('@/pages/customers/CustomerFormDialog').then((m) => ({ default: m.CustomerFormDialog })));
const DriversList = lazy(() => import('@/pages/drivers/DriversList').then((m) => ({ default: m.DriversList })));
const DriverFormDialog = lazy(() => import('@/pages/drivers/DriverFormDialog').then((m) => ({ default: m.DriverFormDialog })));
const InvoicesList = lazy(() => import('@/pages/invoices/InvoicesList').then((m) => ({ default: m.InvoicesList })));
const InvoiceFormDialog = lazy(() => import('@/pages/invoices/InvoiceFormDialog').then((m) => ({ default: m.InvoiceFormDialog })));
const VehicleAssignmentsList = lazy(() => import('@/pages/vehicle_assignments/VehicleAssignmentsList').then((m) => ({ default: m.VehicleAssignmentsList })));
const VehicleAssignmentFormDialog = lazy(() => import('@/pages/vehicle_assignments/VehicleAssignmentFormDialog').then((m) => ({ default: m.VehicleAssignmentFormDialog })));
const VehicleExpensesList = lazy(() => import('@/pages/vehicle_expenses/VehicleExpensesList').then((m) => ({ default: m.VehicleExpensesList })));
const VehicleExpenseFormDialog = lazy(() => import('@/pages/vehicle_expenses/VehicleExpenseFormDialog').then((m) => ({ default: m.VehicleExpenseFormDialog })));
const AllowancesList = lazy(() => import('@/pages/allowances/AllowancesList').then((m) => ({ default: m.AllowancesList })));
const AllowanceFormDialog = lazy(() => import('@/pages/allowances/AllowanceFormDialog').then((m) => ({ default: m.AllowanceFormDialog })));
const DeductionsList = lazy(() => import('@/pages/deductions/DeductionsList').then((m) => ({ default: m.DeductionsList })));
const DeductionFormDialog = lazy(() => import('@/pages/deductions/DeductionFormDialog').then((m) => ({ default: m.DeductionFormDialog })));
const AttendancesList = lazy(() => import('@/pages/attendances/AttendancesList').then((m) => ({ default: m.AttendancesList })));
const AttendanceFormDialog = lazy(() => import('@/pages/attendances/AttendanceFormDialog').then((m) => ({ default: m.AttendanceFormDialog })));
const PayrollsList = lazy(() => import('@/pages/payrolls/PayrollsList').then((m) => ({ default: m.PayrollsList })));
const PayrollFormDialog = lazy(() => import('@/pages/payrolls/PayrollFormDialog').then((m) => ({ default: m.PayrollFormDialog })));
const Reports = lazy(() => import('@/pages/reports/Reports').then((m) => ({ default: m.Reports })));
const UsersList = lazy(() => import('@/pages/users/UsersList').then((m) => ({ default: m.UsersList })));
const UserFormDialog = lazy(() => import('@/pages/users/UserFormDialog').then((m) => ({ default: m.UserFormDialog })));
const RolesList = lazy(() => import('@/pages/roles/RolesList').then((m) => ({ default: m.RolesList })));
const RoleFormDialog = lazy(() => import('@/pages/roles/RoleFormDialog').then((m) => ({ default: m.RoleFormDialog })));
const Notifications = lazy(() => import('@/pages/system/Notifications').then((m) => ({ default: m.Notifications })));
const Profile = lazy(() => import('@/pages/system/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('@/pages/system/Settings').then((m) => ({ default: m.Settings })));

export const crudRoutes: CrudRouteConfig[] = [
  { key: 'companies', routes: ROUTES.admin.companies, List: CompaniesList, Form: CompanyFormDialog },
  { key: 'offices', routes: ROUTES.admin.offices, List: OfficesList, Form: OfficeFormDialog },
  { key: 'departments', routes: ROUTES.admin.departments, List: DepartmentsList, Form: DepartmentFormDialog },
  { key: 'positions', routes: ROUTES.admin.positions, List: PositionsList, Form: PositionFormDialog },
  { key: 'employees', routes: ROUTES.admin.employees, List: EmployeesList, Form: EmployeeFormDialog, requiredRole: 'admin' },
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
  { key: 'attendances', routes: ROUTES.admin.attendances, List: AttendancesList, Form: AttendanceFormDialog },
  { key: 'payrolls', routes: ROUTES.admin.payrolls, List: PayrollsList, Form: PayrollFormDialog },
  { key: 'users', routes: ROUTES.admin.users, List: UsersList, Form: UserFormDialog, requiredRole: 'admin' },
  { key: 'roles', routes: ROUTES.admin.roles, List: RolesList, Form: RoleFormDialog, requiredRole: 'admin' },
];

export const singleRoutes: SingleRouteConfig[] = [
  { key: 'reports', path: ROUTES.admin.reports.list, Component: Reports },
  { key: 'notifications', path: ROUTES.admin.notifications, Component: Notifications },
  { key: 'profile', path: ROUTES.admin.profile, Component: Profile },
  { key: 'settings', path: ROUTES.admin.settings, Component: Settings },
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
