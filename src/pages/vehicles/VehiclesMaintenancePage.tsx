import { useState } from 'react';
import { Card, Empty, Select, Spin, Typography } from 'antd';
import { useList } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { VehicleMaintenanceTab } from './VehicleMaintenanceTab';
import type { Vehicle } from '@/types';
import { ROUTES } from '@/routes';

export function VehiclesMaintenancePage() {
  const { t } = useTranslation();
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | undefined>(undefined);

  const { data: vehiclesData, isLoading: vehiclesLoading } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });

  const vehicles = vehiclesData?.data ?? [];

  const selectedVehicle = vehicles.find((v) => v.id === selectedVehicleId);

  const vehicleOptions = vehicles.map((v) => ({
    value: v.id,
    label: `${v.plate_number}${v.brand ? ` · ${v.brand}` : ''}${v.model ? ` ${v.model}` : ''}`,
  }));

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('sidebar.maintenance')}
        description="Theo dõi lịch bảo dưỡng và lịch sử sửa chữa xe"
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('sidebar.vehicles'), path: ROUTES.admin.vehicles.list },
          { label: t('sidebar.maintenance') },
        ]}
      />

      <Card>
        <div style={{ marginBottom: 20 }}>
          <Typography.Text strong style={{ display: 'block', marginBottom: 8 }}>
            Chọn xe để xem bảo dưỡng
          </Typography.Text>
          {vehiclesLoading ? (
            <Spin size="small" />
          ) : (
            <Select
              showSearch
              style={{ width: 360 }}
              placeholder="Tìm kiếm theo biển số..."
              value={selectedVehicleId}
              onChange={(v) => setSelectedVehicleId(v as number)}
              options={vehicleOptions}
              filterOption={(input, option) =>
                String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())
              }
              allowClear
              onClear={() => setSelectedVehicleId(undefined)}
            />
          )}
        </div>

        {selectedVehicleId == null ? (
          <Empty description="Chọn một xe để xem lịch bảo dưỡng và lịch sử sửa chữa" style={{ padding: '40px 0' }} />
        ) : (
          <VehicleMaintenanceTab
            vehicleId={selectedVehicleId}
            currentOdometerKm={selectedVehicle?.current_odometer_km}
          />
        )}
      </Card>
    </div>
  );
}
