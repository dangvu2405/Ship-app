# Báo Cáo Scan Frontend

**Dự án**: ship-app
**Ngày scan**: 11/05/2026
**Stack phát hiện**: React 18 / Refine / Ant Design / TanStack Query / Zustand / Tailwind CSS

---

## Top 10 Vấn Đề Quan Trọng Nhất

---

### #1 — Race condition trong useEffect fetch data
**Mức độ**: 🔴 Critical
**Loại**: Data Fetching / State Management
**Vị trí**: `src/hooks/useDashboardRevenueByOffice.ts` (dòng 23-86)

**Mô tả vấn đề**:
Hook sử dụng `useEffect` gọi API bất đồng bộ qua `axios.get` và tự quản lý `useState` (loading, error, data). Không có `AbortController` hay biến cờ để bỏ qua kết quả nếu component unmount hoặc dependency thay đổi nhanh. Nếu user đổi filter liên tục, request cũ có thể về sau request mới, gây ra lỗi hiển thị data sai (race condition) và lỗi memory leak do update state trên unmounted component. Hơn nữa, việc không tận dụng `useQuery` của TanStack Query có sẵn trong dự án làm mất đi cơ hội tối ưu (cache, dedupe).

**Gợi ý fix**:
```tsx
import { useQuery } from '@tanstack/react-query';
import api from '@/services/api';

export function useDashboardRevenueByOffice({ offices, companyId, officeId, month, year }) {
  const { data: rows, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard-revenue', companyId, officeId, month, year],
    queryFn: async ({ signal }) => {
      const res = await api.get('/trips', {
        signal,
        params: { status: 'completed', month, year, company_id: companyId, office_id: officeId, per_page: 1000 }
      });
      // process data here
      return result;
    }
  });

  return { rows, loading: isLoading, error, refetch };
}
```

---

### #2 — Fetch trùng lặp cùng endpoint không share cache
**Mức độ**: 🟠 High
**Loại**: Data Fetching
**Vị trí**: `src/hooks/useDashboardTripRevenue.ts` và `src/hooks/useDashboardRevenueByOffice.ts`

**Mô tả vấn đề**:
Cả hai hook này đều gọi chung endpoint `/trips` với lượng dữ liệu lớn (`per_page: 1000`) bằng `axios.get` trực tiếp. Nếu được render trên cùng một trang Dashboard, trình duyệt sẽ gửi đi 2 request trùng lặp tốn băng thông và làm chậm server. Do không dùng thư viện quản lý cache (TanStack Query), các component không thể share data chung với nhau.

**Gợi ý fix**:
```tsx
// Tạo một custom hook dùng chung useQuery cho endpoint /trips trên dashboard
// Các biểu đồ (revenue by office, trip revenue) chỉ cần select data từ cache chung này:
const { data: trips } = useQuery({
  queryKey: ['dashboard-trips', filters],
  queryFn: fetchTrips,
  staleTime: 5 * 60 * 1000 // Cache 5 phút
});
```

---

### #3 — Component quá lớn, vi phạm Single Responsibility
**Mức độ**: 🟠 High
**Loại**: Component Design
**Vị trí**: `src/pages/settings/CategoriesPage.tsx` (dòng 1-653)

**Mô tả vấn đề**:
File dài hơn 650 dòng, ôm đồm quá nhiều trách nhiệm. Nó định nghĩa và render cả `CargoTypesTab` và `VehicleTypesTab` (cùng các state, logic CRUD, Ant Design Form, Table, Modal) trong cùng một file. Điều này gây khó khăn trong việc bảo trì, đọc hiểu code và dễ xảy ra conflict khi nhiều dev cùng sửa file này.

**Gợi ý fix**:
```tsx
// Tách mỗi tab ra một file component riêng biệt
// src/pages/settings/tabs/CargoTypesTab.tsx
// src/pages/settings/tabs/VehicleTypesTab.tsx
import { CargoTypesTab } from './tabs/CargoTypesTab';
import { VehicleTypesTab } from './tabs/VehicleTypesTab';

export default function CategoriesPage() {
  return <Tabs items={[
    { key: 'cargo', children: <CargoTypesTab /> },
    { key: 'vehicle', children: <VehicleTypesTab /> }
  ]} />;
}
```

---

### #4 — Re-render không cần thiết do khởi tạo object/array trong render
**Mức độ**: 🟡 Medium
**Loại**: Component Design
**Vị trí**: `src/pages/settings/CategoriesPage.tsx` (dòng 52-87)

**Mô tả vấn đề**:
Mảng `columns` cấu hình cho Ant Design `<Table>` và hàm `handleSubmit` được khởi tạo trực tiếp trong thân function component. Mỗi khi component re-render (vì state `open`, `editing` thay đổi), `columns` bị tạo tham chiếu bộ nhớ mới, ép component `<Table>` bên trong phải render lại toàn bộ các row, làm giảm performance đáng kể khi danh sách dài.

**Gợi ý fix**:
```tsx
const columns = useMemo<TableProps<CargoType>['columns']>(() => [
  { key: 'name', title: 'Tên loại hàng', dataIndex: 'name' },
  // ...
], [t, deleteOne, refetch]); // Thêm dependencies cần thiết

// Sử dụng useCallback cho function
const handleSubmit = useCallback(async (vals) => { /*...*/ }, [editing, create, update, refetch]);
```

---

### #5 — List dài không dùng virtualization
**Mức độ**: 🟠 High
**Loại**: Performance
**Vị trí**: `src/pages/settings/CategoriesPage.tsx` (dòng 104)

**Mô tả vấn đề**:
Trong `CargoTypesTab`, hook `useList` gọi max `pageSize: 200` và component `<Table>` bị vô hiệu hóa phân trang (`pagination={false}`). Điều này có nghĩa React phải render và mount trực tiếp hàng trăm DOM nodes cùng lúc. Khi số lượng item tăng, ứng dụng sẽ bị freeze, UI giật lag.

**Gợi ý fix**:
```tsx
// 1. Mở lại pagination cho Table
<Table pagination={{ pageSize: 20 }} />

// 2. Hoặc nếu muốn scroll nguyên list, áp dụng thư viện ảo hóa như @tanstack/react-virtual
// tích hợp chung với Ant Design Table (dùng thuộc tính components={...})
```

---

### #6 — Thiếu optimistic update cho các thao tác CRUD thường xuyên
**Mức độ**: 🟡 Medium
**Loại**: Data Fetching
**Vị trí**: `src/pages/settings/CategoriesPage.tsx` (dòng 43-46)

**Mô tả vấn đề**:
Khi người dùng sửa hoặc thêm `CargoType`, luồng xử lý hiện tại là: Đợi API trả về thành công -> Gọi `refetch()` -> Table hiển thị loading -> Fetch xong list mới. Quá trình này tạo ra độ trễ trải nghiệm (lag), đặc biệt ở các thao tác cần phản hồi nhanh. Thiếu áp dụng Optimistic Update (cập nhật giao diện ngay lập tức).

**Gợi ý fix**:
```tsx
// Sử dụng config mutationMode: 'optimistic' nếu dùng Refine hooks:
const { mutateAsync: update } = useUpdate<CargoType>({
  mutationMode: "optimistic",
});
```

---

### #7 — Thiếu Error Boundary tổng thể cho Async State
**Mức độ**: 🟡 Medium
**Loại**: UI / UX Consistency
**Vị trí**: `src/hooks/useDashboardRevenueByOffice.ts`

**Mô tả vấn đề**:
Khi API fetch lỗi, hook set `error` message string đơn giản. Các component consume hook này (nếu không check state error cẩn thận) có thể render UI trống không báo lỗi rõ ràng, hoặc bị crash trắng trang. Thiếu áp dụng cơ chế Error Boundary tổng thể hoặc fallback UI đồng nhất.

**Gợi ý fix**:
```tsx
// Tại component sử dụng, tích hợp báo lỗi chuẩn:
if (error) {
  return <Alert type="error" message="Không thể tải dữ liệu" description={error} showIcon action={<Button onClick={refetch}>Thử lại</Button>} />;
}
```

---

### #8 — Tính toán phái sinh phức tạp không được memoize
**Mức độ**: 🟡 Medium
**Loại**: Performance
**Vị trí**: `src/pages/dispatch/DispatchBoardPage.tsx`

**Mô tả vấn đề**:
Trang Dispatch Board có các hàm như `getTripWindow`, `tripBarBackground` và khởi tạo array timeline (`HOURS`). Do là trang dashboard kéo/thả tương tác liên tục, các state thay đổi thường xuyên khiến các hàm tính toán DOM coordinate và format thời gian nặng bị chạy lại ở mọi render cycle, gây tốn CPU.

**Gợi ý fix**:
```tsx
// Đưa các static variables ra ngoài component (đã làm một phần).
// Bọc các component row render nặng trong React.memo.
// Memoize map data của dispatch rows:
const timelineData = useMemo(() => calculateTimeline(trips), [trips]);
```

---

### #9 — Thiếu Skeleton / Empty State chuẩn cho Layout Loading
**Mức độ**: 🟡 Medium
**Loại**: UI / UX Consistency
**Vị trí**: `src/pages/dispatch/DispatchBoardPage.tsx`

**Mô tả vấn đề**:
Loading state của các trang lớn phức tạp chủ yếu dựa vào `<Spin>` (spinner overlay). Nó khiến người dùng không biết trước được cấu trúc layout sẽ như thế nào, gây giật cục UI khi data trả về. Không dùng Skeleton screen cho các component widget.

**Gợi ý fix**:
```tsx
import { Skeleton } from 'antd';

if (isLoading) {
  return <Skeleton active paragraph={{ rows: 10 }} />;
}
```

---

### #10 — Quản lý State tính toán thủ công thay vì derived state
**Mức độ**: 🟡 Medium
**Loại**: State Management
**Vị trí**: `src/hooks/useDashboardRevenueByOffice.ts` (dòng 52-67)

**Mô tả vấn đề**:
Việc gom nhóm `completedTrips` và cộng gộp `revenue` được viết bằng vòng for loop push thẳng mutation vào local Map `existing.completedTrips += 1` và sau đó `setRows(result)`. Logic aggregation này nằm cứng trong fetching hook, nên tách khỏi side effect (fetch) và đưa thành derived state (bằng `useMemo` tính toán dựa trên list raw data từ `useQuery`).

**Gợi ý fix**:
```tsx
// Fetch raw data
const { data: rawTrips } = useQuery(...);

// Derive state
const rows = useMemo(() => {
  if (!rawTrips) return [];
  // Viết logic aggregate reduce tại đây
}, [rawTrips, offices]);
```

---

## Tóm Tắt

| # | Vấn đề | Loại | Mức độ |
|---|--------|------|--------|
| 1 | Race condition trong useEffect fetch data | Data Fetching | 🔴 |
| 2 | Fetch trùng lặp cùng endpoint không share cache | Data Fetching | 🟠 |
| 3 | Component quá lớn, vi phạm Single Responsibility | Component Design | 🟠 |
| 4 | Re-render không cần thiết (Thiếu useMemo) | Component Design | 🟡 |
| 5 | List dài không dùng virtualization | Performance | 🟠 |
| 6 | Thiếu optimistic update cho thao tác CRUD | Data Fetching | 🟡 |
| 7 | Thiếu Error Boundary tổng thể | UI / UX Consistency | 🟡 |
| 8 | Tính toán phái sinh phức tạp không được memoize | Performance | 🟡 |
| 9 | Thiếu Skeleton / Empty State chuẩn | UI / UX Consistency | 🟡 |
| 10 | Quản lý State tính toán thủ công (thiếu derived state) | State Management | 🟡 |

**Ưu tiên fix trước**: #1, #2, #5
