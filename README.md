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
