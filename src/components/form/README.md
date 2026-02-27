# Form Components

Các component form item tái sử dụng cho Ant Design Form với đầy đủ props và type-safe.

## Components

### FormItemText
Component wrapper cho `Form.Item` với `Input` (text input).

#### Props đầy đủ

**Base Props (từ BaseFormItemProps):**
- `name`: `string | number | (string | number)[]` - Tên field (required)
- `label`: `React.ReactNode` - Label hiển thị
- `rules`: `FormItemProps['rules']` - Validation rules
- `required`: `boolean` - Hiển thị dấu * (required)
- `tooltip`: `React.ReactNode` - Tooltip text
- `help`: `React.ReactNode` - Help text dưới input
- `extra`: `React.ReactNode` - Extra content bên phải label
- `disabled`: `boolean` - Disable field
- `hidden`: `boolean` - Ẩn field
- `className`: `string` - Custom class name
- `style`: `React.CSSProperties` - Custom style

**Input-specific Props:**
- `inputProps`: `InputProps` - Props truyền vào Input component
- `placeholder`: `string` - Placeholder text
- `type`: `'text' | 'email' | 'password' | 'tel' | 'url'` - Input type
- `maxLength`: `number` - Độ dài tối đa
- `showCount`: `boolean` - Hiển thị số ký tự
- `prefix`: `React.ReactNode` - Icon/element trước input
- `suffix`: `React.ReactNode` - Icon/element sau input
- `readOnly`: `boolean` - Chỉ đọc
- `autoComplete`: `string` - Auto-complete attribute
- `autoFocus`: `boolean` - Tự động focus
- `size`: `'small' | 'middle' | 'large'` - Kích thước

#### Ví dụ

```tsx
import { FormItemText } from '@/components/form';
import { MailOutlined, UserOutlined } from '@ant-design/icons';

// Basic
<FormItemText
  name="username"
  label="Username"
  rules={[{ required: true, message: 'Please enter username' }]}
  placeholder="Enter username"
/>

// With prefix icon
<FormItemText
  name="email"
  label="Email"
  type="email"
  prefix={<MailOutlined />}
  rules={[
    { required: true, message: 'Please enter email' },
    { type: 'email', message: 'Invalid email' }
  ]}
/>

// With character count
<FormItemText
  name="code"
  label="Code"
  maxLength={50}
  showCount
  rules={[{ required: true, max: 50 }]}
/>
```

---

### FormItemTextArea
Component wrapper cho `Form.Item` với `Input.TextArea`.

#### Props đầy đủ

**Base Props:** (giống FormItemText)

**TextArea-specific Props:**
- `textAreaProps`: `TextAreaProps` - Props truyền vào TextArea
- `placeholder`: `string` - Placeholder text
- `rows`: `number` - Số dòng (default: 3)
- `maxLength`: `number` - Độ dài tối đa
- `showCount`: `boolean` - Hiển thị số ký tự
- `readOnly`: `boolean` - Chỉ đọc
- `autoFocus`: `boolean` - Tự động focus
- `size`: `'small' | 'middle' | 'large'` - Kích thước
- `autoSize`: `boolean | { minRows?: number; maxRows?: number }` - Tự động điều chỉnh kích thước

#### Ví dụ

```tsx
import { FormItemTextArea } from '@/components/form';

// Basic
<FormItemTextArea
  name="description"
  label="Description"
  rows={4}
  placeholder="Enter description"
/>

// With character count
<FormItemTextArea
  name="address"
  label="Address"
  maxLength={500}
  showCount
  rows={3}
/>

// Auto-size
<FormItemTextArea
  name="notes"
  label="Notes"
  autoSize={{ minRows: 3, maxRows: 6 }}
/>
```

---

### FormItemNumber
Component wrapper cho `Form.Item` với `InputNumber`.

#### Props đầy đủ

**Base Props:** (giống FormItemText)

**Number-specific Props:**
- `inputNumberProps`: `InputNumberProps` - Props truyền vào InputNumber
- `placeholder`: `string` - Placeholder text
- `min`: `number` - Giá trị tối thiểu
- `max`: `number` - Giá trị tối đa
- `precision`: `number` - Số chữ số thập phân
- `step`: `number | string` - Bước tăng/giảm
- `controls`: `boolean` - Hiển thị nút tăng/giảm
- `size`: `'small' | 'middle' | 'large'` - Kích thước
- `prefix`: `React.ReactNode` - Element trước (ví dụ: $)
- `suffix`: `React.ReactNode` - Element sau (ví dụ: USD)
- `readOnly`: `boolean` - Chỉ đọc
- `autoFocus`: `boolean` - Tự động focus
- `formatter`: `(value) => string` - Format hiển thị
- `parser`: `(displayValue) => number` - Parse từ display
- `thousandSeparator`: `boolean | string` - Dấu phân cách hàng nghìn

#### Ví dụ

```tsx
import { FormItemNumber } from '@/components/form';

// Basic
<FormItemNumber
  name="age"
  label="Age"
  min={0}
  max={120}
  rules={[{ required: true }]}
/>

// Currency
<FormItemNumber
  name="price"
  label="Price"
  min={0}
  precision={2}
  prefix="$"
  formatter={(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
  parser={(value) => value!.replace(/\$\s?|(,*)/g, '')}
/>

// With thousand separator
<FormItemNumber
  name="quantity"
  label="Quantity"
  thousandSeparator=","
  step={10}
/>
```

---

### FormItemSelect
Component wrapper cho `Form.Item` với `Select`.

#### Props đầy đủ

**Base Props:** (giống FormItemText)

**Select-specific Props:**
- `selectProps`: `Omit<SelectProps, 'options'>` - Props truyền vào Select
- `options`: `SelectOption[]` - Mảng options `{ label: string, value: string | number, disabled?: boolean }`
- `placeholder`: `string` - Placeholder text
- `allowClear`: `boolean` - Cho phép xóa (default: true)
- `showSearch`: `boolean` - Hiển thị search (default: false)
- `mode`: `'multiple' | 'tags'` - Chế độ chọn nhiều
- `size`: `'small' | 'middle' | 'large'` - Kích thước
- `loading`: `boolean` - Hiển thị loading
- `filterOption`: `boolean | (input: string, option: SelectOption) => boolean` - Custom filter
- `optionRender`: `(option: SelectOption) => React.ReactNode` - Custom render option
- `maxTagCount`: `number | 'responsive'` - Số tag tối đa hiển thị (multiple mode)
- `maxTagPlaceholder`: `React.ReactNode | (omittedValues) => React.ReactNode` - Placeholder cho tags bị ẩn
- `showArrow`: `boolean` - Hiển thị mũi tên
- `dropdownRender`: `(menu: React.ReactElement) => React.ReactElement` - Custom dropdown
- `tagRender`: `(props) => React.ReactElement` - Custom tag render

#### Ví dụ

```tsx
import { FormItemSelect } from '@/components/form';

// Basic
<FormItemSelect
  name="status"
  label="Status"
  options={[
    { label: 'Active', value: 'active' },
    { label: 'Inactive', value: 'inactive' }
  ]}
  rules={[{ required: true }]}
/>

// With search
<FormItemSelect
  name="category"
  label="Category"
  options={categories}
  showSearch={true}
  placeholder="Search category..."
/>

// Multiple selection
<FormItemSelect
  name="tags"
  label="Tags"
  options={tagOptions}
  mode="multiple"
  maxTagCount={3}
  maxTagPlaceholder={(omittedValues) => `+${omittedValues.length} more`}
/>

// Custom filter
<FormItemSelect
  name="user"
  label="User"
  options={users}
  showSearch={true}
  filterOption={(input, option) =>
    option.label.toLowerCase().includes(input.toLowerCase()) ||
    option.value.toString().includes(input)
  }
/>
```

---

## Ví Dụ Sử Dụng Đầy Đủ

### Form hoàn chỉnh với tất cả components

```tsx
import { Form } from 'antd';
import { 
  FormItemText, 
  FormItemTextArea, 
  FormItemNumber, 
  FormItemSelect 
} from '@/components/form';
import { MailOutlined, PhoneOutlined } from '@ant-design/icons';

const MyForm = () => {
  const [form] = Form.useForm();

  return (
    <Form form={form} layout="vertical">
      {/* Text Input */}
      <FormItemText
        name="name"
        label="Full Name"
        required
        rules={[
          { required: true, message: 'Please enter name' },
          { min: 2, message: 'Name must be at least 2 characters' }
        ]}
        placeholder="Enter your full name"
      />

      {/* Email with icon */}
      <FormItemText
        name="email"
        label="Email"
        type="email"
        prefix={<MailOutlined />}
        rules={[
          { required: true, message: 'Please enter email' },
          { type: 'email', message: 'Invalid email format' }
        ]}
        autoComplete="email"
      />

      {/* Phone */}
      <FormItemText
        name="phone"
        label="Phone"
        type="tel"
        prefix={<PhoneOutlined />}
        maxLength={20}
        placeholder="Enter phone number"
      />

      {/* Number */}
      <FormItemNumber
        name="age"
        label="Age"
        min={18}
        max={100}
        rules={[{ required: true }]}
        tooltip="Must be between 18 and 100"
      />

      {/* TextArea */}
      <FormItemTextArea
        name="description"
        label="Description"
        rows={4}
        maxLength={500}
        showCount
        placeholder="Enter description"
      />

      {/* Select */}
      <FormItemSelect
        name="status"
        label="Status"
        required
        options={[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' }
        ]}
        rules={[{ required: true }]}
      />
    </Form>
  );
};
```

## Type Exports

Tất cả types được export từ `@/components/form`:

```tsx
import type {
  SelectOption,
  BaseFormItemProps,
  FormItemTextProps,
  FormItemTextAreaProps,
  FormItemNumberProps,
  FormItemSelectProps,
} from '@/components/form';
```
