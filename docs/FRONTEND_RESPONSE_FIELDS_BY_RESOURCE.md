# Trường dữ liệu API mà frontend nhận (response) — theo resource

Tài liệu mô tả **từng trường** FE kỳ vọng trong JSON **trả về** từ backend (sau envelope), để đối chiếu serializer Laravel / Resource class. Nguồn chính: `src/types/index.ts`, `src/providers/dataProvider.tsx`, `src/services/dashboard.service.ts`, `src/services/auth.service.ts`.

### Nguồn chân lý backend (DB / BA / QA)

- **Từ điển dữ liệu API/DB (ship-app-api):** [`DATABASE_DATA_DICTIONARY.md`](../../ship-app-api/docs/DATABASE_DATA_DICTIONARY.md) — bảng `users`, `employees`, `drivers`, `trips`, `invoices`, payroll, v.v.
- **Cách dùng:** serializer Laravel nên map cột DB → JSON **snake_case** khớp dictionary; FE (`src/types`) có thể là **tập con** hoặc **alias** — khi lệch, ưu tiên cập nhật API + type TS + hai tài liệu này cùng lúc.

**Đối chiếu nhanh (dictionary vs type FE hiện tại — cần thống nhất theo Resource API):**

| Vùng | Backend (dictionary) | Frontend (`src/types`) / ghi chú |
|------|------------------------|-----------------------------------|
| **User** | `avatar_url`, `last_login_at`, `emergency_contact_*`, `residential_address` | `User` chưa khai báo — BE có thể trả thêm; bổ sung optional khi UI dùng. |
| **Employee** | Nhiều cột: `office_id`, `department_id`, `position_id`, `dob`, `gender`, `national_id_*`, ngân hàng, BHXH… | `Employee` chủ yếu nested `office` / `department` / `position`; thiếu FK phẳng và profile mở rộng — bổ sung khi form/hiển thị cần. |
| **Driver** | `license_image_url`, `identity_image_url`, `driver_insurance_*`, `health_certificate_*`, `available_status`: `available` \| `busy` \| `offline` | FE dùng tên kiểu `id_card_*`, `insurance_*`, URL `*_url` — **cần map rõ** trong API (alias hoặc đổi FE theo DB). Enum sẵn sàng: BE `busy`/`offline` vs UI cũ `on_trip`/`off` — thống nhất một bộ giá trị. |
| **Invoice** | `subtotal`, `vat_rate`, `vat_amount`, `paid_at`, `status` gồm `cancelled` | FE có `tax_amount`; không có `subtotal`/`vat_rate`/`paid_at` — align serializer + type. |
| **Customer** | Dictionary ghi migration có thể **chưa** có `contact_person` / `code` / `status` | FE `Customer` có `contact_person` — chỉ dùng nếu BE/migration đã bổ sung (xem §6.1 dictionary). |
| **Vehicle assignment** | `driver_id` → FK **employees** | FE gán `Driver` nested — đúng hướng nếu API trả employee/driver theo quan hệ. |
| **Payroll** | `payroll_period_id`, `notes`, mốc `approved_at` / `paid_at`, enum `draft` \| `approved` \| `paid` \| `locked` | FE `Payroll` tối giản — bổ sung khi màn chi tiết/report cần. |
| **Payroll detail** | `meta_json`, audit `*_by` | FE `PayrollDetail` chưa có — thêm optional khi export chi tiết. |

**Quy ước envelope thường gặp:**

| Ngữ cảnh | Cấu trúc `response.data` (sau axios) | Phần “bản ghi” FE đọc |
|----------|--------------------------------------|------------------------|
| **List** `GET /{resource}` | `{ success, message?, data: { data: T[], meta?: { total, current_page, last_page, per_page } } }` | Mảng `data.data[]`; tổng `data.meta.total`. |
| **Chi tiết / tạo / cập nhật** | `{ success, message?, data: T }` hoặc envelope tương thích | Object `T` qua `unwrapEnvelope` → **`data`** là object bản ghi (không lồng thêm `.data` con). |
| **Lỗi** | `success: false`, `message`, `errors?: Record<string, string[]>` | — |

Kiểu TypeScript cột **Kiểu** = kỳ vọng khi parse JSON (số có thể là number từ JSON).

---

## 1. Auth & user

### 1.1. `POST /auth/login` — `data` khi thành công

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `user` | object (`User`) | Có (FE kiểm tra `response.data.user`) | Xem bảng **User** bên dưới. |
| `token` | string | Khuyến nghị | Lưu Bearer; thiếu thì chỉ dùng cookie nếu BE thiết kế vậy. |

### 1.2. `GET /user` (profile) — `data`

Toàn bộ body `data` là một object **User** (cùng shape tối thiểu như bảng dưới; có thể kèm quan hệ đã eager load).

### 1.3. **User**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `username` | string | Có | |
| `email` | string | Có | |
| `employee_id` | number | Không | |
| `status` | string | Có | Ví dụ `active` / `inactive`. |
| `roles` | `Role[]` | Không | Danh sách role kèm UI. |
| `employee` | `Employee` | Không | Nested khi BE trả. |

---

## 2. **Permission**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `name` | string | Có | |
| `code` | string | Không | Mã quyền (slug). |

---

## 3. **Role**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `name` | string | Có | |
| `description` | string | Không | |
| `permissions` | `Permission[]` | Không | Khi list/show role có kèm quyền. |

---

## 4. **Company**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `tax_code` | string | Không | |
| `address` | string | Không | |
| `phone` | string | Không | |
| `email` | string | Không | |
| `status` | string | Có | `active` / `inactive`. |

---

## 5. **Office**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `address` | string | Không | |
| `company_id` | number | Có | FK công ty. |
| `manager_id` | number | Không | |
| `company` | `Company` | Không | Nested. |

---

## 6. **Department**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `office_id` | number | Có | |
| `parent_id` | number | Không | Phòng ban cha. |
| `office` | `Office` | Không | Nested. |

---

## 7. **Position**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `base_salary` | number | Có | |
| `level` | number | Không | |
| `description` | string | Không | |

---

## 8. **Employee**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `email` | string | Không | |
| `phone` | string | Không | |
| `type` | `'office' \| 'driver'` | Có | |
| `status` | string | Có | Tab list: `active` / `inactive`. |
| `office` | `Office` | Không | |
| `department` | `Department` | Không | |
| `position` | `Position` | Không | |

---

## 9. **Driver**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `employee_id` | number | Có | |
| `license_no` | string | Có | |
| `license_class` | string | Có | |
| `expired_date` | string | Không | ISO / date. |
| `available_status` | string | Không | Ví dụ `available`, `on_trip`, `off`. |
| `employee` | `Employee` | Không | Nested. |
| `id_card_no` | string | Không | CCCD/CMND. |
| `id_card_issue_date` | string | Không | |
| `permanent_address` | string | Không | |
| `id_card_front_url` | string | Không | **URL** sau upload (khác tên field gửi lên form file). |
| `id_card_back_url` | string | Không | |
| `insurance_provider` | string | Không | |
| `insurance_policy_no` | string | Không | |
| `insurance_expiry_date` | string | Không | |
| `insurance_doc_url` | string | Không | |
| `profile_notes` | string | Không | |

---

## 10. **Vehicle**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `plate_number` | string | Có | |
| `type` | string | Có | |
| `brand` | string | Không | |
| `model` | string | Không | |
| `year` | number | Không | |
| `capacity` | number | Không | |
| `status` | string | Có | |
| `office_id` | number | Có | |

---

## 11. **Customer**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `name` | string | Có | |
| `type` | `'company' \| 'individual'` | Có | |
| `tax_code` | string | Không | |
| `email` | string | Không | |
| `phone` | string | Không | |
| `address` | string | Không | |
| `contact_person` | string | Không | |

---

## 12. **Trip**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `customer_id` | number | Có | |
| `driver_id` | number | Có | |
| `vehicle_id` | number | Có | |
| `start_point` | string | Có | |
| `end_point` | string | Có | |
| `distance_km` | number | Có | |
| `price` | number | Có | |
| `status` | string | Có | Ví dụ `pending`, `in_progress`, `completed`, `cancelled`. |
| `start_time` | string | Không | Datetime. |
| `end_time` | string | Không | |
| `customer` | `Customer` | Không | Nested khi BE trả. |

*(FE type không khai báo `company_id` / `office_id` trên `Trip`, nhưng list có thể filter theo các FK này — BE có thể trả thêm các field snake_case; nên bổ sung vào API doc nếu UI cần hiển thị.)*

---

## 13. **TripBonusRule**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `min_km` | number | Có | |
| `max_km` | number \| null | Không | |
| `bonus_per_km` | number | Có | |
| `created_at` | string | Không | |
| `updated_at` | string | Không | |

---

## 14. **Invoice**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `customer_id` | number | Có | |
| `trip_id` | number | Không | |
| `total_amount` | number | Có | |
| `tax_amount` | number | Không | |
| `issued_at` | string | Không | |
| `due_date` | string | Không | |
| `status` | string | Có | `draft` / `issued` / `paid`. |
| `trip` | `Trip` | Không | |
| `customer` | `Customer` | Không | |

---

## 15. **VehicleAssignment**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `vehicle_id` | number | Có | |
| `driver_id` | number | Có | |
| `from_date` | string | Có | |
| `to_date` | string | Không | |
| `vehicle` | `Vehicle` | Không | |
| `driver` | `Driver \| Employee` | Không | |

---

## 16. **VehicleExpense**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `vehicle_id` | number | Có | |
| `driver_id` | number | Không | |
| `type` | string | Có | |
| `amount` | number | Có | |
| `expense_date` | string | Có | |
| `note` | string | Không | |
| `vehicle` | `Vehicle` | Không | |
| `driver` | `Driver \| Employee` | Không | |

---

## 17. **Allowance**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |
| `default_amount` | number | Không | |
| `taxable` | boolean | Không | |

---

## 18. **Deduction**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `code` | string | Có | |
| `name` | string | Có | |

---

## 19. **Attendance**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `employee_id` | number | Có | |
| `date` | string | Có | |
| `check_in` | string | Không | |
| `check_out` | string | Không | |
| `work_hours` | number | Không | |
| `overtime_hours` | number | Không | |
| `status` | string | Không | |
| `employee` | `Employee` | Không | |

---

## 20. **Payroll**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `company_id` | number | Có | |
| `month` | number | Có | 1–12. |
| `year` | number | Có | |
| `status` | string | Có | Theo nghiệp vụ BE (draft/approved/locked…). |
| `locked_at` | string | Không | |
| `details` | `PayrollDetail[]` | Không | Khi show/export chi tiết. |

### 20.1. **PayrollDetail**

| Trường | Kiểu | Bắt buộc | Ghi chú |
|--------|------|-----------|---------|
| `id` | number | Có | |
| `payroll_id` | number | Có | |
| `employee_id` | number | Có | |
| `base_salary` | number | Có | |
| `working_days` | number | Có | |
| `overtime` | number | Có | |
| `bonus` | number | Có | |
| `allowance` | number | Có | |
| `deduction` | number | Có | |
| `fuel_cost` | number | Có | |
| `tax` | number | Có | |
| `net_salary` | number | Có | |
| `employee` | `Employee` | Không | |

---

## 21. Dashboard — `GET /reports/dashboard`

FE nhận `ApiResponse` với `data` là object; **`dashboard.service`** chuẩn hóa nhiều dạng legacy về **`DashboardStats`**.

### 21.1. **DashboardStats** (sau map)

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `companies` | `{ total: number; active: number }` | Nếu BE gửi `companies` object thì giữ; không thì fallback `companies_count` → cả `total` và `active`. |
| `employees` | `{ total: number; active: number }` | Mặc định `{0,0}` nếu thiếu. |
| `vehicles` | `{ total: number; active: number }` | Mặc định `{0,0}` nếu thiếu. |
| `trips` | `{ total: number; pending: number; completed: number }` | Mặc định `{0,0,0}` nếu thiếu. |
| `payrolls` | `{ total: number; pending: number; completed: number }` | Fallback `payrolls_count` cho `total` nếu không có object `payrolls`. |
| `revenue` | `{ total: number }` | Không bắt buộc. BE có thể gửi một trong các key phẳng: `revenue_total`, `trips_revenue`, `trip_revenue_total`, `sales_total`, hoặc `revenue` (number hoặc `{ total }`). |

---

## 22. Chat (nếu bật tính năng)

### 22.1. **ChatSession**

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `id` | number \| string | |
| `session_id` | string | Không |
| `title` | string | Không |
| `model` | string | Không |
| `created_at`, `updated_at` | string | Không |
| `last_message` | string | Không |
| `last_message_at` | string | Không |
| `message_count` | number | Không |

### 22.2. **ChatMessage**

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `id` | number \| string | |
| `session_id` | string | Không |
| `role` | string | `'user' \| 'assistant' \| …` |
| `message`, `response`, `response_text`, `content`, `text` | string | BE chỉ cần **một** field nội dung chuẩn; FE đọc nhiều alias để tương thích. |
| `created_at`, `updated_at`, `model`, `status` | mixed | Không |
| `cached`, `guarded` | boolean | Không |
| `context` | object | Không |

---

## 23. Đi muộn — `LateAttendanceNotification`

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `id` | number \| string | |
| `date` | string | Không |
| `employee_id` | number | Không |
| `employee` | `Employee` | Không |
| `employee_name` | string | Không |
| `check_in` | string | Không |
| `late_minutes` | number | Không |
| `late_after` | string | Không |
| `notified` | boolean | Không |
| `note` | string | Không |

---

## 24. ActivityLog (nếu API có)

| Trường | Kiểu | Ghi chú |
|--------|------|---------|
| `id` | number | |
| `type` | string | `create` \| `update` \| `delete` \| `system` \| `user` |
| `resource` | string | Tên resource logic |
| `resource_id` | number | Không |
| `action` | string | |
| `description` | string | |
| `user_id` | number | Không |
| `user_name` | string | Không |
| `created_at` | string | |
| `read` | boolean | |

---

## 25. Ghi chú cho backend

1. **Tên trường:** ưu tiên **snake_case** như bảng để khớp type TS và form.
2. **File upload:** response dùng `*_url` (string); request form có thể dùng field file khác — cần tài liệu riêng multipart/URL.
3. **Số & null:** JSON number vs string — FE thường `Number()` khi cần; nên thống nhất kiểu (đặc biệt decimal tiền tệ).
4. **Timestamp:** nhiều entity không khai báo `created_at` trong type FE nhưng BE vẫn **nên** trả nếu có; có thể bổ sung type sau.
5. **Nguồn sự thật mã:** khi lệch tài liệu này với runtime, ưu tiên cập nhật **`src/types/index.ts`** và file này cùng lúc.

---

*Liên kết: payload gửi đi (query/body) — [`FRONTEND_PAYLOADS_BY_SCREEN.md`](./FRONTEND_PAYLOADS_BY_SCREEN.md); tổng quan giao tiếp — [`FRONTEND_OVERVIEW_FOR_BACKEND.md`](./FRONTEND_OVERVIEW_FOR_BACKEND.md).*
