import { App, Table, Space, Button, Popconfirm, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { 
  EditOutlined, 
  DeleteOutlined, 
  EyeOutlined
} from '@ant-design/icons';
import { useNavigation, useDelete } from '@refinedev/core';
import type { BaseTableProps, BaseTableAction } from './types';

// Re-export types
export type { BaseTableProps, BaseTableAction, BaseTableColumn } from './types';

/**
 * BaseTable - Reusable table component with Ant Design and Refine integration
 * 
 * @example Basic usage
 * ```tsx
 * const { tableProps } = useTable<Company>({ resource: 'companies' });
 * 
 * <BaseTable<Company>
 *   {...tableProps}
 *   columns={columns}
 *   resource="companies"
 *   showActions
 * />
 * ```
 * 
 * @example With custom actions
 * ```tsx
 * <BaseTable<Company>
 *   columns={columns}
 *   dataSource={data}
 *   actions={[
 *     { key: 'view', label: 'View', type: 'view', icon: <EyeOutlined /> },
 *     { key: 'edit', label: 'Edit', type: 'edit', icon: <EditOutlined /> },
 *     { 
 *       key: 'custom', 
 *       label: 'Custom', 
 *       type: 'custom',
 *       onClick: (record) => handleCustom(record)
 *     }
 *   ]}
 * />
 * ```
 */
export function BaseTable<T extends Record<string, unknown>>({
  columns,
  dataSource,
  loading,
  rowKey = 'id',
  resource,
  showActions = false,
  actions,
  onRowClick,
  onEdit,
  onDelete,
  onView,
  deleteConfirmMessage = 'Are you sure you want to delete this item?',
  deleteSuccessMessage = 'Item deleted successfully',
  deleteErrorMessage = 'Failed to delete item',
  useRefineDelete = true,
  emptyText = 'No data available',
  scroll,
  size = 'middle',
  rowSelection,
  expandable,
  pagination,
  showHeader = true,
  className,
  style,
  ...tableProps
}: BaseTableProps<T>) {
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const { message } = App.useApp();

  const getRecordKey = (record: T): string | number | undefined => {
    if (typeof rowKey === 'function') {
      return rowKey(record);
    }

    if (typeof rowKey === 'string') {
      const value = record[rowKey as keyof T];
      if (typeof value === 'string' || typeof value === 'number') {
        return value;
      }
    }

    return undefined;
  };

  // Handle delete action
  const handleDelete = async (record: T) => {
    if (useRefineDelete && resource) {
      const id = getRecordKey(record);
      if (id === undefined) {
        message.error(deleteErrorMessage);
        return;
      }

      deleteItem(
        {
          resource,
          id,
        },
        {
          onSuccess: () => {
            message.success(deleteSuccessMessage);
          },
          onError: () => {
            message.error(deleteErrorMessage);
          },
        }
      );
    } else if (onDelete) {
      try {
        await onDelete(record);
        message.success(deleteSuccessMessage);
      } catch (error) {
        message.error(deleteErrorMessage);
      }
    }
  };

  // Handle view action
  const handleView = (record: T) => {
    if (onView) {
      onView(record);
    } else if (resource) {
      const id = getRecordKey(record);
      if (id === undefined) {
        return;
      }
      show(resource, id);
    }
  };

  // Handle edit action
  const handleEdit = (record: T) => {
    if (onEdit) {
      onEdit(record);
    } else if (resource) {
      const id = getRecordKey(record);
      if (id === undefined) {
        return;
      }
      show(resource, id);
    }
  };

  // Build default actions
  const defaultActions: BaseTableAction<T>[] = [
    {
      key: 'view',
      label: 'View',
      type: 'view',
      icon: <EyeOutlined />,
      buttonType: 'link',
      onClick: handleView,
    },
    {
      key: 'edit',
      label: 'Edit',
      type: 'edit',
      icon: <EditOutlined />,
      buttonType: 'link',
      onClick: handleEdit,
    },
    {
      key: 'delete',
      label: 'Delete',
      type: 'delete',
      icon: <DeleteOutlined />,
      buttonType: 'link',
      danger: true,
      confirm: true,
      confirmMessage: typeof deleteConfirmMessage === 'function'
        ? deleteConfirmMessage
        : deleteConfirmMessage,
      onClick: handleDelete,
    },
  ];

  // Use custom actions or default actions
  const tableActions = actions || (showActions ? defaultActions : []);

  // Build actions column if needed
  const actionsColumn: ColumnsType<T>[0] | null = tableActions.length > 0
    ? {
        title: 'Actions',
        key: 'actions',
        dataIndex: 'actions',
        width: 150,
        fixed: 'right' as const,
        align: 'center' as const,
        render: (_: unknown, record: T) => {
          return (
            <Space size="small">
              {tableActions.map((action) => {
                const isDisabled = action.disabled ? action.disabled(record) : false;
                const button = (
                  <Button
                    key={action.key}
                    type={action.buttonType || 'link'}
                    size="small"
                    danger={action.danger}
                    disabled={isDisabled}
                    icon={action.icon}
                    onClick={() => {
                      if (action.type === 'delete' && action.confirm) {
                        // Delete will be handled by Popconfirm
                        return;
                      }
                      if (action.onClick) {
                        action.onClick(record);
                      } else if (action.type === 'view') {
                        handleView(record);
                      } else if (action.type === 'edit') {
                        handleEdit(record);
                      } else if (action.type === 'delete') {
                        handleDelete(record);
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                );

                if (action.confirm && action.type === 'delete') {
                  const confirmMsg = typeof action.confirmMessage === 'function'
                    ? action.confirmMessage(record)
                    : action.confirmMessage || deleteConfirmMessage;

                  return (
                    <Popconfirm
                      key={action.key}
                      title={confirmMsg as string}
                      onConfirm={() => handleDelete(record)}
                      okText="Yes"
                      cancelText="No"
                      okType="danger"
                    >
                      {button}
                    </Popconfirm>
                  );
                }

                if (action.tooltip) {
                  return (
                    <Tooltip key={action.key} title={action.tooltip}>
                      {button}
                    </Tooltip>
                  );
                }

                return button;
              })}
            </Space>
          );
        },
      }
    : null;

  // Merge columns with actions column
  // Convert BaseTableColumn to ColumnsType format
  const normalizedColumns = (columns as ColumnsType<T>).map((column) => ({
    ...column,
    align: column.align ?? ('center' as const),
  }));

  const finalColumns: ColumnsType<T> = [
    ...normalizedColumns,
    ...(actionsColumn ? [actionsColumn] : []),
  ];

  // Handle row click
  const handleRowClick = (record: T) => {
    if (onRowClick) {
      onRowClick(record);
    }
  };

  return (
    <Table<T>
      columns={finalColumns}
      dataSource={dataSource}
      loading={loading}
      rowKey={rowKey}
      scroll={scroll}
      size={size}
      rowSelection={rowSelection}
      expandable={expandable}
      pagination={pagination}
      showHeader={showHeader}
      className={className}
      style={style}
      locale={{
        emptyText: emptyText,
      }}
      onRow={(record) => ({
        onClick: () => handleRowClick(record),
        style: onRowClick ? { cursor: 'pointer' } : {},
      })}
      {...tableProps}
    />
  );
}
