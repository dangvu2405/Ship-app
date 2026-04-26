# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev       # Start Vite dev server (port 3000, proxies /api → VITE_API_ORIGIN)
npm run build     # TypeScript check + Vite production build
npm run preview   # Preview production build locally
npm run lint      # ESLint (strict — max 0 warnings)
npm run knip      # Detect unused files and dependencies
```

There is no test runner configured in this project.

## Architecture Overview

This is a **React + TypeScript ERP admin dashboard** built on top of the [Refine](https://refine.dev/) meta-framework. Refine provides routing context, auth guards, CRUD resource management, and a `dataProvider`/`authProvider` abstraction that wraps Axios.

### Key libraries

| Concern | Library |
|---|---|
| Framework | React 18 + Refine v4 |
| Routing | React Router v6 (managed by Refine) |
| UI components | Ant Design v5 + `@refinedev/antd` |
| Styling | TailwindCSS v3 + SCSS |
| Global state | Zustand (auth + app UI preferences) |
| Server state | TanStack React Query v5 (separate `QueryClient` from Refine's internal instance) |
| HTTP | Axios with interceptors |
| Charts | Recharts |
| Validation | Zod v4 |
| i18n | Custom `useTranslation` hook, locale files in `src/locales/` |

### Routing

Routes are defined in two files:
- [src/routes/index.ts](src/routes/index.ts) — `ROUTES` enum with all path constants
- [src/routes/appRouteConfig.tsx](src/routes/appRouteConfig.tsx) — dynamic CRUD route config consumed by Refine; lazy-loads page components via `suspensePage()`

All protected routes are wrapped in Refine's `<Authenticated>` guard. Public routes (`/login`, `/register`, `/forgot-password`) bypass this.

### API layer

1. **Axios instance** ([src/services/api.ts](src/services/api.ts)) — base URL is `/api/v1` in dev (Vite proxy) or `VITE_API_ORIGIN + /api/v1` in prod. Request interceptor attaches the Bearer token; response interceptor handles errors and shows toasts globally. Custom config flags: `skipToast`, `skipErrorToast`, `errorMode` (`'global' | 'local' | 'silent'`).

2. **Endpoint constants** ([src/services/endpoints.ts](src/services/endpoints.ts)) — all API paths centralized here.

3. **Service singletons** (e.g., `auth.service.ts`, `payroll.service.ts`) — one exported singleton per domain; methods return typed `ApiResponse<T>`.

4. **Refine dataProvider** ([src/providers/dataProvider.tsx](src/providers/dataProvider.tsx)) — wraps SimpleRest adapter for Refine's built-in CRUD hooks (`useList`, `useCreate`, etc.).

### State management

- **Auth state** — `useAuthStore` (Zustand, persisted to `localStorage` key `auth-storage:v1`). Holds `user`, `isAuthenticated`, token helpers.
- **App UI state** — `useAppStore` (Zustand, persisted). Holds `theme`, `sidebarOpen`, `locale`, notification prefs.
- **Server state** — TanStack React Query via custom hooks (`useResourceListQuery`, `useDashboardStats`, etc.) in `src/hooks/`. Query keys are namespaced via `createResourceQueryKeys()` from `src/shared/`.

### Component conventions

- `src/components/common/` — shared layout pieces (PageHeader, Breadcrumb, loaders)
- `src/components/form/` — Ant Design field wrappers used in forms
- `src/components/table/` — DataTable + Pagination
- `src/components/dashboard/` — chart and stats widgets
- `src/components/crud/` — generic create/edit/show form shells
- Feature-specific components live in `src/pages/<feature>/`

### Environment variables

```env
VITE_API_ORIGIN=http://localhost:8080   # Backend origin (required)
VITE_APP_NAME=Ship ERP
VITE_AUTH_FORGOT_PASSWORD_SEND_ENABLED=true
VITE_AUTH_FORGOT_PASSWORD_VERIFY_ENABLED=true
VITE_AUTO_LOGIN=true                   # Dev convenience: auto-login on start
VITE_DEMO_EMAIL=admin@abctransport.com
VITE_DEMO_PASSWORD=password
```

### TypeScript

Strict mode is on (`noUnusedLocals`, `noUnusedParameters`). Path alias `@/*` maps to `./src/*`. The build runs `tsc -b` before Vite, so type errors block production builds.

<!-- gitnexus:start -->
# GitNexus — Code Intelligence

This project is indexed by GitNexus as **ship-app** (3876 symbols, 6109 relationships, 123 execution flows). Use the GitNexus MCP tools to understand code, assess impact, and navigate safely.

> If any GitNexus tool warns the index is stale, run `npx gitnexus analyze` in terminal first.

## Always Do

- **MUST run impact analysis before editing any symbol.** Before modifying a function, class, or method, run `gitnexus_impact({target: "symbolName", direction: "upstream"})` and report the blast radius (direct callers, affected processes, risk level) to the user.
- **MUST run `gitnexus_detect_changes()` before committing** to verify your changes only affect expected symbols and execution flows.
- **MUST warn the user** if impact analysis returns HIGH or CRITICAL risk before proceeding with edits.
- When exploring unfamiliar code, use `gitnexus_query({query: "concept"})` to find execution flows instead of grepping. It returns process-grouped results ranked by relevance.
- When you need full context on a specific symbol — callers, callees, which execution flows it participates in — use `gitnexus_context({name: "symbolName"})`.

## Never Do

- NEVER edit a function, class, or method without first running `gitnexus_impact` on it.
- NEVER ignore HIGH or CRITICAL risk warnings from impact analysis.
- NEVER rename symbols with find-and-replace — use `gitnexus_rename` which understands the call graph.
- NEVER commit changes without running `gitnexus_detect_changes()` to check affected scope.

## Resources

| Resource | Use for |
|----------|---------|
| `gitnexus://repo/ship-app/context` | Codebase overview, check index freshness |
| `gitnexus://repo/ship-app/clusters` | All functional areas |
| `gitnexus://repo/ship-app/processes` | All execution flows |
| `gitnexus://repo/ship-app/process/{name}` | Step-by-step execution trace |

## CLI

| Task | Read this skill file |
|------|---------------------|
| Understand architecture / "How does X work?" | `.claude/skills/gitnexus/gitnexus-exploring/SKILL.md` |
| Blast radius / "What breaks if I change X?" | `.claude/skills/gitnexus/gitnexus-impact-analysis/SKILL.md` |
| Trace bugs / "Why is X failing?" | `.claude/skills/gitnexus/gitnexus-debugging/SKILL.md` |
| Rename / extract / split / refactor | `.claude/skills/gitnexus/gitnexus-refactoring/SKILL.md` |
| Tools, resources, schema reference | `.claude/skills/gitnexus/gitnexus-guide/SKILL.md` |
| Index, status, clean, wiki CLI commands | `.claude/skills/gitnexus/gitnexus-cli/SKILL.md` |

<!-- gitnexus:end -->
