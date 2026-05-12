# UI fix: TripRouteStep (Ant Design)

**File:** `src/pages/trips/components/TripRouteStep.tsx`  
**Ngày:** 2026-05-12  
**Tham chiếu:** Prompt AntD RULE-1–8 (layout/spacing/token, không hardcode màu, không Tailwind layout wrapper).

---

## BƯỚC 1 — Kiểm tra vi phạm

| # | Dòng (trước sửa) | Vi phạm | Rule |
|---|------------------|---------|------|
| 1 | 67 | `className="flex flex-col gap-4"` — layout Tailwind thay vì AntD | RULE-3 |
| 2 | 68 | `style={{ marginTop: 0 }}` trên `Divider` | RULE-2 |
| 3 | 69, 192, 251 | `Space` không có `size` | RULE-6 |
| 4 | 165–166 | `gap={8}` và `style={{ flex: 1 }}` — magic number + inline flex | RULE-2, RULE-6 |
| 5 | 17–19 | `form: any`, `initialValues?: any` | best practice (khớp `TripForm`) |

---

## BƯỚC 2 — Giải thích sửa đổi

1. **Wrapper:** Thay `div` + Tailwind bằng `<Flex vertical gap="middle">` — prop `vertical`, `gap` của [Ant Design Flex](https://ant.design/components/flex) (RULE-1a).
2. **Divider đầu:** Bỏ `marginTop: 0`; khoảng cách dọc do `Flex` `gap="middle"` (RULE-6).
3. **Icon + text trong Divider:** Thêm `<Space size="small">` — preset spacing AntD (RULE-6).
4. **Grid:** `Row` dùng `gutter={[16, 16]}` và `[24, 24]` — responsive gutter Grid (RULE-1c).
5. **Distance + nút:** `Row gutter={8}` + `Col flex="auto"` / `Col flex="none"` + `align="bottom"` `wrap` — bỏ `style={{ flex: 1 }}`; gutter 8 = khoảng nhỏ theo RULE-6.
6. **Types:** `FormInstance` từ `antd/lib/form`, `initialValues?: Partial<Trip>`, import `Trip` từ `@/types` — đồng bộ với `TripForm.tsx`.
7. **Địa chỉ:** `startPointTrimmed` / `endPointTrimmed` / `hasTripId` để tránh chuỗi `any` và giữ hành vi `relaxCascadeRequired` / `legacySavedAddress`.

---

## BƯỚC 3 — Code đã sửa

Toàn bộ component đã được ghi vào repo tại:

`src/pages/trips/components/TripRouteStep.tsx`

Tóm tắt thay đổi chính:

- Root: `Flex vertical gap="middle"`.
- Mọi `Divider` bọc `Space size="small"` cho icon + label.
- Các `Row` dùng `gutter` dạng mảng khi cần khoảng cách dọc.
- Khối quãng đường + tính phí: lồng `Row`/`Col` thay cho `Flex` + `div` + inline flex.
- Props typed: `FormInstance`, `Partial<Trip>`.

---

## BƯỚC 4 — Checklist xác nhận

| Tiêu chí | Yes / No |
|----------|----------|
| Không có inline style nào ngoài `width: '100%'`? | **Yes** |
| Không hardcode màu hex/rgb? | **Yes** |
| Không `className` custom cho layout trong file này? | **Yes** |
| Spacing dùng prop AntD (`gap`, `gutter`, `size`)? | **Yes** |
| Typography hierarchy AntD (`Title`/`Text`)? | **N/A** (step chỉ label field qua FormItem) |
| Form đủ `Form.Item` / rules qua wrapper? | **Yes** |
| Loading bằng `Spin`? | **Yes** (`suffix` khi tính phí) |
| Empty bằng `<Empty>`? | **N/A** |
| Action nguy hiểm `Popconfirm`? | **N/A** |
| Import cần thiết, không thừa? | **Yes** |

---

## Xác minh build / lint

Sau sửa: `npm run lint` và `npm run build` đều chạy thành công.
