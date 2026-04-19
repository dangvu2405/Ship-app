---
name: react-antd
description: Viết và refactor code React + Ant Design v5 theo best practice. Dùng khi tạo component UI, form, table, modal, hoặc khi gặp code antd cũ cần migrate. Kích hoạt khi người dùng nhắc "antd", "ant design", hoặc khi file import từ "antd".
paths: **/*.tsx, **/*.jsx, **/*.ts, **/*.js
allowed-tools: Read, Grep, Glob, Edit, Write
---

# React + Ant Design v5

Dự án dùng **Ant Design v5**. Luôn tuân thủ các nguyên tắc dưới đây khi viết hoặc sửa code UI.

## Nguyên tắc cốt lõi

1. **Ưu tiên component của antd** thay vì tự build UI primitive (Button, Input, Select, Table, Form, Modal, Drawer, Tabs, Tag, Space, Flex...).
2. **Không dùng CSS global để override antd** — dùng `ConfigProvider` theme token hoặc `className` scoped.
3. **Dayjs, không moment**. Antd v5 đã bỏ moment. `DatePicker` nhận `Dayjs` object.
4. **TypeScript-first**: tận dụng type từ antd (`TableProps`, `FormProps`, `ColumnsType`, `MenuProps`...).
5. **Accessibility**: giữ nguyên prop `aria-*` mà antd expose, không xoá.

## Setup bắt buộc ở root

```tsx
// App.tsx
import { ConfigProvider, App as AntApp } from 'antd';
import viVN from 'antd/locale/vi_VN';
import 'dayjs/locale/vi';
import dayjs from 'dayjs';

dayjs.locale('vi');

export default function Root() {
  return (
    <ConfigProvider
      locale={viVN}
      theme={{
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6,
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        components: {
          Button: { controlHeight: 36 },
        },
      }}
    >
      <AntApp>
        {/* routes */}
      </AntApp>
    </ConfigProvider>
  );
}
```

**`<App>` wrapper là bắt buộc** để dùng `message`, `notification`, `Modal.confirm` có đúng theme + context. Không dùng static `message.success(...)` trực tiếp — dùng hook.

## Patterns chuẩn

### Message / Notification / Modal (luôn dùng hook, không dùng static)

```tsx
import { App } from 'antd';

function MyButton() {
  const { message, notification, modal } = App.useApp();

  const handleClick = async () => {
    try {
      await saveData();
      message.success('Đã lưu');
    } catch (e) {
      notification.error({ message: 'Lỗi', description: String(e) });
    }
  };

  const handleDelete = () => {
    modal.confirm({
      title: 'Xác nhận xoá?',
      okText: 'Xoá',
      okButtonProps: { danger: true },
      cancelText: 'Huỷ',
      onOk: async () => { await deleteItem(); },
    });
  };

  return <Button onClick={handleClick}>Save</Button>;
}
```

**Lý do**: static API không nhận được theme + locale từ `ConfigProvider`, và sẽ warning ở v5.

### Form — cách chuẩn

```tsx
import { Form, Input, Button, Select, DatePicker } from 'antd';
import type { FormProps } from 'antd';
import dayjs, { Dayjs } from 'dayjs';

type FieldType = {
  name: string;
  email: string;
  role: 'admin' | 'user';
  birthday: Dayjs;
};

export function UserForm({ onSubmit }: { onSubmit: (v: FieldType) => Promise<void> }) {
  const [form] = Form.useForm<FieldType>();
  const [loading, setLoading] = useState(false);

  const onFinish: FormProps<FieldType>['onFinish'] = async (values) => {
    setLoading(true);
    try {
      await onSubmit(values);
      form.resetFields();
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form<FieldType>
      form={form}
      layout="vertical"
      onFinish={onFinish}
      initialValues={{ role: 'user', birthday: dayjs() }}
      autoComplete="off"
      requiredMark="optional"
    >
      <Form.Item<FieldType>
        label="Họ tên"
        name="name"
        rules={[{ required: true, message: 'Nhập họ tên' }]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType>
        label="Email"
        name="email"
        rules={[
          { required: true, message: 'Nhập email' },
          { type: 'email', message: 'Email không hợp lệ' },
        ]}
      >
        <Input />
      </Form.Item>

      <Form.Item<FieldType> label="Role" name="role" rules={[{ required: true }]}>
        <Select options={[
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
        ]} />
      </Form.Item>

      <Form.Item<FieldType> label="Ngày sinh" name="birthday">
        <DatePicker format="DD/MM/YYYY" style={{ width: '100%' }} />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={loading}>
        Lưu
      </Button>
    </Form>
  );
}
```

**Quy tắc Form**:
- Luôn `Form.useForm()` khi cần control từ bên ngoài (reset, setFields, validate).
- `Form.Item` phải có `name` để bind value — không dùng `value`/`onChange` thủ công bên trong.
- Dùng `initialValues` của `Form`, **không** set `defaultValue` trên input con.
- Rule `required: true` đủ cho case đơn giản; custom rule dùng `validator: async (_, v) => {...}`.
- `Form.List` cho mảng field động.
- `Form.useWatch('fieldName', form)` để react theo giá trị field.

### Table — typed, có pagination/filter/sort

```tsx
import { Table, Tag, Space, Button } from 'antd';
import type { TableProps } from 'antd';

type User = { id: string; name: string; role: 'admin' | 'user'; createdAt: string };

const columns: TableProps<User>['columns'] = [
  {
    title: 'Tên',
    dataIndex: 'name',
    key: 'name',
    sorter: (a, b) => a.name.localeCompare(b.name),
  },
  {
    title: 'Role',
    dataIndex: 'role',
    key: 'role',
    filters: [
      { text: 'Admin', value: 'admin' },
      { text: 'User', value: 'user' },
    ],
    onFilter: (value, record) => record.role === value,
    render: (role: User['role']) => (
      <Tag color={role === 'admin' ? 'gold' : 'blue'}>{role}</Tag>
    ),
  },
  {
    title: 'Ngày tạo',
    dataIndex: 'createdAt',
    key: 'createdAt',
    render: (v: string) => dayjs(v).format('DD/MM/YYYY HH:mm'),
  },
  {
    title: 'Hành động',
    key: 'action',
    render: (_, record) => (
      <Space>
        <Button size="small" onClick={() => edit(record)}>Sửa</Button>
        <Button size="small" danger onClick={() => remove(record.id)}>Xoá</Button>
      </Space>
    ),
  },
];

<Table<User>
  rowKey="id"
  columns={columns}
  dataSource={users}
  loading={loading}
  pagination={{ pageSize: 20, showSizeChanger: true }}
  scroll={{ x: 'max-content' }}
/>
```

**Quy tắc Table**:
- `rowKey` bắt buộc, trỏ đến id unique — không để antd dùng index (rerender sai).
- Typed column với `TableProps<T>['columns']` để autocomplete đúng `dataIndex`.
- `scroll={{ x: 'max-content' }}` cho table rộng tránh vỡ layout mobile.
- Server-side pagination: dùng `onChange` lấy `pagination`, `filters`, `sorter` rồi fetch lại.

### Layout — dùng Flex/Space thay vì CSS tay

```tsx
import { Flex, Space } from 'antd';

// Hàng ngang với gap
<Flex gap="middle" align="center" justify="space-between">
  <Title level={3}>Danh sách user</Title>
  <Button type="primary">Thêm mới</Button>
</Flex>

// Cụm button
<Space>
  <Button>Huỷ</Button>
  <Button type="primary">OK</Button>
</Space>

// Vertical stack
<Flex vertical gap={16}>
  <Card>...</Card>
  <Card>...</Card>
</Flex>
```

Không viết `<div style={{ display: 'flex', gap: 16 }}>` khi đã có `Flex`.

### Modal / Drawer — controlled

```tsx
const [open, setOpen] = useState(false);

<Modal
  title="Chỉnh sửa user"
  open={open}
  onCancel={() => setOpen(false)}
  onOk={() => form.submit()}
  okText="Lưu"
  cancelText="Huỷ"
  destroyOnClose        // reset state form khi đóng
  maskClosable={false}  // tránh đóng nhầm khi đang edit
>
  <UserForm />
</Modal>
```

### Icon

```tsx
import { PlusOutlined, DeleteOutlined } from '@ant-design/icons';

<Button type="primary" icon={<PlusOutlined />}>Thêm</Button>
<Button danger icon={<DeleteOutlined />} />
```

Không import `@ant-design/icons` kiểu `import * as Icons` — sẽ bundle toàn bộ icon set.

## Cấm kỵ

- ❌ `import 'antd/dist/antd.css'` — v5 dùng CSS-in-JS, không có file này nữa.
- ❌ `moment` — dùng `dayjs`.
- ❌ Static `message.xxx()`, `notification.xxx()`, `Modal.confirm()` ở top-level — dùng `App.useApp()`.
- ❌ Override class `.ant-*` bằng CSS global — dùng theme token hoặc `ConfigProvider` theo scope.
- ❌ `Form.Item` bọc ngoài input mà dùng state riêng — Form không track được.
- ❌ `Table` không có `rowKey`.
- ❌ `Select` option truyền qua children (`<Select><Option>...`) — dùng prop `options={[...]}`.
- ❌ `Button.Group` — deprecated, dùng `Space.Compact`.
- ❌ `visible` prop trên Modal/Drawer — đổi thành `open` (v5).

## Theme & dark mode

```tsx
import { theme } from 'antd';

<ConfigProvider
  theme={{
    algorithm: darkMode ? theme.darkAlgorithm : theme.defaultAlgorithm,
    token: { colorPrimary: '#1677ff' },
  }}
>
```

Dùng `theme.useToken()` trong component để đọc token động:

```tsx
const { token } = theme.useToken();
<div style={{ padding: token.paddingLG, borderRadius: token.borderRadius }} />
```

## Checklist khi review code antd

1. Có `<ConfigProvider>` + `<App>` ở root chưa?
2. Có còn import từ `moment` không?
3. `message`/`notification`/`Modal.confirm` có gọi qua hook không?
4. Table có `rowKey` chưa, có typed generic `<T>` chưa?
5. Form có `form={form}` + `name` cho mỗi Item không?
6. Prop `visible` còn sót ở Modal/Drawer không?
7. Icon có import named không (không `import *`)?
8. Có CSS override `.ant-*` global không — nếu có, chuyển sang theme token.
9. Select có dùng prop `options` thay cho `<Option>` children không?