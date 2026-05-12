# Frontend ↔ Backend Mapping

**Generated:** 2026-05-12  
**Status:** **Template — backend controllers not indexed**

This document maps **frontend consumers** to **intended API paths**. Backend controller/action columns must be filled when the Laravel repo is available.

---

## Convention

- **Full URL:** `{VITE_API_ORIGIN}{VITE_API_BASE_URL}{path}` — e.g. `http://localhost:8080/api/trips`
- **Sanctum:** `{VITE_API_ORIGIN}/sanctum/csrf-cookie`
- **Health (current code):** `{VITE_API_ORIGIN}/health` (via `useApiRoot`)

---

## Mapping table (fill Backend column later)

| Domain | Frontend path | HTTP (typical) | Frontend file(s) | Backend controller (TBD) | Notes |
|--------|---------------|----------------|-------------------|--------------------------|-------|
| Auth | `/auth/login` | POST | `auth.service.ts` | | |
| Auth | `/auth/me` | GET | `auth.service.ts` | | |
| Trips | `/trips` | GET, POST | `trip.service.ts`, hooks | | List/create |
| Trips | `/trips/:id` | GET, PUT, DELETE | `trip.service.ts` | | |
| Trips | `/trips/:id/assign` | PATCH | `trip.service.ts` | | |
| Trips | `/trips/:id/deliver` | PATCH | `trip.service.ts` (`deliver`) | | |
| Customers | `/customers` | GET | `customer.service.ts` | | |
| Reports | `/reports/dashboard` | GET | `dashboard.service.ts`, `reports.service.ts`, `features/.../dashboard.service.ts` | | Multiple callers |
| Workforce | `/driver-work-schedules` | GET, POST | `driver-schedule.service.ts`, `workforce-ops.service.ts` | `api.php` | |
| Workforce | `/driver-work-schedules/generate` | POST | `driver-schedule.service.ts` | `api.php` | |
| Workforce | `/driver-work-schedules/:id/submit` | PATCH | `ENDPOINTS.driverSchedules` | `api.php` | |
| Workforce | `/driver-work-schedules/:id/approve` | PATCH | `ENDPOINTS.driverSchedules`, `workforce-ops` | `api.php` | |
| Workforce | `/driver-work-schedules/:id/reject` | PATCH | `ENDPOINTS.driverSchedules`, `workforce-ops` | `api.php` | |
| Chat | `/chat/messages/stream` | POST (SSE) | `chat.service.ts` | | `fetch` + credentials |

---

## Refine dynamic resources

Any `resource` string from Refine (e.g. `trips`, `vehicle-assignments`) maps to `GET/POST/PUT/DELETE` on `/{kebab-resource}` per [`dataProvider.tsx`](../src/providers/dataProvider.tsx).

Add rows per resource after backend `api.php` grouping is known.

---

## Environment

| Variable | Role |
|----------|------|
| `VITE_API_ORIGIN` | Laravel host (e.g. `http://localhost:8080`) |
| `VITE_API_BASE_URL` | API prefix (e.g. `/api`) |
| `VITE_API_TIMEOUT_MS` | Axios timeout (optional) |

See [`src/config/env.ts`](../src/config/env.ts).
