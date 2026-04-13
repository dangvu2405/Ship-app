import { Fragment, Suspense, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Layout, theme } from 'antd';
import { AppLoadingSpin } from '@/components/common/AppLoadingSpin';
import { AppSidebarContent } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { FloatingChatAssistant } from '@/components/common/FloatingChatAssistant';
import { useAppStore } from '@/stores/app.store';

const { Sider, Content, Header } = Layout;

export function AppLayout() {
  const { sidebarOpen, setSidebarOpen, toggleSidebar } = useAppStore();
  const { token } = theme.useToken();
  const collapsed = !sidebarOpen;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'b' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        toggleSidebar();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [toggleSidebar]);

  return (
    <Fragment>
      <Layout style={{ minHeight: '100vh' }}>
        <Sider
          width={260}
          collapsed={collapsed}
          onCollapse={(c) => setSidebarOpen(!c)}
          collapsible
          breakpoint="lg"
          collapsedWidth={72}
          style={{
            overflow: 'hidden',
            height: '100vh',
            position: 'sticky',
            top: 0,
            left: 0,
            borderRight: `1px solid ${token.colorSplit}`,
          }}
        >
          <AppSidebarContent collapsed={collapsed} />
        </Sider>
        <Layout style={{ minHeight: '100vh' }}>
          <Header
            style={{
              position: 'sticky',
              top: 0,
              zIndex: 50,
              paddingInline: 0,
              height: 56,
              lineHeight: '56px',
              background: token.colorBgContainer,
              borderBottom: `1px solid ${token.colorSplit}`,
            }}
          >
            <SiteHeader sidebarCollapsed={collapsed} onToggleSidebar={toggleSidebar} />
          </Header>
          <Content
            style={{
              margin: 0,
              minHeight: 280,
              background: token.colorFillAlter,
            }}
          >
            <div
              style={{
                position: 'relative',
                minHeight: '100%',
                background: `radial-gradient(circle at top right, ${token.colorPrimary}14, transparent 40%), radial-gradient(circle at bottom left, ${token.colorSuccess}12, transparent 35%)`,
              }}
            >
              <div
                style={{
                  margin: '0 auto',
                  width: '100%',
                  maxWidth: 1600,
                  padding: '16px 16px 24px',
                }}
              >
                <Suspense fallback={<AppLoadingSpin variant="outlet" />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </Content>
        </Layout>
      </Layout>
      <FloatingChatAssistant />
    </Fragment>
  );
}
