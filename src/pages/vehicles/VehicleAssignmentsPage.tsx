import { useMemo, useState } from 'react';
import { Card, Empty, Select, Spin, Typography } from 'antd';
import { useList } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { VehicleAssignments } from './VehicleAssignments';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle } from '@/types';
import { ROUTES } from '@/routes';

export function VehicleAssignmentsPage() {
  const { t } = useTranslation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);

  const { data: vehiclesData, isLoading: vehiclesLoading } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });

  const vehicles = useMemo(() => vehiclesData?.data ?? [], [vehiclesData?.data]);

  const vehicleOptions = useMemo(
    () =>
      vehicles.map((v) => ({
        value: v.id,
        label: `${v.plate_number}${v.brand ? ` · ${v.brand}` : ''}${v.model ? ` ${v.model}` : ''}`,
      })),
    [vehicles],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title="Phân công xe"
        description="Gán tài xế cho xe theo ca vận hành và theo dõi lịch sử phân công"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.vehicles'), path: ROUTES.admin.vehicles.list },
          { label: 'Phân công xe' },
        ]}
      />

      <Card>
        <div style={{ marginBottom: 20 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Chọn xe để phân công tài xế
          </Typography.Text>
          {vehiclesLoading ? (
            <Spin size="small" />
          ) : (
            <Select
              showSearch
              style={{ width: 360 }}
              placeholder="Tìm kiếm theo biển số..."
              value={selectedVehicleId}
              onChange={(value) => setSelectedVehicleId(value as number)}
              options={vehicleOptions}
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
              allowClear
              onClear={() => setSelectedVehicleId(undefined)}
            />
          )}
        </div>

        {selectedVehicleId == null ? (
          <Empty description="Chọn một xe để bắt đầu phân công tài xế" style={{ padding: '40px 0' }} />
        ) : (
          <VehicleAssignments vehicleId={selectedVehicleId} />
        )}
      </Card>
    </div>
  );
}
