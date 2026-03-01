import { ReactNode } from 'react';
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
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white dark:bg-gray-900 divide-y divide-gray-200 dark:divide-gray-700">
            {data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              data.map((item) => (
                <tr
                  key={item.id}
                  onClick={() => onRowClick?.(item)}
                  className={onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}
                >
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100"
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
