import type { ReactNode } from 'react';
import { Empty, Table } from 'antd';
import type { TableColumnsType } from 'antd';

type DataTableRecord = { id?: string | number };

export type DataTableColumn<T extends DataTableRecord> = {
  key: string;
  header: ReactNode;
  dataIndex?: keyof T | string;
  render?: (record: T) => ReactNode;
};

type DataTablePagination = {
  current: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

type DataTableProps<T extends DataTableRecord> = {
  data: T[];
  columns: DataTableColumn<T>[];
  onRowClick?: (record: T) => void;
  emptyMessage?: ReactNode;
  emptyDescription?: ReactNode;
  emptyAction?: ReactNode;
  pagination?: DataTablePagination;
};

export const DataTable = <T extends DataTableRecord>({
  data,
  columns,
  onRowClick,
  emptyMessage,
  emptyDescription,
  emptyAction,
  pagination,
}: DataTableProps<T>) => {
  const tableColumns: TableColumnsType<T> = columns.map((column) => ({
    key: column.key,
    title: column.header,
    dataIndex: column.dataIndex as string | undefined,
    render: (_: unknown, record: T) => {
      if (column.render) {
        return column.render(record);
      }
      if (!column.dataIndex) {
        return null;
      }
      return String((record as Record<string, unknown>)[column.dataIndex as string] ?? '');
    },
  }));

  return (
    <Table<T>
      rowKey={(record, index) => {
        const id = record.id;
        if (typeof id === 'string' || typeof id === 'number') {
          return id;
        }
        return String(index ?? 0);
      }}
      dataSource={data}
      columns={tableColumns}
      locale={{
        emptyText: (
          <Empty
            description={emptyDescription ?? emptyMessage}
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          >
            {emptyAction}
          </Empty>
        ),
      }}
      onRow={
        onRowClick
          ? (record) => ({
              onClick: () => onRowClick(record),
              style: { cursor: 'pointer' },
            })
          : undefined
      }
      pagination={
        pagination
          ? {
              current: pagination.current,
              total: pagination.total,
              pageSize: pagination.pageSize,
              onChange: pagination.onPageChange,
            }
          : false
      }
      scroll={{ x: 'max-content' }}
    />
  );
};
