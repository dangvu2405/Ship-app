# Prompt Refactor — Kiến trúc DataProvider Tập Trung
## Dùng cho project: React + Vite + TypeScript + Tailwind + Ant Design + React Query

---

## Context dự án hiện tại

Stack thực tế đang dùng:
- **React 18 + Vite + TypeScript**
- **Ant Design 5.x** (UI components)
- **Tailwind CSS + shadcn/ui** (styling — KHÔNG dùng SCSS Modules)
- **React Query (TanStack Query)** (data fetching/caching)
- **Zustand** (global state: `stores/app.store.ts`, `stores/auth.store.ts`)
- **React Router v6** (`routes/`)
- **i18n** (`locales/en.ts`, `locales/vi.ts`)

Vấn đề kiến trúc hiện tại cần sửa:
1. `types/index.ts` — 1 file 18KB chứa tất cả types, quá lớn và lẫn lộn
2. `services/api.ts` — Axios instance nằm sai chỗ, thiếu interceptors chuẩn
3. `services/*.service.ts` — 16 file service riêng lẻ, phân tán logic API
4. `providers/dataProvider.tsx` — Đã có nhưng chưa implement đủ, chưa theo contract
5. `providers/notificationProvider.ts` — Chưa theo pattern static instance
6. Chưa có `utils/antdGlobal.ts` — không thể gọi notification từ Axios interceptor

---

## NHIỆM VỤ

### BƯỚC 1 — Tạo `src/utils/antdGlobal.ts`

**Mục đích:** Lưu static instance của Ant Design để gọi `notification`/`message`/`modal`
từ bất kỳ đâu, kể cả bên trong Axios interceptor (ngoài React tree).

**Yêu cầu code:**

```typescript
// src/utils/antdGlobal.ts
import type { MessageInstance } from 'antd/es/message/interface';
import type { NotificationInstance } from 'antd/es/notification/interface';
import type { ModalStaticFunctions } from 'antd/es/modal/confirm';

let _message: MessageInstance;
let _notification: NotificationInstance;
let _modal: Omit<ModalStaticFunctions, 'warn'>;

export const antdUtils = {
  setMessageInstance(i: MessageInstance)                          { _message      = i; },
  setNotificationInstance(i: NotificationInstance)               { _notification = i; },
  setModalInstance(i: Omit<ModalStaticFunctions, 'warn'>)        { _modal        = i; },

  getMessage():      MessageInstance                              { if (!_message)      throw new Error('[antdUtils] message chưa init');      return _message;      },
  getNotification(): NotificationInstance                         { if (!_notification) throw new Error('[antdUtils] notification chưa init'); return _notification; },
  getModal():        Omit<ModalStaticFunctions, 'warn'>           { if (!_modal)        throw new Error('[antdUtils] modal chưa init');        return _modal;        },
};
```

---

### BƯỚC 2 — Cập nhật `src/App.tsx`

**Mục đích:** Khởi tạo static instances ngay khi app mount, lưu vào `antdUtils`.

**Yêu cầu:** Tìm component root (`App.tsx`) và thêm `AppInitializer` bên trong `<App>` của Ant Design:

```tsx
// Thêm component này bên trong App.tsx
import { App as AntdApp } from 'antd';
import { antdUtils } from './utils/antdGlobal';

function AppInitializer() {
  const { message, notification, modal } = AntdApp.useApp();
  useEffect(() => {
    antdUtils.setMessageInstance(message);
    antdUtils.setNotificationInstance(notification);
    antdUtils.setModalInstance(modal);
  }, [message, notification, modal]);
  return null;
}

// Wrap toàn bộ app:
// <ConfigProvider theme={...}>
//   <AntdApp>
//     <AppInitializer />   ← thêm dòng này
//     {/* phần còn lại */}
//   </AntdApp>
// </ConfigProvider>
```

**Lưu ý:** Nếu `<App>` của antd đã có trong project, chỉ cần thêm `<AppInitializer />` bên trong.
Không được dùng `import { notification } from 'antd'` trực tiếp — sẽ không theo theme `ConfigProvider`.

---

### BƯỚC 3 — Tạo `src/@types/entity.d.ts`

**Mục đích:** Tách các DB entity interfaces ra khỏi `types/index.ts` thành file riêng.

**Yêu cầu:**
- Đọc file `src/types/index.ts` hiện tại
- Tìm tất cả interface/type liên quan đến **đối tượng database** (User, Driver, Trip, Vehicle,
  Order, Customer, Payroll, Invoice, Shipment, Department, Office, Role, v.v.)
- Di chuyển sang `src/@types/entity.d.ts`
- Giữ lại `export` để không break import cũ
- Thêm `BaseEntity` làm interface gốc nếu chưa có:

```typescript
// src/@types/entity.d.ts
export interface BaseEntity {
  id: string | number;
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string;
}

// --- Tất cả entity extends BaseEntity ---
// Ví dụ:
export interface Driver extends BaseEntity {
  name: string;
  phone: string;
  licenseNumber: string;
  status: 'active' | 'inactive' | 'on_leave';
  // ... các field hiện có trong types/index.ts
}

// ... copy toàn bộ entity interfaces từ types/index.ts vào đây
```

---

### BƯỚC 4 — Tạo `src/@types/provider.d.ts`

**Mục đích:** Định nghĩa contract (kiểu tham số & trả về) cho `dataProvider`.

**Yêu cầu:** Tạo file mới với nội dung sau, **không thay đổi**:

```typescript
// src/@types/provider.d.ts

export interface Pagination {
  page: number;
  pageSize: number;
}

export interface Sorter {
  field: string;
  order: 'asc' | 'desc';
}

export interface GetListParams {
  resource: string;
  pagination?: Pagination;
  filters?: Record<string, unknown>;
  sorters?: Sorter[];
}

export interface GetOneParams {
  resource: string;
  id: string | number;
}

export interface MutationParams<TVariables = unknown> {
  resource: string;
  id?: string | number;
  variables?: TVariables;
}

export interface GetListResponse<TData> {
  data: TData[];
  total: number;
  page?: number;
  pageSize?: number;
}

export interface IDataProvider {
  getList<TData>(params: GetListParams): Promise<GetListResponse<TData>>;
  getOne<TData>(params: GetOneParams): Promise<TData>;
  create<TData, TVariables = unknown>(params: MutationParams<TVariables>): Promise<TData>;
  update<TData, TVariables = unknown>(params: MutationParams<TVariables>): Promise<TData>;
  deleteOne(params: MutationParams): Promise<void>;
}
```

---

### BƯỚC 5 — Refactor `src/services/api.ts` → `src/providers/apiInstance.ts`

**Mục đích:** Axios instance duy nhất, chuẩn hoá interceptors.

**Yêu cầu:**

1. Đọc `src/services/api.ts` hiện tại để lấy `baseURL`, timeout, headers đang dùng
2. Tạo `src/providers/apiInstance.ts` với nội dung:

```typescript
// src/providers/apiInstance.ts
import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { antdUtils } from '../utils/antdGlobal';

// Map HTTP status → thông báo tiếng Việt
const ERROR_MESSAGES: Record<number, string> = {
  400: 'Dữ liệu gửi lên không hợp lệ.',
  403: 'Bạn không có quyền thực hiện thao tác này.',
  404: 'Không tìm thấy dữ liệu yêu cầu.',
  422: 'Dữ liệu không thể xử lý được.',
  429: 'Quá nhiều yêu cầu, vui lòng thử lại sau.',
  500: 'Lỗi máy chủ nội bộ.',
  502: 'Máy chủ không phản hồi.',
  503: 'Dịch vụ tạm thời không khả dụng.',
};

const MUTATION_METHODS = new Set(['post', 'put', 'patch', 'delete']);

const apiInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 15_000,
  headers: { 'Content-Type': 'application/json' },
});

// ── Request: gắn token ──────────────────────────────────────────
apiInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    // ĐỌC FILE auth.store.ts hoặc auth-session.ts để lấy đúng key token
    // Hiện tại project dùng key gì thì giữ nguyên key đó
    const token = localStorage.getItem('access_token')
                ?? localStorage.getItem('token');
    if (token && config.headers) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response: success notification ─────────────────────────────
// ── Response: error notification + 401 redirect ─────────────────
apiInstance.interceptors.response.use(
  (response) => {
    const method = response.config.method?.toLowerCase() ?? '';
    if (MUTATION_METHODS.has(method)) {
      const msg = response.data?.message as string | undefined;
      antdUtils.getNotification().success({
        message: 'Thành công',
        description: msg ?? 'Thao tác đã được thực hiện.',
        placement: 'topRight',
        duration: 3,
      });
    }
    return response;
  },
  (error: AxiosError<{ message?: string }>) => {
    const status = error.response?.status;
    if (status === 401) {
      // ĐỌC auth.store.ts để gọi đúng action logout hiện tại
      localStorage.removeItem('access_token');
      window.location.href = '/login';
      return Promise.reject(error);
    }
    antdUtils.getNotification().error({
      message: `Lỗi${status ? ` ${status}` : ''}`,
      description: error.response?.data?.message
                ?? ERROR_MESSAGES[status ?? 0]
                ?? error.message
                ?? 'Đã có lỗi không xác định xảy ra.',
      placement: 'topRight',
      duration: 5,
    });
    return Promise.reject(error);
  },
);

export default apiInstance;
```

3. **Giữ nguyên** `services/api.ts` cũ — chỉ thêm một dòng re-export để không break code hiện tại:
   ```typescript
   // services/api.ts (thêm vào cuối file)
   export { default as apiInstance } from '../providers/apiInstance';
   ```

---

### BƯỚC 6 — Refactor `src/providers/dataProvider.tsx`

**Mục đích:** Implement đủ `IDataProvider` contract, dùng `apiInstance` mới.

**Yêu cầu:**

1. Đọc file `src/providers/dataProvider.tsx` hiện tại
2. Giữ lại mọi logic đang hoạt động, chỉ **bổ sung** các hàm còn thiếu
3. Đảm bảo implement đủ 5 hàm theo `IDataProvider`:

```typescript
// src/providers/dataProvider.ts  (đổi extension tsx → ts nếu không có JSX)
import apiInstance from './apiInstance';
import type {
  GetListParams, GetListResponse,
  GetOneParams, MutationParams, IDataProvider,
} from '../@types/provider';

// Helper: map GetListParams → query string object
function buildQuery(params: GetListParams): Record<string, string> {
  const q: Record<string, string> = {};
  if (params.pagination) {
    q.page     = String(params.pagination.page);
    q.pageSize = String(params.pagination.pageSize);
  }
  if (params.filters) {
    for (const [k, v] of Object.entries(params.filters)) {
      if (v !== undefined && v !== null && v !== '') q[k] = String(v);
    }
  }
  if (params.sorters?.length) {
    q.sortField = params.sorters[0].field;
    q.sortOrder = params.sorters[0].order;
  }
  return q;
}

const dataProvider: IDataProvider = {
  async getList<T>(p: GetListParams): Promise<GetListResponse<T>> {
    const res = await apiInstance.get<GetListResponse<T>>(
      `/${p.resource}`, { params: buildQuery(p) }
    );
    return res.data;
  },
  async getOne<T>(p: GetOneParams): Promise<T> {
    const res = await apiInstance.get<T>(`/${p.resource}/${p.id}`);
    return res.data;
  },
  async create<T, V = unknown>(p: MutationParams<V>): Promise<T> {
    const res = await apiInstance.post<T>(`/${p.resource}`, p.variables);
    return res.data;
  },
  async update<T, V = unknown>(p: MutationParams<V>): Promise<T> {
    if (!p.id) throw new Error(`[dataProvider] update: thiếu id cho "${p.resource}"`);
    const res = await apiInstance.put<T>(`/${p.resource}/${p.id}`, p.variables);
    return res.data;
  },
  async deleteOne(p: MutationParams): Promise<void> {
    if (!p.id) throw new Error(`[dataProvider] deleteOne: thiếu id cho "${p.resource}"`);
    await apiInstance.delete(`/${p.resource}/${p.id}`);
  },
};

export default dataProvider;
```

---

### BƯỚC 7 — Cập nhật `src/hooks/useResourceListQuery.ts`

**Mục đích:** Hook này đang đúng hướng — chỉ cần đảm bảo gọi qua `dataProvider` mới.

**Yêu cầu:** Đọc file hiện tại, nếu đang import từ `services/` thì chuyển sang:

```typescript
import dataProvider from '../providers/dataProvider';
import type { GetListParams } from '../@types/provider';

export function useResourceListQuery<T>(params: GetListParams) {
  return useQuery({
    queryKey: [params.resource, params.pagination, params.filters, params.sorters],
    queryFn: () => dataProvider.getList<T>(params),
  });
}
```

---

### BƯỚC 8 — Cập nhật `src/hooks/useResourceDeleteMutation.ts`

```typescript
import dataProvider from '../providers/dataProvider';

export function useResourceDeleteMutation(resource: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string | number) =>
      dataProvider.deleteOne({ resource, id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [resource] });
    },
  });
}
```

---

## Ràng buộc bắt buộc (KHÔNG được vi phạm)

| # | Quy tắc |
|---|---------|
| 1 | **KHÔNG** dùng `import { notification } from 'antd'` — luôn qua `antdUtils.getNotification()` |
| 2 | **KHÔNG** gọi `apiInstance` trực tiếp trong page/component — chỉ qua `dataProvider` hoặc hooks |
| 3 | **KHÔNG** xoá `services/*.service.ts` ngay — giữ nguyên để không break, migrate từ từ |
| 4 | **KHÔNG** hardcode `baseURL` — dùng `import.meta.env.VITE_API_BASE_URL` |
| 5 | **KHÔNG** định nghĩa type inline trong component — import từ `@types/` |
| 6 | Đọc `src/stores/auth.store.ts` trước khi viết logic 401 logout — dùng đúng action của store |
| 7 | Đọc `src/lib/auth-session.ts` trước khi lấy token — dùng đúng key/method hiện tại |

---

## Thứ tự thực thi bắt buộc

```
1. utils/antdGlobal.ts          (không phụ thuộc gì)
2. App.tsx                       (phụ thuộc antdGlobal)
3. @types/entity.d.ts           (không phụ thuộc gì)
4. @types/provider.d.ts         (không phụ thuộc gì)
5. providers/apiInstance.ts      (phụ thuộc antdGlobal + đọc auth.store.ts)
6. providers/dataProvider.ts     (phụ thuộc apiInstance + @types/provider)
7. hooks/useResourceListQuery.ts (phụ thuộc dataProvider + @types/provider)
8. hooks/useResourceDeleteMutation.ts
```

---

## Kiểm tra sau khi hoàn thành

Chạy lệnh sau để đảm bảo không có lỗi:

```bash
npx tsc --noEmit          # kiểm tra TypeScript
npx eslint src/           # kiểm tra lint
npm run build             # build thử
```

Nếu build thành công và không có TypeScript error — refactor hoàn tất.

---

## Ghi chú quan trọng cho AI Agent

- **Đọc file hiện tại trước khi ghi đè** — đặc biệt `App.tsx`, `dataProvider.tsx`, `auth.store.ts`, `auth-session.ts`
- **Không xoá code đang hoạt động** — chỉ thêm/sửa những gì prompt yêu cầu
- **Giữ nguyên i18n** — không thêm string cứng tiếng Việt vào component, dùng `useTranslation`
- **Giữ nguyên React Query** — không thay bằng `useEffect + fetch`
- **Giữ nguyên Zustand stores** — chỉ đọc, không refactor stores trong lần này