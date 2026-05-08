import { useMemo, useState } from 'react';
import { Card, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useList } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import type { Vehicle, VehicleExpense } from '@/types';
import { formatMoney } from '@/utils/displayFormat';

const EXPENSE_TYPE_LABELS: Record<string, string> = {
  fuel: 'Nhiên liệu',
  toll: 'Phí cầu đường',
  maintenance: 'Bảo dưỡng',
  repair: 'Sửa chữa',
  parking: 'Đỗ xe',
  insurance: 'Bảo hiểm',
  other: 'Khác',
};

export function VehicleCostsPage() {
  const { t } = useTranslation();
  const [vehicleIdFilter, setVehicleIdFilter] = useState<number | undefined>(undefined);
  const [expenseTypeFilter, setExpenseTypeFilter] = useState<string | undefined>(undefined);

  const { data: vehiclesData } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });

  const { data: expensesData, isLoading } = useList<VehicleExpense>({
    resource: 'vehicle_expenses',
    filters: [
      ...(vehicleIdFilter != null ? [{ field: 'vehicle_id', operator: 'eq' as const, value: vehicleIdFilter }] : []),
      ...(expenseTypeFilter ? [{ field: 'type', operator: 'eq' as const, value: expenseTypeFilter }] : []),
    ],
    pagination: { current: 1, pageSize: 100 },
    sorters: [{ field: 'expense_date', order: 'desc' }],
  });

  const vehicles = useMemo(() => vehiclesData?.data ?? [], [vehiclesData?.data]);
  const expenses = useMemo(() => expensesData?.data ?? [], [expensesData?.data]);

  const vehicleMap = useMemo(() => {
    const map = new Map<number, Vehicle>();
    vehicles.forEach((vehicle) => map.set(vehicle.id, vehicle));
    return map;
  }, [vehicles]);

  const columns = useMemo<ColumnsType<VehicleExpense>>(
    () => [
      { title: 'ID', dataIndex: 'id', key: 'id', width: 70 },
      {
        title: 'Biển số xe',
        key: 'vehicle',
        render: (_, record) => {
          const vehicle = record.vehicle ?? vehicleMap.get(record.vehicle_id);
          return vehicle?.plate_number ?? `#${record.vehicle_id}`;
        },
      },
      {
        title: 'Loại chi phí',
        key: 'type',
        render: (_, record) => (
          <Tag>{EXPENSE_TYPE_LABELS[record.type] ?? record.type}</Tag>
        ),
      },
      {
        title: t('trips.price'),
        key: 'amount',
        align: 'right',
        render: (_, record) => formatMoney(record.amount, { withCurrency: true }),
      },
      {
        title: 'Ngày chi phí',
        key: 'expense_date',
        render: (_, record) => <DateTimeBadge value={record.expense_date} mode="date" />,
      },
      {
        title: t('common.note'),
        key: 'note',
        render: (_, record) => (
          <Typography.Text ellipsis={{ tooltip: record.note }} style={{ maxWidth: 260 }}>
            {record.note ?? '-'}
          </Typography.Text>
        ),
      },
    ],
    [t, vehicleMap],
  );

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((vehicle) => ({
        value: vehicle.id,
        label: `${vehicle.plate_number}${vehicle.brand ? ` · ${vehicle.brand}` : ''}`,
      })),
    [vehicles],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title="Chi phí xe"
        description="Theo dõi chi phí đội xe theo phương tiện và loại phát sinh"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.vehicles'), path: ROUTES.admin.vehicles.list },
          { label: 'Chi phí xe' },
        ]}
      />

      <Card>
        <Space wrap style={{ marginBottom: 16 }}>
          <Select
            allowClear
            style={{ width: 280 }}
            placeholder="Lọc theo xe"
            options={vehicleOptions}
            value={vehicleIdFilter}
            onChange={(value) => setVehicleIdFilter(value as number | undefined)}
          />
          <Select
            allowClear
            style={{ width: 220 }}
            placeholder="Lọc loại chi phí"
            options={Object.entries(EXPENSE_TYPE_LABELS).map(([value, label]) => ({ value, label }))}
            value={expenseTypeFilter}
            onChange={(value) => setExpenseTypeFilter(value)}
          />
        </Space>

        <Table<VehicleExpense>
          rowKey="id"
          columns={columns}
          dataSource={expenses}
          loading={isLoading}
          pagination={{ pageSize: 20, showSizeChanger: false }}
          locale={{ emptyText: t('common.noData') }}
          scroll={{ x: 'max-content' }}
        />
      </Card>
    </div>
  );
}
