import { ReactNode } from 'react';
import { TableProps, ColumnsType } from 'antd/es/table';
import { FormProps } from 'antd/es/form';
import { SelectProps } from 'antd/es/select';
import { InputProps } from 'antd/es/input';

/**
 * Base Table Action configuration
 */
export interface BaseTableAction<T> {
  /** Action key (unique identifier) */
  key: string;
  /** Action label text */
  label: string;
  /** Action icon element */
  icon?: ReactNode;
  /** Action type: 'view' | 'edit' | 'delete' | 'custom' */
  type?: 'view' | 'edit' | 'delete' | 'custom';
  /** Custom onClick handler (required for 'custom' type) */
  onClick?: (record: T) => void;
  /** Whether action requires confirmation dialog */
  confirm?: boolean;
  /** Confirmation message (can be function for dynamic message) */
  confirmMessage?: string | ((record: T) => string);
  /** Button type */
  buttonType?: 'link' | 'text' | 'default' | 'primary' | 'dashed';
  /** Whether action is dangerous (red color) */
  danger?: boolean;
  /** Function to determine if action is disabled */
  disabled?: (record: T) => boolean;
  /** Tooltip text */
  tooltip?: string;
}

/**
 * Base Table Column configuration
 */
export interface BaseTableColumn<T> extends Omit<ColumnsType<T>[0], 'render'> {
  /** Column title */
  title: string;
  /** Data index (field name or array of nested fields) */
  dataIndex?: string | string[];
  /** Custom render function */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (value: any, record: T, index: number) => ReactNode;
  /** Whether column is sortable (boolean or custom sorter function) */
  sorter?: boolean | ((a: T, b: T) => number);
  /** Whether column is filterable */
  filterable?: boolean;
  /** Column width (number or string) */
  width?: number | string;
  /** Column fixed position */
  fixed?: 'left' | 'right' | boolean;
  /** Column text alignment */
  align?: 'left' | 'right' | 'center';
  /** Whether column can be resized */
  resizable?: boolean;
  /** Column ellipsis configuration */
  ellipsis?: boolean | { showTitle?: boolean };
}

/**
 * Base Table Props
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface BaseTableProps<T extends Record<string, any>> 
  extends Omit<TableProps<T>, 'columns' | 'dataSource'> {
  /** Table columns configuration */
  columns: BaseTableColumn<T>[];
  /** Table data source */
  dataSource?: T[];
  /** Loading state */
  loading?: boolean;
  /** Row key field name or function (default: 'id') */
  rowKey?: string | ((record: T) => string);
  /** Resource name for Refine navigation */
  resource?: string;
  /** Whether to show default actions column (View, Edit, Delete) */
  showActions?: boolean;
  /** Custom actions configuration */
  actions?: BaseTableAction<T>[];
  /** On row click handler */
  onRowClick?: (record: T) => void;
  /** On edit handler */
  onEdit?: (record: T) => void;
  /** On delete handler */
  onDelete?: (record: T) => Promise<void> | void;
  /** On view handler */
  onView?: (record: T) => void;
  /** Delete confirmation message (can be function) */
  deleteConfirmMessage?: string | ((record: T) => string);
  /** Success message after delete */
  deleteSuccessMessage?: string;
  /** Error message after delete */
  deleteErrorMessage?: string;
  /** Whether to use Refine's useDelete hook */
  useRefineDelete?: boolean;
  /** Empty state message */
  emptyText?: ReactNode;
  /** Scroll configuration */
  scroll?: { x?: number | string | true; y?: number | string };
  /** Table size */
  size?: 'small' | 'middle' | 'large';
  /** Row selection configuration */
  rowSelection?: TableProps<T>['rowSelection'];
  /** Expandable row configuration */
  expandable?: TableProps<T>['expandable'];
  /** Pagination configuration (false to disable) */
  pagination?: TableProps<T>['pagination'] | false;
  /** Whether to show table header */
  showHeader?: boolean;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}

/**
 * Search field configuration for BaseTableHeader
 */
export interface BaseTableSearchField {
  /** Field name */
  name: string;
  /** Field type: 'text' | 'select' */
  type?: 'text' | 'select';
  /** Placeholder text */
  placeholder?: string;
  /** Field width */
  width?: number | string;
  /** Whether to show search icon (for text fields) */
  showSearchIcon?: boolean;
  /** Options for select field */
  options?: SelectProps['options'];
  /** Show search for select field */
  showSearch?: boolean;
  /** Custom filter function for select */
  filterOption?: SelectProps['filterOption'];
  /** Additional input props */
  inputProps?: InputProps;
}

/**
 * Base Table Header Props
 */
export interface BaseTableHeaderProps {
  /** Header title (string or ReactNode) */
  title: string | ReactNode;
  /** Header description */
  description?: string;
  /** Breadcrumb component */
  breadcrumb?: ReactNode;
  /** Custom actions (buttons, etc.) */
  actions?: ReactNode;
  /** Create button click handler */
  onCreate?: () => void;
  /** Create button text */
  createButtonText?: string;
  /** Create button icon */
  createButtonIcon?: ReactNode;
  /** Whether to show create button */
  showCreateButton?: boolean;
  /** Refresh button click handler */
  onRefresh?: () => void;
  /** Whether to show refresh button */
  showRefreshButton?: boolean;
  /** Export button click handler */
  onExport?: () => void;
  /** Whether to show export button */
  showExportButton?: boolean;
  /** Export button text */
  exportButtonText?: string;
  /** Search fields configuration */
  searchFields?: BaseTableSearchField[];
  /** Search form props (from useTable) */
  searchFormProps?: FormProps;
  /** Whether to show search form */
  showSearch?: boolean;
  /** Search form layout */
  searchLayout?: 'inline' | 'horizontal' | 'vertical';
  /** Extra content */
  extra?: ReactNode;
  /** Custom className */
  className?: string;
  /** Custom style */
  style?: React.CSSProperties;
}
