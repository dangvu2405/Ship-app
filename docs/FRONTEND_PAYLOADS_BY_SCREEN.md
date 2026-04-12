# Payload theo từng màn hình (FE → BE)

Tài liệu mô tả **query string** (list) và **JSON body** (create/update) mà frontend gửi, bám theo mã nguồn hiện tại. Base path mặc định: **`/api/v1`** (xem `FRONTEND_OVERVIEW_FOR_BACKEND.md`).

**Quy ước list (dataProvider):** mọi list dùng `page`, `per_page` (1–100); filter có `field` + `value` → query **đúng tên `field`**, riêng `search` / `q` → **`keyword`**; sort: `sort_by`, `sort_order`.

---

## 1. Auth & công khai

| Màn | Method | Path | Body / query |
|-----|--------|------|----------------|
| **Đăng nhập** | POST | `/auth/login` | `{ "email": string, "password": string }` (trim email) |
| **Đăng ký** | POST | `/auth/register` | `{ "username", "email", "password", "password_confirmation" }` |
| **Đăng xuất** | POST | `/auth/logout` | (theo axios, có Bearer nếu có token) |
| **Refresh token** | POST | `/auth/refresh` | (theo backend) |
| **User hiện tại** | GET | `/user` | — |
| **Test accounts** (tùy môi trường) | GET | `/auth/test-accounts` | — |

---

## 2. Dashboard

| Nguồn | Method | Path | Query / body |
|-------|--------|------|----------------|
| **Thống kê dashboard** | GET | `/reports/dashboard` | `month` (1–12), `year`, tùy chọn `company_id` |
| **Danh sách công ty (filter UI)** | GET | `/companies` | `page`, `per_page`, `status=active`, `sort_by=name`, `sort_order=asc` |
| **Danh sách văn phòng (chart)** | GET | `/offices` | `page`, `per_page`, sort tên |
| **Doanh thu chuyến (fallback client)** | GET | `/trips` | Lặp `page`… `per_page=100`, `status=completed`, optional `company_id` |

---

## 3. Danh sách (GET `/{resource}`)

Cột **Query khi áp dụng** = tham số thực tế sau khi map (`search` → `keyword`). Luôn có `page`, `per_page` (thường 15; select scroll dùng 10).

| Màn | `resource` | Query thêm (khi user lọc / tab) |
|-----|------------|----------------------------------|
| **Companies** | `companies` | `keyword`, `status` (`active` / `inactive`; tab đồng bộ với filter) |
| **Offices** | `offices` | `keyword`, `company_id` |
| **Departments** | `departments` | `keyword`, `office_id` |
| **Positions** | `positions` | `keyword` |
| **Employees** | `employees` | `keyword`, `type` (`office` / `driver`), `status` (tab; `active` / `inactive`) |
| **Drivers** | `drivers` | `keyword`, `available_status` (`available` / `on_trip` / `off`; tab + filter form) |
| **Users** | `users` | `keyword`, `status` |
| **Roles** | `roles` | `keyword` |
| **Vehicles** | `vehicles` | `keyword`, `status` |
| **Customers** | `customers` | `keyword`, `type` (`company` / `individual`) |
| **Trips** | `trips` | `company_id`, `office_id`, `status` (tab: `pending`, `in_progress`, …) |
| **Trip bonus rules** | `trip_bonus_rules` | — (chỉ phân trang) |
| **Invoices** | `invoices` | `keyword`, `status` (`draft` / `issued` / `paid`) |
| **Allowances** | `allowances` | — |
| **Deductions** | `deductions` | — |
| **Attendances** | `attendances` | — |
| **Payrolls** | `payrolls` | — |
| **Vehicle assignments** | `vehicle_assignments` | — |
| **Vehicle expenses** | `vehicle_expenses` | — |

**Select phụ (dropdown phân trang):** `GET /companies` (`status=active`, sort name), `GET /offices` (thêm `company_id` khi đã chọn công ty trên Trips), tương tự các màn Offices/Departments dùng scroll 10 bản ghi/trang.

---

## 4. Chi tiết / xóa

| Thao tác | Method | Path |
|----------|--------|------|
| Chi tiết | GET | `/{resource}/{id}` |
| Xóa | DELETE | `/{resource}/{id}` |

---

## 5. Form tạo / cập nhật (POST hoặc PUT `/{resource}` hoặc `/{resource}/{id}`)

Toàn bộ giá trị lấy từ **Ant Design Form** `onFinish` → gửi nguyên object `values` (trừ các màn ghi chú riêng). Kiểu số/date là giá trị FE (chuỗi ISO hoặc số tùy field).

### 5.1. `companies`

`code`, `name`, `tax_code`, `address`, `phone`, `email`, `status` (`active` | `inactive`).  
*(Import Excel nếu có là luồng riêng / toast — không gộp trong bản payload CRUD chuẩn ở đây.)*

### 5.2. `offices`

`company_id`, `code`, `name`, `address`

### 5.3. `departments`

`office_id`, `parent_id` (optional), `code`, `name`

### 5.4. `positions`

`code`, `name`, `base_salary`, `level`

### 5.5. `employees`

`code`, `name`, `email`, `phone`, `type` (`office` | `driver`), `status`

### 5.6. `drivers`

`employee_id`, `license_no`, `license_class`, `expired_date`, `available_status`,  
`id_card_no`, `id_card_issue_date`, `permanent_address`,  
`id_card_front`, `id_card_back` (upload — cấu trúc theo norm file Ant),  
`insurance_provider`, `insurance_policy_no`, `insurance_expiry_date`, `insurance_doc`,  
`profile_notes`

### 5.7. `users`

`username`, `email`, `employee_id`, `role_ids` (mảng id), `status`;  
màn tạo thêm `password` (khi có field).

### 5.8. `roles`

**PUT/POST body role:** `{ "name", "description" }`  
**Quyền:** sau khi tạo/sửa role thành công, FE gọi thêm API sync permissions với danh sách `permission_ids` (xem `ENDPOINTS.roles.syncRolePermissions`).

### 5.9. `vehicles`

`plate_number`, `type`, `brand`, `model`, `year`, `capacity`, `status`

### 5.10. `customers`

`name`, `type` (`company` | `individual`), `tax_code`, `email`, `phone`, `address`, `contact_person`

### 5.11. `trips`

`code`, `customer_id`, `driver_id`, `vehicle_id`,  
`start_point`, `end_point`, `distance_km`, `price`,  
`status`, `start_time`, `end_time` (chuỗi datetime-local / ISO tùy FE)

**Đổi trạng thái nhanh từ list (workflow):** `PUT /trips/{id}` với body **`{ "status": "in_progress" | "completed" | "cancelled" }`** (qua `trip.service`).

### 5.12. `trip_bonus_rules`

`min_km`, `max_km` (optional), `bonus_per_km`

### 5.13. `invoices`

`code`, `customer_id`, `trip_id`, `total_amount`, `tax_amount`, `issued_at`, `due_date`, `status`

### 5.14. `allowances`

`code`, `name`, `default_amount`, `taxable` (boolean)

### 5.15. `deductions`

`code`, `name`

### 5.16. `attendances`

`employee_id`, `date`, `check_in`, `check_out`, `work_hours`, `overtime_hours`, `status`

### 5.17. `payrolls`

**Tạo (generate):** `{ "company_id": number, "month": number, "year": number }`  
*(Service `payrollService.generate` cũng POST cùng shape tới `/payrolls`.)*

**Duyệt / khóa / export (không phải body form list):**

- POST `/payrolls/{id}/approve`
- POST `/payrolls/{id}/lock`
- GET `/payrolls/{id}/export` → FE tải JSON

### 5.18. `vehicle_assignments`

`vehicle_id`, `driver_id`, `from_date`, `to_date`

### 5.19. `vehicle_expenses`

`vehicle_id`, `driver_id` (optional), `type`, `amount`, `expense_date`, `note`

---

## 6. Ghi chú cho backend

1. **Đặt tên field** nên khớp snake_case như bảng trên để khớp form Refine.
2. **`invoice` status:** FE có thể hiển thị chuẩn hóa label; giá trị filter list gửi `draft` / `issued` / `paid`.
3. **Upload:** các field file trên `drivers` thường là mảng file Ant; backend cần thống nhất multipart hoặc URL/id sau upload — kiểm tra thực tế API.
4. **V2 employees:** nếu dùng, gọi qua base `/api` + path trong `ENDPOINTS.v2` (không nằm trong bảng CRUD Refine mặc định).

---

*Tài liệu sinh từ mã nguồn `src/pages`, `src/providers/dataProvider.tsx`, `src/services`. Khi đổi form hoặc filter, cập nhật song hành file này.*
