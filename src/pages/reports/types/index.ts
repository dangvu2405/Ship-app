import { TableProps } from 'antd';

export interface ReportRow {
  [key: string]: any;
}

export interface ReportColumn {
  title: string;
  dataIndex: string;
  key: string;
  width?: number;
  sorter?: boolean;
  render?: (text: any, record: ReportRow) => React.ReactNode;
}

export interface ReportFilter {
  type: 'date-range' | 'search' | 'select';
  key: string;
  label: string;
  options?: { label: string; value: any }[];
}

export interface PaginationMeta {
  currentPage: number;
  perPage: number;
  total: number;
  totalPages: number;
}

export interface ReportResponse {
  data: ReportRow[];
  meta: PaginationMeta;
}

export interface ReportTableProps extends TableProps<ReportRow> {
  columns: ReportColumn[];
  data: ReportRow[];
  loading: boolean;
  pagination?: PaginationMeta;
  onTableChange?: (pagination: any, filters: any, sorter: any) => void;
  onExport?: (format: 'csv' | 'excel') => void;
}
