# Ship ERP — Báo cáo thiết kế giao diện (Design System Report)

> Tự động trích xuất từ mã nguồn ngày 12/04/2026. Mọi giá trị đều tham chiếu trực tiếp
> tới file gốc trong repo.

---

## 1. Tổng quan kiến trúc giao diện

| Lớp | Công nghệ | Ghi chú |
|-----|-----------|---------|
| Token màu / bóng / bo góc | CSS custom properties (`:root` / `.dark`) trong [`src/index.css`](../src/index.css) | HSL components, chuyển dark mode bằng class `.dark` |
| Utility classes | [Tailwind CSS](../tailwind.config.js) + plugin `tailwindcss-animate` | Map semantic color sang `hsl(var(--token))` |
| Biến SCSS | [`src/styles/variables.scss`](../src/styles/variables.scss) | Layout, spacing, breakpoint, shadow, z-index |
| Component SCSS | [`src/styles/components.scss`](../src/styles/components.scss) | Layout shell, toolbar `.list-page-filters` |
| UI primitives (Radix) | [`src/components/ui/*`](../src/components/ui/) — 50 file | shadcn/ui: Button, Card, Input, Select, Tabs, Dialog, … |
| Ant Design | `antd` (`Select`, `Spin`, `Form`, `Table`, `ConfigProvider`) | Dùng song song với Radix cho filter, bảng, loading |
| Biểu đồ | [Recharts](../src/components/ui/chart.tsx) | `ChartContainer` + 5 chart token (`--chart-1` … `--chart-5`) |
| Phong cách | **Skeuomorphic** — gradient surface + raised shadow + pressed state | Lớp utility `.sku-*` trong `index.css` |

**Font chữ:** `Inter`, fallback hệ thống (`-apple-system, BlinkMacSystemFont, Segoe UI, Roboto, sans-serif`).

---

## 2. Bảng màu (Color Palette)

### 2.1 Semantic tokens — Light (`:root`)

| Vai trò | Token | HSL | Hex gần đúng | Dùng cho |
|---------|-------|-----|---------------|----------|
| **Primary** | `--primary` | `215 80% 48%` | `#1570c7` | Nút chính, focus ring, link, biểu đồ #1 |
| Primary foreground | `--primary-foreground` | `0 0% 100%` | `#ffffff` | Chữ trên nền primary |
| **Accent** | `--accent` | `38 90% 56%` | `#e8a317` | Điểm nhấn vàng-cam |
| **Destructive** | `--destructive` | `0 72% 51%` | `#dc2626` | Xóa, lỗi |
| **Success** | `--success` | `152 60% 42%` | `#2aad6e` | Thành công, chart #2 |
| **Warning** | `--warning` | `38 92% 50%` | `#f59e0b` | Cảnh báo |
| **Info** | `--info` | `200 80% 50%` | `#0ea5e9` | Thông báo thông tin |
| Background | `--background` | `220 20% 97%` | `#f5f6f8` | Nền app |
| Foreground | `--foreground` | `220 30% 12%` | `#171c26` | Chữ chính |
| Card | `--card` | `0 0% 100%` | `#ffffff` | Nền thẻ / popover |
| Secondary | `--secondary` | `218 18% 92%` | `#e6e9ef` | Nút phụ |
| Muted | `--muted` | `220 16% 93%` | `#ebedf1` | Nền phụ, placeholder |
| Muted foreground | `--muted-foreground` | `220 10% 50%` | `#737a86` | Chữ phụ |
| Border / Input | `--border` | `220 16% 85%` | `#d1d5db` | Viền, input |
| Ring (focus) | `--ring` | `215 80% 48%` | `#1570c7` | Focus ring = primary |

### 2.2 Dark mode (`.dark`)

| Token | HSL dark | Thay đổi so với light |
|-------|----------|----------------------|
| `--background` | `222 30% 8%` | Tối hơn |
| `--foreground` | `220 15% 90%` | Sáng hơn |
| `--card` | `222 28% 12%` | Xám tối |
| `--primary` | `215 80% 58%` | Sáng hơn 10% |
| `--border` | `222 20% 20%` | Tối hơn |
| Shadow | rgba alpha **×3** so với light | Mạnh hơn cho dark |

### 2.3 Sidebar

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar-background` | `0 0% 98%` | `240 5.9% 10%` |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `240 4.8% 95.9%` |
| `--sidebar-border` | `220 13% 91%` | `240 3.7% 15.9%` |

Tailwind config cũng có hex cố định: `sidebar.bg: #1e293b`, `sidebar.bg-dark: #0f172a`, `sidebar.text: #cbd5e1` — dùng cho gradient sidebar.

### 2.4 Chart tokens

| Token | HSL | Dùng cho |
|-------|-----|----------|
| `--chart-1` | `221 83% 53%` | Series 1 (xanh dương) |
| `--chart-2` | `152 60% 42%` | Series 2 (xanh lá) |
| `--chart-3` | `38 90% 56%` | Series 3 (vàng-cam) |
| `--chart-4` | `0 72% 51%` | Series 4 (đỏ) |
| `--chart-5` | `280 60% 55%` | Series 5 (tím) |

---

## 3. Typography

| Thành phần | Class Tailwind | Kích thước | Font weight |
|-----------|----------------|-----------|-------------|
| `h1` | `text-3xl` | 30px | **bold** (700) |
| `h2` | `text-2xl` | 24px | **semibold** (600) |
| `h3` | `text-xl` | 20px | **semibold** (600) |
| `h4` | `text-lg` | 18px | **medium** (500) |
| `h5` | `text-base` | 16px | **medium** (500) |
| `h6` | `text-sm` | 14px | **medium** (500) |
| Body | — | 16px (mobile) / 14px (`md:text-sm`) | 400 |
| `line-height` | — | `1.6` (body) | — |
| Font smoothing | `-webkit-font-smoothing: antialiased` | — | — |

---

## 4. Kích thước layout (Layout Dimensions)

Nguồn: [`variables.scss`](../src/styles/variables.scss) + [`index.css`](../src/index.css).

### 4.1 App shell

| Thành phần | Giá trị | Breakpoint |
|-----------|---------|-----------|
| **Sidebar mở rộng** | **260px** (`$sidebar-width`) | Desktop |
| Sidebar thu gọn | **70px** | Desktop |
| Sidebar mobile (drawer) | **280px** | < 1024px |
| **Header** | **48px** (`h-12`) | All; `sticky top-0 z-50` |
| Footer | **48px** | — |
| Content max-width | **1600px** (`AppLayout`, `--content-max-width`, `$content-max-width`) | — |
| Content padding | `px-4 py-4` → `md:py-6 lg:px-6` | — |
| Content gap | `gap-4` → `md:gap-6` | — |

### 4.2 Sidebar (shadcn)

Từ [`src/components/ui/sidebar.tsx`](../src/components/ui/sidebar.tsx):

| Constant | Giá trị |
|----------|---------|
| `SIDEBAR_WIDTH` | `16rem` (256px) |
| `SIDEBAR_WIDTH_MOBILE` | `18rem` (288px) |
| `SIDEBAR_WIDTH_ICON` | `3rem` (48px) |
| Collapse mode | `offcanvas` |

### 4.3 Page Header

Từ [`PageHeader.tsx`](../src/components/common/PageHeader.tsx):

| Phần | Style |
|------|-------|
| Wrapper | `mb-6 space-y-3` |
| Breadcrumb bar | `rounded-xl border px-3 py-2 backdrop-blur-sm` |
| Header card | `rounded-2xl border p-5 shadow-sm` + gradient `from-background via-background to-primary/5` |
| Title | `text-2xl font-bold md:text-3xl` |
| Description | `text-sm text-muted-foreground mt-1` |
| Actions | `flex flex-wrap gap-3 md:justify-end` |

### 4.4 CRUD list empty state & dashboard chart loading

| Pattern | Nguồn | Ghi chú |
|---------|--------|---------|
| Empty list (title + mô tả + CTA) | [`DataTable.tsx`](../src/components/table/DataTable.tsx) — props `emptyMessage`, `emptyDescription`, `emptyAction` | 19 màn `*List.tsx` trong `crudRoutes` truyền `emptyState.listDescription` (`{resource}`) + nút tạo trùng handler với `PageHeader`. |
| Copy i18n | [`vi.ts`](../src/locales/vi.ts) / [`en.ts`](../src/locales/en.ts) — `emptyState.listDescription` | Tiêu đề ngắn vẫn dùng `common.noData`. |
| Suspense fallback biểu đồ dashboard | [`DashboardChartSkeleton.tsx`](../src/components/dashboard/DashboardChartSkeleton.tsx) | `min-h-[280px]` / `h-[280px]` khớp vùng chart trong [`ChartAreaInteractive`](../src/components/chart-area-interactive.tsx). |

---

## 5. Spacing system (SCSS)

| Token | rem | px |
|-------|-----|----|
| `$spacing-xs` | 0.25 | 4 |
| `$spacing-sm` | 0.5 | 8 |
| `$spacing-md` | 1 | 16 |
| `$spacing-lg` | 1.5 | 24 |
| `$spacing-xl` | 2 | 32 |
| `$spacing-2xl` | 3 | 48 |
| `$spacing-3xl` | 4 | 64 |

---

## 6. Breakpoints

| Tên | Pixel | Dùng khi |
|-----|-------|----------|
| `sm` | 640px | Toolbar Trips chuyển sang row |
| `md` | 768px | Grid toolbar 3/4 cột, header thu nhỏ |
| `lg` | 1024px | Sidebar ẩn thành drawer mobile |
| `xl` | 1280px | — |
| `2xl` | 1536px | — |

---

## 7. Bo góc (Border Radius)

| Token | Giá trị | Dùng cho |
|-------|---------|----------|
| `--radius` (CSS) | **0.5rem** (8px) | Mặc định toàn app |
| Tailwind `rounded-lg` | `var(--radius)` | Card, Input, Button |
| Tailwind `rounded-md` | `calc(var(--radius) - 2px)` | 6px |
| Tailwind `rounded-sm` | `calc(var(--radius) - 4px)` | 4px |
| Badge | `rounded-4xl` | Tròn viên thuốc |
| PageHeader card | `rounded-2xl` | 16px |

SCSS tokens bổ sung: `$border-radius-sm` 4px → `$border-radius-full` 9999px.

---

## 8. Shadow & hiệu ứng Skeuomorphic

### 8.1 Shadow tokens

| Token | Light | Ghi chú |
|-------|-------|---------|
| `--shadow-xs` | `0 1px 2px rgba(0,0,0,0.06)` | Rất nhẹ |
| `--shadow-sm` | `0 1px 3px …, 0 1px 2px …` | Thẻ nhỏ |
| `--shadow-md` | `0 4px 6px -1px …` | Dropdown |
| `--shadow-lg` | `0 10px 15px -3px …` | Modal |
| `--shadow-xl` | `0 20px 25px -5px …` | Lớn |
| `--shadow-card` | 3 lớp + outline 1px | Card mặc định |
| `--shadow-card-hover` | Nặng hơn card | Hover card |
| `--shadow-raised` | 3 lớp + `border-bottom: 2px` | Nút raised |
| `--shadow-pressed` | `inset 0 2px 4px` | Nút nhấn |
| `--shadow-inner` | `inset 0 2px 4px` | Input |
| `--shadow-sidebar` | `2px 0 12px` | Sidebar |

### 8.2 Gradient tokens

| Token | Dùng cho |
|-------|----------|
| `--gradient-surface` | Card raised (trắng → slate nhạt) |
| `--gradient-header` | Header (trắng → f8fafc) |
| `--gradient-sidebar` | Sidebar (#1e293b → #0f172a) |
| `--gradient-btn-primary` | Nút primary (sáng → tối) |
| `--gradient-btn-secondary` | Nút secondary (trắng → f1f5f9) |

### 8.3 Lớp utility `.sku-*`

| Class | Ý nghĩa |
|-------|---------|
| `.sku-card` | `gradient-surface` + `shadow-card` → `shadow-card-hover` on hover |
| `.sku-btn` | `shadow-raised` + `border-bottom: 2px`; hover `translateY(-1px)`; active `translateY(1px)` + `shadow-pressed` |
| `.sku-btn-primary` | `gradient-btn-primary` + `border-color: hsl(215 80% 38%)` |
| `.sku-btn-secondary` | `gradient-btn-secondary` |
| `.sku-input` | `shadow-inner` + `border: 1.5px`; focus `ring 3px` |
| `.sku-table-header` | `gradient-btn-secondary` + `border-bottom: 2px` |
| `.sku-sidebar` | `gradient-sidebar` + `shadow-sidebar` |
| `.sku-header` | `gradient-header` + `shadow-sm` |
| `.sku-badge` | Raised badge + inset highlight |
| `.sku-skeleton` | Shimmer gradient animation 1.5s |
| `.sku-glass` | `backdrop-filter: blur(12px) saturate(150%)` + 80% opacity |

---

## 9. Component UI — Kích thước & Variant

### 9.1 Button (`ui/button.tsx`)

CVA-based, Radix `Slot` hỗ trợ `asChild`.

**Variants:**

| Variant | Nền | Chữ |
|---------|-----|-----|
| `default` | `bg-primary` | `text-primary-foreground` |
| `outline` | `bg-background` + `border-border` | `text-foreground` |
| `secondary` | `bg-secondary` | `text-secondary-foreground` |
| `ghost` | transparent | hover `bg-muted` |
| `destructive` | `bg-destructive/10` | `text-destructive` |
| `link` | transparent | `text-primary` + underline |

**Sizes:**

| Size | Chiều cao | Padding | Font | Icon |
|------|-----------|---------|------|------|
| `xs` | `h-6` (24px) | `px-2` | `text-xs` (12px) | 12px |
| `sm` | `h-7` (28px) | `px-2.5` | `text-[0.8rem]` (12.8px) | 14px |
| `default` | `h-8` (32px) | `px-2.5` | `text-sm` (14px) | 16px |
| `lg` | `h-9` (36px) | `px-2.5` | `text-sm` | 16px |
| `icon` | `32×32` | — | — | 16px |
| `icon-xs` | `24×24` | — | — | 12px |
| `icon-sm` | `28×28` | — | — | — |
| `icon-lg` | `36×36` | — | — | — |

Props bổ sung: `loading`, `loadingText`, `asChild`.

### 9.2 Badge (`ui/badge.tsx`)

| Thuộc tính | Giá trị |
|-----------|---------|
| Chiều cao | `h-5` (20px) |
| Font | `text-xs` (12px), `font-medium` |
| Bo góc | `rounded-4xl` (pill) |
| Padding | `px-2 py-0.5` |
| Variants | `default`, `secondary`, `destructive`, `outline`, `ghost`, `link` |

### 9.3 Card (`ui/card.tsx`)

| Size | Gap | Padding Y | Child padding X |
|------|-----|-----------|-----------------|
| `default` | `gap-4` | `py-4` | `px-4` |
| `sm` | `gap-3` | `py-3` | `px-3` |

Luôn có: `rounded-xl`, `ring-1 ring-foreground/10`, `bg-card text-card-foreground`.

Sub-components: `CardHeader`, `CardTitle`, `CardDescription`, `CardAction`, `CardContent`, `CardFooter`.

### 9.4 Input (`ui/input.tsx`)

| Thuộc tính | Giá trị |
|-----------|---------|
| Chiều cao | `h-8` (32px) |
| Bo góc | `rounded-lg` (8px) |
| Padding | `px-2.5 py-1` |
| Font | `text-base` → `md:text-sm` |
| Border | `border-input` |
| Focus | `border-ring` + `ring-3 ring-ring/50` |

### 9.5 Tabs (`ui/tabs.tsx`)

| Variant | Nền | Ghi chú |
|---------|-----|---------|
| `default` | `bg-muted` + `rounded-lg` | Tab pills |
| `line` | `bg-transparent` + `gap-1` | Tab underline |

`TabsList` height: `h-8` (horizontal). `TabsTrigger` height: `h-7`.

### 9.6 Select (Radix — `ui/select.tsx`)

| Thuộc tính | Giá trị |
|-----------|---------|
| Trigger height | `h-8` (32px) |
| Border | `border-input` |
| Bo góc | `rounded-lg` |
| Font | `text-sm` |
| Icon | chevron `size-4`, `opacity-50` |

---

## 10. Toolbar danh sách CRUD (`.list-page-filters`)

Nguồn: [`components.scss`](../src/styles/components.scss) dòng 171–329 + [`ListPageFilters.tsx`](../src/components/common/ListPageFilters.tsx).

### 10.1 Kích thước thống nhất cho hàng filter

| Phần tử | Chiều cao | Font | Width |
|---------|-----------|------|-------|
| Search input | **40px** | **14px** | Tự co giãn theo grid |
| Ant `Select` | **40px** | **14px** | `clamp(180px, 100%, 240px)` |
| Radix `SelectTrigger` | **40px** | **14px** | `clamp(180px, 100%, 240px)` |
| Nút **Tìm** | **40px** | **14px**, weight 500 | `clamp(140px, 100%, 160px)` |
| Nút **Đặt lại** | **40px** | **14px** | `clamp(100px, 100%, 120px)` |
| Gap | **12px** | — | — |

### 10.2 Modifier layout

| Modifier SCSS | Kiểu | Cột ≥ md/sm | Dùng cho |
|--------------|------|-------------|----------|
| `--grid-4` | CSS Grid | Search `3fr` + Select `240px` + 2 nút `max-content` | Companies, Offices, Departments, Employees, Vehicles, Drivers, Customers, Invoices, Users |
| `--grid-3` | CSS Grid | Search `1fr` + 2 nút `max-content` | Positions, Roles |
| `--dual-entity` | Flexbox | 2 Select trái (≥ 640px) + nút phải | Trips |

Sub-classes BEM:

| Class | Vai trò |
|-------|---------|
| `__search` | Wrapper SearchField (flex, gap 0.5rem) |
| `__select` | Ant `Select` root |
| `__radix-select` | Radix `SelectTrigger` |
| `__btn-search` | Nút Tìm |
| `__btn-reset` | Nút Đặt lại |
| `__select-row` | Lưới 2 cột select (Trips) |
| `__btn-row` | Flex row nút (Trips) |

### 10.3 Compound component `ListPageFilters`

```tsx
<ListPageFilters variant="grid-4">
  <ListPageFilters.Search placeholder="..." value={keyword} onChange={setKeyword} />
  {/* Filter giữa: Ant Select / Radix Select */}
  <ListPageFilters.Actions onSearch={fn} onReset={fn} busy={isFetching && !isLoading} />
</ListPageFilters>
```

---

## 11. Bảng dữ liệu (Data Table)

### 11.1 DataTable (Radix-style — `DataTable.tsx`)

| Phần | Style |
|------|-------|
| Wrapper | `rounded-2xl border bg-card shadow-sm overflow-x-auto` |
| `<thead>` | `.sku-table-header` + sticky + `backdrop-blur`, `text-[11px] font-semibold uppercase tracking-wider` |
| `<th>` | `px-6 py-3.5` |
| `<td>` | `px-6 py-4 text-sm whitespace-nowrap` |
| Row hover | `hover:bg-primary/5` |
| Even rows | `even:bg-muted/30` |
| Empty | `py-12 text-center text-muted-foreground` |

### 11.2 BaseTable (Ant Design — `BaseTable.tsx`)

Dùng Ant `Table` + `.professional-ant-table`:

| Phần | Style |
|------|-------|
| Wrapper | `rounded-[0.5rem] overflow-hidden` |
| Header bg | `hsl(--muted / 0.45)`, font `600`, `letter-spacing: 0.01em` |
| Cell padding | `12px` top/bottom |
| Hover | `hsl(--accent / 0.35)` + inset border-top |
| Selected | `hsl(--primary / 0.08)` |
| Transition | `background 0.2s, box-shadow 0.2s` |
| Dark header | `hsl(--muted / 0.55)` |

---

## 12. Dialog / Form

### 12.1 DeleteConfirmDialog

Radix `AlertDialog`; nút confirm: `bg-destructive text-destructive-foreground`; loading có `Loader2 animate-spin`.

### 12.2 FormItemSelect (Ant Design)

Ant `Form.Item` + `Select`; defaults: `allowClear`, `showSearch`, `optionFilterProp: 'label'`.

Size: `'small' | 'middle' | 'large'` (Ant native).

### 12.3 FilterBar (Ant Design standalone)

Ant `ConfigProvider` theme: primary `#4f46e5`, `controlHeight: 40`, `borderRadius: 6`, `fontSize: 14`.

Keyword input: `width: 280px`; Status select: `width: 180px`; Submit button: `minWidth: 120px, height: 40`.

---

## 13. Các component chung (Common)

| Component | File | Mô tả |
|-----------|------|-------|
| `PageHeader` | [`PageHeader.tsx`](../src/components/common/PageHeader.tsx) | Breadcrumb + title + description + actions |
| `PageLoadingOverlay` | [`PageLoadingOverlay.tsx`](../src/components/common/PageLoadingOverlay.tsx) | Overlay blur + Ant Spin 32px; children dim 40%; `min-h-[280px]` |
| `ErrorState` | [`ErrorState.tsx`](../src/components/common/ErrorState.tsx) | Icon destructive 64px + title + description + retry button |
| `SearchField` | [`SearchField.tsx`](../src/components/common/SearchField.tsx) | Lucide Search icon + Input; class `list-page-filters__search` |
| `ListPageFilters` | [`ListPageFilters.tsx`](../src/components/common/ListPageFilters.tsx) | Compound: Root (variant) + Search + Actions |
| `DeleteConfirmDialog` | [`DeleteConfirmDialog.tsx`](../src/components/common/DeleteConfirmDialog.tsx) | Radix AlertDialog, destructive confirm |
| `FloatingChatAssistant` | [`FloatingChatAssistant.tsx`](../src/components/common/FloatingChatAssistant.tsx) | FAB 56×56px, draggable, edge gap 8px |
| `NotificationPopup` | [`NotificationPopup.tsx`](../src/components/common/NotificationPopup.tsx) | DropdownMenu + Tabs (all/activity/system/user) |
| `AppLoadingSpin` | [`AppLoadingSpin.tsx`](../src/components/common/AppLoadingSpin.tsx) | Spinner toàn trang / outlet |

---

## 14. Z-index layers

| Tên | Giá trị | Dùng cho |
|-----|---------|----------|
| `$z-dropdown` | 10 | Dropdown menu |
| `$z-sticky` | 20 | Header SCSS |
| `$z-fixed` | 30 | Sidebar SCSS |
| `$z-modal-backdrop` | 40 | Backdrop |
| `$z-modal` | 50 | Modal / dialog |
| `$z-popover` | 60 | Popover |
| `$z-tooltip` | 70 | Tooltip |
| Header Tailwind | `z-50` | `site-header.tsx` |

---

## 15. Transition & Animation

| Token SCSS | Giá trị |
|-----------|---------|
| `$transition-fast` | **150ms** |
| `$transition-base` | **200ms** |
| `$transition-slow` | **300ms** |
| `$transition-ease` | `cubic-bezier(0.4, 0, 0.2, 1)` |

Animation: `shimmer` keyframe (skeleton) 1.5s infinite; sidebar/nav chevron `duration-300 ease-out`.

---

## 16. Scrollbar tuỳ chỉnh

```
width/height: 8px
track: hsl(--muted), border-radius 4px
thumb: hsl(--muted-foreground / 0.3), hover 0.5
```

---

## 17. Routing & Trang

| Loại | Số lượng | Chi tiết |
|------|---------|----------|
| CRUD resources | **19** | 4 route mỗi resource (list / create / show / edit) = 76 route |
| Single routes | **6** | Reports, Notifications, Profile, Settings, Billing, Driver Schedule |
| Auth routes | **2** | Login, Register |
| Tổng page files | **68** | `src/pages/**/*.tsx` |

---

## 18. Tóm tắt quy ước thiết kế

1. **Màu semantic:** dùng HSL custom properties → Tailwind map → dễ theme light/dark.
2. **Chiều sâu:** skeuomorphic gradient + shadow tạo phân tầng (card → raised button → pressed).
3. **Toolbar filter:** 40px / 14px chuẩn hoá; 3 layout modifier (grid-4, grid-3, dual-entity); compound `ListPageFilters` giảm lặp.
4. **Bảng:** DataTable (Radix) cho list CRUD + BaseTable (Ant) cho dữ liệu phức tạp.
5. **Font:** Inter, scale heading rõ ràng; body 14px trên desktop.
6. **Responsive:** breakpoint sm/md/lg khớp Tailwind; sidebar collapse thành drawer < 1024px.
7. **Ant + Radix song song:** Ant cho Select filter + Spin + Form; Radix/shadcn cho Button/Card/Input/Dialog/Tabs.
