---
name: review-antd
description: Review toàn bộ dự án về việc sử dụng Ant Design v5 — phát hiện anti-pattern, API deprecated, vi phạm chuẩn v5, và cơ hội tối ưu. Dùng khi muốn audit chất lượng UI antd của cả codebase.
context: fork
agent: Explore
argument-hint: [path?]
allowed-tools: Read, Grep, Glob, Bash(git log:*), Bash(find:*), Bash(wc:*), Bash(jq:*), Bash(cat:*)
---

# Review Ant Design toàn dự án

Thực hiện audit toàn diện cách dùng Ant Design v5 trong codebase. Nếu có `$ARGUMENTS`, giới hạn scope trong path đó (ví dụ: `src/pages/users`).

## Thông tin dự án

- Version antd: !`cat package.json 2>/dev/null | grep -E '"antd"|"@ant-design' || echo "Không tìm thấy package.json ở root"`
- Version dayjs/moment: !`cat package.json 2>/dev/null | grep -E '"dayjs"|"moment"'`
- Version react: !`cat package.json 2>/dev/null | grep '"react"'`
- Số file UI: !`find . -type f \( -name "*.tsx" -o -name "*.jsx" \) -not -path '*/node_modules/*' -not -path '*/dist/*' -not -path '*/build/*' | wc -l`
- File có import antd: !`grep -rl "from ['\"]antd['\"]" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . 2>/dev/null | grep -v node_modules | head -100`

## Quy trình review

### Bước 1 — Setup root
Kiểm tra file entry (thường là `App.tsx`, `main.tsx`, `_app.tsx`, `index.tsx`):
- [ ] Có `<ConfigProvider>` bao bọc app không?
- [ ] Có `<App>` wrapper từ antd không (bắt buộc để `message`/`notification`/`modal` hoạt động đúng)?
- [ ] Có set `locale` không (vi_VN hay khác)?
- [ ] Có cấu hình `theme.token` tập trung không, hay mỗi nơi override một kiểu?
- [ ] Còn import `'antd/dist/antd.css'` hay `'antd/dist/reset.css'` không cần thiết không?

### Bước 2 — Quét anti-pattern tự động

Chạy các lệnh grep dưới đây và tổng hợp kết quả. **Mọi match đều là vi phạm cần fix**:

```bash
# 1. Static API (message/notification/modal ngoài <App> context)
grep -rn "message\.\(success\|error\|warning\|info\|loading\)" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . | grep -v node_modules | grep -v "useApp"

grep -rn "notification\.\(success\|error\|warning\|info\|open\)" --include="*.tsx" --include="*.jsx" . | grep -v node_modules | grep -v "useApp"

grep -rn "Modal\.confirm\|Modal\.info\|Modal\.success\|Modal\.error\|Modal\.warning" --include="*.tsx" --include="*.jsx" . | grep -v node_modules

# 2. Prop deprecated
grep -rn "visible={" --include="*.tsx" --include="*.jsx" . | grep -v node_modules
# → Modal/Drawer dùng `visible` thay vì `open` (deprecated v5)

grep -rn "Button\.Group\|<Button\.Group" --include="*.tsx" --include="*.jsx" . | grep -v node_modules
# → Dùng Space.Compact thay thế

grep -rn "bordered={false}" --include="*.tsx" --include="*.jsx" . | grep -v node_modules
# → Card v5 dùng `variant="borderless"`

# 3. Moment thay vì Dayjs
grep -rn "from ['\"]moment['\"]" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . | grep -v node_modules
grep -rn "import moment" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" . | grep -v node_modules

# 4. Import CSS cũ
grep -rn "antd/dist/antd" --include="*.tsx" --include="*.jsx" --include="*.ts" --include="*.js" --include="*.css" --include="*.scss" . | grep -v node_modules

# 5. Import icon sai cách
grep -rn "import \* as .* from ['\"]@ant-design/icons['\"]" --include="*.tsx" --include="*.jsx" . | grep -v node_modules

# 6. Override CSS global .ant-*
grep -rn "\.ant-" --include="*.css" --include="*.scss" --include="*.less" . | grep -v node_modules | head -50

# 7. Select dùng <Option> children thay vì prop options
grep -rn "Select\.Option\|<Option " --include="*.tsx" --include="*.jsx" . | grep -v node_modules
```

### Bước 3 — Đọc từng file UI

Với mỗi file `.tsx`/`.jsx` có import từ antd, check:

**Form**:
- [ ] Mọi `Form.Item` đều có `name` không?
- [ ] Có component nào bọc trong Form.Item nhưng tự quản state (`useState` + `value`/`onChange`) không? → Form không track được
- [ ] Dùng `initialValues` ở Form hay `defaultValue` ở input? → Phải là initialValues
- [ ] Có validate bằng regex inline hay rule chuẩn không?

**Table**:
- [ ] Có `rowKey` không? Có trỏ đúng id unique không (không phải index)?
- [ ] Typed `<T>` với `TableProps<T>['columns']` không?
- [ ] Table rộng có `scroll={{ x: ... }}` không?
- [ ] Server-side pagination có implement `onChange` không, hay fetch toàn bộ?

**Modal/Drawer**:
- [ ] Dùng `open` (v5) hay `visible` (v4)?
- [ ] Có `destroyOnClose` khi chứa form không?
- [ ] Prop `onOk`/`onCancel` có typed đúng không?

**Layout**:
- [ ] Có `<div style={{ display: 'flex' }}>` nào thay vì dùng `Flex`/`Space` không?
- [ ] Dùng `Row/Col` cho layout đơn giản (nên dùng Flex)?

**Typography/Accessibility**:
- [ ] Có dùng `<Typography.Text>`/`<Title>` hay `<h1>`/`<p>` tay?
- [ ] Icon-only button có `aria-label` không?

### Bước 4 — Phân tích bundle/performance

- [ ] Import `@ant-design/icons` có named không (không `import *`)?
- [ ] Có dùng dynamic import cho Modal/Drawer ít khi mở không?
- [ ] Locale có import đúng 1 lần ở root không, hay import lặp nhiều nơi?

### Bước 5 — Theme & nhất quán

- [ ] Màu primary có được đặt ở `ConfigProvider.token.colorPrimary` không, hay hardcode khắp nơi (`#1677ff`, `#1890ff`)?
- [ ] Border radius, spacing có nhất quán (dùng token) không?
- [ ] Có nhiều `<ConfigProvider>` lồng nhau không cần thiết không?

## Định dạng output

Trả về báo cáo markdown: