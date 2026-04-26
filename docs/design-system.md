# Ship ERP — Danh mục Actions theo màn hình (cho Designer)

> Mục tiêu: liệt kê đầy đủ hành động người dùng trên từng màn hình để thiết kế UI/UX flow, trạng thái, xác nhận, feedback.
>
> Nguồn tham chiếu chính: `src/routes/appRouteConfig.tsx`, các màn `src/pages/**`.

---

## 1) Quy ước chung khi thiết kế action

### 1.1 Mẫu action lặp lại trên hầu hết màn List

- **Header action:** nút `Tạo mới` (primary).
- **Filter actions:** `Tìm kiếm`, `Đặt lại`, có thể kèm filter `Trạng thái` / `Công ty`.
- **Row actions:** `Xem`, `Sửa`, `Xóa` (icon hoặc menu overflow).
- **Row click:** mở màn `Show` hoặc mở form edit/show tùy resource.
- **Delete flow:** mở confirm dialog -> confirm -> toast thành công/lỗi -> refresh list.

### 1.2 Trạng thái UI bắt buộc cho designer

- **Loading:** skeleton bảng hoặc overlay loading.
- **Error:** block lỗi có nút `Thử lại`.
- **Empty:** thông điệp không có dữ liệu + CTA tạo mới (nếu phù hợp quyền).
- **Disabled action:** theo role, theo status record, theo điều kiện nghiệp vụ.

### 1.3 Feedback chuẩn

- **Success:** toast thành công cho create/update/delete/approve/reject.
- **Error:** toast lỗi cục bộ (khi không bị global handler chặn).
- **Unsaved changes:** cảnh báo khi đóng form có thay đổi chưa lưu.

---

## 2) Action matrix theo nhóm màn hình

## Dashboard

- **Màn:** `dashboard`.
- **Actions chính:**
  - Đổi range thời gian biểu đồ (`90d`, `30d`, `7d`).
  - Đổi company/office filter (trên các widget tương ứng).
  - Mở link điều hướng từ card thống kê sang màn chi tiết (nếu có).
- **Trạng thái cần thiết kế:** loading chart, no-data chart, error chart, polling refresh.

## Tổ chức (Organization)

- **Màn:** `companies`, `offices`, `departments`, `positions`.
- **Actions list:**
  - Tạo mới.
  - Tìm kiếm theo keyword.
  - Lọc theo trạng thái/công ty (màn có filter liên quan).
  - Xem/Sửa/Xóa từng dòng.
- **Actions form:**
  - Lưu tạo mới.
  - Lưu cập nhật.
  - Quay lại/đóng dialog.
  - Cảnh báo unsaved changes khi đóng.
- **Lưu ý nghiệp vụ UI:** form địa chỉ hành chính VN có cascade tỉnh/huyện/xã.

## Nhân sự & phân quyền

- **Màn:** `users`, `roles`, `profile`, `system users hub`.
- **Actions list (`users`, `roles`):**
  - Tạo mới user/role.
  - Tìm kiếm + lọc trạng thái (users).
  - Xem/Sửa/Xóa.
- **Actions role form:**
  - Gán quyền (permission_ids).
  - Lưu role + đồng bộ quyền.
- **Actions profile:**
  - Cập nhật thông tin cá nhân.
  - Cập nhật avatar (nếu có).

## Đội xe & vận hành

- **Màn:** `vehicles`, `drivers`, `vehicle_assignments`, `vehicle_expenses`, `drivers_schedule`, `drivers_schedule_bulk`.
- **Actions list:**
  - Tạo mới record.
  - Xem/Sửa/Xóa.
  - Tìm kiếm/lọc (tùy màn).
- **Actions đặc thù:**
  - Driver schedule: áp lịch theo template, cập nhật schedule theo ngày.
  - Driver schedule bulk: thao tác hàng loạt theo khoảng thời gian/tập tài xế.
  - Upload tài liệu lái xe/giấy tờ bảo hiểm (driver form).

## Khách hàng - chuyến - hóa đơn

- **Màn:** `customers`, `trips`, `trip_bonus_rules`, `invoices`.
- **Actions customers:**
  - CRUD chuẩn + search/filter.
- **Actions trips:**
  - CRUD.
  - Trên detail: action theo trạng thái chuyến (assign/start/complete/cancel... tùy backend flow).
  - Điều kiện disable field khi chuyến ở terminal status.
- **Actions trip bonus rules:**
  - CRUD rule thưởng theo km.
- **Actions invoices:**
  - CRUD.
  - Xem detail invoice.
  - Lọc theo trạng thái hóa đơn.

## Chấm công - lương - chính sách

- **Màn:** `allowances`, `deductions`, `payrolls`, `payroll_adjustments`, `overtime`, `leave`, `violations`.
- **Actions payrolls:**
  - Tạo kỳ lương.
  - Xem detail kỳ lương.
  - Các action trạng thái (approve/lock/pay) theo quyền và trạng thái.
- **Actions payroll adjustments:**
  - Tạo/duyệt/từ chối điều chỉnh (tùy flow hiện có).
- **Actions overtime:**
  - Tạo yêu cầu OT.
  - Duyệt / từ chối request.
  - Lọc theo trạng thái.
- **Actions leave/violations:**
  - CRUD/lifecycle theo trạng thái.

## Báo cáo & hệ thống

- **Màn:** `reports`, `notifications`, `settings`, `billing`.
- **Actions reports:**
  - Chọn bộ lọc thời gian/phạm vi.
  - Export (nếu có).
- **Actions notifications:**
  - Đánh dấu đã đọc.
  - Lọc theo nhóm thông báo.
- **Actions settings/billing:**
  - Cập nhật cấu hình hệ thống.
  - Các action liên quan gói/cước/thanh toán.

---

## 3) Danh sách route để designer map sitemap

### 3.1 CRUD resources (list/create/show/edit)

- `companies`
- `offices`
- `departments`
- `positions`
- `vehicles`
- `trips`
- `trip_bonus_rules`
- `customers`
- `drivers`
- `invoices`
- `vehicle_assignments`
- `vehicle_expenses`
- `allowances`
- `deductions`
- `payrolls`
- `payroll_adjustments`
- `users`
- `roles`

### 3.2 Single screens

- `dashboard`
- `reports`
- `notifications`
- `profile`
- `settings`
- `billing`
- `system_users_hub`
- `drivers_schedule`
- `drivers_schedule_bulk`
- `violations`
- `overtime`
- `leave`

---

## 4) Checklist handoff cho designer

- **Mỗi màn List có đủ:** header action, filter area, table row actions, empty/loading/error.
- **Mỗi Form/Dialog có đủ:** primary action, secondary action, close action, unsaved warning.
- **Mỗi action nguy hiểm có đủ:** confirm dialog + destructive visual style.
- **Mỗi lifecycle status có đủ:** trạng thái button (enabled/disabled/loading), label và màu.
- **Mỗi API action có đủ feedback:** success toast, error toast, retry path.

---

## 5) Mẫu ghi action chi tiết cho 1 màn (để copy)

```md
### [Tên màn hình]
- Mục tiêu người dùng:
- Primary actions:
  - [Action A]
  - [Action B]
- Row actions:
  - [View]
  - [Edit]
  - [Delete]
- Điều kiện disable:
  - [Rule 1]
  - [Rule 2]
- Confirm/Warning:
  - [Delete confirm]
  - [Unsaved changes]
- Feedback:
  - Success: [...]
  - Error: [...]
- States:
  - Loading / Empty / Error / Permission denied
```

---

## 6) Ghi chú scope

- Tài liệu này tập trung vào **action inventory** cho thiết kế tương tác.
- Không mô tả token màu, spacing, typography chi tiết như bản design system cũ.
- Nếu cần, có thể tách riêng file thứ hai: `docs/design-tokens.md` để giữ phần token/UI foundation.
