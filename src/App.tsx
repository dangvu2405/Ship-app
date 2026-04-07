import { Refine, Authenticated } from '@refinedev/core';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ConfigProvider, theme as antdTheme } from 'antd';
import { Toaster } from 'react-hot-toast';
import { Fragment, Suspense, useEffect } from 'react';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { AppLayout } from './layouts/AppLayout';
import { useAppStore } from './stores/app.store';
import { ROUTES } from '@/routes';
import { appNotificationProvider } from './providers/notificationProvider';
import {
  AppPages,
  crudRoutes,
  renderCrudElement,
  renderSingleElement,
  singleRoutes,
} from './routes/appRouteConfig';

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
            <Route path={ROUTES.login} element={<AppPages.LoginForm />} />
            <Route path={ROUTES.register} element={<AppPages.RegisterForm />} />
            <Route
              element={
                <Authenticated key="authenticated-layout" fallback={<Navigate to={ROUTES.login} replace />}>
                  <AppLayout />
                </Authenticated>
              }
            >
              <Route index element={<Navigate to={ROUTES.dashboard} replace />} />
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
            </Route>
            <Route path={ROUTES.notFound} element={<AppPages.NotFound />} />
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
