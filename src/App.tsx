import { Refine, Authenticated } from '@refinedev/core';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { LoginForm } from './pages/auth/login-form';
import { RegisterForm } from './pages/auth/register-form';
import Dashboard from './pages/dashboard/dashboard';
import { UsersList } from './pages/users/UsersList';
import { UserFormDialog } from './pages/users/UserFormDialog';
import { RolesList } from './pages/roles/RolesList';
import { RoleFormDialog } from './pages/roles/RoleFormDialog';
import { Profile } from './pages/system/Profile';
import { Settings } from './pages/system/Settings';
import { CompaniesList } from './pages/companies/CompaniesList';
import { CompanyFormDialog } from './pages/companies/CompanyFormDialog';
import { OfficesList } from './pages/offices/OfficesList';
import { OfficeFormDialog } from './pages/offices/OfficeFormDialog';
import { DepartmentsList } from './pages/departments/DepartmentsList';
import { DepartmentFormDialog } from './pages/departments/DepartmentFormDialog';
import { PositionsList } from './pages/positions/PositionsList';
import { PositionFormDialog } from './pages/positions/PositionFormDialog';
import { EmployeesList } from './pages/employees/EmployeesList';
import { EmployeeFormDialog } from './pages/employees/EmployeeFormDialog';
import { VehiclesList } from './pages/vehicles/VehiclesList';
import { VehicleFormDialog } from './pages/vehicles/VehicleFormDialog';
import { TripsList } from './pages/trips/TripsList';
import { TripFormDialog } from './pages/trips/TripFormDialog';
import { CustomersList } from './pages/customers/CustomersList';
import { CustomerFormDialog } from './pages/customers/CustomerFormDialog';
import { DriversList } from './pages/drivers/DriversList';
import { DriverFormDialog } from './pages/drivers/DriverFormDialog';
import { InvoicesList } from './pages/invoices/InvoicesList';
import { InvoiceFormDialog } from './pages/invoices/InvoiceFormDialog';
import { VehicleAssignmentsList } from './pages/vehicle_assignments/VehicleAssignmentsList';
import { VehicleAssignmentFormDialog } from './pages/vehicle_assignments/VehicleAssignmentFormDialog';
import { VehicleExpensesList } from './pages/vehicle_expenses/VehicleExpensesList';
import { VehicleExpenseFormDialog } from './pages/vehicle_expenses/VehicleExpenseFormDialog';
import { AllowancesList } from './pages/allowances/AllowancesList';
import { AllowanceFormDialog } from './pages/allowances/AllowanceFormDialog';
import { DeductionsList } from './pages/deductions/DeductionsList';
import { DeductionFormDialog } from './pages/deductions/DeductionFormDialog';
import { AttendancesList } from './pages/attendances/AttendancesList';
import { AttendanceFormDialog } from './pages/attendances/AttendanceFormDialog';
import { PayrollsList } from './pages/payrolls/PayrollsList';
import { PayrollFormDialog } from './pages/payrolls/PayrollFormDialog';
import { Reports } from './pages/reports/Reports';
import { NotFound } from './pages/404';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { useEffect } from 'react';
import { ROUTES } from '@/routes';
import { appNotificationProvider } from './providers/notificationProvider';
import { ProtectedRoute } from './components/common/ProtectedRoute';

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
