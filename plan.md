# Kế hoạch Triển Khai UI Theo Từng Page (Bám CONVENTION.md)

Mục tiêu: quét toàn bộ pages hiện có trong src/pages, đối chiếu spec màn hình ở CONVENTION.md phần 3.1 → 3.14, và lập backlog triển khai giao diện theo module, ưu tiên theo mức ảnh hưởng nghiệp vụ.

## 1) Nguyên tắc triển khai
- Bám spec UI/flow theo CONVENTION.md, không thay đổi nghiệp vụ ngoài phạm vi màn hình.
- Hook-first: page chỉ gọi hook/service typed, không xử lý fetch rải rác trong UI.
- Mỗi page phải có: loading state, empty state, error state, action state (disabled/loading).
- Chuẩn i18n: text hiển thị qua useTranslation, tránh hard-code tiếng Việt/Anh trong UI.
- Chuẩn tương tác: filter/search/reset, pagination, badge trạng thái, quick actions đồng nhất.

## 2) Ma trận Spec ↔ Pages hiện có

### 3.1 Navigation
- Trạng thái: đã có route và nhóm menu theo module.
- Cần làm: rà soát biểu tượng/tên nhóm/menu order đúng spec.

### 3.2 Dashboard
- Page chính: src/pages/dashboard/dashboard.tsx
- Trạng thái: có KPI + chart + ranking.
- Khoảng cách với spec: thiếu block cảnh báo tập trung (documents/license/debt) và danh sách đơn gần đây chuẩn cột.

### 3.3 Danh sách đơn hàng
- Page chính: src/pages/trips/TripsList.tsx
- Trạng thái: có filter, actions, bảng dữ liệu.
- Khoảng cách với spec: thiếu đủ bộ filter theo khoảng ngày + khách hàng + xe theo đúng wireframe; cần chuẩn hóa cột theo spec mục 3.3.

### 3.4 Form tạo/sửa đơn hàng
- Page chính: src/pages/trips/TripForm.tsx, src/pages/trips/TripFormDialog.tsx
- Trạng thái: đã tách section và payload typed.
- Khoảng cách với spec: cần bố cục rõ theo 3 nhóm tương ứng (thông tin, tuyến đường, doanh thu) và kiểm tra các trường bắt buộc đúng UI spec.

### 3.5 Chi tiết đơn hàng
- Page chính: src/pages/trips/TripDetailPage.tsx
- Trạng thái: có timeline, action theo status.
- Khoảng cách với spec: thiếu panel chứng từ, ghi chú nội bộ, cụm doanh thu vs chi phí phát sinh theo layout spec.

### 3.6 Bảng điều vận
- Page chính: src/pages/dispatch/DispatchBoardPage.tsx
- Trạng thái: có grid theo giờ, xe, pool unassigned.
- Khoảng cách với spec: bổ sung filter theo loại xe/đội tài xế và thao tác gán nhanh từ pool.

### 3.7 Quản lý xe
- Pages: src/pages/vehicles/VehiclesList.tsx, src/pages/vehicles/VehicleDetailPage.tsx, src/pages/vehicles/VehicleFormDialog.tsx
- Trạng thái: có list + detail tabs cơ bản.
- Khoảng cách với spec: hoàn thiện tab giấy tờ, tab bảo dưỡng, cảnh báo hết hạn, và trạng thái badge theo chuẩn spec.

### 3.8 Quản lý tài xế
- Pages: src/pages/drivers/DriversList.tsx, src/pages/drivers/DriverDetailPage.tsx, src/pages/drivers/DriverFormDialog.tsx
- Trạng thái: có list/form/detail.
- Khoảng cách với spec: chuẩn hóa thông tin giấy tờ tài xế + cảnh báo hạn GPLX/sức khỏe + tab hiệu suất.

### 3.9 Lịch làm việc tài xế
- Pages: src/pages/drivers/DriverSchedulePage.tsx, src/pages/drivers/DriverScheduleBulkPage.tsx, src/pages/system/WorkforceOps.tsx
- Trạng thái: đã có các page vận hành.
- Khoảng cách với spec: cần hợp nhất UX filter/phê duyệt/lock theo một flow màn lịch duy nhất, tránh phân mảnh.

### 3.10 Quản lý khách hàng
- Pages: src/pages/customers/CustomersList.tsx, src/pages/customers/CustomerDetailPage.tsx, src/pages/customers/CustomerFormDialog.tsx
- Trạng thái: đã có list/detail/payment cơ bản.
- Khoảng cách với spec: bổ sung luồng bảng giá khách hàng (price lists + items) theo section riêng.

### 3.11 Kế toán - đối soát
- Pages: src/pages/accounting/RevenuePage.tsx, src/pages/accounting/CostsPage.tsx, src/pages/accounting/DebtPage.tsx, src/pages/accounting/ReconciliationPage.tsx
- Trạng thái: đã có dashboard theo tab page.
- Khoảng cách với spec: hoàn thiện confirm/lock phiên đối soát, chỉnh sửa item đối soát, export phiên.

### 3.12 Cài đặt - danh mục
- Modules liên quan: companies/offices/departments/positions/roles/system
- Trạng thái: CRUD có sẵn.
- Khoảng cách với spec: thiếu trang danh mục hợp nhất cho vehicle_types/cargo_types/cost_categories/locations/route_templates/order_status_configs.

### 3.13 Báo cáo
- Pages: src/pages/reports/Reports.tsx, src/pages/reports/ReportsPage.tsx
- Trạng thái: có overview và biểu đồ.
- Khoảng cách với spec: cần chuẩn hóa theo bộ báo cáo nghiệp vụ (doanh thu, chuyến, tài xế, lương) với export đúng mẫu.

### 3.14 Tóm tắt màn hình
- Trạng thái: chưa có checklist kiểm thử theo từng màn.
- Cần làm: tạo matrix DoD cho từng page trước release.

## 3) Backlog triển khai theo từng page/module

## P0 - Bắt buộc cho khớp spec nghiệp vụ chính

### Orders / Trips
- TripsList.tsx
  - Bổ sung filter: customer, vehicle, date range theo spec 3.3.
  - Chuẩn hóa cột: mã đơn, khách, tuyến, xe, tài xế, trạng thái, thao tác.
- TripDetailPage.tsx
  - Thêm block chứng từ đính kèm.
  - Thêm block chi phí phát sinh và tổng hợp LN gộp.
  - Thêm ghi chú nội bộ edit nhanh.
- TripForm.tsx + TripFormDialog.tsx
  - Gom rõ UI thành 3 nhóm theo spec 3.4.
  - Kiểm soát trường auto/readonly: code, pricing auto-fill, tổng doanh thu auto-calc.

### Dispatch
- DispatchBoardPage.tsx
  - Thêm filter loại xe, đội tài xế.
  - Thêm thao tác gán nhanh đơn từ pool chưa phân công.
  - Tooltip/trip bar hiển thị đủ dữ liệu theo spec.

### Accounting / Reconciliation
- ReconciliationPage.tsx
  - Thêm hành vi save draft / confirm / lock theo trạng thái phiên.
  - Chỉnh item adjustment có reason/dispute note.
  - Bổ sung export reconciliation session.
- DebtPage.tsx
  - Bổ sung liên kết từ dòng công nợ sang payment records.

## P1 - Hoàn thiện quản trị tài nguyên

### Vehicles
- VehiclesList.tsx + VehicleDetailPage.tsx
  - Chuẩn hóa card/list theo cảnh báo giấy tờ hết hạn.
  - Hoàn thiện tab: giấy tờ, bảo dưỡng, lịch sử chuyến.

### Drivers
- DriversList.tsx + DriverDetailPage.tsx + DriverSchedulePage.tsx
  - Bổ sung cảnh báo hạn giấy tờ.
  - Hoàn thiện hiển thị hiệu suất và trạng thái phân công theo ngày.

### Customers
- CustomersList.tsx + CustomerDetailPage.tsx
  - Bổ sung module bảng giá khách hàng (price list + items).
  - Hiển thị debt/payment terms rõ trong trang chi tiết.

### Catalog / Settings
- Tạo khu settings danh mục hợp nhất cho:
  - vehicle_types
  - cargo_types
  - cost_categories
  - locations
  - route_templates
  - order_status_configs

## P2 - Báo cáo và polish

### Reports
- Reports.tsx + ReportsPage.tsx
  - Chuẩn hóa theo report packs trong spec.
  - Đồng bộ filter thời gian/công ty và export CSV/PDF.

### Dashboard polish
- dashboard.tsx
  - Thêm block cảnh báo trung tâm.
  - Thêm bảng đơn gần đây chuẩn cột nghiệp vụ.

## 4) Checklist theo từng page (DoD UI)
- Có loading skeleton/overlay.
- Có empty state.
- Có error state + retry.
- Có filter + reset + pagination (nếu là list).
- Có status tag/badge đúng map.
- Text không hard-code; đi qua i18n.
- Action quan trọng có confirm modal.
- Truy cập bằng bàn phím cơ bản (focus/tab/enter).

## 5) Kế hoạch thực thi theo wave

### Wave 1 (2-3 ngày)
- TripsList + TripDetail + TripForm UI finalize theo 3.3, 3.4, 3.5.
- DispatchBoard bổ sung filter + assign nhanh theo 3.6.
- Reconciliation flow confirm/lock/export theo 3.11.

### Wave 2 (2-3 ngày)
- Vehicles + Drivers modules khớp 3.7, 3.8, 3.9.
- Customers price list UI khớp 3.10.
- Catalog settings page khớp 3.12.

### Wave 3 (1-2 ngày)
- Reports + Dashboard polish khớp 3.2, 3.13.
- Tạo checklist 3.14 và chạy QA toàn màn.

## 6) Validation và bàn giao
- Sau mỗi module: npm run lint và npm run build.
- Trước merge: chạy test UI/hook theo từng module đã sửa.
- PR checklist:
  - Màn nào khớp spec nào (section 3.x)
  - Ảnh before/after
  - Trường hợp chưa làm + lý do

## 7) Trạng thái hiện tại
- Đã hoàn tất nền tảng cho: Dispatch, Customers, Accounting, Trips payload/forms.
- Cần tiếp tục: hoàn thiện UI chi tiết theo từng màn như backlog P0/P1/P2 ở trên để khớp đầy đủ thiết kế trong CONVENTION.md.
