# Tài liệu cải thiện UI bằng component mới

## 1) Mục tiêu
Chuẩn hóa toàn bộ giao diện theo cùng một hệ component mới để:
- Đồng nhất trải nghiệm giữa các màn.
- Tăng tốc phát triển tính năng mới.
- Giảm duplicate UI code.
- Dễ bảo trì khi thay đổi style/theme.

---

## 2) Bộ component chuẩn cần ưu tiên dùng
Nguồn chính trong dự án:
- `src/components/ui/*` (Card, Tabs, Badge, Dialog, Alert, Popover, Select, Table, ...)
- `src/components/common/*` (PageHeader, SearchField, ErrorState, TableSkeleton, ...)
- `src/components/table/DataTable.tsx`

### Mapping thay thế nhanh
- Input tìm kiếm cũ → `SearchField`
- Khối filter/list cũ (`div bg-card`) → `Card` + `CardContent`
- Trạng thái text màu thủ công → `Badge`
- Nút tab filter thủ công → `Tabs` + `TabsList` + `TabsTrigger`
- Popup create/edit/show → `Dialog` + `DialogContent` + `DialogFooter`
- Bảng tự viết theo màn → `DataTable` dùng chung

---

## 3) Chuẩn layout cho mọi màn List
Mỗi màn list nên theo đúng khung sau:
1. `PageHeader` (title, description, breadcrumb, action create)
2. `Card` chứa:
   - (tuỳ chọn) `Tabs` cho quick filter
   - filter area (SearchField + Select + nút Search/Reset)
   - body: `TableSkeleton` | `ErrorState` | `DataTable`
3. `DeleteConfirmDialog`

### Quy ước filter
- Tách `selected*` và `applied*` state.
- Chỉ call API theo `applied*`.
- Reset filter luôn set lại page = 1.

---

## 4) Chuẩn popup Create/Edit/Show (không chuyển trang)
Đã áp dụng route dạng overlay, cần giữ chuẩn này:
- Route CRUD create/edit/show vẫn có URL riêng.
- UI render `List + FormDialog` cùng lúc.
- Dialog đóng bằng `list(resource)` để quay lại list route.

### Cấu trúc popup khuyến nghị
- Header: title + description rõ ngữ cảnh.
- Body: form + helper alert ngắn (nếu cần).
- Footer: Back + Submit (ẩn Submit ở show mode).
- `validateTrigger`: ưu tiên `["onBlur", "onSubmit"]`.

---

## 5) Chuẩn select data + call API
Áp dụng cho mọi form/list có dropdown:
- Luôn dùng `showSearch` khi danh sách > 10 item.
- Thêm `selectProps={{ optionFilterProp: 'label' }}`.
- Query option data nên có `sorters` ổn định.
- Nếu dữ liệu nghiệp vụ yêu cầu, thêm `filters` (vd: `status=active`).
- Dùng đúng resource backend (ví dụ driver select nên gọi `drivers`, không gọi `employees` sai ngữ nghĩa).

---

## 6) Danh sách component mới nên khai thác thêm
Để tăng chất lượng UX theo màn nghiệp vụ:
- `Alert`: guidance block trong form phức tạp.
- `Popover` / `HoverCard`: hiển thị thông tin phụ.
- `Command`: quick search command palette (màn lớn).
- `ScrollArea`: danh sách dài trong popup.
- `Accordion` / `Collapsible`: chia nhóm trường form.
- `RadioGroup` / `Slider` / `Calendar`: input nâng cao.

---

## 7) Kế hoạch rollout đề xuất (theo batch)
### Batch 1 (ưu tiên cao)
- Các màn master-data còn lại chưa đồng bộ pattern list/popup.
- Chuẩn hóa toàn bộ search về `SearchField`.

### Batch 2
- Chuẩn hóa toàn bộ popup form theo cùng template.
- Bổ sung `Alert` guidance cho các form nhiều quan hệ.

### Batch 3
- Nâng trải nghiệm filter nâng cao: tabs, badge status, quick actions.
- Tối ưu loading/error/empty state đồng nhất.

### Batch 4
- Polish UI: spacing, responsive, dark-mode contrast, icon consistency.

---

## 8) Checklist review cho mỗi màn
- [ ] Có `PageHeader` đúng chuẩn.
- [ ] Có `Card` bọc toàn bộ vùng filter/table.
- [ ] Search dùng `SearchField`.
- [ ] Status hiển thị bằng `Badge`.
- [ ] Bảng dùng `DataTable` shared.
- [ ] Create/Edit/Show mở popup, không rời context list.
- [ ] Select dùng `showSearch` + `optionFilterProp: 'label'`.
- [ ] Query option data có `sorters/filters` hợp lý.
- [ ] `npm run lint` pass.
- [ ] `npm run build` pass.

---

## 9) Tiêu chí hoàn tất
Hoàn tất khi:
1. 100% màn CRUD dùng chung pattern list + popup.
2. 100% search input dùng component `SearchField`.
3. 100% dropdown lớn có search/filter đúng chuẩn.
4. Không còn cảnh UI khác chuẩn giữa các module.

---

## 10) Gợi ý vận hành
- Mỗi PR chỉ xử lý 2–4 màn để dễ review.
- Mỗi batch phải chạy lint/build trước khi push.
- Giữ commit message theo nhóm thay đổi (ui, form, routing, select-api).
