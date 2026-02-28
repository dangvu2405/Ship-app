import { Refine, Authenticated } from '@refinedev/core';
import { RefineThemes, ThemedLayoutV2, ThemedSiderV2, notificationProvider } from '@refinedev/antd';
import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
import { BrowserRouter, Routes, Route, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import { Toaster } from 'react-hot-toast';
import { Toaster as ShadcnToaster } from '@/components/ui/toaster';
import { authProvider } from './providers/authProvider';
import { dataProvider } from './providers/dataProvider';
import { resources } from './providers/resources';
import { LoginForm } from './pages/auth/login-form';
import Dashboard from './pages/dashboard/dashboard';
import { Users } from './pages/system/Users';
import { Profile } from './pages/system/Profile';
import { Settings } from './pages/system/Settings';
import { Header } from './components/layout';
import { useAppStore } from './stores/app.store';
import { useEffect } from 'react';
import '@refinedev/antd/dist/reset.css';

// Header wrapper component
const HeaderWrapper = () => {
  const navigate = useNavigate();
  
  return (
    <Header
      logoText="Ship ERP System"
      showSearch
      showNotifications
      showThemeToggle
      onLogoClick={() => navigate('/dashboard')}
    />
  );
};

function App() {
  const { theme } = useAppStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <BrowserRouter>
      <ConfigProvider
        theme={{
          ...RefineThemes.Blue,
          algorithm: theme === 'dark' ? RefineThemes.Blue.algorithm : undefined,
        }}
      >
        <AntdApp>
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
                    <ThemedLayoutV2
                      Sider={(props) => <ThemedSiderV2 {...props} fixed />}
                      Header={HeaderWrapper}
                    >
                      <Outlet />
                    </ThemedLayoutV2>
                  </Authenticated>
                }
              >
                <Route index element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/admin/users" element={<Users />} />
                <Route path="/admin/profile" element={<Profile />} />
                <Route path="/admin/settings" element={<Settings />} />
              </Route>
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
            <UnsavedChangesNotifier />
            <DocumentTitleHandler />
            <Toaster position="top-right" />
            <ShadcnToaster />
          </Refine>
        </AntdApp>
      </ConfigProvider>
    </BrowserRouter>
  );
}

export default App;
