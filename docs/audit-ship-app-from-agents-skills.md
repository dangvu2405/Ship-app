# Rà soát màn hình — ship-app-from-agents-skills

Tài liệu được tạo khi thực hiện kế hoạch rà soát (Refine + Ant Design + Vercel skill có chọn lọc). **Không sửa** file kế hoạch `.cursor/plans/`.

---

## 1. Ma trận route (nguồn: `src/routes/appRouteConfig.tsx`, `src/routes/index.ts`)

### AppPages (không trong `crudRoutes`)

| Key | Path | Component file | `requiredRole` |
|-----|------|------------------|----------------|
| LoginForm | `/login` | `src/pages/auth/login-form.tsx` | — |
| RegisterForm | `/register` | `src/pages/auth/register-form.tsx` | — |
| Dashboard | `/dashboard` | `src/pages/dashboard/dashboard` | — |
| NotFound | `*` | `src/pages/404.tsx` | — |

### CRUD (19 resource trong `crudRoutes`: list + create/show/edit — `List` + `Form` cùng route cho create/show/edit)

| key | list path | List module | Form module | admin only |
|-----|-----------|-------------|-------------|------------|
| companies | `/admin/companies` | `pages/companies/CompaniesList` | `CompanyFormDialog` | no |
| offices | `/admin/offices` | `OfficesList` | `OfficeFormDialog` | no |
| departments | `/admin/departments` | `DepartmentsList` | `DepartmentFormDialog` | no |
| positions | `/admin/positions` | `PositionsList` | `PositionFormDialog` | no |
| employees | `/admin/employees` | `EmployeesList` | `EmployeeFormDialog` | **yes** |
| vehicles | `/admin/vehicles` | `VehiclesList` | `VehicleFormDialog` | **yes** |
| trips | `/admin/trips` | `TripsList` | `TripFormDialog` | **yes** |
| trip_bonus_rules | `/admin/trip_bonus_rules` | `TripBonusRulesList` | `TripBonusRuleFormDialog` | **yes** |
| customers | `/admin/customers` | `CustomersList` | `CustomerFormDialog` | no |
| drivers | `/admin/drivers` | `DriversList` | `DriverFormDialog` | **yes** |
| invoices | `/admin/invoices` | `InvoicesList` | `InvoiceFormDialog` | no |
| vehicle_assignments | `/admin/vehicle_assignments` | `VehicleAssignmentsList` | `VehicleAssignmentFormDialog` | no |
| vehicle_expenses | `/admin/vehicle_expenses` | `VehicleExpensesList` | `VehicleExpenseFormDialog` | no |
| allowances | `/admin/allowances` | `AllowancesList` | `AllowanceFormDialog` | no |
| deductions | `/admin/deductions` | `DeductionsList` | `DeductionFormDialog` | no |
| attendances | `/admin/attendances` | `AttendancesList` | `AttendanceFormDialog` | no |
| payrolls | `/admin/payrolls` | `PayrollsList` | `PayrollFormDialog` | no |
| users | `/admin/users` | `UsersList` | `UserFormDialog` | **yes** |
| roles | `/admin/roles` | `RolesList` | `RoleFormDialog` | **yes** |

### Single routes

| key | path | Component | admin only | Ghi chú |
|-----|------|-----------|------------|---------|
| reports | `/admin/reports` | `pages/reports/Reports` | no | — |
| notifications | `/admin/notifications` | `pages/system/Notifications` | no | — |
| profile | `/admin/profile` | `pages/system/Profile` | no | — |
| settings | `/admin/settings` | `pages/system/Settings` | no | — |
| billing | `/admin/billing` | `pages/system/Billing.tsx` | no | Placeholder + i18n `billing.*`; link menu từ [`nav-user.tsx`](src/components/nav-user.tsx); lazy trong [`appRouteConfig.tsx`](src/routes/appRouteConfig.tsx) (`singleRoutes`). |
| drivers_schedule | `/admin/drivers/schedule` | `pages/drivers/DriverSchedulePage` | **yes** | — |

---

## 2. Quét tự động (lệnh & kết quả)

| Kiểm tra | Kết quả |
|-----------|---------|
| `npx tsc --noEmit` | **Pass** (exit 0) |
| `npm run lint` | **Pass** (đợt rà soát lại: `tsc` + `eslint --max-warnings 0`) |

### Checklist đợt rà soát “tất cả màn” (logic)

- [x] Ma trận route: AppPages + **19** CRUD resource (mỗi resource list + form dialog) + **6** single route trong `singleRoutes` (đã gồm `billing`).
- [x] `requiredRole: 'admin'` khớp `crudRoutes` / `singleRoutes` với bảng mục 1.
- [x] Ma trận list: toolbar `.list-page-filters` vs chỉ `PageLoadingOverlay` (mục 5).
- [x] Toolbar đặc biệt: Trips (`--dual-entity-select`), Positions/Roles (`--search-and-actions`) ghi trong mục 5 và spot-check mục 3.
- [x] Đồng bộ TODO đợt rà soát: toàn bộ hạng mục “rà soát CRUD” coi là **hoàn thành**; số resource trong mã là **19** (khớp `crudRoutes`, không dùng con số 21 trong tài liệu này).

### `addEventListener` / cleanup (`client-*`)

| File | Ghi chú |
|------|---------|
| `FloatingChatAssistant.tsx` | `resize` / `pointermove` / `pointerup` — có `removeEventListener` trong cleanup. |
| `sidebar.tsx` | `keydown` — có cleanup. |
| `use-mobile.tsx` | `matchMedia('change')` — có `removeEventListener`. |
| `chart-area-interactive.tsx` | `mq.addEventListener('change')` — có `removeEventListener` trong cleanup `useEffect`. |

### Conditional render (`rendering-conditional-render`)

- Trong `src/pages/**/*.tsx`, các mẫu `{formOpen && (` / `{!isEdit && (` / `{testAccounts.length > 0 && (` / `{record.status === '…' && (` — toán hạng là **boolean** hoặc **length > 0**, không có rủi ro render số `0` như rule cảnh báo.
- Không thấy `{numericId && <Component/>}` kiểu nguy hiểm trong grep mẫu nhanh.

### Bundle / lazy (`bundle-*`)

- CRUD và single pages: **`lazyWithMinDelay`** trong [`appRouteConfig.tsx`](src/routes/appRouteConfig.tsx).
- `Dashboard`: chart tách `lazyWithMinDelay` — tốt.

### Async / data (`async-*`)

- `Dashboard`: nhiều `useList` / hooks độc lập ở top-level — React Query / Refine chạy song song hợp lý.
- `src/services`: không thấy chuỗi `await` dài dòng đáng gộp trong grep nhanh; các hàm auth một `await` — ổn.

### Persist / localStorage (`client-*`)

- `app.store.ts`: `name: 'app-storage:v1'`, `createSafeStorage()`.
- `auth.store.ts`: `name: 'auth-storage:v1'`.
- Có **version trong tên storage** — phù hợp hướng dẫn “schema / tối thiểu”.

---

## 3. Spot-check theo nhóm nghiệp vụ

| Nhóm | Quan sát |
|------|-----------|
| **Org / HR** | `CompaniesList`, `OfficesList`, `EmployeesList`: pattern `list-page-filters`, `PageLoadingOverlay`, `DataTable` đồng bộ hướng đã chuẩn hóa trước đó. |
| **Fleet / trips** | `TripsList`: shell Radix/shadcn + filter Ant `list-page-filters--dual-entity-select` (cặp Select trái, nút Tìm/Đặt lại phải từ `sm`; mục **5**). `DriversList` / `VehiclesList`: Search + Radix Select + nút. |
| **Filter toolbar** | Ma trận đầy đủ theo resource: mục **5** (`.list-page-filters` có/không, Ant vs Radix, modifier). |
| **Billing / time** | `InvoicesList`, `PayrollsList`, `AttendancesList`: cùng pattern dialog `formOpen &&`. |
| **System / auth** | `App.tsx`: `Dashboard` dùng `suspensePage(<AppPages.Dashboard />)` giống các trang lazy khác. |

---

## 4. Backlog P0 / P1 / P2 (trạng thái sau chỉnh sửa code)

### Đã xử lý

| ID | Cách xử lý |
|----|------------|
| **P0-1** | Thêm [`Billing.tsx`](src/pages/system/Billing.tsx), `singleRoutes` + lazy trong [`appRouteConfig.tsx`](src/routes/appRouteConfig.tsx); i18n `billing.*` trong [`en.ts`](src/locales/en.ts) / [`vi.ts`](src/locales/vi.ts). |
| **P1-1** | Tách [`professionalAntTableData.ts`](src/components/table/professionalAntTableData.ts) + [`professionalAntTableTypes.ts`](src/components/table/professionalAntTableTypes.ts); [`ProfessionalAntTable.tsx`](src/components/table/ProfessionalAntTable.tsx) chỉ export component; [`index.ts`](src/components/table/index.ts) re-export dữ liệu/types. |
| **P1-2** | Giữ `ComponentType<any>` với `eslint-disable-next-line @typescript-eslint/no-explicit-any` và ghi chú: bound chặt hơn làm vỡ inference cho chunk có props (vd. `ChartAreaInteractive` trên Dashboard). |
| **P2-3** | [`App.tsx`](src/App.tsx): `element={suspensePage(<AppPages.Dashboard />)}`. |

### Còn lại (tùy ưu tiên sau)

| ID | Vấn đề | Ghi chú |
|----|--------|--------|
| P2-1 | **`columns` mảng inline** trong nhiều `*List.tsx` | `rerender-*` — chỉ tối ưu khi đo lag. |
| P2-2 | **Dialog + boolean** lặp lại | `composition` — tách hook khi refactor có chủ đích. |

### Web-design-guidelines (tùy chọn)

- Chưa chạy checklist đầy đủ từ [`.agents/skills/web-design-guidelines/`](.agents/skills/web-design-guidelines/) (theo `.mdc` chỉ bắt buộc khi user yêu cầu review UI/a11y sâu). Có thể thêm vòng 2: focus trap dialog, contrast, keyboard table.

---

## 5. Ma trận CRUD list: toolbar vs `PageLoadingOverlay`

Nguồn: grep `*List.tsx` trong `src/pages` (19 resource trong [`crudRoutes`](src/routes/appRouteConfig.tsx)).

| Resource / List | `.list-page-filters` | Layout (filter / shell) | SCSS modifier |
|-----------------|----------------------|-------------------------|---------------|
| companies | Có | Search + Ant Select + nút | `--grid-4` |
| offices | Có | Search + Ant Select công ty + nút | `--grid-4` |
| departments | Có | Search + Ant Select văn phòng + nút | `--grid-4` |
| positions | Có | Search + nút (không Select) | `--grid-3` |
| employees | Có | Search + Radix Select + nút | `--grid-4` |
| vehicles | Có | Search + Radix Select + nút | `--grid-4` |
| trips | Có | 2× Ant Select + nút (không Search) | `--dual-entity` + `__select-row` / `__btn-row` |
| trip_bonus_rules | Không | Chỉ bảng + `PageLoadingOverlay` | — |
| customers | Có | Search + Ant Select + nút | `--grid-4` |
| drivers | Có | Search + Ant Select + nút | `--grid-4` |
| invoices | Có | Search + Ant Select + nút | `--grid-4` |
| vehicle_assignments | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| vehicle_expenses | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| allowances | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| deductions | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| attendances | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| payrolls | Không | Chỉ `PageLoadingOverlay` + bảng | — |
| users | Có | Search + Ant Select + nút | `--grid-4` |
| roles | Có | Search + nút (không Select) | `--grid-3` |

**Nhận xét:** Mọi list đều có `PageLoadingOverlay` khi tải bảng. Layout modifier (`--grid-4`, `--grid-3`, `--dual-entity`) thay thế chuỗi Tailwind `grid grid-cols-1 gap-3 md:grid-cols-*` trước đó, định nghĩa trong [`components.scss`](src/styles/components.scss).

### Backlog: toolbar search cho 7 list chưa có

Các resource sau chưa có toolbar filter. Bổ sung `SearchField` + `keyword` khi xác nhận Laravel controller hỗ trợ query param `keyword`:

- `trip_bonus_rules`
- `vehicle_assignments`
- `vehicle_expenses`
- `allowances`
- `deductions`
- `attendances`
- `payrolls`

---

## 5.1. UX đồng bộ (empty list + layout)

- **Content max-width:** `1600px` thống nhất (`--content-max-width`, `$content-max-width`, `AppLayout`).
- **Empty CRUD:** `DataTable` + `emptyState.listDescription` + CTA tạo trên 19 list; `FilterBar` lấy màu Ant từ token CSS (`--primary`, …).
- **Dashboard:** `Suspense` cho chart dùng `DashboardChartSkeleton` thay spin toàn khối.

## 6. Rule id Vercel (tham chiếu)

| Backlog | Ánh xạ tới nhóm rule (xem `.agents/skills/vercel-react-best-practices/rules/`) |
|---------|--------------------------------------------------------------------------------|
| P1-1 | `bundle-*` / tooling — `react-refresh` |
| P1-2 | `js-*` — kiểu TypeScript chặt |
| P2-1 | `rerender-*` |
| P2-2 | `architecture-*` / `patterns-*` (composition) |
| P0-1 | Ngoài skill — đúng stack route React Router |
| Conditional / listeners / persist | `rendering-conditional-render`, `client-*` |
