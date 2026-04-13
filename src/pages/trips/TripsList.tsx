import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Button, Card, Dropdown, Form, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlayCircleOutlined,
  PlusOutlined,
  ShopOutlined,
} from '@ant-design/icons';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Office, Trip } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import tripService from '@/services/trip.service';
import { TripFormDialog } from './TripFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { notifyErrorOnce } from '@/utils/errorToast';
import { getTripStatusLabel } from '@/utils/tripStatus';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';

function tripStatusTagColor(status: string): string | undefined {
  switch (status) {
    case 'completed':
      return 'success';
    case 'in_progress':
      return 'processing';
    case 'cancelled':
      return 'error';
    default:
      return undefined;
  }
}

type TripFilterForm = {
  company_id?: number;
  office_id?: number;
};

export function TripsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('trips');
  const [filterForm] = Form.useForm<TripFilterForm>();
  const companyWatch = Form.useWatch('company_id', filterForm);

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [current, setCurrent] = useState(1);
  const [appliedCompanyId, setAppliedCompanyId] = useState<number | undefined>(undefined);
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);
  const [busyTripId, setBusyTripId] = useState<number | null>(null);

  const companyFilters = useMemo(
    () => [{ field: 'status', operator: 'eq' as const, value: 'active' }],
    [],
  );

  const officeFilters = useMemo(
    () =>
      companyWatch != null
        ? [{ field: 'company_id', operator: 'eq' as const, value: companyWatch }]
        : [],
    [companyWatch],
  );

  const mapCompanyOption = useCallback(
    (c: Company) => ({ label: c.name ?? `#${c.id}`, value: c.id }),
    [],
  );
  const mapOfficeOption = useCallback(
    (o: Office) => ({ label: o.name ?? `#${o.id}`, value: o.id }),
    [],
  );

  const companiesSelect = usePaginatedResourceSelectOptions<Company>({
    resource: 'companies',
    filters: companyFilters,
    sorters: [{ field: 'name', order: 'asc' }],
    mapOption: mapCompanyOption,
  });

  const officesSelect = usePaginatedResourceSelectOptions<Office>({
    resource: 'offices',
    filters: officeFilters,
    sorters: [{ field: 'name', order: 'asc' }],
    mapOption: mapOfficeOption,
  });

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Trip>({
    resource: 'trips',
    current,
    pageSize: 15,
    filters: [
      ...(appliedCompanyId ? [{ field: 'company_id', operator: 'eq' as const, value: appliedCompanyId }] : []),
      ...(appliedOfficeId ? [{ field: 'office_id', operator: 'eq' as const, value: appliedOfficeId }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });
  const safeRefetch = useSafeRefetch('trips-list', refetch);

  const handleSearchFilters = () => {
    const { company_id, office_id } = filterForm.getFieldsValue();
    setAppliedCompanyId(company_id);
    setAppliedOfficeId(office_id);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setAppliedCompanyId(undefined);
    setAppliedOfficeId(undefined);
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleDelete = useCallback((trip: Trip) => {
    setSelectedTrip(trip);
    setDeleteDialogOpen(true);
  }, []);

  const handleCreate = useCallback(() => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const confirmDelete = () => {
    if (!selectedTrip) return;

    deleteItem(
      {
        id: selectedTrip.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('trips.title') }));
          setDeleteDialogOpen(false);
          setSelectedTrip(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          notifyErrorOnce('trips-delete', error, {
            fallbackMessage: t('notifications.deleteError', { item: t('trips.title') }),
          });
        },
      }
    );
  };

  /** Chuyển trạng thái chuyến theo workflow spec */
  const handleStatusChange = useCallback(
    async (trip: Trip, newStatus: 'in_progress' | 'completed' | 'cancelled') => {
      setBusyTripId(trip.id);
      try {
        await tripService.updateStatus(trip.id, newStatus);
        toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
        await safeRefetch(true);
      } catch (error) {
        if (shouldShowLocalErrorToast(error)) {
          notifyErrorOnce('trips-status-update', error, {
            fallbackMessage: getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }),
          });
        }
      } finally {
        setBusyTripId(null);
      }
    },
    [t, safeRefetch]
  );

  const tripRowMenu = useCallback(
    (record: Trip): MenuProps => {
      const items: MenuProps['items'] = [
        {
          key: 'view',
          icon: <EyeOutlined />,
          label: t('common.view'),
          onClick: () => show('trips', record.id),
        },
        {
          key: 'edit',
          icon: <EditOutlined />,
          label: t('common.edit'),
          onClick: () => handleEdit(record.id),
        },
      ];
      if (record.status === 'pending') {
        items.push({
          key: 'start',
          icon: <PlayCircleOutlined />,
          label: t('trips.startTrip'),
          disabled: busyTripId === record.id,
          onClick: () => void handleStatusChange(record, 'in_progress'),
        });
      }
      if (record.status === 'in_progress') {
        items.push({
          key: 'complete',
          icon: <CheckCircleOutlined />,
          label: t('trips.completeTrip'),
          disabled: busyTripId === record.id,
          onClick: () => void handleStatusChange(record, 'completed'),
        });
      }
      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: t('common.delete'),
        danger: true,
        onClick: () => handleDelete(record),
      });
      return { items };
    },
    [t, show, busyTripId, handleEdit, handleDelete, handleStatusChange],
  );

  const columns = useMemo<DataTableColumn<Trip>[]>(
    () => [
    { key: 'code', header: t('trips.code'), dataIndex: 'code' },
    { key: 'start_point', header: t('trips.startPoint'), dataIndex: 'start_point' },
    { key: 'end_point', header: t('trips.endPoint'), dataIndex: 'end_point' },
    {
      key: 'distance_km',
      header: t('trips.distance'),
      dataIndex: 'distance_km',
      render: (item) => `${item.distance_km} km`,
    },
    {
      key: 'price',
      header: t('trips.price'),
      dataIndex: 'price',
      render: (item) => formatCurrencyVND(item.price),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Tag color={tripStatusTagColor(item.status ?? '')}>{getTripStatusLabel(item.status, t)}</Tag>
      ),
    },
    {
      key: 'start_time',
      header: t('trips.startTime'),
      dataIndex: 'start_time',
      render: (item) => <DateTimeBadge value={item.start_time} mode="datetime" />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div role="presentation" onClick={(e) => e.stopPropagation()}>
          <Dropdown menu={tripRowMenu(record)} trigger={['click']}>
            <Button type="text" size="small" icon={<MoreOutlined />} aria-label={t('common.actions')} />
          </Dropdown>
        </div>
      ),
    },
  ],
    [t, tripRowMenu]
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('trips.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('trips.title')}
        description={t('trips.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('trips.createTrip')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
              <Form
                form={filterForm}
                layout="vertical"
                onValuesChange={(changed) => {
                  if ('company_id' in changed) {
                    filterForm.setFieldsValue({ office_id: undefined });
                  }
                }}
              >
                <FormItemSelect
                  name="company_id"
                  label={null}
                  placeholder={t('companies.title')}
                  options={companiesSelect.options}
                  showSearch
                  allowClear
                  loading={companiesSelect.isLoading || companiesSelect.isFetchingNextPage}
                  prefix={<ApartmentOutlined aria-hidden />}
                  classNames={{ root: 'list-page-filters__select' }}
                  onPopupScroll={companiesSelect.onPopupScroll}
                  optionFilterProp="label"
                  style={{ width: 180, }}
                />
                <FormItemSelect
                  name="office_id"
                  label={null}
                  placeholder={t('employees.office')}
                  options={officesSelect.options}
                  showSearch
                  allowClear
                  loading={officesSelect.isLoading || officesSelect.isFetchingNextPage}
                  prefix={<ShopOutlined aria-hidden />}
                  classNames={{ root: 'list-page-filters__select' }}
                  onPopupScroll={officesSelect.onPopupScroll}
                  optionFilterProp="label"
                  style={{ width: 180}}
                />
              </Form>


            <div className="list-page-filters__btn-row">
              <ListPageFilters.Actions
                onSearch={handleSearchFilters}
                onReset={handleClearFilters}
                busy={isFetching && !isLoading}
              />
            </div>
          {isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => void safeRefetch(true)}
            />
          ) : (
            <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
              <DataTable<Trip>
                data={listData}
                columns={columns}
                onRowClick={(record) => show('trips', record.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('trips.title') })}
                emptyAction={
                  <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                    {t('trips.createTrip')}
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
        itemName={selectedTrip?.code}
      />
      {formOpen && (
        <TripFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void safeRefetch(true);
          }}
        />
      )}
    </>
  );
}
