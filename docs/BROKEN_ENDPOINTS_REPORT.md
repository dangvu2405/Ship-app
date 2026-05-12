# Broken / Risky Integrations Report

**Generated:** 2026-05-12 (updated 2026-05-12)  
**Scope:** Frontend codebase analysis **without** Laravel route verification  

---

## Severity

| Level | Description |
|-------|-------------|
| **CONFIRMED-FRONTEND** | Logic bug or missing client method in this repo |
| **SUSPECTED** | Needs backend confirmation |
| **MITIGATED** | Known workaround in code |

---

## CONFIRMED-FRONTEND

### 1. `TripService` missing `deliver` despite `ENDPOINTS.trips.deliver`

- **Status:** **Fixed** — `deliver(id)` added in [`trip.service.ts`](../src/services/trip.service.ts).

### 2. Duplicate literal `/trips` calls

- **Status:** **Fixed** — hooks now use `ENDPOINTS.trips.base`.

### 3. Duplicate `/vehicles` and `/drivers` checks

- **Status:** **Fixed** — forms use `ENDPOINTS.vehicles.base` / `ENDPOINTS.drivers.base`.

### 4. Dynamic `GET /${resource}` in SimpleCategoryTab

- **File:** [`SimpleCategoryTab.tsx`](../src/pages/settings/tabs/SimpleCategoryTab.tsx)
- **Issue:** Resource comes from props; must match backend pluralization exactly.

---

## SUSPECTED (verify with Laravel)

### A. Driver schedule paths — **aligned with [`api.md`](../api.md)**

- **Resolved:** Submit / approve / reject dùng **`/driver-work-schedules/:id/...`**. List workforce dùng **`GET /driver-work-schedules`** (không còn `/workforce/driver-schedules`).
- **Still verify:** `lock`, `override`, `hos-check` **không** có trong `api.md` — có thể 404 cho đến khi backend thêm route.

### B. Health check URL — **aligned**

- [`system.service.ts`](../src/services/system.service.ts) và [`Settings.tsx`](../src/pages/system/Settings.tsx) gọi **`/health`** qua base URL `/api` → **`/api/health`** như `api.php`.

### C. `NOT_IMPLEMENTED_RESOURCES`

- **File:** [`resourceAliases.ts`](../src/constants/resourceAliases.ts) — `notifications`, `audit-logs`, `system-settings`
- **Risk:** UI hides features that might exist on backend.

### D. Legacy list fallbacks

- **`driver-work-schedules`** → fallback `work-schedules`
- **`vehicle-documents`**, **`driver-documents`** fallbacks look suspicious (`vehicles.documents` may not be a valid route segment)

---

## External dependencies (not bugs)

| Target | Usage |
|--------|-------|
| `date.nager.at` | Public holidays |
| `provinces.open-api.vn` | Address data |
| `/vpic` Vite proxy | NHTSA catalog |

---

## Action checklist

- [ ] Attach Laravel route list and reconcile sections A–A2–D
- [x] `TripService.deliver` implemented
- [x] Dashboard/forms use `ENDPOINTS` for `/trips`, `/vehicles`, `/drivers`
- [ ] Confirm `/health` vs `/api/health` with DevOps/backend
- [x] Company tenant status PATCH uses `ENDPOINTS.companies.status(id)` (non–super-admin)
