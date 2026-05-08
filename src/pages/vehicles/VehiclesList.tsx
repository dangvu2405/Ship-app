import { useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { useListFilters } from '@/hooks/useListFilters';
import { useTable } from '@refinedev/antd';
import type { CrudFilter } from '@refinedev/core';
import { Button, Card, Flex, Input, Select, Space, Table, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { VehicleFormDialog } from './VehicleFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Vehicle } from '@/types';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';


const VEHICLE_TYPE_OPTIONS = ['truck', 'van', 'car', 'motorcycle'] as const;

function vehicleStatusColor(status: string): string {
  switch (status) {
    case 'active':
      return 'success';
    case 'maintenance':
      return 'warning';
    case 'broken':
      return 'error';
    case 'inactive':
    case 'out_of_service':
      return 'default';
    default:
      return 'processing';
  }
}

export function VehiclesList() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('vehicles');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFiltersBase } = useListFilters({
    plate: '',
    type: undefined as string | undefined,
    status: undefined as string | undefined,
  });
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);

  const permanentFilters = useMemo<CrudFilter[]>(() => {
    const f: CrudFilter[] = [];
    if (filterApplied.plate.trim()) {
      f.push({ field: 'plate_number', operator: 'contains', value: filterApplied.plate.trim() });
    }
    if (filterApplied.status) {
      f.push({ field: 'status', operator: 'eq', value: filterApplied.status });
    }
    if (filterApplied.type) {
      f.push({ field: 'type', operator: 'eq', value: filterApplied.type });
    }
    return f;
  }, [filterApplied]);

  const { tableProps, tableQuery } = useTable<Vehicle>({
    resource: 'vehicles',
    pagination: { pageSize: 15 },
    filters: { permanent: permanentFilters },
    syncWithLocation: true,
  });

  const safeRefetch = useSafeRefetch('vehicles-vehicleslist', tableQuery.refetch);

  const clearFilters = () => {
    clearFiltersBase();
    setSelectedRowKeys([]);
  };

  const handleDelete = (vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selectedVehicle) return;

    deleteItem(
      { id: selectedVehicle.id },
      {
        onSuccess: () => {
          feedback.success(t('notifications.deleteSuccess', { item: t('vehicles.title') }));
          setDeleteDialogOpen(false);
          setSelectedVehicle(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }
          feedback.error(t('notifications.deleteError', { item: t('vehicles.title') }));
        },
      },
    );
  };

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('vehicles.title') },
  ];

  const total = tableQuery.data?.total ?? 0;
  const tableRows = tableProps.dataSource ?? [];

  const handleExportCsv = () => {
    const rows = tableRows.map((row) => ({
      plate_number: row.plate_number,
      vehicle_type: row.vehicle_type?.name ?? row.type ?? '',
      status: row.status,
      max_load_ton: row.max_load_ton ?? row.capacity ?? '',
      warning_count: row.status === 'maintenance' || row.status === 'broken' ? 1 : 0,
    }));
    const header = ['plate_number', 'vehicle_type', 'status', 'max_load_ton', 'warning_count'];
    const csv = [header.join(','), ...rows.map((row) => header.map((key) => JSON.stringify(String((row as Record<string, unknown>)[key] ?? ''))).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'vehicles.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns: ColumnsType<Vehicle> = useMemo(
    () => [
      {
        title: t('vehicles.plateNumber'),
        dataIndex: 'plate_number',
        key: 'plate_number',
        render: (v: string, row) => (
          <Space wrap size={4}>
            <Button type="link" style={{ padding: 0 }} onClick={() => show('vehicles', row.id)}>
              {v}
            </Button>
            {(row.status === 'broken' || row.status === 'maintenance') && (
              <Tooltip title={t('vehicles.dispatchExclusionWarning')}>
                <Tag icon={<WarningOutlined />} color="warning">
                  {t('vehicles.dispatchExclusionShort')}
                </Tag>
              </Tooltip>
            )}
          </Space>
        ),
      },
      {
        title: t('vehicles.vehicleTypeCatalog'),
        key: 'vehicle_type_id',
        render: (_: unknown, row) =>
          row.vehicle_type?.name ?? (row.vehicle_type_id != null ? `#${row.vehicle_type_id}` : row.type ?? '—'),
      },
      {
        title: t('vehicles.maxLoadTon'),
        key: 'max_load_ton',
        align: 'right',
        render: (_: unknown, row) =>
          row.max_load_ton != null ? `${row.max_load_ton}` : row.capacity != null ? `${row.capacity}` : '—',
      },
      {
        title: t('drivers.title'),
        key: 'responsible_driver',
        render: () => '—',
      },
      {
        title: t('dashboard.alertsTitle'),
        key: 'warning_count',
        align: 'center',
        render: (_: unknown, row) => (row.status === 'maintenance' || row.status === 'broken' ? 1 : 0),
      },
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        render: (s: string) => (
          <Tag color={vehicleStatusColor(s)}>{t(`vehicles.status.${s}`, { defaultValue: s })}</Tag>
        ),
      },
      {
        title: t('vehicles.currentOdometer'),
        dataIndex: 'current_odometer_km',
        key: 'current_odometer_km',
        align: 'right',
        render: (v: number | null | undefined) => (v != null ? `${v}` : '—'),
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 140,
        render: (_: unknown, row) => (
          <Space size="small">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              aria-label={t('common.view')}
              onClick={() => show('vehicles', row.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              aria-label={t('common.edit')}
              onClick={() => handleOpenDialog('edit', row.id)}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined aria-hidden />}
              aria-label={t('common.delete')}
              onClick={() => handleDelete(row)}
            />
          </Space>
        ),
      },
    ],
    [show, t],
  );

  if (tableQuery.isError) {
    return (
      <>
        <PageHeader title={t('vehicles.title')} description={t('vehicles.description')} breadcrumb={breadcrumb} />
        <ErrorState
          title={t('common.loadError')}
          description={t('common.tryAgainDescription')}
          onRetry={() => void tableQuery.refetch()}
        />
      </>
    );
  }

  return (
    <div className="enterprise-page vehicles-page space-y-4">
      <PageHeader
        title={t('vehicles.title')}
        description={t('vehicles.description')}
        breadcrumb={breadcrumb}
        actions={
          <Space>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              {t('common.export')}
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
              {t('vehicles.createVehicle')}
            </Button>
          </Space>
        }
      />

      <Card
        className="enterprise-section-card"
        title={<Flex align="center" gap={8}><CarOutlined /><span>{t('vehicles.title')}</span></Flex>}
        extra={<Tag>{total} {t('common.records')}</Tag>}
        styles={{ body: { padding: 16 } }}
      >
        <ListPageFilters variant="grid-3" className="enterprise-filter-bar mb-4">
          <Input
            placeholder={t('vehicles.plateSearchPlaceholder')}
            value={filterInputs.plate}
            onChange={(e) => setFilterInput('plate', e.target.value)}
            onPressEnter={applyFilters}
            allowClear
            onClear={() => setFilterInput('plate', '')}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('common.status')}
            value={filterInputs.status}
            onChange={(v) => setFilterInput('status', v)}
            options={[
              { value: 'active', label: t('vehicles.status.active') },
              { value: 'maintenance', label: t('vehicles.status.maintenance') },
              { value: 'inactive', label: t('vehicles.status.inactive') },
              { value: 'broken', label: t('vehicles.status.broken') },
              { value: 'out_of_service', label: t('vehicles.status.out_of_service') },
            ]}
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('vehicles.type')}
            value={filterInputs.type}
            onChange={(v) => setFilterInput('type', v)}
            options={VEHICLE_TYPE_OPTIONS.map((v) => ({ value: v, label: v }))}
          />
          <div className="list-page-filters__btn-row col-span-full">
            <ListPageFilters.Actions
              onSearch={applyFilters}
              onReset={clearFilters}
              busy={tableQuery.isFetching && !tableQuery.isLoading}
            />
          </div>
        </ListPageFilters>

        <Table<Vehicle>
          {...tableProps}
          rowKey="id"
          columns={columns}
          rowSelection={{
            selectedRowKeys,
            onChange: setSelectedRowKeys,
          }}
          scroll={{ x: 'max-content' }}
          loading={tableProps.loading}
          className="enterprise-table"
        />
      </Card>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedVehicle?.plate_number}
      />
      <VehicleFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          void safeRefetch(true);
        }}
      />
    </div>
  );
}
