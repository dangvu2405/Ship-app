import { useMemo } from 'react';
import { useTable } from '@refinedev/antd';
import type { CrudFilter } from '@refinedev/core';
import { Button, Dropdown, Empty, Flex, Table, Tag, Typography } from 'antd';
import type { MenuProps } from 'antd';
import { MoreOutlined } from '@ant-design/icons';
import type { Trip } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { ErrorState } from '@/components/common/ErrorState';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { formatCurrencyVND } from '@/utils/format';
import { getTripConventionDisplay } from '@/utils/tripStatus';
import type { ColumnsType } from 'antd/es/table';

export interface TripTableProps {
  permanentFilters: CrudFilter[];
  tripRowMenu: (record: Trip) => MenuProps;
  onRowClick?: (record: Trip) => void;
}

export function TripTable({ permanentFilters, tripRowMenu, onRowClick }: TripTableProps) {
  const { t } = useTranslation();

  const { tableProps, tableQuery } = useTable<Trip>({
    resource: 'trips',
    pagination: { pageSize: 15 },
    filters: { permanent: permanentFilters },
    syncWithLocation: true,
  });

  const total = tableQuery.data?.total ?? 0;

  const columns = useMemo<ColumnsType<Trip>>(
    () => [
      { title: t('trips.code'), dataIndex: 'code', key: 'code', width: 140, fixed: 'left' },
      {
        title: t('invoices.customer'),
        key: 'customer',
        width: 180,
        ellipsis: true,
        render: (_: unknown, row) => row.customer?.name ?? (row.customer_id ? `#${row.customer_id}` : '—'),
      },
      {
        title: t('trips.startPoint'),
        dataIndex: 'start_point',
        key: 'start_point',
        ellipsis: true,
        width: 200,
      },
      {
        title: t('trips.endPoint'),
        dataIndex: 'end_point',
        key: 'end_point',
        ellipsis: true,
        width: 200,
      },
      {
        title: t('vehicles.title'),
        key: 'vehicle',
        width: 130,
        render: (_: unknown, row) =>
          row.vehicle?.plate_number ?? (row.vehicle_id ? `#${row.vehicle_id}` : '—'),
      },
      {
        title: t('drivers.title'),
        key: 'driver',
        width: 160,
        ellipsis: true,
        render: (_: unknown, row) =>
          row.driver?.name ?? row.driver?.code ?? (row.driver_id ? `#${row.driver_id}` : '—'),
      },
      {
        title: t('trips.distance'),
        dataIndex: 'distance_km',
        key: 'distance_km',
        width: 100,
        align: 'right',
        render: (v: number) => (v ? `${v} km` : '—'),
      },
      {
        title: t('trips.price'),
        dataIndex: 'price',
        key: 'price',
        width: 140,
        align: 'right',
        render: (_: unknown, row) => formatCurrencyVND(row.price),
      },
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        width: 140,
        render: (_: unknown, row) => {
          const { label, color, style } = getTripConventionDisplay(row.status ?? '', t);
          return <Tag color={color} style={style}>{label}</Tag>;
        },
      },
      {
        title: t('trips.startTime'),
        dataIndex: 'start_time',
        key: 'start_time',
        width: 160,
        render: (_: unknown, row) => <DateTimeBadge value={row.start_time} mode="datetime" />,
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 72,
        render: (_: unknown, row) => (
          <div role="presentation" onClick={(e) => e.stopPropagation()}>
            <Dropdown menu={tripRowMenu(row)} trigger={['click']}>
              <Button type="text" size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
            </Dropdown>
          </div>
        ),
      },
    ],
    [t, tripRowMenu],
  );

  if (tableQuery.isError) {
    return (
      <ErrorState
        title={t('common.loadError')}
        description={t('common.tryAgainDescription')}
        onRetry={() => void tableQuery.refetch()}
      />
    );
  }

  return (
    <>
      <Flex align="center" justify="space-between" style={{ marginBottom: 8 }}>
        <Typography.Text type="secondary">
          {total.toLocaleString('vi-VN')} {t('common.records')}
        </Typography.Text>
      </Flex>
      <Table<Trip>
        {...tableProps}
        rowKey="id"
        columns={columns}
        scroll={{ x: 'max-content' }}
        locale={{
          emptyText: (
            <Empty
              image={Empty.PRESENTED_IMAGE_SIMPLE}
              description={t('common.noData')}
            />
          ),
        }}
        onRow={(record) => ({
          onClick: () => onRowClick?.(record),
          style: { cursor: onRowClick ? 'pointer' : undefined },
        })}
        className="enterprise-table"
      />
    </>
  );
}
