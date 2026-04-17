# Ship App API — Tài Liệu Nghiệp Vụ Frontend

> **Cập nhật lần cuối**: 2026-04-17  
> **Base URL**: `http://your-domain/api/v1`  
> **Auth**: Tất cả endpoint protected yêu cầu header `Authorization: Bearer <token>`  
> **Content-Type**: `application/json`

---

## Envelope Response (chuẩn chung)

```json
{
  "success": true | false,
  "message": "Mô tả kết quả",
  "data": { ... } | [ ... ],
  "errors": { "field": ["lỗi cụ thể"] }   // chỉ có khi 422
}
```

---

## Pagination (danh sách)

Tất cả endpoint GET danh sách trả về:

```json
{
  "current_page": 1,
  "data": [...],
  "last_page": 5,
  "per_page": 20,
  "total": 98,
  "next_page_url": "...",
  "prev_page_url": null
}
```

Truyền `?page=2&per_page=50` để điều hướng.

---

## Định dạng dữ liệu

| Kiểu       | Format                         | Ví dụ                     |
|------------|--------------------------------|---------------------------|
| Date       | `YYYY-MM-DD`                   | `2026-05-01`              |
| Datetime   | `YYYY-MM-DD HH:MM:SS`          | `2026-05-01 07:00:00`     |
| Time       | `HH:MM`                        | `07:00`                   |
| Currency   | Integer VND, không thập phân   | `10000000`                |
| Decimal    | Float                          | `3200.5`                  |

---

## HTTP Status Codes

| Code | Ý nghĩa                                              |
|------|------------------------------------------------------|
| 200  | Thành công                                           |
| 201  | Tạo mới thành công                                   |
| 400  | Bad request                                          |
| 401  | Chưa xác thực — token thiếu hoặc không hợp lệ       |
| 403  | Không có quyền hoặc vi phạm SoD                      |
| 404  | Không tìm thấy resource                              |
| 409  | Conflict — trùng lịch / trùng dữ liệu               |
| 422  | Validation thất bại — xem field `errors`             |
| 500  | Server error                                         |

---

## Quy tắc SoD (Separation of Duties)

| Nghiệp vụ                  | Người tạo KHÔNG được làm              |
|----------------------------|---------------------------------------|
| Leave request              | Approve chính đơn mình tạo           |
| Overtime request           | Approve chính đơn mình gửi           |
| Violation report           | Confirm / Waive vi phạm mình báo cáo |
| Payroll                    | Approve bảng lương mình tạo          |

Backend trả về `403` nếu vi phạm.

---

## 1. Xác Thực (Auth)

### POST /auth/login — Đăng nhập

**Request**
```json
{ "email": "admin@example.com", "password": "secret123" }
```

**Response 200**
```json
{
  "success": true,
  "data": {
    "token": "eyJ...",
    "token_type": "Bearer",
    "user": { "id": 1, "name": "Admin", "email": "...", "roles": ["admin"] }
  }
}
```

**Lỗi**: `401` sai thông tin đăng nhập, `422` validation.

---

### POST /auth/social/login — Đăng nhập social

| Field          | Bắt buộc | Ghi chú                              |
|----------------|----------|--------------------------------------|
| `provider`     | Có       | `google` / `facebook` / `apple`      |
| `access_token` | Có*      | Bắt buộc nếu không có `id_token`     |
| `id_token`     | Có*      | Bắt buộc nếu không có `access_token` |

**Response 200** — cùng cấu trúc như `/auth/login`.

---

### POST /auth/forgot-password

```json
{ "email": "user@example.com" }
```

**Response 200**: `{ "success": true, "message": "Password reset link sent." }`

---

### POST /auth/reset-password

```json
{
  "token": "abc123...",
  "email": "user@example.com",
  "password": "newpassword",
  "password_confirmation": "newpassword"
}
```

---

### POST /auth/logout *(auth)*

**Response 200**: `{ "success": true, "message": "Logged out." }`

---

### POST /auth/refresh *(auth)*

Trả về `token` mới.

---

### GET /auth/me *(auth)*

```json
{
  "success": true,
  "data": {
    "user": {
      "id": 1,
      "name": "Admin",
      "email": "admin@example.com",
      "driver": { "id": 10, "name": "...", "status": "active" },
      "roles": [{ "name": "admin", "permissions": [...] }]
    }
  }
}
```

---

## 2. Lịch Làm Việc Tài Xế *(admin)*

### Vòng đời trạng thái

```
draft → submitted → approved → locked
                ↘ rejected (về draft)
```

| Trạng thái  | Mô tả                              |
|-------------|-------------------------------------|
| `draft`     | Mới tạo, chưa gửi                  |
| `submitted` | Đã gửi, chờ duyệt                  |
| `approved`  | Đã duyệt                           |
| `locked`    | Đã khóa, không thể chỉnh sửa      |

---

### GET /driver-schedules

**Query params**: `driver_id`, `office_id`, `work_date`, `from`, `to`, `status`, `page`, `per_page`

**Response 200**
```json
{
  "success": true,
  "data": {
    "data": [
      {
        "id": 1,
        "driver_id": 10,
        "office_id": 2,
        "work_date": "2026-05-01",
        "shift_code": "day",
        "start_time": "07:00",
        "end_time": "17:00",
        "vehicle_id": 5,
        "notes": null,
        "status": "approved",
        "driver": { "id": 10, "name": "Nguyen Van A" },
        "vehicle": { "id": 5, "plate_number": "51A-12345" }
      }
    ],
    "total": 42,
    "per_page": 50
  }
}
```

---

### POST /driver-schedules

| Field              | Bắt buộc | Validation                              |
|--------------------|----------|-----------------------------------------|
| `driver_id`        | Có       | exists:drivers                          |
| `office_id`        | Có       | exists:offices                          |
| `work_date`        | Có       | date >= today                           |
| `shift_code`       | Không    | `day` / `night` / `split` / `custom`   |
| `start_time`       | Có       | HH:MM                                   |
| `end_time`         | Có       | HH:MM                                   |
| `vehicle_id`       | Không    | Kiểm tra conflict                       |
| `notes`            | Không    | max 500 ký tự                           |

**Lỗi**: `409` driver/xe đã có lịch trùng ngày/ca.

---

### POST /driver-schedules/{id}/submit
Chuyển draft → submitted.

### POST /driver-schedules/{id}/approve
Chuyển submitted → approved.

### POST /driver-schedules/{id}/reject
Chuyển submitted → draft.

### POST /driver-schedules/{id}/lock
Chuyển approved → locked.

### POST /driver-schedules/{id}/override *(admin)*
Ghi đè lịch đã locked.

**Request**
```json
{
  "work_date": "2026-05-02",
  "shift_code": "day",
  "start_time": "08:00",
  "end_time": "18:00",
  "vehicle_id": 3,
  "override_reason": "Xe hỏng đột xuất, điều phối lại"
}
```

---

### GET /driver-schedules/{id}/hos-check
Kiểm tra Hours of Service (HOS) — giới hạn 12h/ngày.

```json
{
  "success": true,
  "data": {
    "driver_id": 10,
    "work_date": "2026-05-01",
    "total_hours": 10,
    "limit_hours": 12,
    "is_ok": true
  }
}
```

> Backend chấp nhận cả `GET` lẫn `POST` cho endpoint này.

---

## 3. Chấm Công *(admin)*

### GET /attendance
**Query params**: `driver_id`, `date`, `from`, `to`, `status`, `page`, `per_page` (max 200)

---

### POST /attendance/check-in

```json
{ "driver_id": 10, "check_in_time": "2026-05-01 07:05:00" }
```

**Response 201**
```json
{
  "data": {
    "id": 101,
    "driver_id": 10,
    "date": "2026-05-01",
    "check_in": "2026-05-01 07:05:00",
    "check_out": null,
    "work_hours": null,
    "overtime_hours": 0,
    "status": "present"
  }
}
```

---

### POST /attendance/check-out

```json
{ "driver_id": 10, "check_out_time": "2026-05-01 17:30:00" }
```

Backend tự tính `work_hours` và `overtime_hours` (> 8h).

---

### PATCH /attendance/{id}/adjust

```json
{
  "check_in": "2026-05-01 07:00:00",
  "check_out": "2026-05-01 16:00:00",
  "status": "present",
  "reason": "GPS offline, điều chỉnh thủ công"
}
```

`reason` bắt buộc khi thay đổi bất kỳ field nào.

#### Legacy aliases (tương thích FE cũ)
- `GET /attendances` → `/attendance`
- `POST /attendances/check-in` → `/attendance/check-in`
- `POST /attendances/check-out` → `/attendance/check-out`
- `PATCH /attendances/{id}/adjust` → `/attendance/{id}/adjust`
- `GET /attendances/late` → danh sách đến muộn
- `POST /attendances/late/notify` → thông báo đến muộn

---

## 4. Quản Lý Phép *(admin)*

### Vòng đời trạng thái

```
pending → approved
        ↘ rejected
pending | approved → cancelled
```

---

### GET /leave/types
Danh sách loại phép.

```json
{
  "data": {
    "leave_types": [
      {
        "id": 1,
        "code": "ANNUAL",
        "name": "Nghỉ phép năm",
        "is_paid": true,
        "annual_quota_days": 12,
        "allow_carry_forward": true
      },
      {
        "id": 2,
        "code": "SICK",
        "name": "Nghỉ ốm",
        "is_paid": false,
        "annual_quota_days": 0
      }
    ]
  }
}
```

---

### GET /leave
**Query params**: `driver_id`, `status`, `from`, `to`

---

### POST /leave

| Field             | Bắt buộc | Validation                         |
|-------------------|----------|------------------------------------|
| `driver_id`       | Có       | exists:drivers                     |
| `leave_type_id`   | Có       | exists:leave_types                 |
| `from_date`       | Có       | date >= today                      |
| `to_date`         | Có       | date >= from_date                  |
| `total_days`      | Có       | numeric, min: 0.5                  |
| `reason`          | Không    | max 1000 ký tự                     |
| `attachment_urls` | Không    | array of URLs                      |

**Lỗi**:
- `422` — đơn phép trùng ngày đã tồn tại
- `422` — số dư phép không đủ (phép có lương)

---

### POST /leave/{id}/approve
**SoD**: người tạo đơn không được approve.

### POST /leave/{id}/reject
```json
{ "rejection_reason": "Mùa cao điểm, không đủ nhân lực." }
```

### POST /leave/{id}/cancel
Huỷ đơn. Nếu đơn đã `approved` và là phép có lương → **tự động hoàn trả số dư phép**.

---

## 5. Tăng Ca *(admin)*

### Giới hạn nghiệp vụ
- **Tối đa 40 giờ/tháng** (Bộ Luật Lao Động VN)
- Khi submit OT mới: hệ thống kiểm tra tổng giờ OT đã approved trong tháng + giờ mới ≤ 40h
- Khi tính lương: payroll engine cap OT tại 40h, ưu tiên các request theo thứ tự ngày tăng dần

---

### GET /overtime
**Query params**: `driver_id`, `company_id`, `status`, `from`, `to`

---

### POST /overtime

| Field        | Bắt buộc | Validation                  |
|--------------|----------|-----------------------------|
| `driver_id`  | Có       | exists:drivers              |
| `company_id` | Có       | exists:companies            |
| `work_date`  | Có       | date                        |
| `start_time` | Có       | HH:MM                       |
| `end_time`   | Có       | HH:MM, sau start_time       |
| `ot_hours`   | Có       | numeric, 0.5–8              |
| `reason`     | Không    | max 500 ký tự               |

**Lỗi**: `422` — vượt cap 40h/tháng.

---

### POST /overtime/{id}/approve
**SoD**: người gửi không được approve.

### POST /overtime/{id}/reject
```json
{ "rejection_reason": "Không có lý do chính đáng." }
```

---

## 6. Vi Phạm & Khiếu Nại *(admin)*

### Vòng đời trạng thái

```
pending → confirmed → (deduct payroll)
        ↘ disputed  → resolved_upheld   (giữ phạt)
                    → resolved_overturned → waived (bỏ phạt, auto-recalc payroll draft)
pending | confirmed → waived (admin bỏ qua)
```

> **Tự động**: Khi violation bị `waived` hoặc dispute `overturned`, hệ thống **tự động recalculate** payroll draft/approved trong tháng xảy ra vi phạm.  
> Payroll đã `locked` hoặc `paid` **không bị ảnh hưởng**.

---

### GET /violations
**Query params**: `driver_id`, `company_id`, `status`, `from`, `to`

**Status values**: `pending` / `confirmed` / `disputed` / `waived`

---

### POST /violations

| Field            | Bắt buộc | Ghi chú                                                           |
|------------------|----------|-------------------------------------------------------------------|
| `driver_id`      | Có       |                                                                   |
| `company_id`     | Có       |                                                                   |
| `trip_id`        | Không    |                                                                   |
| `type`           | Có       | `speeding` / `route_deviation` / `fuel_misuse` / `behavior` / `accident` / `other` |
| `occurred_at`    | Có       | Datetime                                                          |
| `description`    | Có       | max 2000 ký tự                                                   |
| `penalty_amount` | Có       | VND, ≥ 0                                                         |
| `evidence_urls`  | Không    | array of URLs                                                     |

---

### POST /violations/{id}/confirm
**SoD**: người báo cáo không được confirm.

---

### POST /violations/{id}/dispute
Tài xế khiếu nại vi phạm.

```json
{
  "reason": "Dữ liệu GPS sai, tôi không vượt tốc độ.",
  "evidence_urls": ["https://cdn.example.com/dashcam.mp4"]
}
```

Violation status → `disputed`.

---

### POST /violations/{id}/resolve-dispute

```json
{
  "resolution": "upheld",
  "resolution_note": "Xác minh GPS của bên thứ 3. Vi phạm hợp lệ."
}
```

| `resolution`  | Kết quả                                                  |
|---------------|----------------------------------------------------------|
| `upheld`      | Khiếu nại bị bác, violation `confirmed`, **giữ phạt**   |
| `overturned`  | Khiếu nại thắng, violation → `waived`, **bỏ phạt**      |

---

### POST /violations/{id}/waive
Admin bỏ vi phạm không qua khiếu nại.  
**SoD**: người báo cáo không được waive.

```json
{ "waive_reason": "Vi phạm lần đầu, tài xế đã được đào tạo lại." }
```

---

## 7. Bảng Lương *(admin)*

### Vòng đời trạng thái

```
draft → approved → locked → paid
```

| Trạng thái  | Mô tả                                              | Có thể recalculate? |
|-------------|-----------------------------------------------------|----------------------|
| `draft`     | Đang soạn thảo, có thể recalculate                 | Có                   |
| `approved`  | Đã duyệt, chờ lock                                 | Có (nếu cần)         |
| `locked`    | Đã khóa, tạo snapshot, sẵn sàng thanh toán         | Không                |
| `paid`      | Đã trả lương thực tế                               | Không                |

> **Lưu ý**: Payroll `locked` hoặc `paid` là **bất biến** — không thể update, delete, hoặc recalculate.

---

### Công thức tính lương

```
Net = proratedBaseSalary
    + tripBonus
    + overtimePay
    + nightShiftAllowance
    + publicHolidayPay
    + allowance
    + fuelSavingBonus        ← Nếu chi phí xăng < quota tháng
    − deduction              ← BHXH (10.5% × proratedBaseSalary)
    − tax                    ← Thuế TNCN (% × proratedBaseSalary)
    − leaveUnpaidDeduction   ← Phép không lương
    − violationDeduction     ← Vi phạm confirmed, không bị waived
    − fuelExcessDeduction    ← Chi phí xăng vượt quota
```

**Giải thích chi tiết**:

| Thành phần              | Công thức                                                      |
|-------------------------|----------------------------------------------------------------|
| `proratedBaseSalary`    | `baseSalary × actualWorkingDays / effectiveStdDays`            |
| `effectiveStdDays`      | `workingDays (22) − holidayCount`                              |
| `actualWorkingDays`     | `effectiveStdDays − unpaidLeaveDays`                           |
| `tripBonus`             | Σ (km_chuyến × bonusPerKm theo tier)                          |
| `overtimePay`           | Σ (hours × hourlyRate × multiplier), cap 40h/tháng            |
| `hourlyRate`            | `baseSalary / (effectiveStdDays × 8)`                          |
| OT multiplier           | Weekday: 150% / Weekend: 200% / Holiday: 300%                  |
| `nightShiftAllowance`   | Σ (giờ ca đêm × hourlyRate × differential%)                   |
| `publicHolidayPay`      | Số ngày lễ có mặt đủ (check_in + check_out) × dailyRate × 300% |
| `deduction` (BHXH)      | `proratedBaseSalary × 10.5%`                                   |
| `leaveUnpaidDeduction`  | `baseSalary × unpaidLeaveDays / effectiveStdDays`              |
| `fuelExcessDeduction`   | `max(0, actualFuelCost − fuelQuota)`                           |
| `fuelSavingBonus`       | `max(0, fuelQuota − actualFuelCost) × savingBonusRate`         |

---

### GET /payrolls
**Query params**: `company_id`, `month`, `year`, `status`, `page`, `per_page`

**Response 200**
```json
{
  "data": {
    "data": [
      {
        "id": 1,
        "company_id": 1,
        "month": 5,
        "year": 2026,
        "status": "draft",
        "approved_at": null,
        "approved_by": null,
        "locked_at": null,
        "paid_at": null,
        "paid_by": null,
        "notes": null,
        "company": { "id": 1, "name": "Company A" }
      }
    ]
  }
}
```

---

### POST /payrolls — Tạo / Recalculate draft

```json
{ "company_id": 1, "month": 5, "year": 2026 }
```

- Nếu payroll tháng đó chưa tồn tại → tạo mới.
- Nếu đã tồn tại và đang `draft`/`approved` → **recalculate** (xóa lines cũ, tính lại).
- Nếu đang `locked`/`paid` → lỗi `422`.

**Response 201** — payroll object + array `lines`.

---

### GET /payrolls/{id}

**Response 200** — payroll với `lines` (mảng PayrollLine kèm `driver`).

---

### PUT /payrolls/{id} — Cập nhật ghi chú

Chỉ cho phép khi status `draft` hoặc `approved`.

```json
{ "notes": "Ghi chú tháng 5" }
```

---

### DELETE /payrolls/{id}

Chỉ cho phép khi status `draft` hoặc `approved`.

---

### POST /payrolls/{id}/approve
Chuyển `draft → approved`.  
**SoD**: người tạo payroll không được approve.

---

### POST /payrolls/{id}/lock
Chuyển `approved → locked`. Tạo `snapshot_json` lưu trữ toàn bộ dữ liệu tính lương.

---

### POST /payrolls/{id}/mark-paid
Chuyển `locked → paid`. Ghi nhận `paid_at` và `paid_by`.

**Response 200**
```json
{
  "success": true,
  "message": "Payroll marked as paid",
  "data": {
    "id": 1,
    "status": "paid",
    "paid_at": "2026-05-31T23:59:00Z",
    "paid_by": 2
  }
}
```

---

### GET /payrolls/{id}/export
Xuất CSV bảng lương.

---

### GET /payrolls/my-salary *(auth, mọi role)*
Tài xế xem lương cá nhân.

**Query params**: `month`, `year`

**Response 200**
```json
{
  "data": {
    "payroll": { "month": 5, "year": 2026, "status": "locked" },
    "line": {
      "base_salary": 10000000,
      "trip_bonus": 2500000,
      "overtime_pay": 450000,
      "night_shift_allowance": 200000,
      "public_holiday_pay": 0,
      "allowance": 500000,
      "deduction": 1050000,
      "leave_unpaid_deduction": 0,
      "violation_deduction": 0,
      "fuel_excess_deduction": 300000,
      "tax": 0,
      "net_salary": 12300000,
      "working_days": 20,
      "leave_days_paid": 0,
      "leave_days_unpaid": 2,
      "overtime_hours": 5.0,
      "trips_completed_count": 15,
      "total_distance_km": 3200.5
    }
  }
}
```

---

### GET /payrolls/driver/{driverId}
Lịch sử lương của tài xế cụ thể.

**Query params**: `month`, `year`

---

## Payroll UI Spec (Hợp đồng giao diện)

### A. Danh sách Payroll

| Cột              | Field nguồn       | Format            | Ghi chú                    |
|------------------|-------------------|-------------------|-----------------------------|
| ID               | `id`              | number            | Click mở detail             |
| Công ty          | `company.name`    | text              |                             |
| Kỳ lương         | `month` + `year`  | `MM/YYYY`         |                             |
| Trạng thái       | `status`          | badge             | Xem màu sắc bên dưới        |
| Approved At      | `approved_at`     | datetime / `-`    |                             |
| Locked At        | `locked_at`       | datetime / `-`    |                             |
| Paid At          | `paid_at`         | datetime / `-`    |                             |
| Ghi chú          | `notes`           | text (truncate)   |                             |
| Actions          | —                 | buttons           |                             |

**Badge status**:
- `draft` → gray (Bản nháp)
- `approved` → amber (Đã duyệt)
- `locked` → blue (Đã khóa)
- `paid` → green (Đã thanh toán)

**Filter bar**: `company_id`, `month`, `year`, `status`

---

### B. Chi tiết Payroll — Bảng PayrollLine

| Nhóm       | Cột                       | Field                    | Format         |
|------------|---------------------------|--------------------------|----------------|
| Tài xế     | Tên tài xế                | `driver.name`            | text           |
| Thu nhập   | Lương cơ bản              | `base_salary`            | VND            |
| Thu nhập   | Thưởng trip               | `trip_bonus`             | VND            |
| Thu nhập   | Lương tăng ca             | `overtime_pay`           | VND            |
| Thu nhập   | Phụ cấp ca đêm            | `night_shift_allowance`  | VND            |
| Thu nhập   | Lương ngày lễ             | `public_holiday_pay`     | VND            |
| Thu nhập   | Phụ cấp                   | `allowance`              | VND            |
| Khấu trừ  | BHXH/Bảo hiểm            | `deduction`              | VND            |
| Khấu trừ  | Phép không lương          | `leave_unpaid_deduction` | VND            |
| Khấu trừ  | Vi phạm                   | `violation_deduction`    | VND            |
| Khấu trừ  | Vượt định mức xăng        | `fuel_excess_deduction`  | VND            |
| Khấu trừ  | Thuế TNCN                 | `tax`                    | VND            |
| Kết quả   | **Lương thực nhận**       | `net_salary`             | VND (in đậm)   |
| KPI        | Ngày công thực tế         | `working_days`           | number         |
| KPI        | Ngày phép có lương        | `leave_days_paid`        | number         |
| KPI        | Ngày phép không lương     | `leave_days_unpaid`      | number         |
| KPI        | Giờ tăng ca               | `overtime_hours`         | number (1 dec) |
| KPI        | Số chuyến                 | `trips_completed_count`  | number         |
| KPI        | Tổng km                   | `total_distance_km`      | number (1 dec) |

---

### C. Quy tắc hiển thị nút Action

| Status    | Nút hiển thị                                  |
|-----------|-----------------------------------------------|
| `draft`   | Approve, Xóa, Sửa ghi chú, Export            |
| `approved`| Lock, Export                                  |
| `locked`  | Mark Paid, Export                             |
| `paid`    | Export (chỉ xem, không chỉnh sửa gì được)    |

> **SoD**: Người tạo payroll không được bấm Approve → backend trả `403`.

---

### D. TypeScript Interfaces

```typescript
type PayrollStatus = "draft" | "approved" | "locked" | "paid";

interface PayrollSummary {
  id: number;
  company_id: number;
  month: number;
  year: number;
  status: PayrollStatus;
  approved_at: string | null;
  locked_at: string | null;
  paid_at: string | null;
  paid_by: number | null;
  notes: string | null;
  company?: { id: number; name: string };
}

interface PayrollLine {
  id: number;
  payroll_id: number;
  driver_id: number;
  driver?: { id: number; name: string };
  base_salary: number;
  trip_bonus: number;
  overtime_pay: number;
  night_shift_allowance: number;
  public_holiday_pay: number;
  allowance: number;
  deduction: number;
  leave_unpaid_deduction: number;
  violation_deduction: number;
  fuel_excess_deduction: number;   // ⚠ đổi tên từ fuel_cost (phiên bản cũ)
  tax: number;
  net_salary: number;
  working_days: number;
  leave_days_paid: number;
  leave_days_unpaid: number;
  overtime_hours: number;
  trips_completed_count: number;
  total_distance_km: number;
}

type ScheduleStatus = "draft" | "submitted" | "approved" | "locked";

type LeaveStatus = "pending" | "approved" | "rejected" | "cancelled";

type OvertimeStatus = "pending" | "approved" | "rejected";

type ViolationStatus = "pending" | "confirmed" | "disputed" | "waived";

type DisputeResolution = "upheld" | "overturned";
```

---

## 8. Dữ Liệu Gốc (Master Data) *(admin)*

Tất cả resource hỗ trợ CRUD: `GET /`, `POST /`, `GET /{id}`, `PUT /{id}`, `DELETE /{id}`.

| Resource              | Path                    | Field quan trọng                                        |
|-----------------------|-------------------------|---------------------------------------------------------|
| Companies             | `/companies`            | Tenant gốc                                              |
| Offices               | `/offices`              | `company_id`, `manager_id`                             |
| Departments           | `/departments`          | `office_id`                                             |
| Positions             | `/positions`            | `base_salary` — dùng tính lương                        |
| Drivers               | `/drivers`              | Xem bên dưới                                           |
| Vehicles              | `/vehicles`             | `plate_number`, `type`, `status`                       |
| Vehicle Assignments   | `/vehicle_assignments`  | `driver_id`, `vehicle_id`, `from_date`, `to_date`      |
| Vehicle Expenses      | `/vehicle_expenses`     | `type=fuel` ảnh hưởng fuel_excess_deduction           |
| Customers             | `/customers`            | Khách hàng gửi hàng                                    |
| Trips                 | `/trips`                | `status`, `distance_km`, `driver_id`                   |
| Trip Bonus Rules      | `/trip_bonus_rules`     | `min_km`, `max_km`, `bonus_per_km`, `effective_from`   |
| Invoices              | `/invoices`             | `status`: draft / issued / paid / cancelled            |
| Public Holidays       | `/public-holidays`      | Ảnh hưởng lương ngày lễ và effective working days      |

---

### Driver — Field quan trọng

| Nhóm       | Field                           | Ghi chú                             |
|------------|---------------------------------|--------------------------------------|
| Cá nhân    | `name`, `email`, `phone`, `dob` |                                      |
| Tổ chức    | `office_id`, `position_id`      | `position.base_salary` dùng tính lương |
| Trạng thái | `status`                        | `active` / `inactive` / `resigned`  |
| Tài xế     | `license_no`, `license_class`   |                                      |
| Sẵn sàng   | `available_status`              | `available` / `busy` / `offline`    |
| Ngân hàng  | `bank_name`, `bank_account_no`  | Dùng khi xuất lương                 |

---

### Trip — Vòng đời

```
pending → in_progress → completed
        ↘ cancelled
```

**Validation quan trọng**:
- `start_point ≠ end_point`
- Khi `status = in_progress`: bắt buộc `start_time`
- Khi `status = completed`: bắt buộc `end_time`
- Không tài xế/xe nào có thể có 2 trip `in_progress` cùng lúc

---

### Trip Bonus Rule — Cấu hình thưởng theo km

```json
{
  "company_id": 1,
  "min_km": 100,
  "max_km": 300,
  "bonus_per_km": 5000,
  "effective_from": "2026-01-01",
  "effective_to": null
}
```

- Một trip sẽ match rule có `min_km ≤ distance_km ≤ max_km`
- `max_km = null` nghĩa là không giới hạn trên
- `max_km > min_km` (validation bắt buộc)

---

## 9. Báo Cáo *(admin)*

### GET /reports/dashboard
**Query params**: `month`, `year` (mặc định tháng hiện tại)

KPI tổng hợp: tổng tài xế, chuyến, doanh thu, chi phí lương.

---

### GET /reports/payroll-summary
**Query params**: `company_id` (bắt buộc), `month`, `year`

Chi tiết chi phí lương theo công ty/văn phòng.

---

### GET /reports/revenue-summary
**Query params**: `company_id`, `month`, `year`, `from`, `to`

Nếu không có `from`/`to`, phải có `month`/`year`.

---

## 10. Người Dùng & Phân Quyền *(admin)*

### CRUD Users: `/users`
### CRUD Roles: `/roles`

### POST /roles/{id}/permissions
Gán quyền cho role:
```json
{ "permissions": ["payrolls.approve", "drivers.edit"] }
```

### GET /permissions
Danh sách tất cả permission có thể gán.

---

## 11. AI & Chat

### POST /ai/business-assist *(admin)*
```json
{ "question": "Tài xế nào có chi phí xăng cao nhất tháng này?" }
```

### Chat *(auth)*
- `GET /chat/sessions` — Danh sách phiên chat
- `DELETE /chat/sessions/{id}` — Xóa phiên
- `GET /chat/messages?session_id=xxx` — Tin nhắn trong phiên
- `POST /chat/messages` — Gửi tin nhắn
- `POST /chat/messages/stream` — Stream SSE

---

## 12. Legacy Endpoints (tương thích ngược)

| Endpoint                  | Mapping thực tế                   |
|---------------------------|-----------------------------------|
| `GET /employees`          | Alias → `GET /drivers`            |
| `GET /allowances`         | Trả array rỗng (deprecated)      |
| `GET /deductions`         | Trả array rỗng (deprecated)      |
| `GET /documentation`      | Trả links Swagger                 |

---

## ⚠ Những điểm Frontend cần kiểm tra

### Breaking changes từ các fix gần nhất

| Thay đổi | Cũ | Mới | Ảnh hưởng |
|----------|-----|-----|-----------|
| Field tên xăng trong PayrollLine | `fuel_cost` | `fuel_excess_deduction` | Rename tất cả chỗ hiển thị và TypeScript interface |
| Payroll status thêm `paid` | `draft/approved/locked` | + `paid` | Thêm badge, thêm nút "Mark Paid", cập nhật type |
| Endpoint mark-paid | *(chưa có)* | `POST /payrolls/{id}/mark-paid` | Gọi API mới sau khi lock |
| BHXH tính trên | `baseSalary` (full) | `proratedBaseSalary` | Số `deduction` có thể thay đổi với driver nghỉ phép |
| OT cap trong payroll | Không cap | Cap 40h/tháng | `overtime_hours` trong line có thể < tổng OT approved |

### Checklist kiểm tra frontend

- [ ] `PayrollLine.fuel_cost` → đổi thành `PayrollLine.fuel_excess_deduction`
- [ ] `PayrollStatus` type thêm `"paid"`
- [ ] Màu badge `paid` (gợi ý: green)
- [ ] Nút **Mark Paid** hiển thị khi status = `locked`, gọi `POST /payrolls/{id}/mark-paid`
- [ ] Nút **Export** hiển thị ở tất cả status kể cả `paid`
- [ ] Khi status = `paid`: disable toàn bộ action ngoại trừ Export
- [ ] Cột `paid_at` trong danh sách payroll (hiện `-` nếu null)
- [ ] Nếu violation bị waive/overturn → payroll draft sẽ tự recalculate → FE cần refresh danh sách payroll
- [ ] OT cap 40h: hiển thị warning khi submit OT gần đến giới hạn tháng
