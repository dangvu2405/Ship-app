import { ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Pagination } from './Pagination';

function getValue<T>(item: T, dataIndex?: string | string[], key?: string): unknown {
  const path = dataIndex ?? (key ? [key] : []);
  if (Array.isArray(path)) return path.reduce((obj: unknown, k) => (obj != null && typeof obj === 'object' ? (obj as Record<string, unknown>)[k] : undefined), item as unknown);
  return item != null && typeof item === 'object' ? (item as Record<string, unknown>)[path] : undefined;
}

export interface DataTableColumn<T> {
  key: string;
  header: string;
  /** Field path for default cell value (supports nested e.g. ['employee', 'name']) */
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
  pagination?: DataTablePagination;
}

export function DataTable<T extends { id: number }>({
  data,
  columns,
  loading,
  onRowClick,
  emptyMessage = 'No data available',
  pagination,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (data.length === 0 && !pagination?.total) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 dark:text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  const lastPage = pagination ? Math.max(1, Math.ceil(pagination.total / pagination.pageSize)) : 1;

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-border/70 bg-card shadow-sm">
        <table className="min-w-full divide-y divide-border">
          <thead className="sku-table-header sticky top-0 z-10 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-card">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-muted-foreground">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={cn(
                    onRowClick
                      ? 'group cursor-pointer even:bg-muted/30 hover:bg-primary/5 transition-colors'
                      : 'even:bg-muted/30',
                    'supports-[content-visibility:auto]:[content-visibility:auto] supports-[content-visibility:auto]:[contain-intrinsic-size:auto_3rem]'
                  )}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-foreground"
                      onClick={column.key === 'actions' ? (e) => e.stopPropagation() : undefined}
                    >
                      {column.render
                        ? column.render(item)
                        : String(getValue(item, column.dataIndex, column.key) ?? '')}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {pagination && pagination.total > pagination.pageSize && (
        <Pagination
          currentPage={pagination.current}
          lastPage={lastPage}
          onPageChange={pagination.onPageChange}
        />
      )}
    </>
  );
}
