# Screens Spec from CONVENTION (UI Plan)

> Tài liệu spec triển khai 24 màn hình chính của hệ thống CETA, map từ
> `CONVENTION.md` (mục 3.x) sang code `React + Ant Design v5` theo skill
> `react-antd`. File này dùng song song với `task.md` (roadmap 6 phase).

## Cách dùng tài liệu này

1. Tra cứu nhanh: dùng [Section A](#section-a--convention-map-24-màn) để biết mỗi
   màn nằm ở section nào của `CONVENTION.md`, file nào, hook nào.
2. Khi code 1 màn: đọc spec trong [Section B](#section-b--per-screen-spec) (5
   trường: Layout / Components / Data / Rules / State).
3. Copy 1 trong 3 [Section C](#section-c--3-skeleton-patterns) skeleton phù hợp
   (List / Form dialog / Detail tabs).
4. Tick từng item trong [Section D](#section-d--dod--sprint-plan) DoD trước khi
   close ticket.

Reference: [task.md](task.md) · [CONVENTION.md](CONVENTION.md) ·
`.claude/skills/react-antd/SKILL.md`.

---

## Section A — Convention Map (24 màn)

| #  | Màn hình                | CONVENTION | URL                                       | Quyền                | File chính                                                                    | Hook / Component chính                                                                              |
|----|-------------------------|------------|-------------------------------------------|----------------------|-------------------------------------------------------------------------------|------------------------------------------------------------------------------------------------------|
| 1  | Dashboard               | 3.2        | `/dashboard`                              | mọi role             | [dashboard.tsx](src/pages/dashboard/dashboard.tsx)                            | `useDashboardTodayKpis`, `useExpiringDocuments`, `useDashboardTripRevenue`, `useTopDrivers`, `ExpirationAlerts` |
| 2  | Trips List              | 3.3        | `/admin/trips`                            | `can_view orders`    | [TripsList.tsx](src/pages/trips/TripsList.tsx)                                | `useResourceListQuery`, `useListFilters`, `TripTable`, `useExport`                                  |
| 3  | Trip Form (Create/Edit) | 3.4        | `/admin/trips/create`, `/admin/trips/:id/edit` | `can_create/edit`    | [TripFormDialog.tsx](src/pages/trips/TripFormDialog.tsx), [TripForm.tsx](src/pages/trips/TripForm.tsx) | `useFormModal`, `Form.useForm`, `Form.List` (stops/surcharges)                                       |
| 4  | Trip Detail             | 3.5        | `/admin/trips/:id`                        | `can_view orders`    | [TripDetailPage.tsx](src/pages/trips/TripDetailPage.tsx)                      | `useGetDetail`, `StatusTimeline`, `TripCostsTab`, `RevenueCard`                                     |
| 5  | Orders Pool             | 3.3 ext    | `/admin/orders/pool`                      | `can_edit orders`    | [OrdersPoolPage.tsx](src/pages/orders/OrdersPoolPage.tsx)                     | `useResourceListQuery`, `QuickAssignModal`                                                          |
| 6  | Dispatch Board          | 3.6        | `/admin/dispatch/board`, `/admin/dispatch/today` | `view orders+vehicles` | [dispatch/index.tsx](src/pages/dispatch/index.tsx), [DispatchBoardPage.tsx](src/pages/dispatch/DispatchBoardPage.tsx) | `useDispatchBoard`, `useDispatchDailySummary`, `ResourceStatusBoard`, `UnassignedTripList`, `QuickAssignModal` |
| 7  | Vehicles List           | 3.7        | `/admin/vehicles`                         | `can_view vehicles`  | [VehiclesList.tsx](src/pages/vehicles/VehiclesList.tsx)                       | `useResourceListQuery`, `useListFilters`                                                            |
| 8  | Vehicle Detail          | 3.7        | `/admin/vehicles/:id`                     | `can_view vehicles`  | [VehicleDetailPage.tsx](src/pages/vehicles/VehicleDetailPage.tsx)             | `useGetDetail`, `VehicleDocuments`, `VehicleAssignments`, `VehicleMaintenanceTab`                   |
| 9  | Vehicle Form            | —          | dialog `create/edit`                      | `can_create/edit`    | [VehicleFormDialog.tsx](src/pages/vehicles/VehicleFormDialog.tsx), [VehicleForm.tsx](src/pages/vehicles/VehicleForm.tsx) | `useFormModal`, async unique check biển số                                                          |
| 10 | Drivers List            | 3.8        | `/admin/drivers`                          | `can_view drivers`   | [DriversList.tsx](src/pages/drivers/DriversList.tsx)                          | `useResourceListQuery`, `useListFilters`                                                            |
| 11 | Driver Detail           | 3.8        | `/admin/drivers/:id`                      | `can_view drivers`   | [DriverDetailPage.tsx](src/pages/drivers/DriverDetailPage.tsx)                | `useGetDetail`, schedule matrix, leave history                                                      |
| 12 | Driver Form             | —          | dialog `create/edit`                      | `can_create/edit`    | [DriverFormDialog.tsx](src/pages/drivers/DriverFormDialog.tsx), [DriverForm.tsx](src/pages/drivers/DriverForm.tsx) | `useFormModal`, async unique `license_no`                                                           |
| 13 | Driver Schedule         | 3.9        | `/admin/drivers/schedule`                 | `can_view drivers`   | [DriverSchedulePage.tsx](src/pages/drivers/DriverSchedulePage.tsx)            | `use-driver-schedule-page`, `use-driver-day-map`, `ApplyScheduleModal`                              |
| 14 | Customers List          | 3.10       | `/admin/customers`                        | `can_view orders`    | [CustomersList.tsx](src/pages/customers/CustomersList.tsx)                    | `useCustomerList`, `useCustomerGroups`, `useListFilters`                                            |
| 15 | Customer Detail         | 3.10       | `/admin/customers/:id`                    | `can_view orders`    | [CustomerDetailPage.tsx](src/pages/customers/CustomerDetailPage.tsx)          | `useGetDetail`, debt/revenue stats                                                                  |
| 16 | Customer Form           | —          | dialog `create/edit`                      | `can_create/edit`    | [CustomerFormDialog.tsx](src/pages/customers/CustomerFormDialog.tsx), [CustomerForm.tsx](src/pages/customers/CustomerForm.tsx) | `useCustomerMutations`, async unique tax_code                                                       |
| 17 | Revenue                 | —          | `/admin/accounting/revenue`               | `can_view accounting`| [RevenuePage.tsx](src/pages/accounting/RevenuePage.tsx)                       | `useAccounting`, `useExport`                                                                         |
| 18 | Costs                   | —          | `/admin/accounting/costs`                 | `can_view accounting`| [CostsPage.tsx](src/pages/accounting/CostsPage.tsx)                           | `useAccounting`, `useCostValidation`, `CostApprovalsPage`                                            |
| 19 | Reconciliation          | 3.11       | `/admin/accounting/reconciliation`        | `can_approve`        | [ReconciliationPage.tsx](src/pages/accounting/ReconciliationPage.tsx)         | `useAccounting`, sessions+items split                                                                |
| 20 | Debt                    | —          | `/admin/accounting/debt`                  | `can_view accounting`| [DebtPage.tsx](src/pages/accounting/DebtPage.tsx)                             | `useAccounting`, payment record modal                                                                |
| 21 | Reports                 | 3.13       | `/admin/reports`, `/admin/reports/overview` | `can_view reports`   | [Reports.tsx](src/pages/reports/Reports.tsx), [ReportsPage.tsx](src/pages/reports/ReportsPage.tsx) | `useReports`, `useExport`                                                                            |
| 22 | Categories Settings     | 3.12       | `/admin/settings/categories`              | `admin`              | [CategoriesPage.tsx](src/pages/settings/CategoriesPage.tsx)                   | `useResourceListQuery` cho từng nhóm danh mục                                                        |
| 23 | Users (Admin)           | —          | `/admin/users`                            | `admin`              | [UsersList.tsx](src/pages/users/UsersList.tsx), [UserFormDialog.tsx](src/pages/users/UserFormDialog.tsx), [UserPermissionsTab.tsx](src/pages/users/UserPermissionsTab.tsx) | `useResourceListQuery`, `useFormModal`, permissions matrix                                           |
| 24 | Company Settings        | —          | `/admin/settings/company`                 | `admin`              | [CompanySettingsPage.tsx](src/pages/settings/CompanySettingsPage.tsx)         | `useGetDetail` (company), audit-action confirm                                                       |

> Ghi chú: cột "Quyền" lấy theo `user_permissions.module + can_*` (CONVENTION
> 2.1). Một số màn admin-only thay vì module permission.

---

## Section B — Per-Screen Spec

Mỗi entry có 5 trường:
1. **Layout** — khối chính + tham chiếu CONVENTION 3.x
2. **Antd components** — list cụ thể
3. **Data** — hook + endpoint chính + cache key
4. **Business rules** — chiếu rule R01–R13
5. **State** — loading / empty / error / forbidden / soft-delete

### Phase 1 — Dashboard & Navigation

#### 1. Dashboard
- **Layout** (CONVENTION 3.2): `Header` (greeting + ngày) → KPI row 4 cột (Đơn mới, Đang chạy, Hoàn thành, Doanh thu hôm nay) → Alerts row (xe/tx hết hạn, đơn chưa phân công) → 2 cột Charts (Doanh thu 7 ngày + Xe đang hoạt động) → Recent trips table 10 dòng.
- **Antd components**: `Flex vertical`, `Card`, `Statistic`, `Progress`, `Alert`, `Tag`, `Tabs`, `Table`, `Skeleton.Avatar`, `Empty`. Charts dùng wrapper `Card` cố định height.
- **Data**:
  - `useDashboardTodayKpis()` → KPI counts (today)
  - `useExpiringDocuments()` → vehicle/driver expiry alerts
  - `useDashboardTripRevenue({ days: 7 })` → bar chart
  - `useTopDrivers({ limit: 5 })` → list xe đang hoạt động
  - `useResourceListQuery({ resource: 'trips', filters: { sort: '-created_at', limit: 10 } })` → recent trips
- **Business rules**: R10 (`total_revenue` đã tính sẵn).
- **State**: mỗi widget có riêng `Skeleton` khi loading; `Empty` (Antd `Empty`) khi không có data; `Alert.ErrorBoundary` khi 1 widget lỗi (không sập cả page); alert badge số 0 thì ẩn.

#### 2. AppLayout + AppSidebar
- **Layout** (CONVENTION 3.1): `Layout.Sider` collapsible bên trái + `Layout.Header` sticky + `Layout.Content`. Menu group theo CONVENTION 3.1 (Dashboard / Đơn hàng / Điều vận / Phương tiện / Tài xế / Khách hàng / Kế toán / Báo cáo / Cài đặt).
- **Antd components**: `Layout`, `Layout.Sider`, `Menu` items array (không dùng `<Menu.Item>` children — antd v5 yêu cầu prop `items`), `Badge` cho số notification trong menu, `Tooltip` khi sidebar collapsed.
- **Data**: chỉ dùng `usePermission()` để filter menu items + `useNotifications` cho badge count.
- **Business rules**: hide menu nếu thiếu `can_view` cho module tương ứng (R01–R13 không trực tiếp; logic phân quyền theo CONVENTION 2.1).
- **State**: collapsed mặc định ở mobile (`<992px`); active menu item đồng bộ với route hiện tại qua `useLocation`.

#### 3. NavUser + NotificationBell
- **Layout**: cụm phải header — `NotificationBell` (popover list) + `NavUser` (dropdown avatar → Profile / Settings / Logout).
- **Antd components**: `Dropdown` items array, `Popover`, `Avatar`, `List`, `Badge dot`, `Empty` khi list rỗng.
- **Data**: `useNotifications({ unreadOnly: false, limit: 10 })`, mark-as-read mutation, `useAuth()` cho user info.
- **Business rules**: R09 (audit không sửa) → mark-as-read là update trên `notifications` riêng, không động `audit_logs`.
- **State**: badge dot khi `unread > 0`; loading skeleton trong popover; empty Antd `Empty`.

### Phase 2 — Orders + Dispatch

#### 4. TripsList
- **Layout** (CONVENTION 3.3): `PageHeader` (title + extra `[Tạo đơn][Export]`) → `ListPageFilters` (keyword, status multi-select, customer search, vehicle, date range) → `Table` 8 cột (Mã / KH / Tuyến / Xe / Tài xế / Trạng thái / Doanh thu / Actions) → footer total + pagination.
- **Antd components**: `Table` typed, `Tag` màu lấy từ `order_status_configs.color`, `Space.Compact` cho action group, `DatePicker.RangePicker`, `Select` (search), `Modal` confirm cancel, `Drawer` quick view (optional).
- **Data**: `useResourceListQuery<Trip>({ resource: 'trips', filters })`, `useListFilters`, `useExport({ resource: 'trips' })`. Cache key: `['trips', filters]`.
- **Business rules**: R01 (đơn `completed` không xoá — disable nút xoá), R02 (cảnh báo trùng giờ khi assign), R11 (`code` readonly).
- **State**: skeleton table khi loading; `Empty` description "Không có đơn hàng phù hợp"; `ErrorState` với retry khi 5xx; forbidden 403 hiển thị `Result status="403"`.

#### 5. TripForm
- **Layout** (CONVENTION 3.4): `Modal/Drawer` 3 tabs `Thông tin / Tuyến đường / Doanh thu`. Tab 1: customer + cargo. Tab 2: route_template + origin/destination + multi-stop `Form.List`. Tab 3: pricing + surcharges `Form.List` + total auto-compute.
- **Antd components**: `Tabs` items, `Form` layout vertical, `Form.List` cho `stops` và `surcharges`, `Select` (search remote) cho customer/route, `InputNumber` (formatter currency VND), `DatePicker`, `TimePicker`, `Input.TextArea`, `AutoComplete` cho địa chỉ.
- **Data**: `useFormModal<TripFormValues>({ resource: 'trips', id })`. Auto-fill: khi chọn `route_template_id` → set `distance_km`, `default_price`, `fuel_norm_liter`. Khi chọn `customer_id` + `route_template_id` → query `price_list_items` để gợi ý `base_price`.
- **Business rules**: R10 (`total_revenue = base_price + SUM(surcharges)` — compute realtime qua `Form.useWatch`), R02 (block save nếu xe trùng giờ — call check API trước submit).
- **State**: validate inline tại field; submitting → `confirmLoading` trên modal; backend errors map vào `form.setFields` highlight đúng field; tab hiện lỗi tô badge đỏ.

#### 6. TripDetail
- **Layout** (CONVENTION 3.5): `PageHeader` (mã đơn + status `Tag` + actions `[Sửa][Hủy]`) → 2-col grid `Thông tin đơn` + `Phân công` → `Tuyến đường` (timeline stops) → `Timeline trạng thái` → 2-col `Doanh thu` + `Chi phí phát sinh` → `Chứng từ` + `Ghi chú nội bộ`.
- **Antd components**: `PageHeader` shared, `Descriptions` 2 cột, `Steps` cho stops, `Timeline` cho status history (dùng `StatusTimeline`), `Card`, `Statistic`, `Table` cho costs, `Upload.Dragger` cho documents, `Tabs` (info/stops/costs/documents/notes).
- **Data**: `useGetDetail<Trip>({ resource: 'trips', id })`, sub-queries cho `trip_costs`, `trip_documents`, `trip_status_histories` (cùng resource hoặc nested).
- **Business rules**: R01 (status=`completed` → ẩn nút xoá, cho hủy), R02 (đổi xe/tài xế kiểm tra xung đột), R03 (cảnh báo GPLX hết hạn khi đổi tài xế), R10 (hiển thị `total_revenue` đã tính).
- **State**: `Skeleton` toàn page; `Result status="404"` nếu không tìm thấy; banner `Alert.warning` nếu trip `cancelled`; cost approval pending → badge đỏ trên tab Chi phí.

#### 7. OrdersPoolPage
- **Layout** (CONVENTION 3.3 ext): `PageHeader` + filter bar (vehicle_type, priority, date) + `Table` unassigned trips với cột `[Gán ngay]`.
- **Antd components**: `Table`, `Tag` priority (high=red, normal=default), `Modal` (`QuickAssignModal`) để chọn xe/tài xế từ resource board.
- **Data**: `useResourceListQuery<Trip>({ resource: 'trips', filters: { status: 'pending', driver_id: null } })`, `useDispatchBoard()` cho dropdown xe rảnh.
- **Business rules**: R02 (kiểm tra trùng giờ khi assign), R12 (xe `maintenance/broken` không hiển thị), R13 (tài xế đang nghỉ phép không hiển thị).
- **State**: empty "Không có đơn chờ phân công"; toast success sau assign + refetch list.

#### 8. DispatchBoardPage
- **Layout** (CONVENTION 3.6): 3 vùng `DispatchSummary` (top KPI: tổng/đang chạy/rảnh/bảo dưỡng) → `UnassignedTripList` (trái) → `ResourceStatusBoard` (phải, matrix Xe×Giờ với block màu).
- **Antd components**: `Card`, `Statistic`, custom matrix dùng `Table` virtualized hoặc `div grid` với `Tag` legend, `Segmented` đổi ngày, `DatePicker`, `Modal` `QuickAssignModal`, `Popover` chi tiết block.
- **Data**: `useDispatchBoard({ date })`, `useDispatchDailySummary({ date })`. Cache key: `['dispatch', date]`. Service đã có graceful fallback khi 403.
- **Business rules**: R02, R04 (1 xe ↔ 1 tài xế), R05 (1 tài xế / ngày), R12 (xe hỏng block), R13 (tài xế nghỉ block).
- **State**: legend cố định ở footer; empty "Chưa có lịch ngày này — sinh lịch tự động"; forbidden 403 hiển thị `Result` thay vì lỗi đỏ console.

### Phase 3 — Fleet + Driver Operations

#### 9. VehiclesList
- **Layout** (CONVENTION 3.7): `PageHeader [Thêm xe][Export]` → filter (biển số, loại xe, trạng thái) → `Table` 6 cột (Biển số / Loại / Tài xế PT / Trạng thái / Cảnh báo / Actions).
- **Antd components**: `Table`, `Tag` status (active=green, maintenance=orange, broken=red), `Badge count` cho cảnh báo giấy tờ, `Tooltip` chi tiết cảnh báo.
- **Data**: `useResourceListQuery<Vehicle>({ resource: 'vehicles', filters })`, `useListFilters`, `useExpiringDocuments({ scope: 'vehicle' })` để tô badge.
- **Business rules**: R12 (xe `maintenance/broken` vẫn hiển thị nhưng đánh dấu).
- **State**: empty / error / forbidden chuẩn.

#### 10. VehicleDetail
- **Layout** (CONVENTION 3.7): `PageHeader` + `Tabs` 5 tab `Thông tin / Giấy tờ / Tài xế phụ trách / Bảo dưỡng / Lịch sử chuyến`.
- **Antd components**: `Tabs` items, `Descriptions`, `Table` cho từng tab, `Tag` expiry status, `Upload` cho ảnh giấy tờ, `Timeline` lịch sử phụ trách (`VehicleAssignments`), `Modal` thêm giấy tờ / phiếu sửa.
- **Data**: `useGetDetail<Vehicle>({ resource: 'vehicles', id })`, sub-queries `vehicle_documents`, `vehicle_assignments`, `maintenance_records`. Cache key per tab.
- **Business rules**: R04 (1 xe ↔ 1 driver active — chặn tạo bản ghi mới khi đã có `to_date IS NULL`).
- **State**: skeleton per tab; tab Bảo dưỡng có badge nếu `next_due_date` sắp tới; tab Giấy tờ tô đỏ row sắp hết hạn theo `alert_before_days`.

#### 11. VehicleForm
- **Layout**: `Modal` 1 page, sections `Cơ bản` (biển số, loại, hãng/model/năm) / `Tải trọng & Nhiên liệu` / `Trạng thái`.
- **Antd components**: `Form`, `Input`, `Select` (vehicle_type, fuel_type, status), `InputNumber` (max_load_ton, volume_m3, fuel_consumption), `DatePicker` (year), `Upload` ảnh xe.
- **Data**: `useFormModal<VehicleFormValues>`. Async unique check: gọi `GET /vehicles?plate_number=` debounced 400ms khi blur; set `Form.Item validateStatus="error"` nếu trùng.
- **Business rules**: R11 (mã xe nội bộ readonly nếu có); biển số UNIQUE.
- **State**: feedback "Đang kiểm tra biển số..." khi async; submit disabled khi check failed.

#### 12. DriversList
- **Layout** (CONVENTION 3.8): `PageHeader [Thêm tài xế][Export]` → filter (keyword, team, status) → `Table` 6 cột (Mã / Họ tên / SĐT / Xe PT / Trạng thái / Cảnh báo).
- **Antd components**: `Table`, `Tag` available_status, `Badge` cảnh báo GPLX/sức khỏe, chips filter đang áp dụng.
- **Data**: `useResourceListQuery<Driver>({ resource: 'drivers', filters })`, `useListFilters` thêm `team_id`.
- **Business rules**: R03 (GPLX hết hạn → row tô warning).
- **State**: chuẩn.

#### 13. DriverDetail
- **Layout** (CONVENTION 3.8): `PageHeader` + `Tabs` 5 tab `Thông tin / Giấy tờ / Xe phụ trách / Lịch làm việc / Lịch sử chuyến`.
- **Antd components**: `Tabs`, `Descriptions`, `Avatar` lớn, `Table`, `Calendar` hoặc matrix tự dựng cho lịch tháng, `Tag`, `Modal` upload doc.
- **Data**: `useGetDetail<Driver>({ resource: 'drivers', id })`, sub queries `driver_documents`, `driver_work_schedules` (theo tháng), `leave_requests`.
- **Business rules**: R03 (GPLX expiry alert), R04 (xe phụ trách 1-1).
- **State**: tab Lịch làm việc có legend màu (rảnh/có chuyến/nghỉ/bệnh); skeleton calendar khi loading.

#### 14. DriverForm
- **Layout**: `Modal` 2 tabs `Thông tin cá nhân` + `Giấy phép & ngân hàng`.
- **Antd components**: `Form`, `Input`, `DatePicker` (dob, expired_date, health_certificate_expired_date), `Select` gender/license_class/team/status, `Upload` avatar + license_image.
- **Data**: `useFormModal<DriverFormValues>`. Async unique: `phone`, `email`, `license_no`, `national_id_no`. Pattern: phone VN regex, email standard.
- **Business rules**: R03 (cảnh báo nếu nhập GPLX đã hết hạn — không block).
- **State**: validate inline; alert vàng nếu license expired_date < today.

#### 15. DriverSchedulePage
- **Layout** (CONVENTION 3.9): `PageHeader` (chọn tháng/năm + `[Sinh lịch tự động][Phân công thủ công]`) → matrix `Tài xế × Ngày` với cell màu trạng thái → legend.
- **Antd components**: matrix tự dựng (hoặc `Table` với render cell), `Tag`, `Modal` `ApplyScheduleModal`, `DatePicker.MonthPicker`, `Segmented` view (Day/Week/Month).
- **Data**: `use-driver-schedule-page`, `use-driver-day-map({ month })`. Mutations: bulk generate, approve, reject.
- **Business rules**: R05 (1 tài xế / ngày), R12 (block xe maintenance), R13 (block tài xế nghỉ phép).
- **State**: skeleton matrix; empty "Chưa sinh lịch tháng này"; lock badge khi `status=locked`.

### Phase 4 — Customer Domain

#### 16. CustomersList
- **Layout** (CONVENTION 3.10): `PageHeader [Thêm KH][Export]` → filter (keyword, group, status) → `Table` 6 cột (Mã / Tên / SĐT / Nhóm / Số đơn / Công nợ) + actions (View / Edit / Payment / Delete).
- **Antd components**: `Table`, `Tag` group, `Statistic` công nợ inline, `Space.Compact` actions, `Switch` ẩn/hiện soft-deleted.
- **Data**: `useCustomerList({ filters })`, `useCustomerGroups()` cho dropdown.
- **Business rules**: R08 (xoá chỉ khi không có trips — disable nút xoá nếu `trips_count > 0`).
- **State**: skeleton; soft-deleted row tô xám + tag "Đã xoá"; empty filter.

#### 17. CustomerDetail
- **Layout** (CONVENTION 3.10): `PageHeader` + `Tabs` 4 tab `Thông tin / Bảng giá / Lịch sử đơn / Công nợ`.
- **Antd components**: `Descriptions`, `Statistic` (tổng doanh thu, công nợ, đã thanh toán), `Table` per tab, `Modal` ghi nhận thanh toán.
- **Data**: `useGetDetail<Customer>`, sub queries `price_lists`, `trips` (filter customer), `payment_records`, `reconciliation_sessions`.
- **Business rules**: R08 (action xoá disable + tooltip lý do).
- **State**: tab Công nợ có alert warning nếu `overdue_amount > 0`.

#### 18. CustomerForm
- **Layout**: `Modal` 1 page chia section `Thông tin chung` / `Liên hệ phụ` / `Hợp đồng & thanh toán` / `Tags & ghi chú`.
- **Antd components**: `Form`, `Radio.Group` (type: company/individual), `Input`, `Select` (group, dispatcher), `DatePicker.RangePicker` (contract dates), `InputNumber` (credit_limit, payment_terms_days), `Upload` (contract file), `Input.TextArea`.
- **Data**: `useCustomerMutations()`. Async unique: `tax_code`, `phone`, `email` (debounced 400ms).
- **Business rules**: code readonly; type=`individual` → ẩn `company_name`/`tax_code` (conditional fields).
- **State**: validate inline; submit disabled khi async check failed.

#### 19. CustomerPriceListPage
- **Layout**: `PageHeader [Thêm bảng giá]` → list `price_lists` (`Card` per list với meta hiệu lực) → click vào → drawer items table với inline create.
- **Antd components**: `List` hoặc `Table`, `Card`, `Drawer`, `Form.List` cho items, `Tag` is_active, `RangePicker` effective dates.
- **Data**: `useResourceListQuery({ resource: 'price-lists', filters: { customer_id } })`, items lazy load.
- **Business rules**: chỉ 1 price_list `is_active=true` cho mỗi customer cùng kỳ.
- **State**: empty "Chưa có bảng giá"; error chuẩn.

### Phase 5 — Accounting + Reports

#### 20. RevenuePage
- **Layout**: `PageHeader` + filter (RangePicker, customer, status) → KPI row 4 cột (Doanh thu / Đã thu / Còn nợ / Số đơn) → `Tabs` `Theo chuyến` + `Theo hóa đơn` mỗi tab có Table.
- **Antd components**: `Card`, `Statistic`, `Tabs`, `Table`, `Tag` payment_status (unpaid=red, invoiced=blue, paid=green).
- **Data**: `useAccounting({ scope: 'revenue', filters })`, `useExport`.
- **Business rules**: R10 (`total_revenue` formula).
- **State**: skeleton KPI + table; empty per tab.

#### 21. CostsPage
- **Layout**: filter + KPI (Tổng chi phí / Pending duyệt / Đã duyệt / Từ chối) → tổng theo loại (`Card` grid) → `Table` chi tiết với action `Approve/Reject` (chuyển sang `CostApprovalsPage` cho luồng phê duyệt riêng).
- **Antd components**: `Card`, `Statistic`, `Table`, `Tag` status, `Modal.confirm` cho approve/reject với reason.
- **Data**: `useAccounting({ scope: 'costs' })`, `useCostValidation`, mutations approve/reject.
- **Business rules**: R06 (vượt `approval_threshold` → bắt buộc duyệt).
- **State**: row pending highlight; skeleton; empty.

#### 22. ReconciliationPage
- **Layout** (CONVENTION 3.11): split-pane `Sessions` (trái: list phiên đối soát) + `Items` (phải: chi tiết phiên đang chọn). Tạo phiên: `Modal` chọn KH + period.
- **Antd components**: 2 `Table` (sessions / items), `Steps` trạng thái (draft → confirmed → locked), `Modal.confirm` lock, `InputNumber` chỉnh `adjusted_amount`, `Input.TextArea` lý do, `Tag is_disputed`.
- **Data**: `useAccounting({ scope: 'reconciliation' })`, mutations create/update/lock.
- **Business rules**: R07 (locked → readonly toàn bộ form). UI: disable mọi input, ẩn nút save, chỉ còn nút "Tạo phiên mới".
- **State**: lock banner `Alert.info`; loading items khi switch session; empty "Chọn 1 phiên".

#### 23. DebtPage
- **Layout**: `PageHeader [Ghi nhận thanh toán]` → KPI aging (0–30 / 31–60 / 61–90 / >90 ngày) → `Table` chi tiết theo customer với cột nợ + ngày quá hạn → side `Drawer` tạo `payment_record`.
- **Antd components**: `Card`, `Statistic`, `Progress`, `Table`, `Tag` aging bucket (red/orange/yellow/green), `Drawer`, `Form` payment.
- **Data**: `useAccounting({ scope: 'debt' })` (đã có graceful fallback từ `invoice.service.ts`).
- **Business rules**: cảnh báo theo CONVENTION 2.8 (quá hạn `payment_terms_days`).
- **State**: row overdue tô đỏ; empty "Không có công nợ"; success toast sau ghi nhận thanh toán.

#### 24. Reports / ReportsPage
- **Layout** (CONVENTION 3.13): `PageHeader [Kỳ báo cáo][Export Excel/PDF]` → grid 8 nhóm `Card` (Đơn hàng / Doanh thu / Chi phí / Lợi nhuận / Hiệu suất xe / Hiệu suất TX / Công nợ / Tiêu chí khác) → click `Card` → drill-down `Drawer` hoặc route con.
- **Antd components**: `Card`, `Statistic`, `Tabs`, `Table`, `Segmented` chu kỳ, `DatePicker` month/year, charts wrapper. Mỗi `Card` cùng kích thước header/body/footer.
- **Data**: `useReports({ period, type })`, `useExport({ scope: 'reports', period })` (server-side export).
- **Business rules**: không có rule cứng; nhưng tổng doanh thu phải = SUM `total_revenue` (R10).
- **State**: `Card` skeleton khi loading; export progress message; error per card không sập trang.

### Phase 6 — Settings + Admin

#### 25. CategoriesPage
- **Layout** (CONVENTION 3.12): split-pane — left rail tabs danh mục (`Loại xe / Loại hàng / Chi phí / Điểm giao / Tuyến đường / Trạng thái`) + right CRUD area (`PageHeader[+]` + `Table` drag-sort + `Modal` form).
- **Antd components**: `Tabs` vertical hoặc `Menu`, `Table` với `dnd` drag handle (`MoveOutlined`), `Modal`, `Form`, `Switch is_active`, `InputNumber sort_order`.
- **Data**: 6 nhóm hook `useResourceListQuery` riêng cho từng resource (`vehicle-types`, `cargo-types`, `cost-categories`, `locations`, `route-templates`, `order-status-configs`).
- **Business rules**: code UNIQUE trong company; soft-delete giữ history.
- **State**: empty per tab "Chưa có mục"; modal có async unique check `code`.

#### 26. UsersList + UserFormDialog (Admin)
- **Layout**: `UsersList` chuẩn list page (filter role, status). `UserFormDialog` `Modal` 2 tabs `Thông tin` + `Phân quyền`. Tab Phân quyền: matrix module × action (`view/create/edit/delete/approve/export`).
- **Antd components**: `Table`, `Tag` role, `Modal`, `Tabs`, `Form`, `Checkbox` matrix, `Switch status`, `Button` reset password (`Modal.confirm`).
- **Data**: `useResourceListQuery({ resource: 'users' })`, `useFormModal`, sub-mutation cho `user_permissions` (bulk save matrix).
- **Business rules**: admin role có toàn quyền → matrix readonly + check toàn bộ; super_admin chỉ super_admin tạo được.
- **State**: row inactive tô xám; matrix loading skeleton; reset password feedback message.

#### 27. CompanySettingsPage
- **Layout**: `PageHeader` + `Card` view mode + `Card` edit mode (toggle button `[Sửa]`). Phần status `active/inactive` tách riêng `Card` với `Modal.confirm` xác nhận.
- **Antd components**: `Descriptions` (view), `Form` (edit), `Input`, `Input.TextArea`, `Modal.confirm`, `Tag status`, `Result` audit feedback.
- **Data**: `useGetDetail({ resource: 'companies', id: currentCompanyId })`, mutation update + status. Audit action chuẩn theo `audit-action.ts`.
- **Business rules**: R09 (audit không sửa); `code` UNIQUE; chỉ admin được sửa.
- **State**: view/edit toggle; toast success + invalidate cache; error inline tại field.

> Section B đang phủ 27 entry vì gộp thêm `AppLayout`, `NavUser`, `OrdersPool`,
> `CategoriesPage`, `UsersList+FormDialog`, `CompanySettings` để khớp đủ
> bảng 24 màn ở Section A (một số màn tách thành 2 file con).

---

## Section C — 3 Skeleton Patterns

> Code mẫu để copy-paste khi triển khai từng màn. Đặt trực tiếp trong file
> tương ứng (`src/pages/<domain>/<Domain>List.tsx`...).

### Pattern 1 — List Page

```tsx
// File mẫu: src/pages/<domain>/<Domain>List.tsx
import { Flex, Table, Button, Tag, App } from 'antd';
import type { TableProps } from 'antd';
import { PlusOutlined, ExportOutlined } from '@ant-design/icons';
import PageHeader from '@/components/common/PageHeader';
import ListPageFilters from '@/components/common/ListPageFilters';
import ErrorState from '@/components/common/ErrorState';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { useListFilters } from '@/hooks/useListFilters';
import { useExport } from '@/hooks/useExport';
import { usePermission } from '@/hooks/usePermission';

type Row = { id: number; code: string; status: string };

export default function DomainList() {
  const { message } = App.useApp();
  const { can } = usePermission('orders');
  const {
    filters,
    filterInputs,
    setFilterInput,
    applyFilters,
    resetFilters,
  } = useListFilters({ keyword: '', status: undefined });

  const { data, isLoading, error, refetch } = useResourceListQuery<Row>({
    resource: 'trips',
    filters,
  });

  const { exporting, doExport } = useExport({ resource: 'trips', filters });

  const columns: TableProps<Row>['columns'] = [
    { title: 'Mã', dataIndex: 'code', key: 'code', width: 160 },
    {
      title: 'Trạng thái',
      dataIndex: 'status',
      key: 'status',
      width: 140,
      render: (s: string) => <Tag>{s}</Tag>,
    },
  ];

  if (error) {
    return <ErrorState onRetry={refetch} />;
  }

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title="Đơn hàng"
        extra={
          <>
            {can('export') && (
              <Button
                icon={<ExportOutlined />}
                loading={exporting}
                onClick={() => {
                  doExport().then(() => message.success('Đã xuất file'));
                }}
              >
                Export
              </Button>
            )}
            {can('create') && (
              <Button type="primary" icon={<PlusOutlined />}>
                Tạo đơn
              </Button>
            )}
          </>
        }
      />

      <ListPageFilters
        values={filterInputs}
        onChange={setFilterInput}
        onApply={applyFilters}
        onReset={resetFilters}
      />

      <Table<Row>
        rowKey="id"
        columns={columns}
        dataSource={data?.data ?? []}
        loading={isLoading}
        pagination={{
          pageSize: 20,
          showSizeChanger: true,
          total: data?.total,
        }}
        scroll={{ x: 'max-content' }}
      />
    </Flex>
  );
}
```

### Pattern 2 — Form Dialog (Create/Edit)

```tsx
// File mẫu: src/pages/<domain>/<Domain>FormDialog.tsx
import { Modal, Form, Input, Select, App } from 'antd';
import { useFormModal } from '@/hooks/useFormModal';

type Values = {
  name: string;
  status: 'active' | 'inactive';
};

type Props = {
  open: boolean;
  id?: number;
  onClose: () => void;
};

export default function DomainFormDialog({ open, id, onClose }: Props) {
  const { message } = App.useApp();
  const [form] = Form.useForm<Values>();

  const { submitting, initialValues, onSubmit } = useFormModal<Values>({
    resource: 'trips',
    id,
    form,
    onSuccess: () => {
      message.success(id ? 'Đã cập nhật' : 'Đã tạo');
      onClose();
    },
  });

  return (
    <Modal
      title={id ? 'Sửa đơn hàng' : 'Tạo đơn hàng'}
      open={open}
      onCancel={onClose}
      onOk={() => form.submit()}
      confirmLoading={submitting}
      okText="Lưu"
      cancelText="Huỷ"
      destroyOnHidden
      maskClosable={false}
    >
      <Form<Values>
        form={form}
        layout="vertical"
        initialValues={initialValues}
        onFinish={onSubmit}
        requiredMark="optional"
        autoComplete="off"
      >
        <Form.Item<Values>
          name="name"
          label="Tên"
          rules={[{ required: true, message: 'Nhập tên' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item<Values>
          name="status"
          label="Trạng thái"
          rules={[{ required: true }]}
        >
          <Select
            options={[
              { value: 'active', label: 'Hoạt động' },
              { value: 'inactive', label: 'Tạm dừng' },
            ]}
          />
        </Form.Item>
      </Form>
    </Modal>
  );
}
```

### Pattern 3 — Detail Page (Tabs)

```tsx
// File mẫu: src/pages/<domain>/<Domain>DetailPage.tsx
import { Tabs, Card, Descriptions, Tag, Flex, Skeleton, Result } from 'antd';
import type { TabsProps } from 'antd';
import PageHeader from '@/components/common/PageHeader';
import ErrorState from '@/components/common/ErrorState';
import { useGetDetail } from '@/hooks/useGetDetail';

type Detail = {
  id: number;
  code: string;
  status: string;
};

type Props = { id: number };

export default function DomainDetailPage({ id }: Props) {
  const { data, isLoading, error, refetch } = useGetDetail<Detail>({
    resource: 'trips',
    id,
  });

  if (isLoading) {
    return <Skeleton active />;
  }
  if (error) {
    return <ErrorState onRetry={refetch} />;
  }
  if (!data) {
    return <Result status="404" title="Không tìm thấy đơn hàng" />;
  }

  const tabs: TabsProps['items'] = [
    {
      key: 'info',
      label: 'Thông tin',
      children: (
        <Descriptions
          column={2}
          items={[
            { key: 'code', label: 'Mã đơn', children: data.code },
            { key: 'status', label: 'Trạng thái', children: data.status },
          ]}
        />
      ),
    },
    { key: 'stops', label: 'Tuyến đường', children: <></> },
    { key: 'costs', label: 'Chi phí', children: <></> },
    { key: 'docs', label: 'Chứng từ', children: <></> },
  ];

  return (
    <Flex vertical gap={16}>
      <PageHeader
        title={`Đơn ${data.code}`}
        tags={<Tag color="blue">{data.status}</Tag>}
        extra={<>{/* role-aware actions */}</>}
      />
      <Card>
        <Tabs items={tabs} destroyInactiveTabPane />
      </Card>
    </Flex>
  );
}
```

> Quy tắc khi copy:
> - Tên file: kebab-case không bắt buộc — codebase đang dùng PascalCase cho
>   page component, vẫn giữ nguyên convention hiện tại.
> - Luôn dùng `App.useApp()` cho `message/notification/modal`.
> - Modal/Drawer dùng `open` (không `visible`), `destroyOnHidden`.
> - Table luôn `rowKey` + `scroll={{ x: 'max-content' }}`.
> - Form luôn `Form.useForm()` + `name` cho từng `Form.Item` + `rules`.

---

## Section D — DoD + Sprint Plan

### DoD per screen (copy cho mỗi PR)

```md
- [ ] Layout match CONVENTION 3.x (header / filter / body / footer)
- [ ] Antd v5 chuẩn (App.useApp, destroyOnHidden, Select options, dayjs)
- [ ] Form: form={form} + Form.Item name + rules đầy đủ
- [ ] Table: rowKey, typed columns, scroll x cho table rộng
- [ ] Loading skeleton + Empty + Error/Retry + Forbidden state
- [ ] Permission gating (hide/disable) đúng module + action
- [ ] Business rules R0x được enforce ở UI (block/disable/banner)
- [ ] i18n đầy đủ vi/en, không missing key
- [ ] Responsive 3 breakpoint (mobile/tablet/desktop)
- [ ] Lint + typecheck pass, không warning antd v5
```

### Sprint cadence (gợi ý)

| Sprint | Thời lượng | Phase phủ                                              | Output                                                  |
|--------|-----------|--------------------------------------------------------|---------------------------------------------------------|
| 0      | 0.5 tuần  | Foundation (Phase 0 trong `task.md`)                   | ConfigProvider + 3 skeleton patterns + shared component |
| 1      | 1 tuần    | Phase 1 (Dashboard, Layout, NavUser) + Phase 2 (Trips List/Form/Detail) | 3 màn navigation + 3 màn trips                          |
| 2      | 1 tuần    | Phase 2 (Orders Pool, Dispatch Board) + Phase 3 (Vehicles list/detail/form) | 2 màn dispatch + 3 màn vehicle                          |
| 3      | 1 tuần    | Phase 3 (Drivers list/detail/form/schedule) + Phase 4 (Customer list/detail/form/price-list) | 4 màn driver + 4 màn customer                           |
| 4      | 1 tuần    | Phase 5 (Revenue, Costs, Reconciliation, Debt, Reports) | 5 màn accounting/report                                 |
| 5      | 0.5 tuần  | Phase 6 (Categories, Users, Company Settings) + final QA | 3 màn settings + audit pass                             |

### Gate giữa các sprint

- Cuối sprint chạy `pnpm lint`, `pnpm typecheck`, smoke test ở 3 breakpoint.
- Cross-check console: không còn warning antd v5 (`destroyOnClose`, `addonAfter`,
  `visible`, static `message`).
- Update tracking checklist ở `task.md` cho phase tương ứng (mark `Audit
  completed`, `All target screens redesigned`, `DoD signed off`).

---

## Phụ lục — Quy ước nhanh khi review code

1. Có dùng `App.useApp()` không? Không có → reject.
2. `Form` có `form={form}` không? Có `Form.Item name` cho mọi field control
   không? Không → reject.
3. `Table` có `rowKey` không? Không → reject.
4. Modal/Drawer có `open` (không phải `visible`) không? Có `destroyOnHidden`
   không?
5. `Select` có dùng prop `options` thay vì children `<Option>` không?
6. Có còn `import 'moment'` hoặc `import 'antd/dist/antd.css'` không? Có →
   reject.
7. Loading / Empty / Error / Forbidden có đủ 4 state không?
8. Có business rule R0x liên quan không? Đã enforce ở UI chưa?

---

*File spec triển khai 24 màn. Cập nhật khi `CONVENTION.md` thay đổi.*
