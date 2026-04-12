# Báo cáo nội dung frontend — thống nhất với backend

Tài liệu này dành cho **team backend** và **team frontend** dùng chung để đối chiếu hợp đồng API, giảm lệch tên field, query và format response. Chi tiết kỹ thuật đã được tách thành hai file song song; báo cáo này tóm tắt **bắt buộc phải khớp** và **cách duy trì đồng bộ**.

---

## 1. Mục đích và phạm vi

- **Mục đích:** mô tả cách SPA (Ship App, Vite + React + Refine) gọi API Laravel REST JSON, để backend triển khai/kiểm thử đúng path, query, body và envelope.
- **Phạm vi:** REST dưới prefix versioned (mặc định `/api/v1`), axios một instance, CRUD qua `dataProvider`, endpoint tùy chỉnh trong `src/services/endpoints.ts`.
- **Tài liệu chi tiết (đọc kèm):**
  - [`FRONTEND_FULL_REPORT.md`](./FRONTEND_FULL_REPORT.md) — **báo cáo toàn diện** (kiến trúc, chức năng, component, endpoint, payload — 1 file duy nhất).
  - [`FRONTEND_OVERVIEW_FOR_BACKEND.md`](./FRONTEND_OVERVIEW_FOR_BACKEND.md) — kiến trúc gọi API, env, auth, parse list/detail.
  - [`FRONTEND_PAYLOADS_BY_SCREEN.md`](./FRONTEND_PAYLOADS_BY_SCREEN.md) — bảng query từng màn + body form theo resource.
  - [`FRONTEND_RESPONSE_FIELDS_BY_RESOURCE.md`](./FRONTEND_RESPONSE_FIELDS_BY_RESOURCE.md) — **từng trường dữ liệu JSON nhận vào** (response) theo resource.
- **Từ điển dữ liệu backend (canonical DB / API field):** [`DATABASE_DATA_DICTIONARY.md`](../../ship-app-api/docs/DATABASE_DATA_DICTIONARY.md) trong repo **ship-app-api** — đối chiếu khi đặt tên cột, enum, và serializer.

---

## 2. Hợp đồng bắt buộc (FE kỳ vọng BE)

### 2.1. Base URL và version

| Hạng mục | Quy ước FE | Ghi chú đồng bộ BE |
|----------|-------------|---------------------|
| Prefix API | `VITE_API_PREFIX` hoặc mặc định **`/api/v1`** | Route Laravel phải khớp segment version (ví dụ `Route::prefix('v1')`). |
| Dev | FE thường dùng base relative **`/api/v1`** + Vite proxy | Proxy trỏ đúng origin backend. |
| Prod | `VITE_API_ORIGIN` + prefix | CORS và `APP_URL` nhất quán. |

Tham chiếu mã: `src/utils/constants.ts`, `env.docker.example`.

### 2.2. Xác thực

| Hạng mục | FE |
|----------|-----|
| Header | `Authorization: Bearer <token>` (token `localStorage` key `auth-token:v1`) |
| Cookie | `withCredentials: true` |
| Profile | `GET /user` |

Backend: **401** nên thống nhất (FE có thể xóa token / redirect login).

### 2.3. Danh sách (GET `/{resource}`)

**Query luôn có:** `page`, `per_page` (FE giới hạn **1–100**).

**Filter:** mỗi filter Refine `{ field, value }` → query **đúng tên `field`**, **ngoại lệ:** `search` hoặc `q` → gửi **`keyword`**.

**Sort:** `sort_by` (field đầu tiên), `sort_order` = `asc` | `desc`.

**Response envelope danh sách (khuyến nghị):**

```json
{
  "success": true,
  "message": "optional",
  "data": {
    "data": [ /* records */ ],
    "meta": {
      "total": 0,
      "current_page": 1,
      "last_page": 1,
      "per_page": 15
    }
  }
}
```

- `success === false` → FE coi là lỗi (`throwIfEnvelopeFailed`).
- Tổng bản ghi: ưu tiên **`data.meta.total`**, fallback độ dài mảng.

Mã: `src/providers/dataProvider.tsx`, `src/services/http/envelope.ts`.

### 2.4. Chi tiết / tạo / cập nhật

- `GET /{resource}/{id}`, `POST /{resource}`, `PUT /{resource}/{id}` — body JSON = object form (snake_case theo bảng payload).
- Sau khi kiểm tra envelope, dữ liệu bản ghi: **`unwrapEnvelope`** — thường là **`response.data.data`** (object) khi body là `{ success, data: { ... } }`; cần thống nhất một chuẩn với BE.

### 2.5. Xóa

- `DELETE /{resource}/{id}` — status thành công là đủ.

### 2.6. Lỗi nghiệp vụ & validation

- Envelope lỗi: `success: false`, `message`; nếu có **`errors`** dạng `Record<string, string[]>` (kiểu Laravel) thì FE có thể map vào form.
- HTTP 4xx/5xx: xử lý thống nhất message cho toast/UI.

---

## 3. Bản đồ resource (Refine → REST)

Chuỗi `resource` trong Refine = segment path (không có leading slash trong code, axios nối sau `baseURL`):

| Resource Refine | Path tương đương (sau base `/api/v1`) |
|-----------------|----------------------------------------|
| `companies` | `/companies` |
| `offices` | `/offices` |
| `departments` | `/departments` |
| `positions` | `/positions` |
| `employees` | `/employees` |
| `drivers` | `/drivers` |
| `users` | `/users` |
| `roles` | `/roles` |
| `vehicles` | `/vehicles` |
| `vehicle_assignments` | `/vehicle_assignments` |
| `vehicle_expenses` | `/vehicle_expenses` |
| `customers` | `/customers` |
| `trips` | `/trips` |
| `trip_bonus_rules` | `/trip_bonus_rules` |
| `invoices` | `/invoices` |
| `allowances` | `/allowances` |
| `deductions` | `/deductions` |
| `attendances` | `/attendances` |
| `payrolls` | `/payrolls` |

**Endpoint không đi theo CRUD chuẩn** (định nghĩa tập trung): `src/services/endpoints.ts` — ví dụ auth, `roles/:id/permissions`, payroll `approve` / `lock` / `export`, reports, chat, attendances late list, `v2/employees` (base `/api` qua flag `useApiRoot`).

---

## 4. Filter & payload theo màn hình

Bảng đầy đủ **query list** và **body form** theo từng resource nằm trong:

**[`FRONTEND_PAYLOADS_BY_SCREEN.md`](./FRONTEND_PAYLOADS_BY_SCREEN.md)**

Tóm tắt điểm dễ lệch:

- **Tìm kiếm:** FE gửi **`keyword`**, không gửi `search`/`q` thô lên BE (trừ khi đổi cả `dataProvider`).
- **Tab/filter:** ví dụ `employees.status`, `drivers.available_status`, `invoices.status`, `trips.status` + `trips.company_id` / `office_id` — tên param phải khớp validator/query builder BE.
- **Payroll:** tạo bằng `{ company_id, month, year }`; workflow `approve` / `lock` / `export` là route con.
- **Roles:** sau POST/PUT role, FE sync quyền qua API permissions (xem `ENDPOINTS.roles.syncRolePermissions`).
- **Upload (drivers):** field file theo Ant Design — BE cần thống nhất **multipart** hoặc **URL/id** sau upload; nên ghi rõ trong spec API backend.

---

## 5. Quy trình giữ thống nhất lâu dài

1. **Một nguồn sự thật phía FE:** `dataProvider` + `endpoints.ts` + form `src/pages/**`.
2. **Khi BE đổi:** cập nhật OpenAPI / `FRONTEND_API_ENDPOINTS.md` (repo API) và thông báo field/query deprecated.
3. **Khi FE đổi filter/form:** cập nhật **`FRONTEND_PAYLOADS_BY_SCREEN.md`** trong cùng PR (quy ước team).
4. **Cross-link:** trong `constants.ts` có comment tham chiếu `ship-app-api/docs/FRONTEND_API_ENDPOINTS.md` — nên duy trì liên kết hai chiều giữa repo API và hai file `docs/` ở repo ship-app.

---

## 6. Checklist nhanh cho backend khi nhận bàn giao UI

- [ ] Prefix `/api/v1` khớp route versioned.
- [ ] List: `page`, `per_page`, filter đúng tên (nhất là **`keyword`**), `sort_by` / `sort_order`.
- [ ] List response: `data.data[]` + `data.meta.total` (hoặc thống nhất khác và sửa FE).
- [ ] Detail/create/update: envelope + `data` object nhất quán với `unwrapEnvelope`.
- [ ] `success: false` + `message` (+ `errors` field) cho lỗi có cấu trúc.
- [ ] Auth: Bearer + `GET /user`; 401 thống nhất.
- [ ] Endpoint đặc biệt trong `endpoints.ts` đã có route tương ứng.

---

*Tài liệu tổng hợp từ mã nguồn `ship-app` và hai file overview/payload hiện có. Cập nhật khi thay đổi hợp đồng API hoặc resource mới.*
