# Frontend API Inventory

**Generated:** 2026-05-12 (updated 2026-05-12 — inventory sync, stale rows removed)  
**Base URL (runtime):** `VITE_API_ORIGIN` + `VITE_API_BASE_URL` → ví dụ `http://localhost:8080/api`  
**Canonical path constants:** [`src/services/endpoints.ts`](../src/services/endpoints.ts)  
**HTTP client:** [`src/lib/axios.ts`](../src/lib/axios.ts) (default export re-exported from [`src/services/api.ts`](../src/services/api.ts))  

**Auth:** `withCredentials: true`; tenant header `X-Tenant-ID` when set; Sanctum CSRF via `GET` origin `/sanctum/csrf-cookie` (outside `/api`).  

---

## API Summary

| Source | Description |
|--------|-------------|
| `ENDPOINTS` | Explicit REST paths under `/api` prefix (axios `baseURL`). |
| Refine `dataProvider` | Dynamic `GET/POST/PUT/DELETE` → `/{resource}` with `RESOURCE_ALIASES` mapping. |
| Refine `useList` / hooks | Same as dataProvider for resources like `route-templates`, `drivers`, `vehicle-assignments`. |
| Known-resource literals | Prefer `ENDPOINTS.*`; dashboard/forms already migrated. |
| `fetch` | Chat SSE (`buildApiUrl`), Nager public holidays (external), provinces API (external), vPIC proxy (external). |

---

## Legend

- **Auth:** Yes = session/cookie + optional `X-Tenant-ID`.
- **Multipart:** `FormData` in trip costs upload path.

---

## 1. Public / health / upload

| Method | Path | Used in | Payload / params | Auth | Notes |
|--------|------|---------|------------------|------|-------|
| GET | `/health` | `system.service.ts`, `Settings.tsx` | — | Yes | Qua `axios` base → **`/api/health`** (khớp `api.php`). |
| GET | `/documentation` | defined in `ENDPOINTS.public.docs` | — | ? | Verify backend exposes if used. |
| POST | `/upload` | `publicFileUpload.ts` | `multipart/form-data` | Yes | |

---

## 2. Auth

| Method | Path | Used in | Payload / params | Auth | Notes |
|--------|------|---------|------------------|------|-------|
| GET | `/sanctum/csrf-cookie` | `auth.service.ts` | — | cookie | Origin URL via `buildOriginUrl`, not prefixed with `/api`. |
| POST | `/auth/login` | `auth.service.ts` | `{ email, password }` | → session | |
| POST | `/auth/social/login` | `auth.service.ts` | provider tokens | | |
| POST | `/auth/logout` | `auth.service.ts` | — | Yes | |
| POST | `/auth/refresh` | `lib/axios.ts` (raw axios) | `{}` | cookie | |
| POST | `/auth/register` | `auth.service.ts` | register fields | | |
| GET | `/auth/me` | `auth.service.ts` | — | Yes | |
| POST | `/auth/forgot-password` | `auth.service.ts` | `{ email }` | | |
| POST | `/auth/check-otp` | `auth.service.ts` | `{ email, otp }` | | |
| POST | `/auth/reset-password` | `auth.service.ts` | payload | | |
| GET | `/auth/actions` | `auth-log.service.ts` | filters | Yes | Audit-style auth actions. |
| GET | `/auth/sessions` | `auth-log.service.ts` | `page`, `per_page` | Yes | |
| GET | `/auth/sessions/summary` | `auth-log.service.ts` | — | Yes | |
| PATCH | `/auth/sessions/:id/revoke` | `auth-log.service.ts` | — | Yes | |
| PATCH | `/auth/sessions/:id/lock-account` | `auth-log.service.ts` | — | Yes | |

---

## 3. Roles / permissions / users

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| CRUD | `/roles`, `/roles/:id` | Refine + endpoints | |
| POST | `/roles/:id/permissions` | `roles.service.ts` | `{ permissions }` |
| GET | `/permissions` | `permissions.service.ts` | paginated |
| GET | `/permissions/:id` | `permissions.service.ts` | |
| CRUD | `/users`, `/users/:id` | Refine + pages | |
| PATCH | `/users/:id/permissions` | (if used) | via endpoints |
| PATCH | `/users/:id/status` | `UsersList.tsx` | `{ status }` |
| POST | `/users/:id/reset-password` | `UsersList.tsx` | |

---

## 4. Fleet: vehicles, drivers, trips

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| Various | `/vehicles`, `/vehicles/:id`, `/vehicles/available`, … | `vehicle.service.ts`, Refine | Includes documents, maintenance, assignments |
| Various | `/drivers`, `/drivers/:id`, `/drivers/available`, … | Refine, `DriverForm.tsx` (duplicate check via `ENDPOINTS.drivers.base`) | |
| Various | `/trips`, `/trips/:id`, workflow PATCHes | `trip.service.ts`, hooks (`ENDPOINTS.trips.base`), Refine | `deliver` exposed on `TripService` |

---

## 5. Customers / pricing / reconciliation

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| CRUD | `/customers`, `/customers/:id` | `customer.service.ts`, Refine | List params: `page`, `per_page`, `search`, `type`, `group_id`, `status`, `include_deleted` |
| GET | `/customers/:id/trips` | `customer.service.ts` | paginated |
| GET | `/customers/:id/debt` | `customer.service.ts` | |
| GET | `/customers/:id/payments` | `customer.service.ts` | |
| POST | `/customers/:id/payments` | `customer.service.ts` | |
| GET | `/customers/:id/price-lists` | `customer.service.ts` | |
| POST | `/customers/:id/price-lists` | `customer.service.ts` | |
| GET | `/customers/:id/reconciliations` | `customer.service.ts` | |
| GET | `/customer-groups` | `customer.service.ts` | |
| CRUD | `/customer-groups` | `ENDPOINTS` | |
| CRUD | `/price-lists`, items qua `/price-lists/:id/items` | `customer.service.ts` | Khớp `api.php` |
| CRUD | `/reconciliations`, items nested | `reconciliation.service.ts`, `customer.service.ts` (list theo `customer_id`) | Khớp `api.php` |
| Various | `/reconciliation-items` | `reconciliation.service.ts` | query `session_id` |
| POST | `/price-lookup` | `trip.service.ts` | |
| POST | `/shipping-fee-lookup` | `trip.service.ts` | |
| GET | `/customers/search` | `ENDPOINTS` | verify consumer |

---

## 6. Dispatch / reports / dashboard analytics

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| GET | `/dispatch/board` | `dispatch.service.ts` | `date` |
| GET | `/dispatch/unassigned-trips` | `dispatch.service.ts` | |
| GET | `/dispatch/daily-summary` | `dispatch.service.ts` | |
| GET | `/reports/*` | `reports.service.ts`, `dashboard.service.ts`, `features/dashboard/services/dashboard.service.ts` | dashboard, revenue, costs, trips, profit, vehicles, drivers, maintenance, debt |
| POST | `/reports/export` | `reports.service.ts` | blob |

---

## 7. Payroll / adjustments / salary

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| CRUD | `/payrolls` | `payroll.service.ts` | approve, lock, mark-paid, exports (blob), `mySalary`, `driver/:id` |
| CRUD | `/payroll-adjustments` | `payroll-adjustment.service.ts` | approve/reject |
| Various | `/salary-adjustments` | `salary-adjustment.service.ts` | |

---

## 8. Schedules / workforce / attendance / leave / overtime / violations

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| POST/PATCH/DELETE | `/driver-work-schedules`, `/driver-work-schedules/:id` | `driver-schedule.service.ts`, `workforce-ops.service.ts` | |
| PATCH | `/driver-work-schedules/:id/submit|approve|reject` | `driver-schedule.service.ts`, `workforce-ops` | Khớp [`api.md`](../api.md) |
| POST | `/work-schedules/generate` | `driver-schedule.service.ts` | |
| GET/PATCH | `/workforce/driver-schedules`, approve, lock | `workforce-ops.service.ts` | |
| GET/POST/PATCH | `/attendance`, check-in/out, adjust | `workforce-ops.service.ts` | |
| GET/POST/PATCH | `/leave-requests`, `/leave-types`, `/leave/balance` | `leave.service.ts`, `workforce-ops.service.ts` | |
| GET/POST/PATCH | `/overtime`, `/overtime/:id` | `overtime.service.ts`, `workforce-ops.service.ts` | |
| Various | `/violations` | `violation.service.ts`, `workforce-ops.service.ts` | |
| GET | `/public-holidays` | `workforce-ops.service.ts`, `driver-schedule.service.ts` | |
| GET | External `date.nager.at` | `workforce-ops.service.ts`, `driver-schedule.service.ts` | Not Laravel |

---

## 9. Invoices / debt / costs / notifications / chat / misc

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| CRUD + workflow | `/invoices`, issue, **GET** `/cqt`, **GET** `/pdf`, **PATCH** `/email`, mark-paid, cancel, status-histories | `invoice.service.ts` | Khớp `api.php` |
| GET | `/debt-overview` | `invoice.service.ts` | |
| GET/POST | `/trip-costs` | `cost.service.ts` | multipart when receipt |
| GET/PATCH | `/cost-approvals` | `cost.service.ts` | |
| GET | `/cost-categories` | `cost.service.ts` | |
| Various | `/notifications` | `notification.service.ts` | |
| GET | `/activity-logs` | `notification.service.ts` | |
| GET/POST/DELETE | `/chat/*` | `chat.service.ts` | SSE: `fetch(buildApiUrl(.../stream))` |
| CRUD | `/companies`, `/offices`, `/admin/companies` | Refine, `CompanySettingsPage.tsx` | status PATCH |
| POST | `/offices/:id/apply-schedule` | `work-schedule.service.ts` | |
| Various | `/cargo-types`, `/vehicle-types`, `/locations`, `/order-status-configs` | Refine / settings | |
| GET | `/v2/employees` | `ENDPOINTS.v2` | verify usage |

---

## 10. Dynamic Refine CRUD (data provider)

Resources resolved via [`resourceAliases`](../src/constants/resourceAliases.ts): alias → kebab-case API segment.

**Typical patterns:**

| Method | Pattern | Used in |
|--------|---------|---------|
| GET | `/{resource}?page=&per_page=&keyword=&sort_*=` | `dataProvider.getList` |
| GET | `/{resource}/:id` | `dataProvider.getOne` |
| POST | `/{resource}` | `dataProvider.create` |
| PUT | `/{resource}/:id` | `dataProvider.update` |
| DELETE | `/{resource}/:id` | `dataProvider.deleteOne` |

**Special:** `trip-costs` uses `cost.service`; `leave-requests` tries `leave-requests` then fallback `workforce.leaveRequests`.

**Known frontend stubs:** `NOT_IMPLEMENTED_RESOURCES` includes `notifications`, `audit-logs`, `system-settings` → empty list without calling API.

---

## 11. Ad-hoc paths (not via ENDPOINTS constant)

| Method | Path | Used in | Notes |
|--------|------|---------|-------|
| GET | `/${resource}` | `SimpleCategoryTab.tsx` | code uniqueness; resource from props (dynamic catalog resources) |

*(Previously: literal `/trips`, `/vehicles`, `/drivers` — migrated to `ENDPOINTS`.)*

---

## 12. External (non-Laravel)

| Method | URL | Used in |
|--------|-----|---------|
| GET | `https://date.nager.at/api/v3/PublicHolidays/...` | workforce / driver-schedule |
| GET | `https://provinces.open-api.vn/api/...` | `vnProvincesOpenApi.ts` |
| GET | `https://nominatim.openstreetmap.org/search` | `AddressAutocomplete.tsx` |
| GET | vPIC via `/vpic` proxy | `vpicNhtsa.ts` |

---

## 13. Declared but unused (frontend)

| Path prefix | Notes |
|-------------|-------|
| `/attendances/late/list`, `/attendances/late/notify` | Present in `ENDPOINTS.attendanceLate` only — no callers found |

---

*End of inventory. Backend route verification requires Laravel `routes/api.php` (not present under `/home/vumoi/company_ship`).*
