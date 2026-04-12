import { Fragment, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { AppLoadingSpin } from '@/components/common/AppLoadingSpin';
import { AppSidebar } from '@/components/app-sidebar';
import { SiteHeader } from '@/components/site-header';
import { FloatingChatAssistant } from '@/components/common/FloatingChatAssistant';
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar';

export function AppLayout() {
  return (
    <Fragment>
      <SidebarProvider>
        <AppSidebar />
        <SidebarInset>
          <SiteHeader />
          <div className="relative flex flex-1 flex-col bg-muted/20">
            <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.08),transparent_40%),radial-gradient(circle_at_bottom_left,hsl(var(--success)/0.06),transparent_35%)]" />
            <div className="@container/main relative flex flex-1 flex-col gap-2">
              <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-4 px-4 py-4 md:gap-6 md:py-6 lg:px-6">
                <Suspense fallback={<AppLoadingSpin variant="outlet" />}>
                  <Outlet />
                </Suspense>
              </div>
            </div>
          </div>
        </SidebarInset>
      </SidebarProvider>
      <FloatingChatAssistant />
    </Fragment>
  );
}
