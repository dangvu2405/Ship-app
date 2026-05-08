# UI Redesign Plan (React + Ant Design v5)

## Mục tiêu

- Quét toàn bộ màn hình theo phase, chuẩn hóa giao diện theo skill `react-antd`.
- Đồng bộ UX enterprise: filter bar, stats cards, table actions, loading/empty/error.
- Chuẩn hóa code antd v5: `App.useApp`, `Form`, `Table`, `Modal open`, `Space/Flex`, token/theme.
- Giảm warning/deprecated, tăng consistency giữa các module.

## Nguyên tắc thiết kế áp dụng cho mọi phase

1. **Antd-first UI**: ưu tiên component antd thay vì custom primitive.
2. **Form chuẩn**: `Form.useForm`, `form={form}`, `Form.Item name`, rules rõ ràng.
3. **Table chuẩn**: typed columns, `rowKey`, pagination, empty state.
4. **Modal/Drawer chuẩn v5**: dùng `open`, `destroyOnHidden`, `maskClosable` hợp lý.
5. **Feedback chuẩn**: dùng `App.useApp()` cho `message/notification/modal`.
6. **Layout chuẩn**: dùng `Flex`, `Space`, `Card`, tránh inline style rời rạc.
7. **Theme token**: thống nhất typography/spacing/radius qua token.

---

## Phase 0 — Foundation & Design System Alignment

### Scope
- Root app shell, token, typography, spacing baseline.
- Shared components: `PageHeader`, `ListPageFilters`, `ErrorState`, dialog wrappers.

### Checklist
- [ ] Chuẩn hóa token màu/chữ/padding/radius tại root `ConfigProvider`.
- [ ] Rà soát tất cả `destroyOnClose` -> `destroyOnHidden`.
- [ ] Loại bỏ `addonAfter` deprecated của `InputNumber` (dùng label hoặc `Space.Compact`).
- [ ] Chuẩn hóa `common` i18n keys dùng chung (`records`, `export`, status labels...).
- [ ] Chuẩn hóa loading skeleton + empty state cho list/detail pages.

### Deliverables
- Bộ guideline UI nội bộ ngắn gọn.
- Shared components không còn warning antd v5.

---

## Phase 1 — Dashboard & Navigation Surfaces

### Màn hình
- `dashboard`
- `AppLayout`, `AppSidebar`, `NavUser`, global header widgets

### Checklist
- [x] Re-layout dashboard theo visual hierarchy `Header -> KPI -> Charts -> Alerts`.
- [x] Đồng bộ card title, subtitle, action placement.
- [x] Chuẩn hóa chart containers (height, padding, loading state).
- [x] Chuẩn hóa empty/error cho từng widget dashboard.
- [x] Rà soát responsive breakpoints mobile/tablet/desktop.

### Acceptance
- UI dashboard nhất quán spacing/typography với các trang còn lại.
- Không còn warning UI từ dashboard/navigation.

---

## Phase 2 — Orders + Dispatch

### Màn hình
- `TripsList`, `TripForm`, `TripDetail`
- `OrdersPoolPage`
- `DispatchBoardPage` + components (`DispatchSummary`, `QuickAssignModal`, ...)

### Checklist
- [x] Chuẩn hóa filter bars (status/date/customer/driver/vehicle) với cùng layout.
- [x] Chuẩn hóa table actions (view/edit/delete/assign/export) theo 1 pattern.
- [x] Redesign trip form sections bằng accordion/tabs rõ ràng (route/revenue/stops/surcharges).
- [x] Refine dispatch board visual density (summary + unassigned + resource board).
- [x] Chuẩn hóa trạng thái loading/error khi API bị 403/404 (graceful UI fallback).

### Acceptance
- Luồng tạo/sửa/xem trip đồng nhất UI.
- Dispatch màn hình rõ ràng, thao tác nhanh, không lỗi hiển thị.

---

## Phase 3 — Fleet + Driver Operations

### Màn hình
- `VehiclesList`, `VehicleDetail`, `VehicleForm`, maintenance tabs
- `DriversList`, `DriverDetail`, `DriverForm`
- `DriverSchedulePage`

### Checklist
- [x] Chuẩn hóa detail pages sang card/tabs có cấu trúc giống nhau.
- [x] Tách rõ “records vs schedules” ở maintenance/schedule với badge trạng thái.
- [x] Chuẩn hóa form validation feedback và async unique-check UX.
- [x] Thiết kế matrix/schedule grid dễ đọc hơn (sticky headers, legend màu).
- [x] Chuẩn hóa action buttons theo role/state (disable/hide rõ ràng).

### Acceptance
- Các trang vehicle/driver có cùng language UI, không rối.
- Bảng lịch dễ quét, ít thao tác thừa.

---

## Phase 4 — Customer Domain

### Màn hình
- `CustomersList`, `CustomerDetail`, `CustomerForm`
- `CustomerPriceListPage`

### Checklist
- [x] Chuẩn hóa cards thống kê công nợ/doanh thu/thanh toán.
- [x] Chuẩn hóa list + quick actions (payment/create/edit/export).
- [x] Tối ưu form contract/contact/identity bằng section hợp lý.
- [x] Chuẩn hóa modal trải nghiệm tạo payment/price-list.
- [x] Rà soát trạng thái inactive/soft-delete hiển thị đúng.

### Acceptance
- Dữ liệu customer nhìn “enterprise”, rõ số liệu, rõ trạng thái.
- Form tạo/sửa customer không gây nhầm lẫn.

---

## Phase 5 — Accounting + Reports

### Màn hình
- `RevenuePage`, `CostsPage`, `ReconciliationPage`, `DebtPage`
- `Reports`, `ReportsPage`

### Checklist
- [x] Đồng bộ bố cục trang kế toán: `filter -> KPI row -> main table/chart`.
- [x] Chuẩn hóa các tab report (8 nhóm) với cùng khung panel.
- [x] Thiết kế lại các bảng đối soát/công nợ theo readability cao.
- [x] Chuẩn hóa export UX (server-side export actions + progress feedback).
- [x] Rà soát dạng số tiền/đơn vị/ngày giờ nhất quán toàn bộ accounting.

### Acceptance
- Người dùng nhìn báo cáo/kế toán theo cùng một pattern, giảm learning curve.
- Không còn mismatch kiểu hiển thị tiền/ngày giữa các trang.

---

## Phase 6 — Settings + Admin

### Màn hình
- `CategoriesPage`
- `UsersList`, `UserFormDialog`, permissions matrix
- `CompanySettingsPage`, admin companies screens

### Checklist
- [x] Chuẩn hóa CRUD settings tabs (toolbar/table/modal/form).
- [x] Tối ưu permissions matrix (module x action) cho dễ quét/chỉnh.
- [x] Chuẩn hóa state badges + status actions (activate/deactivate/reset password).
- [x] Chuẩn hóa company settings form (validation feedback + audit intent UX).
- [x] Đồng bộ super_admin vs tenant_admin visual cues.

### Acceptance
- Cụm settings/admin đồng nhất trải nghiệm và pattern thao tác.
- Permissions/company screens rõ quyền, rõ trạng thái.

---

## Definition of Done (cho mỗi màn)

- [ ] Không còn warning antd v5/deprecated tại màn.
- [ ] Không còn missing i18n key tại màn.
- [ ] Có loading, empty, error state chuẩn.
- [ ] Form/table/modal tuân thủ chuẩn `react-antd`.
- [ ] Responsive pass ở 3 breakpoint cơ bản.
- [ ] UX consistency pass với màn cùng nhóm domain.

---

## Cách thực thi theo sprint

1. Chốt danh sách màn trong phase.
2. Audit UI theo checklist `react-antd`.
3. Redesign từng màn (ưu tiên shared patterns trước).
4. QA nhanh: lint + typecheck + smoke runtime.
5. Chốt phase bằng checklist DoD.

---

## Tracking Template (copy cho mỗi phase)

```md
### Phase X - [Tên phase]
- [ ] Audit completed
- [ ] Shared UI pattern aligned
- [ ] All target screens redesigned
- [ ] Lint/typecheck pass
- [ ] Runtime smoke pass
- [ ] DoD signed off
```

---

## Chi tiết theo từng màn (đủ để triển khai)

### Phase 1

- `dashboard`
  - UI: gom thành 4 block `KPI`, `Charts`, `Alerts`, `Top performance`.
  - Design: đồng bộ card header/body/footer, icon + màu semantic.
  - Data-state: mỗi widget có loading skeleton + empty + retry.
- `AppSidebar`, `NavUser`, `AppLayout`
  - UI: chuẩn spacing item/menu, active state rõ, responsive collapse.
  - Design: badge notification, user menu thống nhất button/link style.
  - State: khi không đủ quyền hiển thị disabled/hide có chủ đích.

### Phase 2

- `TripsList`
  - UI: filter bar chuẩn (keyword/date/status/customer), actions phải cố định.
  - Table: column width ổn định, status tag chuẩn màu, bulk/export dễ thấy.
  - State: empty theo filter + error panel có retry.
- `TripForm`
  - UI: sections `basic/route/stops/revenue` rõ ràng.
  - Form: stops + surcharges dạng line-items dễ nhập.
  - Validation UX: inline errors + highlight field theo backend errors.
- `TripDetail`
  - UI: tabs `info/stops/surcharges/costs/documents` chuẩn.
  - Design: timeline dễ quét, actions theo status/role rõ ràng.
- `OrdersPoolPage`
  - UI: bảng unassigned + quick assign CTA nổi bật.
  - Design: filter priority/vehicle type trực quan.
- `DispatchBoardPage`
  - UI: 3 cột `summary/unassigned/resource-board`.
  - Design: khối driver/vehicle state có legend + màu ổn định.
  - State: nếu 403 thì hiển thị “không có quyền xem” thay vì đỏ console.

### Phase 3

- `VehiclesList`
  - UI: filter + table + actions cùng pattern Trips/Drivers.
- `VehicleDetail`
  - UI: tab rõ thứ tự nghiệp vụ, docs có badge sắp hết hạn.
- `VehicleForm`
  - UX: check biển số duplicate realtime, thông báo ngắn gọn.
- `DriversList`
  - UI: thêm filter `team_id`, chips filter đang áp dụng.
- `DriverDetail`
  - UI: tab lịch làm việc tháng có matrix dễ đọc.
- `DriverForm`
  - UX: validate phone/email/license_no theo chuẩn.
- `DriverSchedulePage`
  - UI: calendar/list có state màu cho leave/maintenance/block.
  - Action: bulk generate + approve/reject rõ context.

### Phase 4

- `CustomersList`
  - UI: filter status + soft-delete hidden mặc định.
  - Table: quick actions payment/edit/view/export.
- `CustomerDetail`
  - UI: debt/revenue cards, tables lịch sử thanh toán/đối soát rõ ràng.
- `CustomerForm`
  - Form: code readonly, contract dates validation, tax/phone rules.
  - UX: duplicate check debounce + thông báo tại field.
- `CustomerPriceListPage`
  - UI: list + create item modal đồng nhất antd form/table style.

### Phase 5

- `RevenuePage`
  - UI: filter + KPI + tabs `theo chuyến/theo hóa đơn`.
  - Design: payment status tags nhất quán.
- `CostsPage`
  - UI: tổng hợp theo loại chi phí + table chi tiết.
- `ReconciliationPage`
  - UI: split-pane `sessions` + `items`.
  - Action: confirm/lock có confirm modal + disabled đúng status.
- `DebtPage`
  - UI: aging buckets + table debt + panel ghi nhận thanh toán.
- `Reports`, `ReportsPage`
  - UI: đủ 8 nhóm report, mỗi nhóm cùng panel layout.
  - Export: server-side export CTA rõ ràng, feedback thành công/thất bại.

### Phase 6

- `CategoriesPage`
  - UI: tabs CRUD đồng nhất, code + sort_order + soft-delete flow rõ.
- `UsersList`
  - UI: action menu `status/reset password/delete` chuẩn.
  - State: badge role + status dễ phân biệt.
- `UserFormDialog`
  - UI: tab `Thông tin` + `Phân quyền`.
  - Matrix: module x action dễ click/save.
- `CompanySettingsPage`
  - UI: view/edit mode rõ, status action tách riêng.
  - Validation: company code unique + audit action feedback.
- `Admin Companies`
  - UI: cùng pattern company list nhưng có nhãn super admin scope.

---

## Checklist triển khai cho mỗi màn (copy dùng trực tiếp)

```md
### [Screen Name]
- [ ] Audit UI hiện tại (spacing, hierarchy, color, typography)
- [ ] Chuẩn hóa filter bar / toolbar / page header
- [ ] Chuẩn hóa table/form/modal theo react-antd
- [ ] Bổ sung loading / empty / error state
- [ ] Kiểm tra permission-state (hide/disable/forbidden)
- [ ] Kiểm tra responsive (mobile/tablet/desktop)
- [ ] Lint + typecheck + runtime smoke
```
