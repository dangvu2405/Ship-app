# 📋 BÁO CÁO SCAN FRONTEND TOÀN DỰ ÁN (REFRESH)

**Dự án**: ship-app  
**Ngày scan**: 12/05/2026  
**Stack phát hiện**: React 18 · Vite · Refine · Ant Design v5 · TanStack Query v5 · Zustand · TypeScript · Recharts · TailwindCSS  
**Ground truth (file + dòng)**: `context-frontend.txt` (generated từ `src/` với line numbers)  
**Tổng file scan**: 385 file trong `src/` (theo `context-frontend.txt`)

---

## 📊 TỔNG QUAN

| Hạng mục | Vấn đề tìm thấy | Critical 🔴 | High 🟠 | Medium 🟡 | Low 🟢 |
|----------|----------------|-------------|---------|-----------|--------|
| [A] State Management | 2 | 0 | 1 | 1 | 0 |
| [B] Component Design | 4 | 0 | 1 | 3 | 0 |
| [C] Data Fetching | 5 | 2 | 1 | 2 | 0 |
| [D] UI / UX | 4 | 0 | 1 | 2 | 1 |
| [E] Performance | 3 | 0 | 0 | 3 | 0 |
| [F] Bảo mật | 4 | 0 | 2 | 2 | 0 |
| [G] Code Quality | 6 | 0 | 0 | 2 | 4 |
| **TỔNG** | **28** | **2** | **7** | **15** | **5** |

**Điểm sức khoẻ dự án**: **10/100**  
> Cách tính: 100 - (Critical×10) - (High×5) - (Medium×2) - (Low×1)  
> = 100 - 20 - 35 - 30 - 5 = **10** → làm tròn theo “tối thiểu 0”: **10/100**.  
> (Lưu ý: score thấp vì nhiều issue thuộc security + error-handling; ưu tiên xử lý nhóm Critical/High sẽ cải thiện mạnh.)

---

## 🔴 CRITICAL — Phải sửa ngay trước khi deploy

### [C-001] Hook report nuốt lỗi → UI tưởng “success” nhưng data = null
**Hạng mục**: [C/G] Data Fetching/Error handling · **Điểm KT**: [C-02], [G-03], [A-03]  
**File**: `src/hooks/useReports.ts` · **Dòng**: 17–37

**Vấn đề**:  
`queryFn` bắt mọi lỗi và `return null`, khiến TanStack Query coi request là **success**. UI không có `isError`, retry không đúng nghĩa, và người dùng không được thông báo lỗi.

**Fix**:
```tsx
// Trước (BAD)
queryFn: async () => {
  try {
    const data = (await fetchers[type](filter)) as T | null;
    return data ?? null;
  } catch {
    return null;
  }
},

// Sau (GOOD): để error bubble lên react-query, UI dùng isError + error
queryFn: async () => {
  const data = (await fetchers[type](filter)) as T | null;
  return data ?? null;
},
```

---

### [C-002] DataProvider che lỗi 403/404 thành empty list (mất tín hiệu lỗi quyền/missing endpoint)
**Hạng mục**: [C/F/G] Data Fetching/Security/Error handling · **Điểm KT**: [C-02], [F-03], [G-03]  
**File**: `src/providers/dataProvider.tsx` · **Dòng**: 166–205

**Vấn đề**:  
Các resource “unavailable” (403/404/… tuỳ `isUnavailableStatus`) bị đưa vào cache runtime và trả `{ data: [], total: 0 }`. UI sẽ hiển thị “không có dữ liệu” thay vì **lỗi quyền**, **lỗi backend chưa có endpoint**, hoặc **lỗi cấu hình resource**.

**Fix**:
```tsx
// Trước (BAD)
if (RUNTIME_UNAVAILABLE_LIST_RESOURCES.has(resource)) {
  return { data: [] as unknown as TData[], total: 0 };
}

// Sau (GOOD): chỉ “silence” trường hợp thật sự not-implemented (allowlist),
// còn 403 phải throw để route-level error/permission UI hiển thị đúng.
if (NOT_IMPLEMENTED_RESOURCES.has(resource)) {
  return { data: [] as unknown as TData[], total: 0 };
}

if (status === 403) {
  throw new Error(`Forbidden resource "${resource}"`);
}
if (status === 404) {
  throw new Error(`Missing endpoint for resource "${resource}"`);
}
```

---

## 🟠 HIGH — Nên sửa trong sprint này

### [H-001] Persist auth/user/tenant vào storage (authority sai tầng + rủi ro stale/tamper)
**Hạng mục**: [F/A] Bảo mật/State · **Điểm KT**: [F-01], [A-01]  
**File**: `src/stores/auth.store.ts` · **Dòng**: 64–182  
**File**: `src/lib/auth-session.ts` · **Dòng**: 30–49

**Vấn đề**:  
`persist(...partialize)` lưu `user`, `isAuthenticated`, `currentTenantId`; đồng thời tenant được set/get từ `localStorage`. Với mô hình HttpOnly cookie, các giá trị này **không nên là nguồn sự thật** (dễ stale hoặc bị chỉnh trong client). UI/route guard có thể ra quyết định dựa trên state sai.

**Fix**:
```tsx
// Trước (BAD)
partialize: (state) => ({
  user: state.user,
  isAuthenticated: state.isAuthenticated,
  currentTenantId: state.currentTenantId,
}),

// Sau (GOOD): không persist user/auth; chỉ persist tenantId nếu thật sự cần
partialize: (state) => ({
  currentTenantId: state.currentTenantId,
}),
// Khi app boot: hydrate từ /me (đã có checkAuth)
```

---

### [H-002] CSS injection risk qua `dangerouslySetInnerHTML` (ChartStyle)
**Hạng mục**: [F] Bảo mật · **Điểm KT**: [F-02]  
**File**: `src/components/ui/chart.tsx` · **Dòng**: 84–114

**Vấn đề**:  
`ChartStyle` inject `<style>` bằng `dangerouslySetInnerHTML`, và `${color}` được nối thẳng vào CSS variable. Nếu `config` có thể bị ảnh hưởng bởi input không tin cậy, có thể dẫn tới CSS injection (ít nghiêm trọng hơn JS XSS, nhưng vẫn là attack surface).

**Fix**:
```tsx
// Trước (BAD)
return color ? `  --color-${key}: ${color};` : null

// Sau (GOOD): validate màu (hex/rgb/hsl/var()) trước khi inject
const isSafeColor = (v: string) =>
  /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(v) ||
  /^rgb(a)?\\(/.test(v) ||
  /^hsl(a)?\\(/.test(v) ||
  /^var\\(--[a-zA-Z0-9-_]+\\)$/.test(v)

return color && isSafeColor(color) ? `  --color-${key}: ${color};` : null
```

---

### [H-003] Inline `!important`/hardcode style phá token system AntD v5
**Hạng mục**: [D] UI/UX Consistency · **Điểm KT**: [D-01]  
**File**: `src/styles/components.scss` · **Dòng**: 203–270, 392–403  
**File**: `src/assets/styles/_components.scss` · **Dòng**: 177–218  
**File**: `src/pages/auth/tenant-selector.tsx` · **Dòng**: 164

**Vấn đề**:  
Override bằng `!important` và hardcode màu/box-shadow làm UI khó maintain, dễ lệch theme/dark mode, và gây “đánh nhau” với AntD token.

**Fix** (hướng):  
- Dùng AntD theme token (`ConfigProvider theme.token`) hoặc component token thay vì `!important`.  
- Với style inline (ví dụ box-shadow), chuyển sang class + token hoá hoặc dùng `theme.useToken()`.

---

### [H-004] `as any`/cast dày ở workforce + trips → dễ runtime mismatch
**Hạng mục**: [G] TypeScript · **Điểm KT**: [G-01]  
**File**: `src/pages/system/workforce-ops/tabs/Workforce*Tab.tsx` · (nhiều chỗ)  
**File**: `src/pages/trips/components/TripRouteStep.tsx` · **Dòng**: 69–70, 196–197, 218–219, 235–236  
**File**: `src/stores/auth.store.ts` · **Dòng**: 79–103

**Vấn đề**:  
Cast `as any` làm mất type-safety ở chỗ “đầu vào” (select props, row render, payload shape), rất dễ ẩn bug khi backend đổi schema.

**Fix**:
```tsx
// Trước (BAD)
options={driverSelectProps.options as any}
{...(driverSelectProps as any)}

// Sau (GOOD): chuẩn hoá generic type cho FormItemSelect + option type
type SelectOption = { label: string; value: number };
// ...driverSelectProps: UseSelectReturnType<SelectOption, ...>
options={driverSelectProps.options}
```

---

## 🟡 MEDIUM — Lên backlog xử lý

| # | Vấn đề | File | Dòng | Điểm KT | Gợi ý fix ngắn |
|---|--------|------|------|---------|----------------|
| 1 | `useQuery` key dùng object `filter` → dễ cache miss nếu caller tạo object literal mỗi render | `src/hooks/useReports.ts` | 17–30 | C-01 | Memoize `filter` ở caller hoặc serialize key ổn định |
| 2 | Fallback `rowKey` về index (list có reorder/add/remove) | `src/components/table/index.tsx` | 56–63 | A-05 | Bắt buộc `id` hoặc nhận prop `getRowKey` |
| 3 | Page/component quá lớn, nhiều responsibility | `src/pages/dispatch/DispatchBoardPage.tsx` | 1–575 | B-01 | Tách hook state + subcomponents |
| 4 | Page/component quá lớn, nhiều responsibility | `src/pages/reports/Reports.tsx` | 1–621 | B-01 | Tách chart/card/filter logic |
| 5 | Page/component quá lớn, nhiều responsibility | `src/components/common/AuthLogsAndSessionManagement.tsx` | 1–512 | B-01 | Tách query/pagination + table view |
| 6 | Hook/page quá lớn, nhiều responsibility | `src/pages/drivers/use-driver-schedule-page.tsx` | 1–610 | B-01 | Split logic theo feature slice |
| 7 | `console.*` trong production path (noise + lộ info) | `src/providers/dataProvider.tsx`, `src/utils/authPermissions.ts`, … | (nhiều) | G-02 | Gate bằng `import.meta.env.DEV` hoặc logger |
| 8 | `dangerouslySetInnerHTML` (MessageRenderer) cần đảm bảo mọi đường vào đều sanitize | `src/components/common/chat/MessageRenderer.tsx` | 145 | F-02 | Audit: chỉ render sanitized HTML, enforce type guard |
| 9 | Các utility SCSS tạo class `!important` (utilities.scss) dễ phá layout AntD/Tailwind | `src/styles/utilities.scss` | 23–27 | D-01 | Giới hạn scope/đổi strategy (Tailwind utilities) |

---

## 🟢 LOW — Cải thiện dần (code quality)

| # | Vấn đề | File | Gợi ý |
|---|--------|------|-------|
| 1 | `console.debug` trong data provider | `src/providers/dataProvider.tsx:169` | Gate bằng `DEV` hoặc logger |
| 2 | `console.warn` trong auth service | `src/services/auth.service.ts:35` | Gate/log centrally |
| 3 | `console.debug` audit action | `src/lib/audit-action.ts:13` | Gate/log centrally |
| 4 | `console.error` dashboard service | `src/features/dashboard/services/dashboard.service.ts:80` | Thống nhất error handler/toast |
| 5 | `console.warn` i18n missing key | `src/hooks/useTranslation.ts:74` | Chỉ warn ở DEV |

---

## ⚠️ MISSING — Chưa có, cần bổ sung

| Hạng mục | Thiếu gì | Mức độ ưu tiên | Gợi ý implement |
|----------|----------|----------------|-----------------|
| [C/G] Error handling | Pattern UI chuẩn cho `isError` (Alert/Result) cho các page/hook | 🟠 High | Tạo `QueryErrorState` component + guideline |
| [F] Auth authority | “Server là nguồn sự thật” cho auth/tenant, tránh persist user/isAuthenticated | 🟠 High | Hydrate qua `/me` ở app boot, invalidate cache khi switch tenant |
| [D] Token system | Quy ước dùng AntD token thay vì `!important`/hardcode | 🟡 Medium | Viết guideline + refactor dần |

---

## 🗺️ ROADMAP SỬA LỖI

### Sprint tiếp theo (ưu tiên cao)
- [ ] [C-001] Sửa `useReport` không nuốt error; UI hiển thị lỗi + retry chuẩn
- [ ] [C-002] Không che 403/404 thành empty list; phân biệt not-implemented vs forbidden
- [ ] [H-001] Giảm/loại persist `user/isAuthenticated` khỏi storage
- [ ] [H-002] Validate color trước khi inject `<style>` trong `ChartStyle`
- [ ] [H-003] Giảm `!important`, đưa về AntD token/theme

### Trong 2–4 tuần
- [ ] Tách các file >500 dòng thành hook + component
- [ ] Chuẩn hoá type cho workforce/trips, xoá `as any`
- [ ] Chuẩn hoá logger (thay `console.*`)

### Backlog (dài hạn)
- [ ] Chuẩn hoá design system + token strategy (AntD + Tailwind)
- [ ] Refactor `DataTable` API để bắt buộc rowKey ổn định

---

## ✅ ĐIỂM MẠNH PHÁT HIỆN

- Có `ErrorBoundary` bao ngoài app: `src/App.tsx:70–126`
- Chat stream đã gửi cookie `credentials: 'include'`: `src/services/chat.service.ts:94–106`
- Route guard đã enforce role bằng `useAuth().hasRole`: `src/routes/appRouteConfig.tsx:32–45`
- Axios dùng `withCredentials: true` cho HttpOnly cookie: `src/services/api.ts:142–149`

---
*Báo cáo được tổng hợp tự động bởi AI Agent từ `context-frontend.txt` (ground truth file+dòng) và đối chiếu mã nguồn hiện tại.*  
