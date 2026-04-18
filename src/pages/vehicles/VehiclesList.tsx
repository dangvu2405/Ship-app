import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Avatar, Button, Card, List, Select, Space, Tabs, Tag } from 'antd';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
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

  const applyStatusFilter = (raw: string) => {
    const next = raw === 'all' ? undefined : raw;
    setAppliedStatus(next);
    setCurrent(1);
  };

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setAppliedKeyword('');
    setAppliedStatus(undefined);
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
        <Tabs activeKey={appliedStatus ?? 'all'} onChange={applyStatusFilter} items={statusTabsItems} />
        <div className="contents min-w-0 w-full">
          <ListPageFilters variant="grid-2">
            <ListPageFilters.Search
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
            <Select
              className="list-page-filters__radix-select"
              value={appliedStatus ?? 'all'}
              options={statusSelectOptions}
              onChange={(v) => applyStatusFilter(String(v))}
              placeholder={t('common.status')}
            />
          </ListPageFilters>
          <div className="list-page-filters__btn-row">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </div>
        </div>

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <List
              itemLayout="vertical"
              size="large"
              dataSource={listData}
              locale={{
                emptyText: t('emptyState.listDescription', { resource: t('vehicles.title') }),
              }}
              pagination={{
                current,
                total,
                pageSize,
                onChange: setCurrent,
              }}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  actions={[
                    <Button key="view" type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={() => show('vehicles', item.id)} />,
                    <Button key="edit" type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} onClick={() => handleOpenDialog('edit', item.id)} />,
                    <Button key="delete" type="text" size="small" danger icon={<DeleteOutlined aria-hidden />} aria-label={t('common.delete')} onClick={() => handleDelete(item)} />,
                  ]}
                >
                  <List.Item.Meta
                    avatar={(() => {
                      const imageUrl = item.image_url?.trim();
                      return imageUrl ? (
                        <Avatar src={imageUrl} alt="" shape="square" size={64} className="shrink-0" />
                      ) : (
                        <Avatar
                          shape="square"
                          size={64}
                          className="shrink-0 bg-muted text-muted-foreground"
                        >
                          <span className="px-1 text-center text-[10px] font-medium leading-tight">
                            {t('vehicles.listNoImage')}
                          </span>
                        </Avatar>
                      );
                    })()}
                    title={(
                      <Button type="link" style={{ padding: 0 }} onClick={() => show('vehicles', item.id)}>
                        {item.plate_number}
                      </Button>
                    )}
                    description={(
                      <Space wrap size={[8, 8]}>
                        <span>{`${t('vehicles.type')}: ${item.type || '-'}`}</span>
                        <span>{`${t('vehicles.brand')}: ${item.brand || '-'}`}</span>
                        <span>{`${t('vehicles.model')}: ${item.model || '-'}`}</span>
                        <span>{`${t('vehicles.year')}: ${item.year || '-'}`}</span>
                        <span>{`${t('vehicles.capacity')}: ${item.capacity ? `${item.capacity} ${t('vehicles.capacityUnit')}` : '-'}`}</span>
                        <Tag color={item.status === 'active' ? 'success' : 'default'}>
                          {item.status === 'active' ? t('common.active') : t('common.inactive')}
                        </Tag>
                      </Space>
                    )}
                  />
                </List.Item>
              )}
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
