import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { getReportData } from '../services/reportService';
import { ReportResponse, PaginationMeta } from '../types';

const useReportData = (initialPage = 1, initialPageSize = 10) => {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialPageSize);
  const [filters, setFilters] = useState<Record<string, unknown>>({});
  const [sorter, setSorter] = useState<Record<string, unknown>>({});

  const { data, isLoading, isError, error } = useQuery<ReportResponse, Error>({
    queryKey: ['reportData', page, pageSize, filters, sorter],
    queryFn: () => getReportData({ page, pageSize, ...filters, ...sorter }),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const handleTableChange = (pagination: any, newFilters: any, newSorter: any) => {
    setPage(pagination.current);
    setPageSize(pagination.pageSize);
    setFilters(newFilters);
    setSorter(newSorter.field ? { sortField: newSorter.field, sortOrder: newSorter.order } : {});
  };

  const paginationMeta: PaginationMeta | undefined = data?.meta;

  return {
    data: data?.data || [],
    loading: isLoading,
    isError,
    error,
    pagination: paginationMeta ? {
      currentPage: paginationMeta.currentPage,
      perPage: paginationMeta.perPage,
      total: paginationMeta.total,
      totalPages: paginationMeta.totalPages,
    } : undefined,
    handleTableChange,
    setFilters,
  };
};

export default useReportData;
