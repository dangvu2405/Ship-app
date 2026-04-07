import { Refine, Authenticated } from '@refinedev/core';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Toaster } from 'react-hot-toast';
import { Suspense, lazy, useEffect } from 'react';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { ROUTES } from '@/routes';
import { appNotificationProvider } from './providers/notificationProvider';
import { ProtectedRoute } from './components/common/ProtectedRoute';

const LoginForm = lazy(() => import('./pages/auth/login-form').then((m) => ({ default: m.LoginForm })));
const RegisterForm = lazy(() => import('./pages/auth/register-form').then((m) => ({ default: m.RegisterForm })));
const Dashboard = lazy(() => import('./pages/dashboard/dashboard'));
const CompaniesList = lazy(() => import('./pages/companies/CompaniesList').then((m) => ({ default: m.CompaniesList })));
const CompanyFormDialog = lazy(() => import('./pages/companies/CompanyFormDialog').then((m) => ({ default: m.CompanyFormDialog })));
const OfficesList = lazy(() => import('./pages/offices/OfficesList').then((m) => ({ default: m.OfficesList })));
const OfficeFormDialog = lazy(() => import('./pages/offices/OfficeFormDialog').then((m) => ({ default: m.OfficeFormDialog })));
const DepartmentsList = lazy(() => import('./pages/departments/DepartmentsList').then((m) => ({ default: m.DepartmentsList })));
const DepartmentFormDialog = lazy(() => import('./pages/departments/DepartmentFormDialog').then((m) => ({ default: m.DepartmentFormDialog })));
const PositionsList = lazy(() => import('./pages/positions/PositionsList').then((m) => ({ default: m.PositionsList })));
const PositionFormDialog = lazy(() => import('./pages/positions/PositionFormDialog').then((m) => ({ default: m.PositionFormDialog })));
const EmployeesList = lazy(() => import('./pages/employees/EmployeesList').then((m) => ({ default: m.EmployeesList })));
const EmployeeFormDialog = lazy(() => import('./pages/employees/EmployeeFormDialog').then((m) => ({ default: m.EmployeeFormDialog })));
const VehiclesList = lazy(() => import('./pages/vehicles/VehiclesList').then((m) => ({ default: m.VehiclesList })));
const VehicleFormDialog = lazy(() => import('./pages/vehicles/VehicleFormDialog').then((m) => ({ default: m.VehicleFormDialog })));
const TripsList = lazy(() => import('./pages/trips/TripsList').then((m) => ({ default: m.TripsList })));
const TripFormDialog = lazy(() => import('./pages/trips/TripFormDialog').then((m) => ({ default: m.TripFormDialog })));
const CustomersList = lazy(() => import('./pages/customers/CustomersList').then((m) => ({ default: m.CustomersList })));
const CustomerFormDialog = lazy(() => import('./pages/customers/CustomerFormDialog').then((m) => ({ default: m.CustomerFormDialog })));
const DriversList = lazy(() => import('./pages/drivers/DriversList').then((m) => ({ default: m.DriversList })));
const DriverFormDialog = lazy(() => import('./pages/drivers/DriverFormDialog').then((m) => ({ default: m.DriverFormDialog })));
const InvoicesList = lazy(() => import('./pages/invoices/InvoicesList').then((m) => ({ default: m.InvoicesList })));
const InvoiceFormDialog = lazy(() => import('./pages/invoices/InvoiceFormDialog').then((m) => ({ default: m.InvoiceFormDialog })));
const VehicleAssignmentsList = lazy(() => import('./pages/vehicle_assignments/VehicleAssignmentsList').then((m) => ({ default: m.VehicleAssignmentsList })));
const VehicleAssignmentFormDialog = lazy(() => import('./pages/vehicle_assignments/VehicleAssignmentFormDialog').then((m) => ({ default: m.VehicleAssignmentFormDialog })));
const VehicleExpensesList = lazy(() => import('./pages/vehicle_expenses/VehicleExpensesList').then((m) => ({ default: m.VehicleExpensesList })));
const VehicleExpenseFormDialog = lazy(() => import('./pages/vehicle_expenses/VehicleExpenseFormDialog').then((m) => ({ default: m.VehicleExpenseFormDialog })));
const AllowancesList = lazy(() => import('./pages/allowances/AllowancesList').then((m) => ({ default: m.AllowancesList })));
const AllowanceFormDialog = lazy(() => import('./pages/allowances/AllowanceFormDialog').then((m) => ({ default: m.AllowanceFormDialog })));
const DeductionsList = lazy(() => import('./pages/deductions/DeductionsList').then((m) => ({ default: m.DeductionsList })));
const DeductionFormDialog = lazy(() => import('./pages/deductions/DeductionFormDialog').then((m) => ({ default: m.DeductionFormDialog })));
const AttendancesList = lazy(() => import('./pages/attendances/AttendancesList').then((m) => ({ default: m.AttendancesList })));
const AttendanceFormDialog = lazy(() => import('./pages/attendances/AttendanceFormDialog').then((m) => ({ default: m.AttendanceFormDialog })));
const PayrollsList = lazy(() => import('./pages/payrolls/PayrollsList').then((m) => ({ default: m.PayrollsList })));
const PayrollFormDialog = lazy(() => import('./pages/payrolls/PayrollFormDialog').then((m) => ({ default: m.PayrollFormDialog })));
const Reports = lazy(() => import('./pages/reports/Reports').then((m) => ({ default: m.Reports })));
const UsersList = lazy(() => import('./pages/users/UsersList').then((m) => ({ default: m.UsersList })));
const UserFormDialog = lazy(() => import('./pages/users/UserFormDialog').then((m) => ({ default: m.UserFormDialog })));
const RolesList = lazy(() => import('./pages/roles/RolesList').then((m) => ({ default: m.RolesList })));
const RoleFormDialog = lazy(() => import('./pages/roles/RoleFormDialog').then((m) => ({ default: m.RoleFormDialog })));
const Profile = lazy(() => import('./pages/system/Profile').then((m) => ({ default: m.Profile })));
const Settings = lazy(() => import('./pages/system/Settings').then((m) => ({ default: m.Settings })));
const NotFound = lazy(() => import('./pages/404').then((m) => ({ default: m.NotFound })));

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const { defaultAlgorithm, darkAlgorithm } = antdTheme;

  return (
    <BrowserRouter>
      <ConfigProvider theme={{ algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm }}>
      <Refine
        dataProvider={dataProvider}
        authProvider={authProvider}
        routerProvider={routerProvider}
        resources={resources}
        notificationProvider={appNotificationProvider}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          projectId: 'ship-erp-system',
        }}
      >
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path={ROUTES.login} element={<LoginForm />} />
            <Route path={ROUTES.register} element={<RegisterForm />} />
            <Route
              element={
                <Authenticated key="authenticated-layout" fallback={<Navigate to={ROUTES.login} replace />}>
                  <AppLayout />
                </Authenticated>
              }
            >
              <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
              <Route path={ROUTES.dashboard} element={<Dashboard />} />
            
            {/* Companies */}
            <Route path={ROUTES.admin.companies.list} element={<CompaniesList />} />
            <Route path={ROUTES.admin.companies.create} element={<CompanyFormDialog />} />
            <Route path={ROUTES.admin.companies.show} element={<CompanyFormDialog />} />
            <Route path={ROUTES.admin.companies.edit} element={<CompanyFormDialog />} />

            {/* Offices */}
            <Route path={ROUTES.admin.offices.list} element={<OfficesList />} />
            <Route path={ROUTES.admin.offices.create} element={<OfficeFormDialog />} />
            <Route path={ROUTES.admin.offices.show} element={<OfficeFormDialog />} />
            <Route path={ROUTES.admin.offices.edit} element={<OfficeFormDialog />} />

            {/* Departments */}
            <Route path={ROUTES.admin.departments.list} element={<DepartmentsList />} />
            <Route path={ROUTES.admin.departments.create} element={<DepartmentFormDialog />} />
            <Route path={ROUTES.admin.departments.show} element={<DepartmentFormDialog />} />
            <Route path={ROUTES.admin.departments.edit} element={<DepartmentFormDialog />} />

            {/* Positions */}
            <Route path={ROUTES.admin.positions.list} element={<PositionsList />} />
            <Route path={ROUTES.admin.positions.create} element={<PositionFormDialog />} />
            <Route path={ROUTES.admin.positions.show} element={<PositionFormDialog />} />
            <Route path={ROUTES.admin.positions.edit} element={<PositionFormDialog />} />
            
            {/* Employees */}
            <Route path={ROUTES.admin.employees.list} element={<EmployeesList />} />
            <Route path={ROUTES.admin.employees.create} element={<EmployeeFormDialog />} />
            <Route path={ROUTES.admin.employees.show} element={<EmployeeFormDialog />} />
            <Route path={ROUTES.admin.employees.edit} element={<EmployeeFormDialog />} />
            
            {/* Vehicles */}
            <Route path={ROUTES.admin.vehicles.list} element={<VehiclesList />} />
            <Route path={ROUTES.admin.vehicles.create} element={<VehicleFormDialog />} />
            <Route path={ROUTES.admin.vehicles.show} element={<VehicleFormDialog />} />
            <Route path={ROUTES.admin.vehicles.edit} element={<VehicleFormDialog />} />
            
            {/* Trips */}
            <Route path={ROUTES.admin.trips.list} element={<TripsList />} />
            <Route path={ROUTES.admin.trips.create} element={<TripFormDialog />} />
            <Route path={ROUTES.admin.trips.show} element={<TripFormDialog />} />
            <Route path={ROUTES.admin.trips.edit} element={<TripFormDialog />} />

            <Route path={ROUTES.admin.customers.list} element={<CustomersList />} />
            <Route path={ROUTES.admin.customers.create} element={<CustomerFormDialog />} />
            <Route path={ROUTES.admin.customers.show} element={<CustomerFormDialog />} />
            <Route path={ROUTES.admin.customers.edit} element={<CustomerFormDialog />} />

            <Route path={ROUTES.admin.drivers.list} element={<DriversList />} />
            <Route path={ROUTES.admin.drivers.create} element={<DriverFormDialog />} />
            <Route path={ROUTES.admin.drivers.show} element={<DriverFormDialog />} />
            <Route path={ROUTES.admin.drivers.edit} element={<DriverFormDialog />} />

            <Route path={ROUTES.admin.invoices.list} element={<InvoicesList />} />
            <Route path={ROUTES.admin.invoices.create} element={<InvoiceFormDialog />} />
            <Route path={ROUTES.admin.invoices.show} element={<InvoiceFormDialog />} />
            <Route path={ROUTES.admin.invoices.edit} element={<InvoiceFormDialog />} />

            <Route path={ROUTES.admin.vehicle_assignments.list} element={<VehicleAssignmentsList />} />
            <Route path={ROUTES.admin.vehicle_assignments.create} element={<VehicleAssignmentFormDialog />} />
            <Route path={ROUTES.admin.vehicle_assignments.show} element={<VehicleAssignmentFormDialog />} />
            <Route path={ROUTES.admin.vehicle_assignments.edit} element={<VehicleAssignmentFormDialog />} />

            <Route path={ROUTES.admin.vehicle_expenses.list} element={<VehicleExpensesList />} />
            <Route path={ROUTES.admin.vehicle_expenses.create} element={<VehicleExpenseFormDialog />} />
            <Route path={ROUTES.admin.vehicle_expenses.show} element={<VehicleExpenseFormDialog />} />
            <Route path={ROUTES.admin.vehicle_expenses.edit} element={<VehicleExpenseFormDialog />} />

            <Route path={ROUTES.admin.allowances.list} element={<AllowancesList />} />
            <Route path={ROUTES.admin.allowances.create} element={<AllowanceFormDialog />} />
            <Route path={ROUTES.admin.allowances.show} element={<AllowanceFormDialog />} />
            <Route path={ROUTES.admin.allowances.edit} element={<AllowanceFormDialog />} />

            <Route path={ROUTES.admin.deductions.list} element={<DeductionsList />} />
            <Route path={ROUTES.admin.deductions.create} element={<DeductionFormDialog />} />
            <Route path={ROUTES.admin.deductions.show} element={<DeductionFormDialog />} />
            <Route path={ROUTES.admin.deductions.edit} element={<DeductionFormDialog />} />

            <Route path={ROUTES.admin.attendances.list} element={<AttendancesList />} />
            <Route path={ROUTES.admin.attendances.create} element={<AttendanceFormDialog />} />
            <Route path={ROUTES.admin.attendances.show} element={<AttendanceFormDialog />} />
            <Route path={ROUTES.admin.attendances.edit} element={<AttendanceFormDialog />} />
            
            {/* Payrolls */}
            <Route path={ROUTES.admin.payrolls.list} element={<PayrollsList />} />
            <Route path={ROUTES.admin.payrolls.create} element={<PayrollFormDialog />} />
            <Route path={ROUTES.admin.payrolls.show} element={<PayrollFormDialog />} />
            <Route path={ROUTES.admin.payrolls.edit} element={<PayrollFormDialog />} />
            
            {/* Reports */}
            <Route path={ROUTES.admin.reports.list} element={<Reports />} />
            
            {/* Users */}
            <Route
              path={ROUTES.admin.users.list}
              element={
                <ProtectedRoute requiredRole="admin">
                  <UsersList />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.users.create}
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserFormDialog />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.users.show}
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserFormDialog />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.users.edit}
              element={
                <ProtectedRoute requiredRole="admin">
                  <UserFormDialog />
                </ProtectedRoute>
              }
            />

            <Route
              path={ROUTES.admin.roles.list}
              element={
                <ProtectedRoute requiredRole="admin">
                  <RolesList />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.roles.create}
              element={
                <ProtectedRoute requiredRole="admin">
                  <RoleFormDialog />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.roles.show}
              element={
                <ProtectedRoute requiredRole="admin">
                  <RoleFormDialog />
                </ProtectedRoute>
              }
            />
            <Route
              path={ROUTES.admin.roles.edit}
              element={
                <ProtectedRoute requiredRole="admin">
                  <RoleFormDialog />
                </ProtectedRoute>
              }
            />
            
              {/* System */}
              <Route path={ROUTES.admin.profile} element={<Profile />} />
              <Route path={ROUTES.admin.settings} element={<Settings />} />
            </Route>
            <Route path={ROUTES.notFound} element={<NotFound />} />
          </Routes>
        </Suspense>
        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
        <Toaster position="top-right" />
        <ShadcnToaster />
      </Refine>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
