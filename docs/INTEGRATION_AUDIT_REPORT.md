# Enterprise Integration Audit Report — Ship Frontend ↔ Laravel API

**Generated:** 2026-05-12  
**Workspace:** `/home/vumoi/company_ship/ship-app`  
**Backend Laravel tree:** **Not present** in workspace (no `routes/api.php` under `company_ship`). Comparison tables below list **frontend fact** + **backend status: TBD**.

---

## API Summary

| Area | Finding |
|------|---------|
| HTTP client | Single Axios instance — [`src/lib/axios.ts`](../src/lib/axios.ts), re-exported from [`src/services/api.ts`](../src/services/api.ts) |
| Base URL | `ENV.API_BASE_URL` = normalized `VITE_API_ORIGIN` + `VITE_API_BASE_URL` — [`src/config/env.ts`](../src/config/env.ts) |
| Path catalog | [`src/services/endpoints.ts`](../src/services/endpoints.ts) |
| CRUD / lists | Refine [`dataProvider.tsx`](../src/providers/dataProvider.tsx) → dynamic `/{resource}` + aliases [`resourceAliases.ts`](../src/constants/resourceAliases.ts) |
| Streaming | Chat SSE via `fetch(buildApiUrl(...))` — interceptors do not apply |
| Backend verification | **Blocked** until Laravel repo or `php artisan route:list` export is attached |

---

## Frontend Endpoints

Grouped by domain. Full tables: [API_INVENTORY.md](./API_INVENTORY.md).

| Module | Primary consumers | Pattern |
|--------|-------------------|---------|
| Auth / Sanctum | `auth.service.ts`, `lib/axios.ts` | POST `/auth/*`, CSRF on origin `/sanctum/csrf-cookie`, refresh POST `/auth/refresh` |
| Sessions / audit | `auth-log.service.ts` | `/auth/actions`, `/auth/sessions` |
| Fleet | `trip.service.ts`, `vehicle.service.ts`, Refine | `/trips`, `/vehicles`, `/drivers` + sub-resources |
| Customers / pricing | `customer.service.ts`, `reconciliation.service.ts` | `/customers`, `/price-*`, `/reconciliation-*` |
| Dispatch / reports | `dispatch.service.ts`, `reports.service.ts`, `dashboard.service.ts`, `features/dashboard/services/dashboard.service.ts` | `/dispatch/*`, `/reports/*` |
| Payroll / invoicing | `payroll.service.ts`, `payroll-adjustment.service.ts`, `salary-adjustment.service.ts`, `invoice.service.ts` | `/payrolls`, `/payroll-adjustments`, `/salary-adjustments`, `/invoices`, `/debt-overview` |
| Workforce | `workforce-ops.service.ts`, `driver-schedule.service.ts`, `leave.service.ts`, `overtime.service.ts`, `violation.service.ts` | Mixed prefixes — see **Broken Integrations** |
| Ops / misc | `notification.service.ts`, `cost.service.ts`, `chat.service.ts`, `roles.service.ts`, `permissions.service.ts` | `/notifications`, `/activity-logs`, `/trip-costs`, `/chat/*`, `/roles`, `/permissions` |
| Admin / tenant | Refine, `CompanySettingsPage.tsx` | `/companies`, `/admin/companies`, `/offices` |

---

## Backend Routes

| Status | Notes |
|--------|-------|
| **Not indexed** | Attach Laravel application and run `php artisan route:list --path=api` or paste `routes/api.php` |

Recommended snapshot path after backend is available: `docs/backend-routes.snapshot.md`.

---

## Matched APIs

| Frontend path | Backend | Notes |
|---------------|---------|-------|
| — | — | **No automated match** — backend missing from workspace |

---

## Missing APIs

| Direction | Item |
|-----------|------|
| Frontend → Backend | Cannot classify **missing backend routes** without Laravel |
| Backend → Frontend | Cannot classify **unused backend routes** without Laravel |

---

## Broken Integrations

Issues below are **severity-assigned for reconciliation** once routes exist. Prefix **S** = suspected until Laravel confirms.

| Severity | ID | Issue |
|----------|-----|-------|
| **Medium** | S1 | **Schedule extras:** `lock` / `override` / `hos-check` không có trong [`api.md`](../api.md) — có thể 404 |
| **Resolved** | — | Driver schedule + workforce list đã thống nhất `/driver-work-schedules` — xem [`LARAVEL_API_PHP_VS_FRONTEND.md`](./LARAVEL_API_PHP_VS_FRONTEND.md) |
| **Resolved** | — | Health check dùng `/api/health` |
| **Medium** | S4 | **`NOT_IMPLEMENTED_RESOURCES`:** suppresses list calls for `notifications`, `audit-logs`, `system-settings` — may hide working APIs — [`resourceAliases.ts`](../src/constants/resourceAliases.ts) |
| **Medium** | S5 | **Legacy list fallbacks:** e.g. `vehicles.documents` as fallback segment — verify valid Laravel URIs — [`dataProvider.tsx`](../src/providers/dataProvider.tsx) |
| **Low** | S6 | **`ENDPOINTS.attendanceLate`:** no frontend callers — dead constants or future feature |

**Confirmed fixed (frontend):** company status PATCH uses `ENDPOINTS.companies.status(id)` (non–super-admin path aligned with admin pattern).

---

## Payload Mismatches

Not assessed — requires FormRequest / OpenAPI from Laravel.

---

## Authentication Issues

| Topic | Frontend behavior |
|-------|-------------------|
| Session | `withCredentials: true`, `X-Tenant-ID` when tenant selected |
| CSRF | 419 → retry after `GET /sanctum/csrf-cookie` |
| 401 | Optional refresh via `/auth/refresh`; else force logout |
| SSE | Chat stream uses `fetch` — ensure cookie/session behavior matches backend expectations |

---

## Validation Issues

Not assessed — compare Laravel validation responses (`422`) with `errorHandler` / form mapping in UI.

---

## Response Structure Issues

Frontend expects envelope helpers (`unwrapEnvelope`, `throwIfEnvelopeFailed`) — [`src/services/http/`](../src/services/http/). Backend Resource shape must stay compatible or adapters added per endpoint group.

---

## Refactor Recommendations

1. Attach Laravel repo; generate **matched / broken** tables in [API_COMPARISON_REPORT.md](./API_COMPARISON_REPORT.md).
2. Normalize driver schedule URLs to **one** REST namespace (backend preference → update `ENDPOINTS` + services together).
3. Replace `NOT_IMPLEMENTED_RESOURCES` with env-driven flags once backend confirms routes.
4. CI grep: disallow new `api.(get|post)\(['"]/` literals outside allowlist (see [API_REFACTOR_PLAN.md](./API_REFACTOR_PLAN.md)).
5. Optional: OpenAPI or Zod schemas generated from Laravel Resources.

---

## Action Checklist

- [ ] Add Laravel codebase or paste `route:list` output
- [ ] Fill [FRONTEND_BACKEND_MAPPING.md](./FRONTEND_BACKEND_MAPPING.md) controller column
- [ ] Resolve S1–S2 (schedule/workforce path consistency)
- [ ] Confirm S3 health URL with deployment config
- [ ] Audit S4–S5 fallbacks against real routes
- [ ] Remove or implement `attendanceLate` endpoints (S6)

---

*Cross-links: [API_INVENTORY.md](./API_INVENTORY.md) · [API_COMPARISON_REPORT.md](./API_COMPARISON_REPORT.md) · [BROKEN_ENDPOINTS_REPORT.md](./BROKEN_ENDPOINTS_REPORT.md) · [API_REFACTOR_PLAN.md](./API_REFACTOR_PLAN.md)*
