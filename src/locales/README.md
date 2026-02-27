# Localization (i18n)

Hệ thống đa ngôn ngữ với hỗ trợ tiếng Việt và tiếng Anh.

## Cấu trúc

```
locales/
  ├── en.ts      # Tiếng Anh
  ├── vi.ts      # Tiếng Việt
  └── index.ts   # Export và types
```

## Cách sử dụng

### 1. Sử dụng hook useTranslation

```tsx
import { useTranslation } from '@/hooks/useTranslation';

const MyComponent = () => {
  const { t, locale, setLocale } = useTranslation();

  return (
    <div>
      <h1>{t('dashboard.title')}</h1>
      <button onClick={() => setLocale('vi')}>Tiếng Việt</button>
      <button onClick={() => setLocale('en')}>English</button>
    </div>
  );
};
```

### 2. Với tham số

```tsx
const { t } = useTranslation();

// Translation: "Minimum {min} characters"
<span>{t('validation.minLength', { min: 5 })}</span>
// Output: "Minimum 5 characters" (en) hoặc "Tối thiểu 5 ký tự" (vi)
```

### 3. Sử dụng LanguageSwitcher component

```tsx
import { LanguageSwitcher } from '@/components/common/LanguageSwitcher';

<LanguageSwitcher />
```

## Thêm translations mới

### 1. Thêm vào file en.ts

```ts
export const en = {
  // ... existing translations
  myModule: {
    title: 'My Module',
    description: 'Module description',
  },
};
```

### 2. Thêm vào file vi.ts

```ts
export const vi = {
  // ... existing translations
  myModule: {
    title: 'Mô-đun của tôi',
    description: 'Mô tả mô-đun',
  },
};
```

### 3. Sử dụng

```tsx
const { t } = useTranslation();
<h1>{t('myModule.title')}</h1>
```

## Cấu trúc translations

Translations được tổ chức theo modules:

- `common` - Các từ chung (save, cancel, delete, ...)
- `auth` - Xác thực (login, logout, ...)
- `dashboard` - Bảng điều khiển
- `companies` - Công ty
- `employees` - Nhân viên
- `vehicles` - Xe
- `trips` - Chuyến đi
- `payrolls` - Bảng lương
- `reports` - Báo cáo
- `users` - Người dùng
- `header` - Header
- `validation` - Validation messages
- `messages` - Thông báo hệ thống

## Lưu trữ

Locale được lưu trong `localStorage` thông qua Zustand persist middleware, tự động khôi phục khi reload trang.

## Type Safety

Tất cả translation keys đều có type safety, IDE sẽ gợi ý các keys có sẵn khi sử dụng `t()`.
