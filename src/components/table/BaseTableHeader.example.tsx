/**
 * Example: Using BaseTableHeader with BaseTable
 */

import { useState } from 'react';
import { useTable } from '@refinedev/antd';
import { Space } from 'antd';
import { BaseTable, BaseTableHeader, BaseTableColumn } from '@/components/table';
import { Company } from '@/types';

export const CompaniesWithHeader = () => {
  const [, setIsModalVisible] = useState(false);

  const { tableProps, searchFormProps } = useTable<Company>({
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
      width: 100,
    },
  ];

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      {/* Header with title, actions, and search */}
      <BaseTableHeader
        title="Companies"
        description="Manage your companies"
        onCreate={() => setIsModalVisible(true)}
        createButtonText="Add Company"
        showRefreshButton
        onRefresh={() => {
          // Refresh table data
          window.location.reload();
        }}
        showExportButton
        onExport={() => {
          // Export data
          console.log('Exporting...');
        }}
        showSearch
        searchFields={[
          { name: 'name', placeholder: 'Search by name' },
          { name: 'code', placeholder: 'Search by code' },
        ]}
        searchFormProps={searchFormProps}
      />

      {/* Table */}
      <BaseTable<Company>
        {...tableProps}
        dataSource={tableProps.dataSource ? [...tableProps.dataSource] : undefined}
        loading={typeof tableProps.loading === 'boolean' ? tableProps.loading : undefined}
        rowKey={!tableProps.rowKey 
          ? 'id'
          : typeof tableProps.rowKey === 'string' 
            ? tableProps.rowKey 
            : (record: Company) => {
                const key = (tableProps.rowKey as (record: Company) => string | number)(record);
                return typeof key === 'string' ? key : String(key);
              }}
        columns={columns}
        resource="companies"
        showActions
      />
    </Space>
  );
};
