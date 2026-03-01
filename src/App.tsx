import { Refine, Authenticated } from '@refinedev/core';
import { notificationProvider } from '@refinedev/antd';
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
        notificationProvider={notificationProvider}
        options={{
          syncWithLocation: true,
          warnWhenUnsavedChanges: true,
          useNewQueryKeys: true,
          projectId: 'ship-erp-system',
        }}
      >
        <Routes>
          <Route path="/login" element={<LoginForm />} />
          <Route
            element={
              <Authenticated key="authenticated-layout" fallback={<Navigate to="/login" replace />}>
                <AppLayout />
              </Authenticated>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            
            {/* Companies */}
            <Route path="/admin/companies" element={<CompaniesList />} />
            <Route path="/admin/companies/create" element={<CompanyFormDialog />} />
            <Route path="/admin/companies/edit/:id" element={<CompanyFormDialog />} />
            
            {/* Employees */}
            <Route path="/admin/employees" element={<EmployeesList />} />
            <Route path="/admin/employees/create" element={<EmployeeFormDialog />} />
            <Route path="/admin/employees/edit/:id" element={<EmployeeFormDialog />} />
            
            {/* Vehicles */}
            <Route path="/admin/vehicles" element={<VehiclesList />} />
            <Route path="/admin/vehicles/create" element={<VehicleFormDialog />} />
            <Route path="/admin/vehicles/edit/:id" element={<VehicleFormDialog />} />
            
            {/* Trips */}
            <Route path="/admin/trips" element={<TripsList />} />
            <Route path="/admin/trips/create" element={<TripFormDialog />} />
            <Route path="/admin/trips/edit/:id" element={<TripFormDialog />} />
            
            {/* Payrolls */}
            <Route path="/admin/payrolls" element={<PayrollsList />} />
            <Route path="/admin/payrolls/create" element={<PayrollFormDialog />} />
            <Route path="/admin/payrolls/edit/:id" element={<PayrollFormDialog />} />
            
            {/* Reports */}
            <Route path="/admin/reports" element={<Reports />} />
            
            {/* Users */}
            <Route path="/admin/users" element={<UsersList />} />
            <Route path="/admin/users/create" element={<UserFormDialog />} />
            <Route path="/admin/users/edit/:id" element={<UserFormDialog />} />
            
            {/* System */}
            <Route path="/admin/profile" element={<Profile />} />
            <Route path="/admin/settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<NotFound />} />
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
