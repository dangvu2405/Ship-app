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
import Dashboard from './pages/dashboard/dashboard';
import { UsersList } from './pages/users/UsersList';
import { UserFormDialog } from './pages/users/UserFormDialog';
import { Profile } from './pages/system/Profile';
import { Settings } from './pages/system/Settings';
import { CompaniesList } from './pages/companies/CompaniesList';
import { CompanyFormDialog } from './pages/companies/CompanyFormDialog';
import { EmployeesList } from './pages/employees/EmployeesList';
import { EmployeeFormDialog } from './pages/employees/EmployeeFormDialog';
import { VehiclesList } from './pages/vehicles/VehiclesList';
import { VehicleFormDialog } from './pages/vehicles/VehicleFormDialog';
import { TripsList } from './pages/trips/TripsList';
import { TripFormDialog } from './pages/trips/TripFormDialog';
import { PayrollsList } from './pages/payrolls/PayrollsList';
import { PayrollFormDialog } from './pages/payrolls/PayrollFormDialog';
import { Reports } from './pages/reports/Reports';
import { NotFound } from './pages/404';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { useEffect } from 'react';
import { ROUTES } from '@/routes';
import { appNotificationProvider } from './providers/notificationProvider';

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
            
            {/* Payrolls */}
            <Route path={ROUTES.admin.payrolls.list} element={<PayrollsList />} />
            <Route path={ROUTES.admin.payrolls.create} element={<PayrollFormDialog />} />
            <Route path={ROUTES.admin.payrolls.show} element={<PayrollFormDialog />} />
            <Route path={ROUTES.admin.payrolls.edit} element={<PayrollFormDialog />} />
            
            {/* Reports */}
            <Route path={ROUTES.admin.reports.list} element={<Reports />} />
            
            {/* Users */}
            <Route path={ROUTES.admin.users.list} element={<UsersList />} />
            <Route path={ROUTES.admin.users.create} element={<UserFormDialog />} />
            <Route path={ROUTES.admin.users.show} element={<UserFormDialog />} />
            <Route path={ROUTES.admin.users.edit} element={<UserFormDialog />} />
            
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
