# 📋 BÁO CÁO SCAN FRONTEND TOÀN DỰ ÁN

**Dự án**: ship-app  
**Ngày scan**: 12/05/2026  
**Stack phát hiện**: React 18.3.1 · Vite 7 · Refine 4 · Ant Design 5 · TanStack Query 5 · Zustand · TypeScript 5.5 · Recharts · Tailwind CSS  
**Tổng file scan**: 377 file trong `src/` (~48.159 dòng)

> GitNexus: đã chạy `gitnexus analyze` vì index stale. CLI hiện tại không hỗ trợ lệnh `gitnexus export`, nên report được tạo bằng GitNexus index đã refresh + scan trực tiếp mã nguồn hiện tại với line number.

---

## 📊 TỔNG QUAN

| Hạng mục | Vấn đề tìm thấy | Critical 🔴 | High 🟠 | Medium 🟡 | Low 🟢 |
|----------|----------------|-------------|---------|-----------|--------|
| [A] State Management | 3 | 0 | 0 | 2 | 1 |
| [B] Component Design | 5 | 0 | 1 | 3 | 1 |
| [C] Data Fetching | 6 | 1 | 2 | 2 | 1 |
| [D] UI / UX | 5 | 0 | 0 | 3 | 2 |
| [E] Performance | 4 | 0 | 1 | 2 | 1 |
| [F] Bảo mật | 5 | 1 | 3 | 1 | 0 |
| [G] Code Quality | 6 | 0 | 0 | 1 | 5 |
| **TỔNG** | **34** | **2** | **7** | **14** | **11** |

**Điểm sức khoẻ dự án**: **6/100**  
> Cách tính: 100 - (Critical×10) - (High×5) - (Medium×2) - (Low×1) = 100 - 20 - 35 - 28 - 11 = **6**.

---

## 🔴 CRITICAL — Phải sửa ngay trước khi deploy

> Các vấn đề ảnh hưởng trực tiếp đến chức năng, bảo mật, hoặc gây crash.

### [C-001] Refine auth check bị hỏng sau migration HttpOnly cookie
**Hạng mục**: [C/F] Data Fetching/Auth · **Điểm KT**: [C-02], [F-03]  
**File**: `src/lib/auth-session.ts` · **Dòng**: 14-18  
**File**: `src/providers/authProvider.tsx` · **Dòng**: 75-83

**Vấn đề**:  
`hasAuthToken()` luôn trả `false` vì frontend không đọc được HttpOnly cookie. Nhưng `authProvider.check()` lại dùng `hasAuthToken()` làm điều kiện đầu tiên và trả unauthenticated ngay, không gọi `/me`. Sau reload, Refine `<Authenticated>` có thể redirect user hợp lệ về login dù browser vẫn có session cookie.

**Fix**:
```tsx
// Trước (BAD)
const hasToken = hasAuthToken();
if (!hasToken) {
  setCurrentUser(null);
  return UNAUTHENTICATED;
}

// Sau (GOOD): với HttpOnly cookie, kiểm tra server là nguồn sự thật
try {
  const response = await authService.getCurrentUser();
  const user = authService.getUserFromMeResponse(response);
  if (response.success && user) {
    setCurrentUser(user);
    return { authenticated: true };
  }
} catch {
  setCurrentUser(null);
}
return { authenticated: false, redirectTo: ROUTES.login, logout: true };
```

---

### [C-002] Role-based route guard bị vô hiệu hoá
**Hạng mục**: [F] Bảo mật · **Điểm KT**: [F-03]  
**File**: `src/routes/appRouteConfig.tsx` · **Dòng**: 32-44, 117-190

**Vấn đề**:  
Nhiều route khai báo `requiredRole: 'admin'`, nhưng check role bị comment ở dòng 37. Người dùng authenticated không phải admin vẫn có thể vào các route admin nếu biết URL. Đây là lỗi RBAC route-level, không chỉ là ẩn UI.

**Fix**:
```tsx
// Trước (BAD)
// if (requiredRole && !hasRole(requiredRole)) return <Navigate to={ROUTES.dashboard} replace />;

// Sau (GOOD)
const { user } = useAuthStore();
const hasRole = user?.roles?.some((role) => role.name === requiredRole);

if (requiredRole && !hasRole) {
  return <Navigate to={ROUTES.dashboard} replace />;
}
```

---

## 🟠 HIGH — Nên sửa trong sprint này

### [H-001] Token refresh luôn bị bypass
**Hạng mục**: [C/F] Data Fetching/Auth · **Điểm KT**: [C-02], [F-01]  
**File**: `src/lib/auth-session.ts` · **Dòng**: 10-12  
**File**: `src/services/api.ts` · **Dòng**: 188-229

**Vấn đề**: `getRefreshToken()` luôn trả `null`, nhưng interceptor chỉ refresh khi `Boolean(getRefreshToken())`. Kết quả: mọi 401 non-auth endpoint bị `forceLogout()` thay vì thử refresh bằng HttpOnly cookie.

**Fix**:
```tsx
// Trước (BAD)
const canTryRefresh = AUTH_REFRESH_ENABLED && Boolean(getRefreshToken());

// Sau (GOOD)
const canTryRefresh = AUTH_REFRESH_ENABLED;
```

---

### [H-002] Chat streaming không gửi cookie credentials
**Hạng mục**: [C/F] Data Fetching/Auth · **Điểm KT**: [C-01], [F-01]  
**File**: `src/services/chat.service.ts` · **Dòng**: 94-107

**Vấn đề**: API axios dùng `withCredentials: true`, nhưng SSE chat stream dùng `fetch()` không có `credentials: 'include'`. Nếu backend xác thực bằng HttpOnly cookie, stream sẽ mất session.

**Fix**:
```tsx
await fetch(`${API_BASE_URL}${ENDPOINTS.chat.messagesStream}`, {
  method: 'POST',
  credentials: 'include',
  headers: {
    'Content-Type': 'application/json',
    Accept: 'text/event-stream',
    ...(tenantId ? { 'X-Tenant-ID': String(tenantId) } : {}),
  },
  body: JSON.stringify(this.toApiPayload(payload)),
  signal,
});
```

---

### [H-003] Tenant guard đang là no-op
**Hạng mục**: [F] Bảo mật · **Điểm KT**: [F-03]  
**File**: `src/App.tsx` · **Dòng**: 29-31, 79-117

**Vấn đề**: `TenantGuard` chỉ return children. App đã có multi-tenant flow (`pendingTenants`, `currentTenantId`) nhưng route không ép user chọn tenant trước khi vào admin pages.

**Fix**:
```tsx
function TenantGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, currentTenantId, pendingTenants } = useAuthStore();
  if (isAuthenticated && !currentTenantId && pendingTenants.length > 0) {
    return <Navigate to={ROUTES.selectTenant} replace />;
  }
  return <>{children}</>;
}
```

---

### [H-004] Client persist auth/user/tenant vào localStorage
**Hạng mục**: [F] Bảo mật · **Điểm KT**: [F-01]  
**File**: `src/stores/auth.store.ts` · **Dòng**: 67-68, 183-189  
**File**: `src/lib/auth-session.ts` · **Dòng**: 38-44  
**File**: `src/services/api.ts` · **Dòng**: 159-162

**Vấn đề**: Zustand persist lưu `user`, `isAuthenticated`, `currentTenantId`; `X-Tenant-ID` lấy từ localStorage. Dữ liệu này có thể stale hoặc bị sửa trong client. Server vẫn phải verify, nhưng frontend không nên dùng state localStorage làm authority cho auth/tenant.

**Fix**:
```tsx
partialize: () => ({}), // không persist user/isAuthenticated

// khi app boot, luôn hydrate từ /me
await useAuthStore.getState().checkAuth();
```

---

### [H-005] DataProvider che lỗi 403/404 thành empty list
**Hạng mục**: [C/G] Data Fetching/Error handling · **Điểm KT**: [C-02], [G-03]  
**File**: `src/providers/dataProvider.tsx` · **Dòng**: 166-203

**Vấn đề**: Resource chưa implement hoặc runtime 403/404 trả `{ data: [], total: 0 }`. UI sẽ hiển thị “không có dữ liệu” thay vì lỗi quyền, lỗi endpoint hoặc backend missing.

**Fix**:
```tsx
if (status === 403) {
  throw new Error(`Forbidden resource "${resource}"`);
}
if (status === 404 && !NOT_IMPLEMENTED_RESOURCES.has(resource)) {
  throw new Error(`Missing endpoint for resource "${resource}"`);
}
```

---

### [H-006] `useReport` nuốt lỗi API và trả `null`
**Hạng mục**: [C/G] Data Fetching/Error handling · **Điểm KT**: [A-03], [C-02], [G-03]  
**File**: `src/hooks/useReports.ts` · **Dòng**: 17-30

**Vấn đề**: `queryFn` catch mọi lỗi rồi return `null`, làm TanStack Query coi request là success. UI không có `isError`, không retry đúng nghĩa, và người dùng không thấy lỗi.

**Fix**:
```tsx
queryFn: async () => {
  const data = (await fetchers[type](filter)) as T | null;
  return data ?? null;
},
throwOnError: false,
```

---

### [H-007] Component/page quá lớn, nhiều responsibility
**Hạng mục**: [B] Component Design · **Điểm KT**: [B-01]  
**File**: `src/pages/dispatch/DispatchBoardPage.tsx` · **Dòng**: 1-677  
**File**: `src/hooks/use-driver-schedule-page.tsx` · **Dòng**: 1-610  
**File**: `src/pages/reports/Reports.tsx` · **Dòng**: 1-621  
**File**: `src/components/common/AuthLogsAndSessionManagement.tsx` · **Dòng**: 58-512

**Vấn đề**: Các file này vừa fetch data, giữ state, xử lý workflow, build columns, render UI. Blast radius cao khi sửa vì một file chứa nhiều luồng nghiệp vụ.

**Fix**:
```tsx
// Ví dụ tách DispatchBoardPage
export function DispatchBoardPage() {
  const board = useDispatchBoardPageState();
  return (
    <>
      <DispatchToolbar {...board.toolbarProps} />
      <DispatchTimeline {...board.timelineProps} />
      <QuickAssignModal {...board.quickAssignProps} />
    </>
  );
}
```

---

## 🟡 MEDIUM — Lên backlog xử lý

| # | Vấn đề | File | Dòng | Điểm KT | Gợi ý fix ngắn |
|---|--------|------|------|---------|----------------|
| 1 | Dashboard fetch `per_page: 1000` rồi aggregate ở frontend | `src/hooks/useDashboardTripRevenue.ts`, `src/hooks/useDashboardRevenueByOffice.ts` | 25-40, 24-41 | C-04/E-02 | Tạo endpoint aggregate hoặc server-side report query |
| 2 | `useEffect` tự fetch auth logs không có abort/ignore stale response | `src/components/common/AuthLogsAndSessionManagement.tsx` | 100-173 | A-04/C-01 | Chuyển sang `useQuery({ queryKey, queryFn })` hoặc dùng `AbortController` |
| 3 | Audit logs paginate bằng `slice` trên client | `src/components/common/AuthLogsAndSessionManagement.tsx` | 145-169 | C-04/E-02 | Gọi API với `page`/`per_page` cho audit log |
| 4 | Mutations chỉ invalidate, chưa optimistic update cho CRUD thường dùng | `src/hooks/useCreate.ts`, `src/hooks/useDelete.ts`, `src/hooks/useCustomerMutations.ts` | 23-36, 33-43, 8-42 | C-03 | Dùng `onMutate` + rollback hoặc Refine `mutationMode="optimistic"` |
| 5 | Table wrapper fallback `rowKey` về index | `src/components/table/index.tsx` | 56-63 | A-05 | Bắt buộc truyền `getRowKey` hoặc throw khi thiếu id |
| 6 | `MessageRenderer` dùng index key cho segment/rich content | `src/components/common/chat/MessageRenderer.tsx` | 133-145 | A-05/E-02 | Tạo key ổn định từ offset/hash segment |
| 7 | Columns/object render tạo inline trong component lớn | `src/pages/reports/Reports.tsx` | 542-570 | A-02/E-02 | Đưa `columns` vào `useMemo` với dependency rõ |
| 8 | Icon-only buttons thiếu `aria-label` | `src/pages/payroll/DeductionsPage.tsx`, `src/components/common/ChatAssistantPanel.tsx`, `src/pages/dispatch/DispatchBoardPage.tsx` | 79-86, 180-184, 461-469 | D-04 | Thêm `aria-label` hoặc text ẩn cho button chỉ có icon |
| 9 | Image preview để `alt=""` dù ảnh có nghiệp vụ | `src/pages/accounting/CostApprovalsPage.tsx`, `src/pages/trips/components/TripCostsTab.tsx` | 119, 170 | D-04 | Dùng alt mô tả: `alt={t('costManagement.receiptImage')}` |
| 10 | Hardcode chart colors thay vì AntD token | `src/pages/reports/Reports.tsx` | 452-482 | D-01 | Dùng `token.colorPrimary`, `token.colorSuccess`, `token.colorError` |
| 11 | CSS override AntD bằng nhiều `!important` | `src/styles/components.scss`, `src/assets/styles/_components.scss` | 203-270, 177-218 | D-01 | Chuyển sang theme token/component token hoặc class scope hẹp |
| 12 | TypeScript `any`/cast dày trong workforce/trip components | `src/pages/system/workforce-ops/tabs/WorkforceOvertimeTab.tsx`, `src/pages/trips/components/TripRouteStep.tsx` | 36-185, 17-236 | G-01 | Tạo type cho form values và select props |
| 13 | `dangerouslySetInnerHTML` cho chart style nhận color config không validate CSS value | `src/components/ui/chart.tsx` | 93-112 | F-02 | Validate color bằng allowlist regex trước khi inject CSS |
| 14 | Modal submit không disable/confirm loading trong một số CRUD | `src/pages/payroll/DeductionsPage.tsx` | 121-129 | D-03 | Bind `confirmLoading={mutation.isPending}` và disable cancel khi pending |

---

## 🟢 LOW — Cải thiện dần (code quality)

| # | Vấn đề | File | Gợi ý |
|---|--------|------|-------|
| 1 | `console.debug` còn trong data provider | `src/providers/dataProvider.tsx:169` | Dùng logger theo env hoặc xoá trước production |
| 2 | `console.warn/info` trong auth service | `src/services/auth.service.ts:13`, `src/services/auth.service.ts:20`, `src/services/auth.service.ts:75` | Guard bằng `import.meta.env.DEV` |
| 3 | `console.error` trong renderer/chat/address | `src/components/common/chat/MessageRenderer.tsx:105`, `src/components/form/AddressAutocomplete.tsx:63` | Gửi về toast/logger thay vì console trực tiếp |
| 4 | Commented-out code còn lại ở route guard | `src/routes/appRouteConfig.tsx:37` | Xoá sau khi implement guard thật |
| 5 | Naming/comment mix tiếng Việt và tiếng Anh trong cùng module | `src/services/api.ts`, `src/stores/auth.store.ts`, `src/utils/tripStatus.ts` | Thống nhất convention theo team |
| 6 | `ComponentType<any>` trong lazy helper cần ràng buộc hẹp hơn | `src/utils/lazyWithMinDelay.ts:13-14` | Dùng `ComponentType<unknown>` hoặc overload route component |
| 7 | `Reports.tsx` dùng nhiều inline style/class mix | `src/pages/reports/Reports.tsx:441-527` | Tách component chart/card và style token |
| 8 | `NoImageAvatar` alt rỗng cho avatar có thể là nội dung | `src/components/common/NoImageAvatar.tsx:12` | Cho phép truyền `alt` mặc định theo entity |
| 9 | `DataTable` không memoize mapped columns | `src/components/table/index.tsx:40-53` | `useMemo` theo `columns` |
| 10 | `authProvider.updatePassword` placeholder success | `src/providers/authProvider.tsx:203-207` | Implement thật hoặc trả error “not implemented” |
| 11 | Duplicate style trees `src/styles/*` và `src/assets/styles/*` | `src/styles/components.scss`, `src/assets/styles/_components.scss` | Chọn một entry style chính để giảm drift |

---

## ⚠️ MISSING — Chưa có, cần bổ sung

| Hạng mục | Thiếu gì | Mức độ ưu tiên | Gợi ý implement |
|----------|----------|----------------|-----------------|
| [F] Route guard | Role/permission guard thật cho `requiredRole` | 🔴 Critical | Implement `hasRole`/`canAccess` ở `ProtectedRoute` và test route admin |
| [F] Tenant guard | Guard bắt buộc chọn tenant trước khi vào admin | 🟠 High | Hoàn thiện `TenantGuard` trong `App.tsx` |
| [C] Auth refresh | Refresh bằng HttpOnly cookie không phụ thuộc refresh token JS | 🟠 High | `canTryRefresh = AUTH_REFRESH_ENABLED`; gọi `/auth/refresh` với cookie |
| [C] Error state | Report hooks không expose error khi API fail | 🟠 High | Không catch trong `queryFn`; render `<Result status="error">` hoặc `<Alert>` |
| [E] Large table strategy | Virtualization/server aggregation cho bảng lớn/dashboard | 🟡 Medium | Dùng server pagination hoặc `virtual`/TanStack Virtual |
| [G] Type coverage | Form value types cho workforce/trip route | 🟡 Medium | Tạo interface form values và select option type |

---

## 🗺️ ROADMAP SỬA LỖI

### Sprint tiếp theo (ưu tiên cao)
- [ ] [C-001] Sửa `authProvider.check()` để verify bằng `/me` khi dùng HttpOnly cookie
- [ ] [C-002] Bật role guard thật cho các route `requiredRole`
- [ ] [H-001] Sửa refresh interceptor không phụ thuộc `getRefreshToken()`
- [ ] [H-002] Thêm `credentials: 'include'` cho chat stream fetch
- [ ] [H-003] Hoàn thiện `TenantGuard`
- [ ] [H-005] Không biến 403/404 thành empty list im lặng

### Trong 2–4 tuần
- [ ] [H-007] Tách các page >500 dòng thành hook + component nhỏ
- [ ] [M-001] Chuyển dashboard aggregate sang server-side hoặc shared query rõ ràng
- [ ] [M-002] Chuyển auth logs/audit logs sang TanStack Query có pagination server
- [ ] [M-004] Thêm optimistic update cho CRUD phổ biến
- [ ] [M-008] Sửa icon-only buttons thiếu aria-label

### Backlog (dài hạn)
- [ ] Chuẩn hoá design token, giảm inline style và `!important`
- [ ] Giảm `any`/`as any` trong workforce, trip, dashboard
- [ ] Consolidate `src/styles` và `src/assets/styles`
- [ ] Thêm lint rule cấm `console.*` production và cấm commented-out code

---

## ✅ ĐIỂM MẠNH PHÁT HIỆN

> Những gì dự án đang làm đúng — để giữ nguyên, không thay đổi.

- Đã có `ErrorBoundary` wrap quanh `Refine` app tại `src/App.tsx:64-120`.
- Route/page lớn đã dùng lazy loading qua `lazyWithMinDelay` tại `src/routes/appRouteConfig.tsx:47-115`.
- Nhiều list chính đã có server pagination và `rowKey="id"`: ví dụ `UsersList`, `TripsList`, `DriversList`, `VehiclesList`.
- Chat markdown có sanitize bằng DOMPurify trước khi render HTML tại `src/components/common/chat/MessageRenderer.tsx:29-35, 138-145`.
- Dashboard hooks mới đã chuyển từ `useEffect` fetch thủ công sang TanStack Query có `signal` tại `src/hooks/useDashboardTripRevenue.ts:25-40` và `src/hooks/useDashboardRevenueByOffice.ts:24-41`.
- Delete destructive action ở nhiều nơi có confirm (`Popconfirm`/`Modal`) thay vì gọi xoá trực tiếp.

---

*Báo cáo được tổng hợp tự động bởi AI Agent từ GitNexus index đã refresh và scan mã nguồn hiện tại.*  
*Để scan lại sau khi sửa: chạy lại prompt này với context mới nhất.*
