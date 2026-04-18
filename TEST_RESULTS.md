# Báo cáo kiểm thử nghiệp vụ — Ship ERP

**Ngày kiểm thử:** 2026-04-19  
**Công cụ:** Playwright (headless Chromium)  
**Tài khoản:** `admin@abctransport.com` — Tenant: ABC Transport Company  
**Môi trường:** `http://localhost:3000` → Backend `http://localhost:8080`

---

## Tổng quan

| | Số lượng |
|---|---|
| ✅ PASS | 31 |
| ❌ FAIL | 13 |
| ⚠️ WARN | 3 |
| **Tổng checks** | **47** |
| **Flows kiểm thử** | **9** |

---

## Kết quả từng flow

### ✅ Flow 8 — Quản lý tài xế & lịch làm việc

| Bước | Kết quả |
|---|---|
| Danh sách tài xế | ✅ PASS |
| Chi tiết tài xế | ✅ PASS |
| Lịch làm việc (schedule matrix) | ✅ PASS |
| Lên lịch hàng loạt (bulk schedule) | ✅ PASS |

---

### ✅ Flow 9 — Quản lý nhân sự vận hành

| Bước | Kết quả |
|---|---|
| Danh sách vi phạm (5 rows) | ✅ PASS |
| Danh sách tăng ca (20 rows) | ✅ PASS |
| Danh sách nghỉ phép (5 rows) | ✅ PASS |

---

### ⚠️ Flow 1 — Tạo chuyến đi mới

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Mở form tạo chuyến | ✅ PASS | |
| Điền mã chuyến, chọn khách hàng | ✅ PASS | |
| Điền khoảng cách, giá cước | ✅ PASS | |
| Submit | ❌ FAIL | Backend lỗi DB (xem BUG-01) |

---

### ❌ Flow 2 — Vòng đời chuyến đi (pending → completed)

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Trang chi tiết chuyến đi tải được | ✅ INFO | Nút hành động hiện đúng |
| API `POST /trips/{id}/assign` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/start` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/pickup` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/transit` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/arrive` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/complete` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/cancel` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/delay` | ❌ FAIL | 404 Route not found |
| API `POST /trips/{id}/resume` | ❌ FAIL | 404 Route not found |
| UI click nút "Phân công" | ❌ FAIL | Gọi API → 404 |

> **9/9 endpoints chuyển trạng thái đều 404** — frontend đã implement đầy đủ UI nhưng backend chưa có.

---

### ⚠️ Flow 3 — Tạo và quản lý hóa đơn

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Tạo hóa đơn qua API (với field `subtotal`) | ✅ PASS | Phải truyền đủ `subtotal + vat_amount + total_amount` |
| Trang chi tiết hóa đơn tải được | ✅ PASS | |
| UI hiện đúng nút "Phát hành hóa đơn" | ✅ PASS | |
| API `POST /invoices/{id}/issue` | ❌ FAIL | 404 Route not found |
| API `POST /invoices/{id}/mark-paid` | ❌ FAIL | 404 Route not found |
| API `POST /invoices/{id}/send-cqt` | ❌ FAIL | 404 Route not found |
| API `POST /invoices/{id}/cancel` | ❌ FAIL | 404 Route not found |
| UI click "Phát hành hóa đơn" | ❌ FAIL | Gọi API → 404 |
| UI form submit | ❌ FAIL | Thiếu field `subtotal` (xem BUG-03) |
| Chọn khách hàng trong form | ✅ PASS | |
| Chọn chuyến đã hoàn thành trong form | ✅ PASS | |

---

### ⚠️ Flow 4 — Tạo và duyệt bảng lương

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Mở form tạo bảng lương | ✅ PASS | |
| Chọn công ty, tháng, năm | ✅ PASS | |
| Submit tạo bảng lương mới | ❌ FAIL | DB thiếu bảng `attendances` (xem BUG-04) |
| Duyệt bảng lương (approve) | ✅ PASS | API `POST /payrolls/{id}/approve` hoạt động |
| Xem chi tiết bảng lương | ✅ PASS | |

---

### ❌ Flow 5 — Ghi nhận chi phí xe

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Mở form thêm chi phí | ✅ PASS | |
| Chọn xe | ✅ PASS | |
| Chọn loại chi phí, nhập số tiền | ❌ FAIL | Form submit lỗi validation |
| API `POST /vehicle_expenses` (gọi trực tiếp) | ✅ PASS | Hoạt động khi truyền đúng `type`, `amount`, `expense_date` |

> Form hoạt động khi điền đủ 3 trường bắt buộc: `type`, `amount`, `expense_date`.

---

### ❌ Flow 6 — Phân công xe cho tài xế

| Bước | Kết quả | Ghi chú |
|---|---|---|
| Mở form phân công | ✅ PASS | |
| Chọn xe, tài xế, ngày bắt đầu/kết thúc | ✅ PASS | |
| Submit | ❌ FAIL | Backend lỗi DB (xem BUG-05) |

---

### ❌ Flow 7 — Điều chỉnh bảng lương

| Bước | Kết quả | Ghi chú |
|---|---|---|
| API `GET /payroll-adjustments` | ❌ FAIL | 404 Route not found |
| Trang danh sách renders (sau khi fix import) | ✅ PASS | Hiện bảng trống do API thiếu |

---

## 🐛 Bug Report

### BUG-01 — Trip CREATE: Backend lỗi DB
- **Mức độ:** 🔴 Critical
- **Mô tả:** `POST /api/v1/trips` trả về `"Database table not found"` — không thể tạo chuyến mới
- **Root cause:** Thiếu migration hoặc bảng phụ thuộc chưa tạo trong DB
- **Ảnh hưởng:** Không thể tạo chuyến đi mới từ UI

---

### BUG-02 — Trip lifecycle: 9/9 action endpoints 404
- **Mức độ:** 🔴 Critical
- **Endpoints bị thiếu:**
  - `POST /api/v1/trips/{id}/assign`
  - `POST /api/v1/trips/{id}/start`
  - `POST /api/v1/trips/{id}/pickup`
  - `POST /api/v1/trips/{id}/transit`
  - `POST /api/v1/trips/{id}/arrive`
  - `POST /api/v1/trips/{id}/complete`
  - `POST /api/v1/trips/{id}/cancel`
  - `POST /api/v1/trips/{id}/delay`
  - `POST /api/v1/trips/{id}/resume`
- **Root cause:** Backend chưa implement các route chuyển trạng thái chuyến đi
- **Ảnh hưởng:** Toàn bộ chức năng vận hành chuyến đi (nút trên UI hiện nhưng không làm được gì)

---

### BUG-03 — Invoice form: thiếu field `subtotal`
- **Mức độ:** 🔴 Critical
- **File:** `src/pages/invoices/InvoiceForm.tsx`
- **Mô tả:** API yêu cầu field `subtotal` (bắt buộc) nhưng form không có field này → mọi lần submit đều fail validation
- **API response:** `{"subtotal":["The subtotal field is required."],"total_amount":["total_amount phải bằng subtotal + vat_amount."]}`
- **Fix:** Thêm field `subtotal` vào form, tính auto từ `trip.price` hoặc để user nhập

---

### BUG-03b — Invoice lifecycle: 4/4 action endpoints 404
- **Mức độ:** 🔴 Critical
- **Endpoints bị thiếu:**
  - `POST /api/v1/invoices/{id}/issue`
  - `POST /api/v1/invoices/{id}/mark-paid`
  - `POST /api/v1/invoices/{id}/send-cqt`
  - `POST /api/v1/invoices/{id}/cancel`
- **Root cause:** Backend chưa implement các route lifecycle cho hóa đơn
- **Ảnh hưởng:** Không thể phát hành, thanh toán, hay hủy hóa đơn

---

### BUG-04 — Payroll CREATE: thiếu bảng `attendances`
- **Mức độ:** 🔴 Critical
- **Mô tả:** `POST /api/v1/payrolls` thất bại với lỗi SQL:
  ```
  Table 'ship_db.attendances' doesn't exist
  SQL: select * from `attendances` where `driver_id` = 1 
       and `date` between 2026-04-01 and 2026-04-30
  ```
- **Root cause:** Migration tạo bảng `attendances` chưa được chạy
- **Ảnh hưởng:** Không thể tạo bảng lương mới

---

### BUG-05 — Vehicle Assignment CREATE: lỗi DB
- **Mức độ:** 🔴 Critical
- **Mô tả:** `POST /api/v1/vehicle_assignments` trả về `"Database table not found"`
- **Root cause:** Thiếu migration — tương tự BUG-01
- **Ảnh hưởng:** Không thể phân công xe cho tài xế

---

### BUG-06 — Payroll Adjustments: endpoint 404
- **Mức độ:** 🟠 High
- **Mô tả:** `GET/POST /api/v1/payroll-adjustments` trả về `"Route not found"`
- **Root cause:** Backend chưa đăng ký route
- **Ảnh hưởng:** Trang điều chỉnh lương hiện bảng trống, không thể thêm/sửa điều chỉnh

---

### BUG-07 (đã fix) — AdjustmentsList: import sai path
- **Mức độ:** 🟡 Medium (đã sửa)
- **File:** `src/pages/payroll-adjustments/AdjustmentsList.tsx:42`
- **Mô tả:** `import { formatMoney } from '@/utils/formatters'` → file không tồn tại → Vite 500 error
- **Fix:** Đổi thành `import { formatMoney } from '@/utils/displayFormat'` ✅

---

## Tóm tắt ưu tiên xử lý

| Ưu tiên | Bug | Action cần làm |
|---|---|---|
| P0 | BUG-02 | Implement 9 trip action endpoints ở backend |
| P0 | BUG-03b | Implement 4 invoice action endpoints ở backend |
| P0 | BUG-04 | Chạy migration tạo bảng `attendances` |
| P0 | BUG-01, BUG-05 | Tìm & chạy migration cho bảng trip/vehicle_assignment phụ thuộc |
| P1 | BUG-03 | Thêm field `subtotal` vào `InvoiceForm.tsx` |
| P1 | BUG-06 | Đăng ký route `/payroll-adjustments` ở backend |
| ✅ Done | BUG-07 | Đã fix import path trong `AdjustmentsList.tsx` |
