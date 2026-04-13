import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button, Card, Dropdown, Select, Tabs, Tag } from 'antd';
import type { MenuProps } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, MoreOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { VehicleFormDialog } from './VehicleFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

export function VehiclesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('vehicles');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<Vehicle | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const statusSelectOptions = useMemo(
    () => [
      { value: 'all', label: t('common.all') },
      { value: 'active', label: t('common.active') },
      { value: 'inactive', label: t('common.inactive') },
    ],
    [t],
  );

  const statusTabsItems = useMemo(
    () => [
      { key: 'all', label: t('common.all') },
      { key: 'active', label: t('common.active') },
      { key: 'inactive', label: t('common.inactive') },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Vehicle>({
    resource: 'vehicles',
    current,
    pageSize: 15,
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const safeRefetch = useSafeRefetch('vehicles-vehicleslist', refetch);

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedStatus(undefined);
    setAppliedKeyword('');
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    setSelectedStatus(value === 'all' ? undefined : value);
    setAppliedStatus(value === 'all' ? undefined : value);
    setCurrent(1);
  };

  const handleDelete = useCallback((vehicle: Vehicle) => {
    setSelectedVehicle(vehicle);
    setDeleteDialogOpen(true);
  }, []);

  const handleOpenDialog = useCallback((mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selectedVehicle) return;

    deleteItem(
      {
        id: selectedVehicle.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('vehicles.title') }));
          setDeleteDialogOpen(false);
          setSelectedVehicle(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('vehicles.title') }));
        },
      }
    );
  };

  const rowMenu = useCallback(
    (record: Vehicle): MenuProps => ({
      items: [
        {
          key: 'view',
          icon: <EyeOutlined />,
          label: t('common.view'),
          onClick: () => show('vehicles', record.id),
        },
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: t('common.edit'),
          onClick: () => handleOpenDialog('edit', record.id),
        },
        { type: 'divider' },
        {
          key: 'delete',
          icon: <DeleteOutlined />,
          label: t('common.delete'),
          danger: true,
          onClick: () => handleDelete(record),
        },
      ],
    }),
    [t, show, handleDelete, handleOpenDialog],
  );

  const columns = useMemo<DataTableColumn<Vehicle>[]>(
    () => [
    { key: 'plate_number', header: t('vehicles.plateNumber'), dataIndex: 'plate_number' },
    { key: 'type', header: t('vehicles.type'), dataIndex: 'type' },
    { key: 'brand', header: t('vehicles.brand'), dataIndex: 'brand' },
    { key: 'model', header: t('vehicles.model'), dataIndex: 'model' },
    { key: 'year', header: t('vehicles.year'), dataIndex: 'year' },
    {
      key: 'capacity',
      header: t('vehicles.capacity'),
      dataIndex: 'capacity',
      render: (item) => item.capacity ? `${item.capacity} ${t('vehicles.capacityUnit')}` : '-',
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Tag color={item.status === 'active' ? 'success' : 'default'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div role="presentation" onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={rowMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        </div>
      ),
    },
  ],
    [t, rowMenu]
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('vehicles.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('vehicles.title')}
        description={t('vehicles.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
            {t('vehicles.createVehicle')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
        <Tabs activeKey={appliedStatus ?? 'all'} onChange={handleStatusTabChange} items={statusTabsItems} />

          <ListPageFilters variant="grid-4">
            <ListPageFilters.Search
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
            <Select
              className="list-page-filters__radix-select"
              value={selectedStatus ?? 'all'}
              options={statusSelectOptions}
              onChange={(value) => setSelectedStatus(value === 'all' ? undefined : String(value))}
              placeholder={t('common.status')}
            />
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </ListPageFilters>

          {isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => void safeRefetch(true)}
            />
          ) : (
            <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
              <DataTable<Vehicle>
                data={listData}
                columns={columns}
                onRowClick={(record) => show('vehicles', record.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('vehicles.title') })}
                emptyAction={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
                    {t('vehicles.createVehicle')}
                  </Button>
                }
                pagination={{
                  current,
                  total,
                  pageSize,
                  onPageChange: setCurrent,
                }}
              />
            </PageLoadingOverlay>
          )}
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
    </>
  );
}
