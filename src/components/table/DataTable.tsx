import { useMemo, type MouseEvent, type ReactNode } from 'react';
import { InboxOutlined } from '@ant-design/icons';
import { Card, Empty, Pagination, Spin, Table, theme } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { cn } from '@/lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  dataIndex?: string | string[];
  render?: (item: T) => ReactNode;
  sortable?: boolean;
}

export interface DataTablePagination {
  current: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
}

export interface DataTableProps<T> {
  data: T[];
  columns: DataTableColumn<T>[];
  loading?: boolean;
  onRowClick?: (item: T) => void;
  emptyMessage?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  pagination?: DataTablePagination;
}

function DataTableEmptyInner({
  emptyMessage,
  emptyDescription,
  emptyAction,
  className,
}: {
  emptyMessage: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('mx-auto flex max-w-md flex-col items-center px-6 py-12 text-center', className)}>
      <Empty
        image={<InboxOutlined style={{ fontSize: 40, color: 'var(--ant-color-text-tertiary)' }} />}
        description={
          <div>
            <div style={{ fontWeight: 600 }}>{emptyMessage}</div>
            {emptyDescription ? (
              <div style={{ marginTop: 8, fontSize: 14, color: 'var(--ant-color-text-secondary)' }}>{emptyDescription}</div>
            ) : null}
          </div>
        }
      />
      {emptyAction ? <div style={{ marginTop: 24 }}>{emptyAction}</div> : null}
    </div>
  );
}

function DataTableEmptyStandalone(props: { emptyMessage: string; emptyDescription?: string; emptyAction?: ReactNode }) {
  const { token } = theme.useToken();
  return (
    <Card
      styles={{ body: { padding: 0 } }}
      style={{ borderRadius: token.borderRadiusLG * 1.25, overflow: 'hidden' }}
    >
      <DataTableEmptyInner {...props} />
    </Card>
  );
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  loading,
  onRowClick,
  emptyMessage = 'No data available',
  emptyDescription,
  emptyAction,
  pagination,
}: DataTableProps<T>) {
  const { token } = theme.useToken();

  const antColumns: ColumnsType<T> = useMemo(
    () =>
      columns.map((column) => ({
        title: column.header,
        key: column.key,
        dataIndex: (column.dataIndex ?? column.key) as string | string[],
        align: 'center' as const,
        onCell:
          column.key === 'actions'
            ? () => ({
                onClick: (e: MouseEvent) => {
                  e.stopPropagation();
                },
              })
            : undefined,
        render: column.render
          ? (_: unknown, record: T) => column.render!(record)
          : (value: unknown) => String(value ?? ''),
      })),
    [columns],
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <Spin size="large" />
      </div>
    );
  }

  if (data.length === 0 && !pagination?.total) {
    return <DataTableEmptyStandalone emptyMessage={emptyMessage} emptyDescription={emptyDescription} emptyAction={emptyAction} />;
  }

  return (
    <>
      <Card
        styles={{ body: { padding: 0 } }}
        style={{ borderRadius: token.borderRadiusLG * 1.25, overflow: 'hidden' }}
      >
        <Table<T>
          rowKey="id"
          columns={antColumns}
          dataSource={data}
          pagination={false}
          loading={false}
          tableLayout="fixed"
          size="middle"
          locale={{
            emptyText:
              emptyDescription || emptyAction ? (
                <DataTableEmptyInner
                  emptyMessage={emptyMessage}
                  emptyDescription={emptyDescription}
                  emptyAction={emptyAction}
                />
              ) : (
                emptyMessage
              ),
          }}
          onRow={(record) => ({
            onClick: () => onRowClick?.(record),
            style: { cursor: onRowClick ? 'pointer' : undefined },
          })}
        />
      </Card>
      {pagination && pagination.total > pagination.pageSize && (
        <div style={{ marginTop: 16, display: 'flex', justifyContent: 'flex-end' }}>
          <Pagination
            current={pagination.current}
            total={pagination.total}
            pageSize={pagination.pageSize}
            onChange={(page) => pagination.onPageChange(page)}
            showSizeChanger={false}
            showTotal={(total, range) => `${range[0]}-${range[1]} / ${total}`}
          />
        </div>
      )}
    </>
  );
}
