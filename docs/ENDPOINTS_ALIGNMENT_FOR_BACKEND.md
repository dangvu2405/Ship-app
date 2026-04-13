# Endpoints Alignment (Frontend ↔ Backend)

Nguồn đối chiếu backend: `Ship-app-api/docs/FRONTEND_API.md`.

- Base frontend dùng: `/api/v1`
- Envelope chuẩn backend:

```json
{
  "success": true,
  "message": "Human-readable status",
  "data": {},
  "errors": {}
}
```

`errors` chỉ có khi `422`.

## 1) Auth (khớp backend)

### `POST /api/v1/auth/login`
- Body: `{ email, password }`
- FE kỳ vọng: `data.token`, `data.user`

### `POST /api/v1/auth/social/login`
- Body: `{ provider, access_token?, id_token? }`
- `provider`: `google | facebook | apple`

### `POST /api/v1/auth/forgot-password`
- Body: `{ email }`
- FE đã map đúng endpoint này.

### `POST /api/v1/auth/reset-password`
- Body:
```json
{
  "token": "reset-token",
  "email": "user@example.com",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```
- FE bước 2 đã chuyển sang form reset password theo token.

### `POST /api/v1/auth/logout` (auth)
### `POST /api/v1/auth/refresh` (auth)
### `GET /api/v1/auth/me` (auth)

## 2) Driver schedule / attendance / HR ops (đã map FE)

Theo backend doc đã có:
- `/driver-schedules` (+ submit/approve/reject)
- `/attendance` (+ check-in/check-out/adjust)
- `/leave` (+ approve/reject/cancel)
- `/overtime` (+ approve/reject)
- `/violations` (+ confirm/dispute/resolve/waive)

Ghi chú:
- FE đã có trang `Workforce Ops` dùng các endpoint:
  - driver schedules: list/submit/approve/reject
  - attendance: list/adjust
  - leave: list/approve/reject/cancel
  - overtime: list/approve/reject
  - violations: list/confirm/dispute/resolve-dispute/waive
- Các luồng create mới (`POST /leave`, `POST /overtime`, `POST /violations`) hiện chưa mở UI tạo bản ghi trong trang này.

## 3) Payroll / Reports / RBAC / AI / Chat

### Payroll
- `GET|POST /payrolls`
- `GET|PUT|DELETE /payrolls/{id}`
- `POST /payrolls/{id}/approve`
- `POST /payrolls/{id}/lock`
- `GET /payrolls/{id}/export`
- `GET /payrolls/my-salary`

### Reports
- `GET /reports/dashboard`
- `GET /reports/payroll-summary`

### Users & RBAC
- `users` CRUD
- `roles` CRUD
- `POST /roles/{id}/permissions`
- `GET /permissions`

### AI
- `POST /ai/business-assist`

### Chat
- `GET /chat/sessions`
- `DELETE /chat/sessions/{sessionId}`
- `GET /chat/messages`
- `POST /chat/messages`
- `POST /chat/messages/stream`

## 4) Master data CRUD dưới `/api/v1`

- `companies`
- `offices`
- `departments`
- `positions`
- `drivers`
- `vehicles`
- `vehicle_assignments`
- `vehicle_expenses`
- `customers`
- `trips`
- `trip_bonus_rules`
- `invoices`

## 5) Checklist backend cần confirm

1. `POST /auth/forgot-password`: response chuẩn luôn có `success`/`message` (có thể không có `data`)?
2. `POST /auth/reset-password`: key token bắt buộc là `token` (đúng như doc), không phải `code`?
3. `GET /auth/me`: luôn trả `data.user` (không trả trực tiếp object user)?
4. Danh sách API legacy `/api/...` có thể giữ tạm, nhưng FE sẽ chuẩn hóa `/api/v1/...`.
5. Pagination shape các list endpoint giữ đúng chuẩn Laravel paginator trong `data`.

## 6) Test luồng quên mật khẩu (đối chiếu FE ↔ BE)

1. FE gọi `POST /api/v1/auth/forgot-password` với email.
2. Nhận email chứa token reset.
3. FE gọi `POST /api/v1/auth/reset-password` với `{ email, token, password, password_confirmation }`.
4. Login lại bằng mật khẩu mới (`POST /api/v1/auth/login`).

