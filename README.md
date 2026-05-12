# Ship ERP — Admin Dashboard

A production-grade ERP admin dashboard for HR, Fleet, and Payroll management built with React 18, TypeScript, Ant Design 5, and the [Refine](https://refine.dev/) meta-framework.

## Tech Stack

| Concern | Library |
|---|---|
| Framework | React 18 + [Refine v4](https://refine.dev/) |
| Language | TypeScript 5 (strict mode) |
| Build tool | Vite 7 |
| UI components | Ant Design v5 + `@refinedev/antd` |
| Styling | TailwindCSS v3 + SCSS |
| Routing | React Router v6 (managed by Refine) |
| Global state | Zustand (persisted to localStorage) |
| Server state | TanStack React Query v5 |
| HTTP client | Axios (with interceptors) |
| Charts | Recharts |
| Validation | Zod v4 |
| i18n | Custom hook — locales in `src/locales/` |
| Notifications | React Hot Toast |

## Project Structure

```
src/
├── components/              # Generic, reusable components only
│   ├── common/              # Shared UI (PageHeader, Breadcrumb, loaders, dialogs)
│   │   └── index.ts
│   ├── form/                # Ant Design form field wrappers
│   │   └── index.ts
│   ├── table/               # DataTable, ProfessionalAntTable, Pagination
│   │   └── index.ts
│   └── ui/                  # Chart helpers (Recharts wrapper)
│
├── layouts/                 # App layout components
│   ├── AppLayout.tsx        # Root layout (Sider + Header + Content)
│   ├── AppSidebar.tsx       # Navigation sidebar with menu items
│   ├── SiteHeader.tsx       # Top header (search, theme toggle, notifications)
│   ├── NavUser.tsx          # User avatar / profile dropdown
│   └── index.ts
│
├── pages/                   # Route pages, feature-based
│   ├── auth/                # login, register, forgot-password, tenant-selector
│   ├── dashboard/
│   │   ├── components/      # Dashboard-specific components
│   │   │   ├── ChartAreaInteractive.tsx
│   │   │   ├── DashboardChartSkeleton.tsx
│   │   │   ├── DashboardRevenueByOffice.tsx
│   │   │   ├── SectionCards.tsx
│   │   │   └── index.ts
│   │   └── dashboard.tsx
│   ├── drivers/
│   │   ├── components/      # Driver scheduling UI
│   │   │   ├── ApplyScheduleModal.tsx
│   │   │   ├── ScheduleDayCell.tsx
│   │   │   ├── driver-schedule-modals.tsx
│   │   │   ├── driver-schedule.constants.ts
│   │   │   └── index.ts
│   │   ├── DriversList.tsx
│   │   ├── DriverFormDialog.tsx
│   │   ├── DriverSchedulePage.tsx
│   │   ├── DriverScheduleBulkPage.tsx
│   │   └── use-driver-schedule-page.tsx
│   ├── payrolls/
│   │   ├── components/      # Payroll-specific components
│   │   │   ├── PayrollSIBreakdown.tsx
│   │   │   └── index.ts
│   │   ├── PayrollsList.tsx
│   │   ├── PayrollDetailPage.tsx
│   │   └── PayrollFormDialog.tsx
│   ├── system/
│   │   ├── components/      # Workforce ops UI primitives
│   │   │   ├── workforce-ops-ui.tsx
│   │   │   ├── workforce-ops.constants.ts
│   │   │   └── index.ts
│   │   └── WorkforceOps.tsx
│   ├── companies/           # CRUD pages
│   ├── offices/
│   ├── departments/
│   ├── positions/
│   ├── employees/
│   ├── vehicles/
│   ├── trips/
│   ├── invoices/
│   ├── customers/
│   ├── users/
│   ├── roles/
│   ├── leave/
│   ├── overtime/
│   ├── violations/
│   ├── allowances/
│   ├── deductions/
│   ├── reports/
│   └── 404.tsx
│
├── providers/               # Refine providers
│   ├── authProvider.tsx     # Refine auth adapter
│   ├── dataProvider.tsx     # Refine data adapter (Axios-backed)
│   ├── resources.tsx        # Refine resource definitions
│   └── notificationProvider.ts
│
├── routes/
│   ├── index.ts             # ROUTES enum (all path constants)
│   └── appRouteConfig.tsx   # Dynamic CRUD route config for Refine
│
├── services/                # API service layer
│   ├── api.ts               # Axios instance + interceptors
│   ├── endpoints.ts         # All API endpoint constants
│   ├── auth.service.ts
│   ├── payroll.service.ts
│   ├── invoice.service.ts
│   ├── trip.service.ts
│   ├── workforce-ops.service.ts
│   └── ...
│
├── stores/                  # Zustand global state
│   ├── auth.store.ts        # User, token, tenant (persisted)
│   └── app.store.ts         # Theme, sidebar, locale (persisted)
│
├── hooks/                   # Custom React hooks
│   ├── useAuth.ts
│   ├── useTranslation.ts
│   ├── usePermission.ts
│   ├── useResourceListQuery.ts
│   └── ...
│
├── lib/                     # Core infrastructure
│   ├── query-client.ts      # TanStack React Query setup
│   ├── auth-session.ts      # Token storage helpers
│   └── safe-storage.ts      # localStorage/sessionStorage wrapper
│
├── shared/
│   └── query/               # Query key factory (createResourceQueryKeys)
│
├── locales/                 # i18n translation files
│   ├── en.ts
│   └── vi.ts
│
├── types/
│   └── index.ts             # All domain TypeScript types (~723 lines)
│
├── utils/                   # Pure utility functions
│   ├── displayFormat.ts     # Date, money, number formatting
│   ├── vnPayrollCalc.ts     # Vietnamese payroll/tax calculation
│   ├── validation.ts        # Zod schemas
│   ├── errorHandler.ts      # Error parsing & user-friendly messages
│   └── ...
│
├── styles/
│   ├── main.scss            # Global SCSS
│   └── index.css            # Tailwind base + CSS variables
│
├── App.tsx                  # Root component (Refine + Router + Providers)
└── main.tsx                 # Entry point
```

## Getting Started

### Prerequisites

- **Node.js** ≥ 20.19.0 (recommended: 22.12.0+)
- **npm** (latest)
- A running backend API (see `docs/backend.md`)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
# Edit VITE_API_ORIGIN to point at your backend

# 3. Start dev server (port 3000)
npm run dev
```

### Environment Variables

```env
VITE_API_ORIGIN=http://localhost:8080   # Backend origin — no /api suffix
VITE_APP_NAME=Ship ERP
VITE_AUTH_FORGOT_PASSWORD_SEND_ENABLED=true
VITE_AUTH_FORGOT_PASSWORD_VERIFY_ENABLED=true
VITE_AUTO_LOGIN=true                   # Dev only: skip login screen
VITE_DEMO_EMAIL=admin@abctransport.com
VITE_DEMO_PASSWORD=password
```

In development, Vite proxies `/api/*` → `VITE_API_ORIGIN`. No CORS config needed locally.

## Commands

```bash
npm run dev       # Start Vite dev server (HMR, port 3000)
npm run build     # TypeScript check + production build → dist/
npm run preview   # Serve the production build locally
npm run lint      # ESLint — strict, max 0 warnings
npm run knip      # Detect unused files and exports
```

## Architecture

### Routing

All routes are defined in two files:

- [`src/routes/index.ts`](src/routes/index.ts) — `ROUTES` enum with every path constant
- [`src/routes/appRouteConfig.tsx`](src/routes/appRouteConfig.tsx) — lazy-loaded CRUD route config consumed by Refine

Protected routes are wrapped in Refine's `<Authenticated>` guard. Multi-tenant flow redirects to `/select-tenant` before the main layout loads.

### API Layer

1. **Axios instance** ([`src/services/api.ts`](src/services/api.ts)) — attaches Bearer token, handles 401 refresh, shows global error toasts. Custom flags: `skipToast`, `errorMode: 'global' | 'local' | 'silent'`.
2. **Endpoint constants** ([`src/services/endpoints.ts`](src/services/endpoints.ts)) — all API paths in one place.
3. **Service singletons** — one exported singleton per domain (`auth.service.ts`, `payroll.service.ts`, etc.) returning `ApiResponse<T>`.

### State Management

| Store | Key | Contents |
|---|---|---|
| `useAuthStore` | `auth-storage:v1` | user, token, tenants, `isAuthenticated` |
| `useAppStore` | `app-storage:v1` | theme, sidebarOpen, locale |

Server state is handled by TanStack React Query via custom hooks in `src/hooks/`.

### Component Conventions

- `src/components/` — **generic only**: form fields, table wrappers, common UI (PageHeader, loaders, dialogs)
- `src/layouts/` — layout shell: sidebar, header, nav-user
- `src/pages/<feature>/components/` — components used exclusively by that feature
- Barrel `index.ts` in every component directory for clean imports

### i18n

```ts
import { useTranslation } from '@/hooks/useTranslation';
const { t } = useTranslation();
// t('key') pulls from src/locales/en.ts or vi.ts based on app locale
```

Locale is stored in `useAppStore` and toggled via the language switcher in the header.

## Key Domain Features

| Module | Description |
|---|---|
| **HR** | Companies, Offices, Departments, Positions, Employees |
| **Fleet** | Vehicles, Vehicle Assignments, Vehicle Expenses |
| **Drivers** | Driver profiles, scheduling (calendar + bulk), leave/OT/violations |
| **Trips** | Full state machine: pending → assigned → accepted → started → completed |
| **Invoices** | Lifecycle: draft → issued → sent_cqt → paid; PDF export; CQT integration |
| **Payroll** | Monthly batches, BHXH/PIT exports, payslips, Vietnamese tax calculation |
| **Workforce Ops** | Attendance, leave requests, overtime, violations — approval workflows |
| **Users & Roles** | Role-based access control, permission matrix |
| **Reports** | Revenue analytics by office, trip revenue, exportable reports |

## Browser Support

Latest versions of Chrome, Firefox, Safari, and Edge.

## License

MIT
# Frontend Context Export
# Repo: ship-app
# Generated: 2026-05-12T10:09:47.568Z
# Files: 385


===== FILE: src/App.tsx =====
    1|import { Refine, Authenticated } from '@refinedev/core';
    2|import { QueryClientProvider } from '@tanstack/react-query';
    3|import { queryClient } from './lib/query-client';
    4|import routerProvider, { UnsavedChangesNotifier, DocumentTitleHandler } from '@refinedev/react-router-v6';
    5|import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
    6|import { App as AntdApp, ConfigProvider, theme as antdTheme } from 'antd';
    7|import { shipEnterpriseTheme } from '@/providers/theme-provider';
    8|import { Fragment, Suspense, useEffect } from 'react';
    9|import { useNavigate } from 'react-router-dom';
   10|import { clearAuthToken } from '@/lib/auth-session';
   11|import { useAuthStore } from '@/stores/auth.store';
   12|import { antdUtils } from './utils/antdGlobal';
   13|import { authProvider } from './providers/authProvider';
   14|import { dataProvider } from './providers/dataProvider';
   15|import { resources } from './providers/resources';
   16|import { AppLayout } from './layouts/AppLayout';
   17|import { useAppStore } from './stores/app.store';
   18|import { ROUTES } from '@/routes';
   19|import { useAppNotificationProvider } from './providers/notificationProvider';
   20|import { ErrorBoundary } from './components/common/ErrorBoundary';
   21|import {
   22|  AppPages,
   23|  crudRoutes,
   24|  renderCrudElement,
   25|  renderSingleElement,
   26|  singleRoutes,
   27|} from './routes/appRouteConfig';
   28|
   29|function TenantGuard({ children }: { children: React.ReactNode }) {
   30|  const { isAuthenticated, currentTenantId, pendingTenants } = useAuthStore();
   31|
   32|  if (isAuthenticated && currentTenantId == null && pendingTenants.length > 0) {
   33|    return <Navigate to={ROUTES.selectTenant} replace />;
   34|  }
   35|
   36|  return <>{children}</>;
   37|}
   38|
   39|function AppContent() {
   40|  const navigate = useNavigate();
   41|  const { message, notification, modal } = AntdApp.useApp();
   42|  const notificationProvider = useAppNotificationProvider();
   43|
   44|  useEffect(() => {
   45|    const handler = () => {
   46|      // Ensure local cleanup and navigate to login when session force-logout occurs.
   47|      try {
   48|        clearAuthToken();
   49|      } catch (e) {
   50|        // ignore clear token error
   51|      }
   52|      try {
   53|        useAuthStore.getState().setUser(null);
   54|      } catch (e) {
   55|        // ignore store error
   56|      }
   57|      navigate(ROUTES.login);
   58|    };
   59|
   60|    window.addEventListener('auth:force-logout', handler);
   61|    return () => window.removeEventListener('auth:force-logout', handler);
   62|  }, [navigate]);
   63|
   64|  useEffect(() => {
   65|    antdUtils.setMessageInstance(message);
   66|    antdUtils.setNotificationInstance(notification);
   67|    antdUtils.setModalInstance(modal);
   68|  }, [message, notification, modal]);
   69|
   70|  return (
   71|    <ErrorBoundary>
   72|      <Refine
   73|        dataProvider={dataProvider}
   74|        authProvider={authProvider}
   75|        routerProvider={routerProvider}
   76|        resources={resources}
   77|        notificationProvider={notificationProvider}
   78|        options={{
   79|          syncWithLocation: true,
   80|          warnWhenUnsavedChanges: true,
   81|          useNewQueryKeys: true,
   82|          projectId: 'ship-erp-system',
   83|        }}
   84|      >
   85|        <TenantGuard>
   86|          <Suspense fallback={<div className="p-6 text-sm text-muted-foreground">Loading...</div>}>
   87|            <Routes>
   88|              <Route path={ROUTES.login} element={<AppPages.LoginForm />} />
   89|
   90|              <Route path={ROUTES.register} element={<AppPages.RegisterForm />} />
   91|              <Route path={ROUTES.forgotPassword} element={<AppPages.ForgotPasswordForm />} />
   92|              <Route path={ROUTES.forgotPasswordVerify} element={<AppPages.ForgotPasswordVerifyForm />} />
   93|              <Route path={ROUTES.selectTenant} element={<AppPages.TenantSelector />} />
   94|              <Route
   95|                element={
   96|                  <Authenticated key="authenticated-layout" fallback={<Navigate to={ROUTES.login} replace />}>
   97|                    <AppLayout />
   98|                  </Authenticated>
   99|                }
  100|              >
  101|                <Route path={ROUTES.root} element={<Navigate to={ROUTES.dashboard} replace />} />
  102|                <Route path={ROUTES.dashboard} element={<AppPages.Dashboard />} />
  103|
  104|                {crudRoutes.map((config) => (
  105|                  <Fragment key={config.key}>
  106|                    <Route path={config.routes.list} element={renderCrudElement(config, 'list')} />
  107|                    <Route path={config.routes.create} element={renderCrudElement(config, 'create')} />
  108|                    <Route path={config.routes.show} element={renderCrudElement(config, 'show')} />
  109|                    <Route path={config.routes.edit} element={renderCrudElement(config, 'edit')} />
  110|                  </Fragment>
  111|                ))}
  112|
  113|                {singleRoutes.map((config) => (
  114|                  <Route key={config.key} path={config.path} element={renderSingleElement(config)} />
  115|                ))}
  116|
  117|                <Route path="*" element={<AppPages.NotFound />} />
  118|              </Route>
  119|            </Routes>
  120|          </Suspense>
  121|          <UnsavedChangesNotifier />
  122|          <DocumentTitleHandler />
  123|        </TenantGuard>
  124|      </Refine>
  125|    </ErrorBoundary>
  126|  );
  127|}
  128|
  129|function App() {
  130|  const { theme } = useAppStore();
  131|
  132|  useEffect(() => {
  133|    document.documentElement.classList.toggle('dark', theme === 'dark');
  134|  }, [theme]);
  135|
  136|  const { defaultAlgorithm, darkAlgorithm } = antdTheme;
  137|
  138|  return (
  139|    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
  140|      <ConfigProvider
  141|        theme={{
  142|          ...shipEnterpriseTheme,
  143|          algorithm: theme === 'dark' ? darkAlgorithm : defaultAlgorithm,
  144|        }}
  145|      >
  146|        <AntdApp>
  147|          <QueryClientProvider client={queryClient}>
  148|            <AppContent />
  149|          </QueryClientProvider>
  150|        </AntdApp>
  151|      </ConfigProvider>
  152|    </BrowserRouter>
  153|  );
  154|}
  155|
  156|export default App;
  157|

===== FILE: src/assets/styles/_components.scss =====
    1|// Component-specific SCSS styles
    2|// Note: Most styling is now handled by the skeuomorphic design system in index.css
    3|
    4|// ============================================================
    5|// LAYOUT COMPONENTS
    6|// ============================================================
    7|
    8|// Main Layout Container
    9|.layout-container {
   10|  display: flex;
   11|  min-height: 100vh;
   12|  background: hsl(var(--background));
   13|}
   14|
   15|// Sidebar Layout
   16|.layout-sidebar {
   17|  position: fixed;
   18|  top: 0;
   19|  left: 0;
   20|  bottom: 0;
   21|  width: $sidebar-width;
   22|  z-index: $z-fixed;
   23|  transition: width $transition-slow $transition-ease,
   24|              transform $transition-slow $transition-ease;
   25|
   26|  &.collapsed {
   27|    width: $sidebar-width-collapsed;
   28|  }
   29|
   30|  @media (max-width: $breakpoint-lg) {
   31|    width: $sidebar-width-mobile;
   32|    transform: translateX(-100%);
   33|
   34|    &.open {
   35|      transform: translateX(0);
   36|    }
   37|  }
   38|}
   39|
   40|// Main Content Area
   41|.layout-main {
   42|  flex: 1;
   43|  margin-left: $sidebar-width;
   44|  min-height: 100vh;
   45|  display: flex;
   46|  flex-direction: column;
   47|  transition: margin-left $transition-slow $transition-ease;
   48|
   49|  &.sidebar-collapsed {
   50|    margin-left: $sidebar-width-collapsed;
   51|  }
   52|
   53|  @media (max-width: $breakpoint-lg) {
   54|    margin-left: 0;
   55|  }
   56|}
   57|
   58|// Header
   59|.layout-header {
   60|  position: sticky;
   61|  top: 0;
   62|  height: $header-height;
   63|  z-index: $z-sticky;
   64|  display: flex;
   65|  align-items: center;
   66|  padding: 0 $content-padding;
   67|
   68|  @media (max-width: $breakpoint-md) {
   69|    height: $header-height-mobile;
   70|    padding: 0 $content-padding-mobile;
   71|  }
   72|}
   73|
   74|// Page Content
   75|.layout-content {
   76|  flex: 1;
   77|  padding: $content-padding;
   78|  max-width: $content-max-width;
   79|  width: 100%;
   80|  margin: 0 auto;
   81|
   82|  @media (max-width: $breakpoint-md) {
   83|    padding: $content-padding-mobile;
   84|  }
   85|}
   86|
   87|// Footer
   88|.layout-footer {
   89|  height: $footer-height;
   90|  display: flex;
   91|  align-items: center;
   92|  justify-content: center;
   93|  border-top: 1px solid hsl(var(--border));
   94|}
   95|
   96|// ============================================================
   97|// LEGACY COMPONENTS (backward compatibility)
   98|// ============================================================
   99|
  100|// Legacy custom button styles
  101|.btn-custom {
  102|  @apply px-4 py-2 rounded-md font-medium transition-colors;
  103|
  104|  &.primary {
  105|    @apply bg-primary text-primary-foreground;
  106|  }
  107|
  108|  &.secondary {
  109|    @apply bg-secondary text-secondary-foreground hover:bg-secondary/80;
  110|  }
  111|}
  112|
  113|// Card styles
  114|.card {
  115|  @apply bg-card text-card-foreground rounded-lg shadow-md p-6;
  116|}
  117|
  118|// Form styles
  119|.form-group {
  120|  @apply mb-4;
  121|
  122|  label {
  123|    @apply block text-sm font-medium text-foreground mb-1;
  124|  }
  125|}
  126|
  127|// Table styles
  128|.table-wrapper {
  129|  @apply overflow-x-auto;
  130|
  131|  table {
  132|    @apply min-w-full divide-y divide-border;
  133|  }
  134|}
  135|
  136|// ============================================================
  137|// PAGE LAYOUTS
  138|// ============================================================
  139|
  140|// Page with header
  141|.page-container {
  142|  @apply space-y-6;
  143|}
  144|
  145|// Page header
  146|.page-header {
  147|  @apply flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between;
  148|
  149|  &__title {
  150|    @apply text-2xl font-semibold tracking-tight;
  151|  }
  152|
  153|  &__description {
  154|    @apply text-muted-foreground;
  155|  }
  156|
  157|  &__actions {
  158|    @apply flex items-center gap-2;
  159|  }
  160|}
  161|
  162|// Content sections
  163|.content-section {
  164|  @apply bg-card rounded-lg border p-6;
  165|
  166|  &--flush {
  167|    @apply p-0;
  168|  }
  169|}
  170|
  171|// --- List filters: kích thước & typography (Select 180–240px / nút Tìm 140–160px / Đặt lại 100–120px, 14px) ---
  172|.list-page-filters {
  173|  align-items: center;
  174|
  175|  .list-page-filters__search [data-slot='input'],
  176|  .list-page-filters__search input {
  177|    height: 40px !important;
  178|    min-height: 40px !important;
  179|    font-size: 14px !important;
  180|    padding: 0;
  181|  }
  182|
  183|  .list-page-filters__select {
  184|    min-width: 180px;
  185|    max-width: 240px;
  186|    width: clamp(180px, 100%, 240px);
  187|  }
  188|
  189|  // Radix Select (Employees / Vehicles)
  190|  [data-slot='select-trigger'].list-page-filters__radix-select {
  191|    min-width: 180px;
  192|    max-width: 240px;
  193|    width: clamp(180px, 100%, 240px);
  194|    height: 40px !important;
  195|    min-height: 40px !important;
  196|    font-size: 14px !important;
  197|    box-sizing: border-box;
  198|  }
  199|
  200|  .list-page-filters__btn-search {
  201|    min-width: 140px;
  202|    max-width: 160px;
  203|    width: clamp(140px, 100%, 160px);
  204|    height: 40px !important;
  205|    min-height: 40px !important;
  206|    padding-left: 20px !important;
  207|    padding-right: 20px !important;
  208|    font-size: 14px !important;
  209|    font-weight: 500;
  210|  }
  211|
  212|  .list-page-filters__btn-reset {
  213|    min-width: 100px;
  214|    max-width: 120px;
  215|    width: clamp(100px, 100%, 120px);
  216|    height: 40px !important;
  217|    min-height: 40px !important;
  218|    font-size: 14px !important;
  219|  }
  220|
  221|  .list-page-filters__search {
  222|    min-width: 0;
  223|    display: flex;
  224|    align-items: center;
  225|    gap: 0.5rem;
  226|  }
  227|
  228|  // === Modifier: grid 2 cột (Search + select) ===
  229|  &--grid-2 {
  230|    display: grid;
  231|    grid-template-columns: 1fr;
  232|    gap: 12px;
  233|
  234|    @media (min-width: 768px) {
  235|      &:has(> :only-child) {
  236|        grid-template-columns: minmax(0, 1fr);
  237|      }
  238|
  239|      &:not(:has(> :only-child)) {
  240|        grid-template-columns: minmax(0, 1fr) minmax(180px, 280px);
  241|        align-items: center;
  242|      }
  243|    }
  244|  }
  245|
  246|  // === Modifier: grid 6 cột (Search + nhiều control + Tìm + Đặt lại) ===
  247|  &--grid-6 {
  248|    display: grid;
  249|    grid-template-columns: 1fr;
  250|    gap: 12px;
  251|
  252|    @media (min-width: 1024px) {
  253|      grid-template-columns:
  254|        minmax(200px, 1.5fr)
  255|        minmax(140px, 1fr)
  256|        minmax(140px, 1fr)
  257|        minmax(140px, 1fr)
  258|        minmax(140px, max-content)
  259|        minmax(100px, max-content);
  260|    }
  261|  }
  262|
  263|  // === Modifier: grid 4 cột (Search + control + Tìm + Đặt lại) ===
  264|  &--grid-4 {
  265|    display: grid;
  266|    grid-template-columns: 1fr;
  267|    gap: 12px;
  268|
  269|    @media (min-width: 768px) {
  270|      &:has(> .list-page-filters__search):has(> :nth-child(4):last-child) {
  271|        grid-template-columns:
  272|          minmax(300px, 3fr) minmax(200px, 240px) minmax(140px, max-content) minmax(100px, max-content);
  273|      }
  274|
  275|      &:not(:has(> .list-page-filters__search)):has(> :nth-child(4):last-child) {
  276|        grid-template-columns:
  277|          minmax(200px, 1.15fr) minmax(200px, 1.15fr) minmax(140px, max-content) minmax(100px, max-content);
  278|      }
  279|    }
  280|  }
  281|
  282|  // === Modifier: grid 3 cột (Search + Tìm + Đặt lại, không select) ===
  283|  &--grid-3 {
  284|    display: grid;
  285|    grid-template-columns: 1fr;
  286|    gap: 12px;
  287|
  288|    @media (min-width: 768px) {
  289|      grid-template-columns: minmax(320px, 1fr) minmax(140px, max-content) minmax(100px, max-content);
  290|    }
  291|  }
  292|
  293|  // === Modifier: Trips — 2 select trái + nút phải ===
  294|  &--dual-entity {
  295|    display: flex;
  296|    min-width: 0;
  297|    flex-direction: column;
  298|    gap: 12px;
  299|
  300|    @media (min-width: 640px) {
  301|      flex-direction: row;
  302|      align-items: flex-end;
  303|      justify-content: space-between;
  304|    }
  305|
  306|    .list-page-filters__select.ant-select {
  307|      min-width: 120px;
  308|      max-width: none;
  309|      width: 100%;
  310|    }
  311|  }
  312|
  313|  &__select-row {
  314|    display: grid;
  315|    min-width: 0;
  316|    width: 100%;
  317|    grid-template-columns: 1fr;
  318|    gap: 12px;
  319|
  320|    @media (min-width: 640px) {
  321|      min-width: 0;
  322|      flex: 1;
  323|      grid-template-columns: repeat(2, minmax(120px, 1fr));
  324|    }
  325|  }
  326|
  327|  &__btn-row {
  328|    display: flex;
  329|    min-width: 0;
  330|    flex-shrink: 0;
  331|    flex-wrap: wrap;
  332|    align-items: center;
  333|    justify-content: flex-end;
  334|    gap: 8px;
  335|  }
  336|}
  337|
  338|@keyframes auth-fade-in {
  339|  from { opacity: 0; transform: translateY(6px); }
  340|  to   { opacity: 1; transform: translateY(0); }
  341|}
  342|
  343|.auth-screen {
  344|  min-height: 100vh;
  345|  padding: 20px;
  346|  animation: auth-fade-in 0.22s ease both;
  347|
  348|  @media (min-width: 768px) {
  349|    padding: 28px;
  350|  }
  351|
  352|  @media (min-width: 1024px) {
  353|    display: flex;
  354|    align-items: center;
  355|    justify-content: center;
  356|    padding: 40px;
  357|  }
  358|
  359|  &__card.ant-card {
  360|    width: min(100%, 1060px);
  361|    border-radius: 20px;
  362|    overflow: hidden;
  363|  }
  364|
  365|  &__layout {
  366|    display: flex;
  367|    min-height: 560px;
  368|  }
  369|
  370|  &__hero {
  371|    display: none;
  372|
  373|    @media (min-width: 1024px) {
  374|      display: block;
  375|      flex: 1.5;
  376|      background: linear-gradient(145deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%);
  377|    }
  378|  }
  379|
  380|  &__hero-image {
  381|    width: 100%;
  382|    height: 100%;
  383|    object-fit: cover;
  384|    opacity: 0.95;
  385|  }
  386|
  387|  &__panel {
  388|    position: relative;
  389|    display: flex;
  390|    width: 100%;
  391|    flex-shrink: 0;
  392|    flex-direction: column;
  393|    justify-content: center;
  394|    background: #ffffff;
  395|    padding: 40px 32px 68px;
  396|
  397|    @media (min-width: 1024px) {
  398|      width: clamp(400px, 38vw, 456px);
  399|      padding: 48px 40px 68px;
  400|    }
  401|
  402|    @media (min-width: 1280px) {
  403|      width: 456px;
  404|      padding: 48px;
  405|    }
  406|  }
  407|
  408|  &__content {
  409|    display: flex;
  410|    flex-direction: column;
  411|    gap: 48px;
  412|  }
  413|
  414|  &__brand {
  415|    display: flex;
  416|    align-items: center;
  417|    gap: 12px;
  418|  }
  419|
  420|  &__brand-mark {
  421|    width: 40px;
  422|    height: 40px;
  423|    border-radius: 9999px;
  424|    background: linear-gradient(135deg, #7d73ff 0%, #ffb36b 100%);
  425|  }
  426|
  427|  &__brand-text {
  428|    font-size: 16px;
  429|    font-weight: 600;
  430|    color: #1a1a1a;
  431|  }
  432|
  433|  &__switch-auth {
  434|    text-align: center;
  435|    font-size: 12px;
  436|    color: #1a1a1a;
  437|  }
  438|
  439|  &__link {
  440|    color: #007aff;
  441|  }
  442|
  443|  &__footer {
  444|    position: absolute;
  445|    bottom: 24px;
  446|    left: 32px;
  447|    right: 32px;
  448|    font-size: 12px;
  449|    color: #666666;
  450|
  451|    @media (min-width: 1024px) {
  452|      left: 40px;
  453|      right: 40px;
  454|    }
  455|
  456|    @media (min-width: 1280px) {
  457|      left: 48px;
  458|      right: 48px;
  459|    }
  460|  }
  461|}
  462|
  463|// --- CONVENTION §3.6 Dispatch board ---
  464|.dispatch-board {
  465|  min-width: 0;
  466|
  467|  .ant-row {
  468|    align-items: stretch;
  469|  }
  470|}
  471|
  472|// --- Enterprise list layout (pixel-close baseline) ---
  473|.enterprise-page {
  474|  .enterprise-section-card.ant-card {
  475|    border-radius: 12px;
  476|    border: 1px solid #e5e7eb;
  477|    box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
  478|
  479|    .ant-card-body {
  480|      padding: 16px;
  481|    }
  482|  }
  483|
  484|  .enterprise-filter-bar {
  485|    border: 1px solid #eef2f7;
  486|    border-radius: 10px;
  487|    padding: 10px;
  488|    background: #fff;
  489|  }
  490|
  491|  .enterprise-kpi-grid {
  492|    display: grid;
  493|    grid-template-columns: repeat(1, minmax(0, 1fr));
  494|    gap: 10px;
  495|  }
  496|
  497|  @media (min-width: 992px) {
  498|    .enterprise-kpi-grid {
  499|      grid-template-columns: repeat(4, minmax(0, 1fr));
  500|    }
  501|  }
  502|
  503|  .enterprise-kpi-card.ant-card {
  504|    border-radius: 10px;
  505|    border: 1px solid #eef2f7;
  506|
  507|    .ant-card-body {
  508|      padding: 10px 12px;
  509|    }
  510|  }
  511|
  512|  .enterprise-table.ant-table-wrapper {
  513|    .ant-table-thead > tr > th {
  514|      font-size: 11px;
  515|      font-weight: 600;
  516|      text-transform: uppercase;
  517|      color: #475569;
  518|      background: #fff;
  519|      padding-top: 10px;
  520|      padding-bottom: 10px;
  521|    }
  522|
  523|    .ant-table-tbody > tr > td {
  524|      padding-top: 10px;
  525|      padding-bottom: 10px;
  526|      font-size: 13px;
  527|      line-height: 1.35;
  528|    }
  529|  }
  530|}
  531|
  532|.dispatch-board {
  533|  .dispatch-meta {
  534|    font-size: 11px;
  535|    line-height: 16px;
  536|  }
  537|
  538|  .dispatch-column-card.ant-card {
  539|    .ant-card-head {
  540|      min-height: 38px;
  541|      padding: 0 10px;
  542|    }
  543|
  544|    .ant-card-head-title {
  545|      padding: 8px 0;
  546|      font-size: 12px;
  547|      font-weight: 600;
  548|      line-height: 18px;
  549|    }
  550|
  551|    .ant-card-body {
  552|      padding: 8px;
  553|    }
  554|  }
  555|
  556|  .dispatch-item-card.ant-card {
  557|    .ant-card-body {
  558|      padding: 10px;
  559|    }
  560|  }
  561|}
  562|
  563|.vehicles-page,
  564|.trips-page {
  565|  .enterprise-filter-bar {
  566|    padding: 8px 10px;
  567|  }
  568|
  569|  .enterprise-title {
  570|    font-size: 18px;
  571|    line-height: 24px;
  572|    font-weight: 700;
  573|  }
  574|
  575|  .enterprise-record-count {
  576|    font-size: 12px;
  577|    line-height: 18px;
  578|  }
  579|}
  580|

===== FILE: src/styles/main.scss =====
    1|@import '../assets/styles/main.scss';
    2|

===== FILE: src/styles/utilities.scss =====
    1|// Utility SCSS classes
    2|
    3|// Text utilities
    4|.text-truncate {
    5|  overflow: hidden;
    6|  text-overflow: ellipsis;
    7|  white-space: nowrap;
    8|}
    9|
   10|// Spacing utilities
   11|$spacings: (
   12|  "none": 0,
   13|  "xs": $spacing-xs,
   14|  "sm": $spacing-sm,
   15|  "md": $spacing-md,
   16|  "lg": $spacing-lg,
   17|  "xl": $spacing-xl,
   18|  "xxl": $spacing-xxl
   19|);
   20|
   21|@each $name, $value in $spacings {
   22|  // Margin
   23|  .m-#{$name} { margin: $value !important; }
   24|  .mt-#{$name} { margin-top: $value !important; }
   25|  .mb-#{$name} { margin-bottom: $value !important; }
   26|  .ml-#{$name} { margin-left: $value !important; }
   27|  .mr-#{$name} { margin-right: $value !important; }
   28|
   29|  // Padding
   30|  .p-#{$name} { padding: $value !important; }
   31|  .pt-#{$name} { padding-top: $value !important; }
   32|  .pb-#{$name} { padding-bottom: $value !important; }
   33|  .pl-#{$name} { padding-left: $value !important; }
   34|  .pr-#{$name} { padding-right: $value !important; }
   35|}
   36|
   37|// Chống chồng chéo cho các phần tử xếp dọc (Stacking)
   38|.stack-space {
   39|  display: flex;
   40|  flex-direction: column;
   41|  gap: $spacing-md; // Mặc định 16px giữa các item
   42|}
   43|
   44|// Flex utilities
   45|.flex-center {
   46|  display: flex;
   47|  align-items: center;
   48|  justify-content: center;
   49|}
   50|
   51|// Animation utilities
   52|.fade-in {
   53|  animation: fadeIn $transition-base ease-in;
   54|}
   55|
   56|@keyframes fadeIn {
   57|  from {
   58|    opacity: 0;
   59|  }
   60|  to {
   61|    opacity: 1;
   62|  }
   63|}
   64|

===== FILE: src/styles/variables.scss =====
    1|// SCSS Variables - Shared across the application
    2|// These variables are automatically imported via vite.config.ts
    3|
    4|// Colors - kept in sync with CSS custom properties in index.css
    5|// --primary: 215 80% 48%  --success: 152 60% 42%  --warning: 38 92% 50%
    6|// --destructive: 0 72% 51%  --info: 200 80% 50%
    7|$primary-color: hsl(215, 80%, 48%);
    8|$success-color: hsl(152, 60%, 42%);
    9|$warning-color: hsl(38, 92%, 50%);
   10|$error-color: hsl(0, 72%, 51%);
   11|$info-color: hsl(200, 80%, 50%);
   12|
   13|// ============================================================
   14|// LAYOUT DIMENSIONS
   15|// ============================================================
   16|
   17|// Sidebar
   18|$sidebar-width: 260px;
   19|$sidebar-width-collapsed: 70px;
   20|$sidebar-width-mobile: 280px;
   21|
   22|// Header
   23|$header-height: 56px;
   24|$header-height-mobile: 48px;
   25|
   26|// Footer
   27|$footer-height: 48px;
   28|
   29|// Content
   30|$content-max-width: 1600px;
   31|$content-padding: 1.5rem;
   32|$content-padding-mobile: 1rem;
   33|
   34|// ============================================================
   35|// SPACING SYSTEM (8px Grid)
   36|// ============================================================
   37|$spacing-unit: 8px;
   38|
   39|$spacing-xs: $spacing-unit * 0.5; // 4px
   40|$spacing-sm: $spacing-unit;       // 8px
   41|$spacing-md: $spacing-unit * 2;   // 16px
   42|$spacing-lg: $spacing-unit * 3;   // 24px
   43|$spacing-xl: $spacing-unit * 4;   // 32px
   44|$spacing-xxl: $spacing-unit * 6;  // 48px
   45|
   46|// ============================================================
   47|// BREAKPOINTS (matching Tailwind)
   48|// ============================================================
   49|$breakpoint-sm: 640px;
   50|$breakpoint-md: 768px;
   51|$breakpoint-lg: 1024px;
   52|$breakpoint-xl: 1280px;
   53|$breakpoint-2xl: 1536px;
   54|
   55|// ============================================================
   56|// BORDER RADIUS
   57|// ============================================================
   58|$radius-base: 6px; // Chuẩn AntD
   59|$radius-sm: 4px;
   60|$radius-lg: 8px;
   61|$radius-xl: 12px;
   62|$radius-full: 9999px;
   63|
   64|// Legacy variables for compatibility
   65|$border-radius-sm: $radius-sm;
   66|$border-radius-md: $radius-base;
   67|$border-radius-lg: $radius-lg;
   68|$border-radius-xl: $radius-xl;
   69|
   70|// ============================================================
   71|// SHADOWS
   72|// ============================================================
   73|$shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
   74|$shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
   75|$shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
   76|$shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
   77|
   78|// ============================================================
   79|// TRANSITIONS
   80|// ============================================================
   81|$transition-fast: 150ms;
   82|$transition-base: 200ms;
   83|$transition-slow: 300ms;
   84|$transition-ease: cubic-bezier(0.4, 0, 0.2, 1);
   85|
   86|// ============================================================
   87|// Z-INDEX LAYERS
   88|// ============================================================
   89|$z-dropdown: 10;
   90|$z-sticky: 20;
   91|$z-fixed: 30;
   92|$z-modal-backdrop: 40;
   93|$z-modal: 50;
   94|$z-popover: 60;
   95|$z-tooltip: 70;
   96|
