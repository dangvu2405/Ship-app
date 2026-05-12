# Đối chiếu `routes/api.php` (snapshot [`api.md`](../api.md)) ↔ Frontend

**Generated:** 2026-05-12  
**Prefix:** Laravel `routes/api.php` được giả định mount dưới `/api` (chuẩn Laravel). Frontend `axios` dùng `ENV.API_BASE_URL` = origin + `/api`.

---

## Khớp trực tiếp (đã chỉnh frontend)

| Backend (`api.md`) | Frontend |
|--------------------|----------|
| `POST prices/lookup` | `ENDPOINTS.priceLookup` → `/prices/lookup` |
| `POST shipping-fees/calculate` | `ENDPOINTS.shippingFeeLookup` → `/shipping-fees/calculate` |
| `apiResource reconciliations` | `ENDPOINTS.reconciliations` → `/reconciliations` (trước: `/reconciliation-sessions`) |
| `PUT reconciliations/{id}/items/{itemId}` | `reconciliationItems.itemById` → `/reconciliations/:id/items/:itemId` |
| `PATCH reconciliations/{id}/confirm` | `reconciliationItems.confirm` → `/reconciliations/:id/confirm` |
| Nested price list items | `/price-lists/{id}/items` (trước: `/price-list-items?price_list_id=`) |
| `PATCH driver-work-schedules/{id}/{submit,approve,reject}` | `driverSchedules.*` → `/driver-work-schedules/...` (trước: `/driver-schedules/...`) |
| `POST driver-work-schedules/generate` | `workSchedules.generate` → `/driver-work-schedules/generate` |
| Shallow `customers.payments` → `payments/{id}` | `ENDPOINTS.payments` → `/payments` |
| `POST auth/sessions/{id}/revoke` | `auth-log.service` dùng **POST** (trước: PATCH) |
| `GET .../health` trong nhóm API | Health check **không** dùng `useApiRoot` → gọi `/api/health` |
| Invoice PDF / CQT / email | `GET /invoices/{id}/pdf`, `GET /invoices/{id}/cqt`, `PATCH /invoices/{id}/email` |
| Reports payroll export route | `payrollSummary` → `GET /reports/payroll/export` (cần khớp payload JSON thực tế của backend) |

---

## Trip workflow (`api.md` § Trips)

Backend chỉ định nghĩa PATCH trên `trips/{id}`:

`assign`, `start`, `deliver`, `complete`, `cancel`, `change-vehicle`, `change-driver`.

- Frontend giữ PATCH cho các action trên.
- `accept`, `pickup`, `transit`, `arrive` (theo trip id), `delay`, `emergency`, `resume`: **không** có route tương ứng → `trip.service` chuyển sang **PUT** `/trips/{id}` (cập nhật resource) với `status` / metadata phù hợp domain.
- Đến điểm dừng: backend dùng `PATCH stops/{childId}/arrive` và `PATCH stops/{childId}/complete` → thêm `ENDPOINTS.tripStops` và method `arriveStop` / `completeStop` khi UI có `stopId`.

---

## Chưa có trong [`api.md`](api.md) — frontend vẫn gọi (rủi ro 404)

| Khu vực | Ghi chú |
|---------|---------|
| `GET /roles`, `GET /permissions`, CRUD roles | Không thấy trong file — cần bổ sung route hoặc gỡ UI |
| Payroll (`/payrolls`, điều chỉnh lương, …) | Không có trong snapshot |
| Violations, `/salary-adjustments`, `/payroll-adjustments` | Không có |
| `/workforce/*`, `/attendance/*`, `/violations` | Không có (workforce-ops đã dùng `/driver-work-schedules` cho list) |
| `GET /customers/{id}/reconciliations` | Không có — chuyển sang list `/reconciliations?customer_id=` |
| `POST /auth/register` | Không có trong public routes snapshot |
| `GET /leave/balance` | Không có |
| `PATCH …/lock` đối với driver-work-schedules | Không có trong `api.md` |
| `/admin/companies` | Không có |
| `/activity-logs`, `/notifications` | Notifications có trong `api.md`; activity-logs không thấy |

---

## Ghi chú upload

Backend: `POST /upload`, `/upload/image`, `/upload/document`. Frontend hiện POST `ENDPOINTS.public.upload` (`/upload`) — khớp `store`; có thể mở rộng thêm image/document nếu cần.

---

*Cập nhật file này khi `api.php` trên server thay đổi.*
