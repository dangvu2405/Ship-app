# API Comparison Report — Frontend vs Laravel Backend

**Generated:** 2026-05-12 (updated 2026-05-12)  
**Frontend repo:** Ship-app (Vite + React)  
**Backend snapshot:** [`api.md`](../api.md) (export `routes/api.php`) — không có full Laravel tree trong repo.  

---

## Executive summary

| Item | Status |
|------|--------|
| Frontend endpoint inventory | **Complete** — see [API_INVENTORY.md](./API_INVENTORY.md) |
| Backend route inventory | **Partial** — từ [`api.md`](../api.md) |
| Matched routes | **Đã áp dụng chỉnh frontend** — chi tiết [`LARAVEL_API_PHP_VS_FRONTEND.md`](./LARAVEL_API_PHP_VS_FRONTEND.md) |
| Mismatches | Một phần **đã sửa trong code**; phần còn lại xem bảng “Chưa có trong api.md” trong doc trên |

**Lưu ý:** [`context-backend.txt`](../context-backend.txt) vẫn là placeholder cho GitNexus export; nguồn route thực tế dùng đối chiếu là **`api.md`**.

---

## What was requested vs delivered

| Step | Delivered |
|------|-----------|
| STEP 1 — Frontend usage | Yes — inventory + dynamic Refine + ad-hoc calls |
| STEP 2 — Backend Laravel | **Pending** — attach backend repo or path |
| STEP 3 — Compare | **Pending** |
| STEP 4 — Detailed report | This file + [BROKEN_ENDPOINTS_REPORT.md](./BROKEN_ENDPOINTS_REPORT.md) (frontend-risk only) |
| STEP 5 — Refactor API layer | Partially done in codebase (`lib/axios`, `ENDPOINTS`, `buildApiUrl`); see [API_REFACTOR_PLAN.md](./API_REFACTOR_PLAN.md) |
| STEP 6 — Docs | This batch under `docs/` |

---

## How to complete comparison (recommended workflow)

1. Clone or symlink Laravel API next to frontend (or monorepo subfolder).
2. Export routes:

   ```bash
   php artisan route:list --path=api --columns=Method,URI,Name,Middleware
   ```

   Or paste `routes/api.php` + grouped `Route::` definitions into `docs/backend-routes.snapshot.md`.

3. Normalize URIs:
   - Laravel often registers under prefix `api` → compare **without** leading duplication (`/api` + axios base).
4. Diff against paths in [`src/services/endpoints.ts`](../src/services/endpoints.ts).
5. Update [FRONTEND_BACKEND_MAPPING.md](./FRONTEND_BACKEND_MAPPING.md) with controller ↔ service mapping.

---

## Frontend-only integration risks (preview)

Xem [LARAVEL_API_PHP_VS_FRONTEND.md](./LARAVEL_API_PHP_VS_FRONTEND.md). Cảnh báo còn lại:

- Module không có trong `api.md` (payroll đầy đủ, violations, roles, v.v.) — có thể 404.
- `NOT_IMPLEMENTED_RESOURCES` — có thể ẩn feature dù backend đã có (vd. notifications đã có route trong `api.md`).

---

## Severity legend (for future backend diff)

| Severity | Meaning |
|----------|---------|
| P0 | Broken production flow (401/404 on critical path) |
| P1 | Wrong method or path for main feature |
| P2 | Payload / pagination mismatch |
| P3 | Naming drift, duplicate endpoints |

---

*Re-run this document after backend snapshot is attached.*
