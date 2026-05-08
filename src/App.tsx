import { Refine, Authenticated } from '@refinedev/core';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from './lib/query-client';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
import { shipEnterpriseTheme } from '@/providers/theme-provider';
import { Toaster } from 'react-hot-toast';
import { Fragment, Suspense, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearAuthToken } from '@/lib/auth-session';
import { useAuthStore } from '@/stores/auth.store';
import { antdUtils } from './utils/antdGlobal';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { ROUTES } from '@/routes';
import { useAppNotificationProvider } from './providers/notificationProvider';
import {
  AppPages,
  crudRoutes,
  renderCrudElement,
  renderSingleElement,
  singleRoutes,
} from './routes/appRouteConfig';

function TenantGuard({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}

function AppContent() {
  const navigate = useNavigate();
  const { message, notification, modal } = AntdApp.useApp();
  const notificationProvider = useAppNotificationProvider();

  useEffect(() => {
    const handler = () => {
      // Ensure local cleanup and navigate to login when session force-logout occurs.
      try {
        clearAuthToken();
      } catch {}
      try {
        useAuthStore.getState().setUser(null);
      } catch {}
      navigate(ROUTES.login);
    };

    window.addEventListener('auth:force-logout', handler);
    return () => window.removeEventListener('auth:force-logout', handler);
  }, [navigate]);

  useEffect(() => {
    antdUtils.setMessageInstance(message);
    antdUtils.setNotificationInstance(notification);
    antdUtils.setModalInstance(modal);
  }, [message, notification, modal]);

  return (
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
      <TenantGuard>
        <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
          <Routes>
            <Route path={ROUTES.login} element={<AppPages.LoginForm />} />
            <Route path={ROUTES.noRoleAccess} element={<AppPages.NoRoleAccessPage />} />
            <Route path={ROUTES.register} element={<AppPages.RegisterForm />} />
            <Route path={ROUTES.forgotPassword} element={<AppPages.ForgotPasswordForm />} />
            <Route path={ROUTES.forgotPasswordVerify} element={<AppPages.ForgotPasswordVerifyForm />} />
            <Route path={ROUTES.selectTenant} element={<AppPages.TenantSelector />} />
            <Route
              element={
                <Authenticated key="authenticated-layout" fallback={<Navigate to={ROUTES.login} replace />}>
                  <AppLayout />
                </Authenticated>
              }
            >
              <Route path={ROUTES.root} element={<Navigate to={ROUTES.dashboard} replace />} />
              <Route path={ROUTES.dashboard} element={<AppPages.Dashboard />} />

              {crudRoutes.map((config) => (
                <Fragment key={config.key}>
                  <Route path={config.routes.list} element={renderCrudElement(config, 'list')} />
                  <Route path={config.routes.create} element={renderCrudElement(config, 'create')} />
                  <Route path={config.routes.show} element={renderCrudElement(config, 'show')} />
                  <Route path={config.routes.edit} element={renderCrudElement(config, 'edit')} />
                </Fragment>
              ))}

              {singleRoutes.map((config) => (
                <Route key={config.key} path={config.path} element={renderSingleElement(config)} />
              ))}

              <Route path="*" element={<AppPages.NotFound />} />
            </Route>
          </Routes>
        </Suspense>
        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
        <Toaster position="top-right" />
      </TenantGuard>
    </Refine>
  );
}

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const { defaultAlgorithm, darkAlgorithm } = antdTheme;

  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <ConfigProvider
        theme={{
          ...shipEnterpriseTheme,
          algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
        }}
      >
        <AntdApp>
          <QueryClientProvider client={queryClient}>
            <AppContent />
          </QueryClientProvider>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
