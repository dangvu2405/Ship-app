import { Refine, Authenticated } from '@refinedev/core';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Toaster } from 'react-hot-toast';
import { Fragment, Suspense, useEffect, type ReactNode } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/query-client';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { useAuthStore } from './stores/auth.store';
import { ROUTES } from '@/routes';
import { appNotificationProvider } from './providers/notificationProvider';
import {
  AppPages,
  crudRoutes,
  renderCrudElement,
  renderSingleElement,
  singleRoutes,
} from './routes/appRouteConfig';
import { AppLoadingSpin } from '@/components/common/AppLoadingSpin';

/** Redirect về /select-tenant nếu user đã đăng nhập nhưng chưa chọn tenant (multi-tenant). */
function TenantGuard({ children }: { children: ReactNode }) {
  const { currentTenantId, pendingTenants } = useAuthStore();
  if (!currentTenantId && pendingTenants.length > 0) {
    return <Navigate to={ROUTES.selectTenant} replace />;
  }
  return <>{children}</>;
}

const suspensePage = (node: ReactNode) => (
  <Suspense fallback={<AppLoadingSpin variant="page" />}>{node}</Suspense>
);


function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  const { defaultAlgorithm, darkAlgorithm } = antdTheme;

  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
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
            <Route path={ROUTES.login} element={suspensePage(<AppPages.LoginForm />)} />
            <Route path={ROUTES.register} element={suspensePage(<AppPages.RegisterForm />)} />
            <Route path={ROUTES.forgotPassword} element={suspensePage(<AppPages.ForgotPasswordForm />)} />
            <Route path={ROUTES.forgotPasswordVerify} element={suspensePage(<AppPages.ForgotPasswordVerifyForm />)} />
            {/* Authenticated nhưng chưa chọn tenant — không có AppLayout */}
            <Route
              element={
                <Authenticated key="authenticated-pre-tenant" fallback={<Navigate to={ROUTES.login} replace />}>
                  <Suspense fallback={<AppLoadingSpin variant="page" />}><AppPages.TenantSelector /></Suspense>
                </Authenticated>
              }
              path={ROUTES.selectTenant}
            />
            <Route
              element={
                <Authenticated key="authenticated-layout" fallback={<Navigate to={ROUTES.login} replace />}>
                  <TenantGuard>
                    <AppLayout />
                  </TenantGuard>
                </Authenticated>
              }
            >
              <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
              <Route path={ROUTES.dashboard} element={suspensePage(<AppPages.Dashboard />)} />

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
            </Route>
            <Route path={ROUTES.notFound} element={suspensePage(<AppPages.NotFound />)} />
          </Routes>
        <UnsavedChangesNotifier />
        <DocumentTitleHandler />
        <Toaster position="top-right" />
      </Refine>
      </ConfigProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
