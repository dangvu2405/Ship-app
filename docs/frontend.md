## Frontend UI Playbook (Uu tien Shadcn UI)

Tai lieu nay quy dinh cach xay dung luong nghiep vu theo huong **tan dung toi da** `src/components/ui` (Shadcn UI), va chi dung `antd` khi that su can.

## 1) Muc tieu

- Dong nhat trai nghiem nguoi dung tren toan app.
- Giam do phuc tap khi maintain (mot he UI chinh).
- Tang toc do tao man moi bang cac primitive co san trong `src/components/ui`.

## 2) Nguyen tac chon component

### 2.1 Uu tien `src/components/ui`

Dung `src/components/ui` cho:
- Layout va shell: `card`, `tabs`, `sheet`, `dialog`, `separator`, `scroll-area`.
- Hanh vi tuong tac co ban: `button`, `dropdown-menu`, `tooltip`, `checkbox`, `input`, `textarea`, `select`.
- Trang thai va phan hoi: `skeleton`, `badge`, `toast`/`toaster`, `alert-dialog`.

### 2.2 Dung `antd` theo nhu cau

Chi dung `antd` khi:
- Form enterprise phuc tap (validation/rules dynamic, dependencies nhieu).
- Input/select co du lieu lon va can behavior dac thu.
- Feature chua co equivalent tot trong `src/components/ui`.

## 2.3 Inventory component da co (theo codebase hien tai)

### `src/components/ui` nen uu tien dung lai

- Form/basic: `button`, `input`, `textarea`, `select`, `checkbox`, `switch`, `label`.
- Layout/shell: `card`, `dialog`, `sheet`, `drawer`, `separator`, `tabs`.
- Data display: `table`, `badge`, `avatar`, `skeleton`, `spinner`, `progress`.
- Navigation/overlay: `dropdown-menu`, `pagination`, `tooltip`, `popover`, `scroll-area`.
- Feedback: `alert-dialog`, `toast`, `toaster`.

### Wrapper nghiep vu da co trong du an

- `src/components/common/PageHeader.tsx`
- `src/components/common/TableSkeleton.tsx`
- `src/components/common/ErrorState.tsx`
- `src/components/common/DeleteConfirmDialog.tsx`
- `src/components/common/SearchField.tsx`
- `src/components/table/DataTable.tsx`
- `src/components/form/FormItemText.tsx`
- `src/components/form/FormItemNumber.tsx`
- `src/components/form/FormItemSelect.tsx`
- `src/components/form/FormItemTextArea.tsx`

## 3) Rule bat buoc khi lam man hinh

- Khong tron 2 he cho cung vai tro trong cung flow.
  - Vi du: khong dung ca `antd Modal` va `ui/dialog` cho 1 thao tac.
- Neu da co wrapper noi bo thi dung wrapper:
  - Bang: `src/components/table/DataTable.tsx`
  - Form field: `src/components/form/FormItem*`
  - Shared state UI: `ErrorState`, `TableSkeleton`, `DeleteConfirmDialog`, `PageHeader`.
- Tat ca man phai tuong thich dark mode + i18n (`src/locales/en.ts`, `src/locales/vi.ts`).

## 4) Luong nghiep vu mau (su dung toi da UI Shadcn)

## 4.1 Luong List CRUD chuan

1. `PageHeader` + action button.
2. Filter panel trong `Card`:
   - `SearchField` / `Input`
   - `ui/select` hoac `antd Select` (neu options lon)
   - `Button` Search/Reset
3. Noi dung:
   - loading -> `TableSkeleton`
   - error -> `ErrorState`
   - success -> `DataTable`
4. Row actions:
   - `DropdownMenu` cho View/Edit/Delete
   - Confirm xoa dung `DeleteConfirmDialog`

Component stack de uu tien:
- `card`, `button`, `dropdown-menu`, `badge`, `tabs`, `skeleton`, `alert-dialog`.

## 4.2 Luong Form Dialog chuan

1. Mo dialog bang `ui/dialog` hoac wrapper dialog page.
2. Form core co the dung `antd Form` + `FormItem*`.
3. Footer action dung `ui/button`.
4. Close guard khi co unsaved changes.
5. Sau submit:
   - toast success
   - invalidate/refetch list
   - close dialog

## 4.3 Luong Payroll QR Payment (de xuat)

Muc tieu UX: user tra luong nhanh qua QR, thao tac toi gian.

Man hinh gom:
1. **Bo loc ky luong** (thang/nam/phong ban) trong `Card`.
2. **Bang danh sach nhan vien luong** bang `DataTable`:
   - cot: employee, amount, status, action.
3. **Action "Tao QR"**:
   - mo `Dialog` hien QR, thong tin chuyen khoan, han thanh toan.
4. **Action "Xac nhan da tra"**:
   - `AlertDialog` confirm.
5. **Trang thai**:
   - pending/paid/failed hien bang `Badge`.
6. **Tai bien lai**:
   - `Button` download.

UI stack uu tien:
- `card`, `dialog`, `alert-dialog`, `badge`, `button`, `table`, `tabs`, `skeleton`.

### 4.3.1 Contract nghiep vu de dev code nhanh

- Input:
  - ky luong: `month`, `year`
  - bo loc: `company_id`, `office_id`, `employee_id` (neu co)
- Output row:
  - `employee_name`, `amount`, `status`, `qr_payload`, `paid_at`
- Trang thai:
  - `draft` -> chua tao QR
  - `pending` -> da tao QR, cho thanh toan
  - `paid` -> da xac nhan thanh toan
  - `failed` -> thanh toan loi/het han
- Action:
  - Generate QR (`Dialog`)
  - Confirm paid (`AlertDialog`)
  - Re-generate QR (`Dialog`)
  - Download receipt (`Button`)

### 4.3.2 Mapping UI cu the cho man QR payroll

- Filter bar: `Card` + `SearchField` + `Select` + `Button`.
- List: `DataTable` + `TableSkeleton` + `ErrorState`.
- QR popup: `Dialog` + `Card` (thong tin ngan hang + QR image).
- Confirm payment: `AlertDialog`.
- Status chip: `Badge`.
- Notification: `toast`/`toaster`.

## 4.5 Luong menu toi gian cho nguoi dung (user-centric)

Menu khuyen nghi (uu tien de user thao tac nhanh):
- Dashboard
- Attendances
- Payrolls
- Notifications
- Settings

Nguyen tac:
- Role `admin`: hien full menu quan tri.
- Role `user`: hien menu toi gian theo 5 muc tren.
- Item khong co route thuc (`#`) khong dua vao menu user-facing.

## 4.4 Luong Notification Center + Chat

- Notification:
  - `Tabs` chia nhom thong bao
  - `DropdownMenu`/`Button` cho mark-as-read
  - loading dung `TableSkeleton`
- Chat:
  - khung chinh dung `Card`, `Textarea`, `Select`, `Badge`
  - optimistic message + pending state voi `Loader2`
  - loi hien thi inline + Retry button

## 5) Quy dinh coding khi dung `src/components/ui`

- Import icon theo direct path (`lucide-react/dist/esm/icons/...`) de toi uu bundle.
- Khong hardcode mau neu da co token/util class.
- Khong tao component moi neu `src/components/ui` da co equivalent.
- PR phai neu ro: "tai sao can antd" neu khong dung ui primitive.

## 5.1 DoD cho mot man hinh moi

- Co `PageHeader`.
- Co du 3 state: loading / error / success.
- Co xu ly empty data.
- Co i18n key cho toan bo text user-facing.
- Khong hardcode mau bat buoc (`dark:` + token classes).
- Pass lint + khong co import UI trung vai tro.

## 6) Checklist review PR

- [ ] Da uu tien `src/components/ui` cho shell va interaction chua?
- [ ] Co tron 2 he UI cho cung 1 vai tro trong cung flow khong?
- [ ] Da dung wrapper chung (`DataTable`, `FormItem*`, `ErrorState`, `TableSkeleton`) chua?
- [ ] Da pass dark mode + i18n?
- [ ] Da xu ly loading/error/success state ro rang?
- [ ] Neu dung `antd`, da co ly do ky thuat hop le?
- [ ] Da dung inventory component co san truoc khi tao component moi?
- [ ] Neu la flow thanh toan, da co confirm dialog + audit trail (paid_at/status)?