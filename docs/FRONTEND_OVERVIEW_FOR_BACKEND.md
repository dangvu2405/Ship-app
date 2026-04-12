# Tổng quan frontend (Ship App) — cho team backend

Tài liệu mô tả cách SPA gọi API, kỳ vọng về payload/response và các điểm cần đồng bộ với Laravel API. Mã nguồn: repo **ship-app** (Vite + React).

> Báo cáo toàn diện (kiến trúc + chức năng + component + endpoint + payload): [`FRONTEND_FULL_REPORT.md`](./FRONTEND_FULL_REPORT.md).

---

## 1. Công nghệ & vai trò

| Thành phần | Ghi chú |
|------------|---------|
| **Vite** | Build/dev server; dev thường proxy `/api` → backend. |
| **React 18** | UI SPA, không SSR. |
| **Refine** | CRUD: `useList`, `useOne`, mutations; **custom `dataProvider`** bọc axios. |
| **Ant Design** | Form/table một phần; lớp UI riêng (Radix, v.v.) cho layout. |
| **Axios** | Một instance chung (`src/services/api.ts`), interceptor xử lý lỗi/toast. |
| **TanStack Query** | Một số query tùy chỉnh (ví dụ select phân trang) dùng cùng `dataProvider`/`api`. |

Backend được giả định là **REST JSON** dưới tiền tố versioned (mặc định **`/api/v1`**). Từ điển cột DB / mô tả nghiệp vụ backend: [`ship-app-api/docs/DATABASE_DATA_DICTIONARY.md`](../../ship-app-api/docs/DATABASE_DATA_DICTIONARY.md).

---

## 2. Base URL & biến môi trường

Logic nằm trong `src/utils/constants.ts`:

- **`API_BASE_URL`** (axios `baseURL`):
  - **Dev:** thường là `VITE_API_PREFIX` hoặc mặc định **`/api/v1`** (relative → Vite proxy tới origin backend).
  - **Prod:** `VITE_API_ORIGIN` + `VITE_API_PREFIX` (mặc định prefix `/api/v1`).
  - Có thể ghi đè tuyệt đối bằng **`VITE_API_BASE_URL`** (chuỗi kết thúc `/api` có thể được chuẩn hóa thành `/api/v1`).
- **`API_ROOT_BASE_URL`**: gốc **`/api`** (bỏ segment `/v1`), dùng cho vài route đặc biệt qua flag **`useApiRoot`** trên request (ví dụ `/api/v2/...`, health).

Tham chiếu mẫu env: `env.docker.example` (`VITE_API_ORIGIN`, `VITE_API_PREFIX`).

---

## 3. Xác thực (auth)

- **`Authorization: Bearer <token>`** — token đọc từ `localStorage` key `auth-token:v1` (`STORAGE_KEYS.AUTH_TOKEN`), gắn ở interceptor request.
- **`withCredentials: true`** — hỗ trợ cookie (ví dụ refresh HttpOnly nếu backend cấu hình).
- **Đăng nhập / user:** `src/services/auth.service.ts` + `ENDPOINTS.auth` (`/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/register`, **`/user`** cho profile).

Backend nên thống nhất: lỗi 401 → FE có thể redirect login / xóa token (xem interceptor trong `api.ts`).

---

## 4. CRUD qua Refine `dataProvider`

File chính: **`src/providers/dataProvider.tsx`**.

### 4.1. Đường dẫn REST

- **Danh sách:** `GET /{resource}` — `resource` là chuỗi Refine (thường khớp segment URL Laravel), ví dụ `companies`, `trips`, `invoices`.
- **Chi tiết:** `GET /{resource}/{id}`
- **Tạo:** `POST /{resource}` — body JSON = payload form.
- **Cập nhật:** `PUT /{resource}/{id}`
- **Xóa:** `DELETE /{resource}/{id}`

`baseURL` đã gồm prefix versioned, nên path thực tế kiểu **`/api/v1/companies`**.

### 4.2. Query danh sách (pagination + filter + sort)

FE gửi query params sau (map từ Refine):

| Param FE | Ý nghĩa |
|----------|---------|
| `page` | Trang hiện tại (mặc định 1). |
| `per_page` | Kích thước trang; FE **clamp** trong khoảng **1–100** (dù Refine yêu cầu lớn hơn). |
| **Filter:** mỗi filter `{ field, operator, value }` — nếu `value` rỗng/undefined thì **bỏ qua**. Tên field gửi **nguyên văn** lên query, **trừ** `search` / `q` → map thành **`keyword`**. |
| `sort_by` | Field sort (lấy **sorter đầu tiên**). |
| `sort_order` | `asc` hoặc `desc`. |

Ví dụ filter list: `company_id`, `office_id`, `status`, `type`, `available_status`, `keyword`, … — backend cần khớp tên param mà các màn list đang gửi.

### 4.3. Kỳ vọng response danh sách

FE parse theo format (comment trong `dataProvider`):

```json
{
  "success": true,
  "message": "...",
  "data": {
    "data": [ /* mảng bản ghi */ ],
    "meta": {
      "total": 123,
      "current_page": 1,
      "last_page": 10,
      "per_page": 15
    }
  }
}
```

- `total` cho Refine: ưu tiên **`data.meta.total`**, fallback độ dài mảng.
- Nếu `success === false`, FE gọi **`throwIfEnvelopeFailed`** → coi như lỗi.

### 4.4. Response getOne / create / update

- Sau khi kiểm tra `success !== false`, dữ liệu bản ghi lấy qua **`unwrapEnvelope`**: thường là **`response.data.data`** (object đơn) hoặc envelope tương thích `ApiEnvelope` trong `src/services/http/types.ts`.

### 4.5. Xóa

- `DELETE` thành công là đủ; FE không bắt buộc body đặc biệt.

---

## 5. Envelope & lỗi validation

- **`throwIfEnvelopeFailed`**: nếu body có `success: false` → throw (message từ `message` hoặc mặc định).
- **`ApiResponse<T>`** (`src/types/index.ts`): `success`, `message?`, `data?`, **`errors?: Record<string, string[]>`** — hữu ích cho lỗi field Laravel; FE có thể map vào form tùy màn.

---

## 6. Endpoint tùy chỉnh (ngoài CRUD chuẩn)

Định nghĩa tập trung: **`src/services/endpoints.ts`**. Một số nhóm:

| Nhóm | Ví dụ path (relative tới versioned base hoặc ghi chú trong code) |
|------|-------------------------------------------------------------------|
| Auth | `/auth/login`, `/auth/logout`, `/auth/refresh`, `/auth/register`, `/user` |
| Roles / permissions | `/roles/:id/permissions`, `/permissions`, … |
| Trips / invoice / payroll | CRUD chuẩn + payroll: `approve`, `lock`, `export`, `my-salary` |
| Reports | `/reports/dashboard`, `/reports/payroll-summary` |
| Chat | `/chat/messages`, stream, sessions |
| Attendance | `/attendances/late/list`, `notify` |
| V2 | `/v2/employees` — thường gọi qua **`useApiRoot: true`** (base `/api`) |

Khi thêm route mới: cập nhật **`ENDPOINTS`** + (nếu là CRUD chuẩn) đảm bảo **`resource`** trong Refine khớp segment URL.

---

## 7. Hành vi UI ảnh hưởng tới API

- **Select filter phân trang:** hook `usePaginatedResourceSelectOptions` gọi `getList` với **`pageSize: 10`** và scroll dropdown để tải thêm — backend nên hỗ trợ `page` / `per_page` nhất quán cho các resource `companies`, `offices`, v.v.
- **Tìm kiếm list:** filter field `search` / `contains` trên FE được map thành query **`keyword`**.

---

## 8. Checklist đồng bộ với backend

1. Prefix **`/api/v1`** (hoặc giá trị `VITE_API_PREFIX`) khớp `routes/api.php` / doc API nội bộ.
2. List response: **`data.data` + `data.meta.total`** (hoặc thống nhất một chuẩn và cập nhật `dataProvider`).
3. Mọi filter list: tên query **khớp** field Refine (và đặc biệt **`keyword`** cho search).
4. Lỗi nghiệp vụ: **`success: false`** + `message` (và `errors` nếu có) để FE hiển thị đúng.
5. **401/403:** thống nhất body hoặc header để FE xử lý (logout / forbidden).

---

## 9. File tham chiếu nhanh (frontend)

| File | Nội dung |
|------|----------|
| `src/providers/dataProvider.tsx` | Map Refine → HTTP query/body & parse list/detail. |
| `src/services/api.ts` | Axios, token, interceptor, `useApiRoot`. |
| `src/services/endpoints.ts` | Path cố định ngoài CRUD. |
| `src/services/http/envelope.ts` | `success`, unwrap data. |
| `src/utils/constants.ts` | `API_BASE_URL`, storage keys. |
| `env.docker.example` | Biến env dev/prod. |

Nếu backend có tài liệu endpoint riêng (ví dụ `FRONTEND_API_ENDPOINTS.md` trong repo API), nên **cross-link** hai chiều với file này để tránh lệch version.

---

## 10. Payload chi tiết theo màn hình

Bảng query + body từng CRUD/list/auth: **`docs/FRONTEND_PAYLOADS_BY_SCREEN.md`**.

Bảng **trường JSON nhận vào** (response) theo từng resource: **`docs/FRONTEND_RESPONSE_FIELDS_BY_RESOURCE.md`**.
