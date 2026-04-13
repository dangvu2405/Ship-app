# Endpoints Alignment (Frontend ↔ Backend)

Tài liệu này dùng để đối chiếu nhanh giữa frontend `ship-app` và backend API.

- Prefix chuẩn frontend đang dùng: `/api/v1`
- Mục tiêu: xác nhận path, method, body, response envelope để tránh mismatch.

## 1) Auth APIs

### 1.1 Login
- **Method**: `POST`
- **Path**: `/api/v1/auth/login`
- **Frontend payload**:
```json
{
  "email": "user@example.com",
  "password": "secret"
}
```
- **Frontend kỳ vọng response**:
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {},
    "token": "..."
  }
}
```

### 1.2 Logout
- **Method**: `POST`
- **Path**: `/api/v1/auth/logout`
- **Auth**: Bearer token

### 1.3 Refresh token
- **Method**: `POST`
- **Path**: `/api/v1/auth/refresh`
- **Auth**: Bearer token
- **Frontend kỳ vọng**: `data.token`

### 1.4 Current user
- **Method**: `GET`
- **Path**: `/api/v1/auth/me`
- **Auth**: Bearer token

### 1.5 Register
- **Method**: `POST`
- **Path**: `/api/v1/auth/register`
- **Frontend payload**:
```json
{
  "username": "newuser",
  "email": "new@company.com",
  "password": "password123",
  "password_confirmation": "password123"
}
```

### 1.6 Forgot password (send reset link)
- **Method**: `POST`
- **Path**: `/api/v1/auth/forgot-password`
- **Frontend payload**:
```json
{
  "email": "user@example.com"
}
```
- **Frontend xử lý**:
  - Thành công: chuyển qua màn reset password.
  - Lỗi: hiển thị `message` từ API, fallback bằng i18n message.

### 1.7 Reset password (using token)
- **Method**: `POST`
- **Path**: `/api/v1/auth/reset-password`
- **Frontend payload**:
```json
{
  "email": "user@example.com",
  "token": "reset-token-from-email",
  "password": "newPassword123",
  "password_confirmation": "newPassword123"
}
```
- **Frontend validation trước khi call**:
  - `token` bắt buộc
  - `password` tối thiểu 8 ký tự
  - `password_confirmation` phải khớp `password`

---

## 2) Chat APIs

### 2.1 Sessions
- `GET /api/v1/chat/sessions`
- `DELETE /api/v1/chat/sessions/{sessionId}`

### 2.2 Messages
- `GET /api/v1/chat/messages`
- `POST /api/v1/chat/messages`
- `POST /api/v1/chat/messages/stream`

---

## 3) Reports APIs

- `GET /api/v1/reports/dashboard`
- `GET /api/v1/reports/payroll-summary`

---

## 4) Payroll extra APIs

- `GET /api/v1/payrolls/my-salary`
- `POST /api/v1/payrolls/{id}/approve`
- `POST /api/v1/payrolls/{id}/lock`
- `GET /api/v1/payrolls/{id}/export`

---

## 5) CRUD resources dưới `/api/v1`

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
- `payrolls`
- `roles`
- `users`
- `permissions` (chủ yếu read/map quyền)

Frontend đang dùng chuẩn REST:
- `GET /resource`
- `POST /resource`
- `GET /resource/{id}`
- `PUT|PATCH /resource/{id}`
- `DELETE /resource/{id}`

---

## 6) Envelope/format cần backend xác nhận

Frontend đang parse theo envelope:

```json
{
  "success": true,
  "message": "string",
  "data": {}
}
```

Đề nghị backend xác nhận:
- Tất cả endpoint có thống nhất `success/message/data` không?
- Validation errors trả theo format nào (422)?
- Unauthorized/forbidden trả message field ổn định không?

---

## 7) Các điểm cần backend đối chiếu ngay

1. `POST /api/v1/auth/forgot-password`: đã sẵn sàng ở môi trường dev/staging/prod chưa?
2. `POST /api/v1/auth/reset-password`: token reset lấy từ email có đúng key là `token` không?
3. `GET /api/v1/auth/me`: có luôn trả `data.user` hay trả trực tiếp user object?
4. `POST /api/v1/auth/register`: backend có yêu cầu quyền admin trong mọi môi trường hay chỉ production?
5. Các endpoint CRUD có đồng nhất pagination/query params (`page`, `per_page`, `search`) không?

---

## 8) Gợi ý test nhanh giữa FE và BE

1. Submit forgot-password bằng email hợp lệ.
2. Lấy token từ email.
3. Submit reset-password với token + password mới.
4. Login bằng mật khẩu mới.
5. Verify `auth/me` trả đúng user.

