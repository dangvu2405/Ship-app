# Table Components

Các component table tái sử dụng với Ant Design và Refine integration.

## BaseTableHeader

Component header cho table với title, actions, và search form.

### Props đầy đủ

**Basic Props:**
- `title`: `string | ReactNode` - Header title
- `description`: `string` - Header description
- `breadcrumb`: `ReactNode` - Breadcrumb component
- `actions`: `ReactNode` - Custom actions (buttons, etc.)
- `extra`: `ReactNode` - Extra content

**Create Button:**
- `onCreate`: `() => void` - Create button click handler
- `createButtonText`: `string` - Create button text (default: 'Create')
- `createButtonIcon`: `ReactNode` - Create button icon (default: PlusOutlined)
- `showCreateButton`: `boolean` - Show create button (default: true)

**Other Buttons:**
- `onRefresh`: `() => void` - Refresh button handler
- `showRefreshButton`: `boolean` - Show refresh button (default: false)
- `onExport`: `() => void` - Export button handler
- `showExportButton`: `boolean` - Show export button (default: false)
- `exportButtonText`: `string` - Export button text (default: 'Export')

**Search:**
- `showSearch`: `boolean` - Show search form (default: false)
- `searchFields`: `BaseTableSearchField[]` - Search fields configuration
- `searchFormProps`: `FormProps` - Search form props (from useTable)
- `searchLayout`: `'inline' | 'horizontal' | 'vertical'` - Search form layout (default: 'inline')

**Other:**
- `className`: `string` - Custom class name
- `style`: `React.CSSProperties` - Custom style

### BaseTableSearchField

```tsx
interface BaseTableSearchField {
  name: string;
  type?: 'text' | 'select';
  placeholder?: string;
  width?: number | string;
  showSearchIcon?: boolean;
  options?: SelectProps['options']; // For select type
  showSearch?: boolean; // For select type
  filterOption?: SelectProps['filterOption']; // For select type
  inputProps?: InputProps; // For text type
}
```

### Ví dụ sử dụng BaseTableHeader

```tsx
import { BaseTableHeader } from '@/components/table';
import { useTable } from '@refinedev/antd';

const MyPage = () => {
  const { tableProps, searchFormProps } = useTable({
    resource: 'companies',
  });

  return (
    <>
      <BaseTableHeader
        title="Companies"
        description="Manage your companies"
        onCreate={() => setIsModalVisible(true)}
        showRefreshButton
        onRefresh={() => refetch()}
        showExportButton
        onExport={() => handleExport()}
        showSearch
        searchFields={[
          { name: 'name', placeholder: 'Search by name' },
          { name: 'code', placeholder: 'Search by code' },
        ]}
        searchFormProps={searchFormProps}
      />
      {/* Table */}
    </>
  );
};
```

### Ví dụ với Select search field

```tsx
<BaseTableHeader
  title="Companies"
  showSearch
  searchFields={[
    { 
      name: 'status', 
      type: 'select',
      placeholder: 'Select status',
      options: [
        { label: 'Active', value: 'active' },
        { label: 'Inactive', value: 'inactive' }
      ],
      showSearch: true
    },
    { name: 'name', placeholder: 'Search by name' }
  ]}
  searchFormProps={searchFormProps}
/>
```

---

## BaseTable

Component table base với đầy đủ tính năng: sorting, pagination, actions, row selection, và tích hợp với Refine.

### Props đầy đủ

**Base Props (từ Ant Design Table):**
- Tất cả props của `Table` component từ Ant Design
- `columns`: `BaseTableColumn<T>[]` - Cấu hình columns
- `dataSource`: `T[]` - Dữ liệu table
- `loading`: `boolean` - Loading state
- `rowKey`: `string | (record) => string` - Row key (default: 'id')
- `scroll`: `{ x?: number | string | true; y?: number | string }` - Scroll config
- `size`: `'small' | 'middle' | 'large'` - Table size
- `pagination`: `TableProps['pagination'] | false` - Pagination config
- `rowSelection`: `TableProps['rowSelection']` - Row selection config
- `expandable`: `TableProps['expandable']` - Expandable rows config

**Refine Integration:**
- `resource`: `string` - Resource name cho Refine navigation
- `useRefineDelete`: `boolean` - Sử dụng Refine's useDelete hook (default: true)

**Actions:**
- `showActions`: `boolean` - Hiển thị actions column mặc định (View, Edit, Delete)
- `actions`: `BaseTableAction<T>[]` - Custom actions configuration
- `onEdit`: `(record: T) => void` - Custom edit handler
- `onDelete`: `(record: T) => Promise<void> | void` - Custom delete handler
- `onView`: `(record: T) => void` - Custom view handler
- `deleteConfirmMessage`: `string | (record: T) => string` - Delete confirmation message
- `deleteSuccessMessage`: `string` - Success message sau khi delete
- `deleteErrorMessage`: `string` - Error message sau khi delete

**Other:**
- `onRowClick`: `(record: T) => void` - Row click handler
- `emptyText`: `ReactNode` - Empty state message
- `showHeader`: `boolean` - Hiển thị header (default: true)
- `className`: `string` - Custom class name
- `style`: `React.CSSProperties` - Custom style

### BaseTableColumn

```tsx
interface BaseTableColumn<T> {
  title: string;
  dataIndex?: string | string[];
  render?: (value: any, record: T, index: number) => ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filterable?: boolean;
  width?: number | string;
  fixed?: 'left' | 'right' | boolean;
  align?: 'left' | 'right' | 'center';
  resizable?: boolean;
  ellipsis?: boolean | { showTitle?: boolean };
}
```

### BaseTableAction

```tsx
interface BaseTableAction<T> {
  key: string;
  label: string;
  icon?: ReactNode;
  type?: 'view' | 'edit' | 'delete' | 'custom';
  onClick?: (record: T) => void;
  confirm?: boolean;
  confirmMessage?: string | ((record: T) => string);
  buttonType?: 'link' | 'text' | 'default' | 'primary' | 'dashed';
  danger?: boolean;
  disabled?: (record: T) => boolean;
  tooltip?: string;
}
```

## Ví Dụ Sử Dụng

### Basic với Refine useTable

```tsx
import { useTable } from '@refinedev/antd';
import { BaseTable } from '@/components/table';
import { Company } from '@/types';

const CompaniesPage = () => {
  const { tableProps } = useTable<Company>({
    resource: 'companies',
    pagination: { pageSize: 10 },
  });

  const columns: BaseTableColumn<Company>[] = [
    {
      title: 'Code',
      dataIndex: 'code',
      sorter: true,
      width: 120,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      sorter: true,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (status: string) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status.toUpperCase()}
        </Tag>
      ),
    },
  ];

  return (
    <BaseTable<Company>
      {...tableProps}
      columns={columns}
      resource="companies"
      showActions
    />
  );
};
```

### Với Custom Actions

```tsx
import { BaseTable, BaseTableAction } from '@/components/table';
import { DownloadOutlined, ShareAltOutlined } from '@ant-design/icons';

const actions: BaseTableAction<Company>[] = [
  {
    key: 'view',
    label: 'View',
    type: 'view',
    icon: <EyeOutlined />,
    buttonType: 'link',
  },
  {
    key: 'download',
    label: 'Download',
    type: 'custom',
    icon: <DownloadOutlined />,
    onClick: (record) => handleDownload(record),
  },
  {
    key: 'share',
    label: 'Share',
    type: 'custom',
    icon: <ShareAltOutlined />,
    onClick: (record) => handleShare(record),
    tooltip: 'Share this company',
  },
  {
    key: 'delete',
    label: 'Delete',
    type: 'delete',
    icon: <DeleteOutlined />,
    danger: true,
    confirm: true,
    confirmMessage: (record) => `Delete ${record.name}?`,
  },
];

<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  actions={actions}
  resource="companies"
/>
```

### Với Row Selection

```tsx
const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  rowSelection={{
    selectedRowKeys,
    onChange: (keys) => setSelectedRowKeys(keys),
    onSelectAll: (selected, selectedRows, changeRows) => {
      console.log('Select all:', selected);
    },
  }}
/>
```

### Với Custom Handlers

```tsx
<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  onRowClick={(record) => {
    console.log('Row clicked:', record);
    navigate(`/companies/${record.id}`);
  }}
  onEdit={(record) => {
    setEditingCompany(record);
    setIsModalVisible(true);
  }}
  onDelete={async (record) => {
    await customDeleteAPI(record.id);
  }}
  deleteConfirmMessage={(record) => `Delete ${record.name}?`}
  deleteSuccessMessage="Company deleted successfully"
/>
```

### Với Expandable Rows

```tsx
<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  expandable={{
    expandedRowRender: (record) => (
      <div>
        <p>Address: {record.address}</p>
        <p>Tax Code: {record.tax_code}</p>
      </div>
    ),
    rowExpandable: (record) => !!record.address,
  }}
/>
```

### Với Custom Pagination

```tsx
<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  pagination={{
    current: currentPage,
    pageSize: 10,
    total: totalItems,
    showSizeChanger: true,
    showTotal: (total) => `Total ${total} companies`,
    onChange: (page, pageSize) => {
      setCurrentPage(page);
      setPageSize(pageSize);
    },
  }}
/>
```

### Với Scroll

```tsx
<BaseTable<Company>
  columns={columns}
  dataSource={companies}
  scroll={{ x: 1200, y: 400 }}
/>
```

### Disable Actions cho một số rows

```tsx
const actions: BaseTableAction<Company>[] = [
  {
    key: 'edit',
    label: 'Edit',
    type: 'edit',
    disabled: (record) => record.status === 'inactive',
  },
  {
    key: 'delete',
    label: 'Delete',
    type: 'delete',
    disabled: (record) => record.isSystem,
  },
];
```

## Migration từ Table thông thường

### Before (Ant Design Table)

```tsx
<Table
  {...tableProps}
  columns={columns}
  rowKey="id"
  scroll={{ x: 1000 }}
/>
```

### After (BaseTable)

```tsx
<BaseTable
  {...tableProps}
  columns={columns}
  resource="companies"
  showActions
/>
```

## Type Exports

```tsx
import type {
  BaseTableProps,
  BaseTableAction,
  BaseTableColumn,
} from '@/components/table';
```
