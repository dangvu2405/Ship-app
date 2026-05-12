import React, { useRef, useState, useMemo } from 'react';
import { Table, Button, Space } from 'antd';
import ResizeObserver from 'rc-resize-observer';
import { ReportTableProps, ReportColumn } from '../types';

// This is a placeholder for the actual export service.
// In a real app, this would use a library like 'xlsx'.
const exportService = {
  exportToExcel: (data: any[], columns: ReportColumn[], fileName: string) => {
    console.log('Exporting to Excel:', { data, columns, fileName });
    alert('Export functionality would be triggered here.');
  },
};

const ReportTable: React.FC<ReportTableProps> = ({
  columns,
  data,
  loading,
  pagination,
  onTableChange,
  onExport,
  ...rest
}) => {
  const [tableWidth, setTableWidth] = useState(0);
  const tableRef = useRef<HTMLDivElement>(null);

  const mergedColumns = useMemo(() => {
    const totalWidth = columns.reduce((sum, col) => sum + (Number(col.width) || 0), 0);
    if (tableWidth > totalWidth) {
      // Distribute remaining width to columns without a fixed width
      const unsetWidthColumns = columns.filter(c => !c.width).length;
      const extraWidth = (tableWidth - totalWidth) / unsetWidthColumns;
      return columns.map(col => ({ ...col, width: col.width || extraWidth }));
    }
    return columns.map(col => ({ ...col, width: col.width || 150 })); // Default width
  }, [columns, tableWidth]);

  const handleExport = (format: 'csv' | 'excel') => {
    if (onExport) {
      onExport(format);
    } else {
      exportService.exportToExcel(data, columns, `report-${new Date().toISOString().split('T')[0]}`);
    }
  };

  return (
    <div ref={tableRef}>
      <Space style={{ marginBottom: 16 }}>
        <Button onClick={() => handleExport('excel')}>Export to Excel</Button>
      </Space>
      <ResizeObserver onResize={({ width }) => setTableWidth(width)}>
        <Table
          {...rest}
          columns={mergedColumns}
          dataSource={data}
          loading={loading}
          pagination={pagination ? {
            current: pagination.currentPage,
            pageSize: pagination.perPage,
            total: pagination.total,
          } : false}
          onChange={onTableChange}
          scroll={{ y: 500, x: '100vw' }}
        />
      </ResizeObserver>
    </div>
  );
};

export default ReportTable;
