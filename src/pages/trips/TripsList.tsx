import { useCallback, useMemo, useState } from 'react';
import { useNavigation, useList } from '@refinedev/core';
import { Button, Card, Dropdown, Form, Modal, Input, Select, Tag } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  MoreOutlined,
  PlusOutlined,
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
import type { Company, Driver, Trip, Vehicle } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import tripService from '@/services/trip.service';
import { TripFormDialog } from './TripFormDialog';
import { formatCurrencyVND } from '@/utils/format';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { notifyErrorOnce } from '@/utils/errorToast';
import {
  getAvailableActions,
  getTripStatusLabel,
  getTripStatusTagColor,
  TERMINAL_TRIP_STATUSES,
} from '@/utils/tripStatus';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';

type TripFilterForm = {
  company_id?: number;
  status?: string;
};

interface ReasonModalState {
  open: boolean;
  trip: Trip | null;
  action: string;
  titleKey: string;
  reasonKey: string;
}

interface AssignModalState {
  open: boolean;
  trip: Trip | null;
  driverId?: number;
  vehicleId?: number;
}

const REASON_ACTIONS = new Set(['cancel', 'emergency', 'delay']);

export function TripsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('trips');
  const [filterForm] = Form.useForm<TripFilterForm>();

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
  const [reasonModal, setReasonModal] = useState<ReasonModalState>({
    open: false, trip: null, action: '', titleKey: '', reasonKey: '',
  });
  const [reasonValue, setReasonValue] = useState('');
  const [assignModal, setAssignModal] = useState<AssignModalState>({ open: false, trip: null });

  const { data: driversData } = useList<Driver>({ resource: 'drivers', pagination: { current: 1, pageSize: 200 } });
  const { data: vehiclesData } = useList<Vehicle>({ resource: 'vehicles', pagination: { current: 1, pageSize: 200 } });
  const driverOptions = useMemo(
    () => (driversData?.data ?? []).map((d) => ({ label: d.name ?? `#${d.id}`, value: d.id })),
    [driversData?.data],
  );
  const vehicleOptions = useMemo(
    () => (vehiclesData?.data ?? [])
      .filter((v) => v.status === 'active')
      .map((v) => ({ label: `${v.plate_number} (${v.type ?? ''})`, value: v.id })),
    [vehiclesData?.data],
  );

  const companyFilters = useMemo(
    () => [{ field: 'status', operator: 'eq' as const, value: 'active' }],
    [],
  );

  const mapCompanyOption = useCallback((c: Company) => ({ label: c.name ?? `#${c.id}`, value: c.id }), []);

  const companiesSelect = usePaginatedResourceSelectOptions<Company>({
    resource: 'companies', filters: companyFilters, sorters: [{ field: 'name', order: 'asc' }], mapOption: mapCompanyOption,
  });
  const statusOptions = useMemo(() => [
    { label: t('trips.statusPending'),   value: 'pending' },
    { label: t('trips.statusAssigned'),  value: 'assigned' },
    { label: t('trips.statusInTransit'), value: 'in_transit' },
    { label: t('trips.statusDelivered'), value: 'delivered' },
    { label: t('trips.statusCompleted'), value: 'completed' },
    { label: t('trips.statusCancelled'), value: 'cancelled' },
  ], [t]);

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Trip>({
    resource: 'trips',
    current,
    pageSize: 15,
    filters: [
      ...(appliedCompanyId ? [{ field: 'company_id', operator: 'eq' as const, value: appliedCompanyId }] : []),
      ...(appliedOfficeId  ? [{ field: 'office_id',  operator: 'eq' as const, value: appliedOfficeId  }] : []),
      ...(appliedStatus    ? [{ field: 'status',     operator: 'eq' as const, value: appliedStatus    }] : []),
    ],
  });
  const safeRefetch = useSafeRefetch('trips-list', refetch);

  const handleSearchFilters = () => {
    const { company_id, status } = filterForm.getFieldsValue();
    setAppliedCompanyId(company_id);
    setAppliedStatus(status);
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
      { id: selectedTrip.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('trips.title') }));
          setDeleteDialogOpen(false);
          setSelectedTrip(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          notifyErrorOnce('trips-delete', error, {
            fallbackMessage: t('notifications.deleteError', { item: t('trips.title') }),
          });
        },
      }
    );
  };

  const dispatchAction = useCallback(
    async (trip: Trip, action: string, reason?: string) => {
      setBusyTripId(trip.id);
      try {
        await tripService.dispatchAction(trip.id, action, { reason });
        toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
        await safeRefetch(true);
      } catch (error) {
        if (shouldShowLocalErrorToast(error)) {
          notifyErrorOnce('trips-action', error, {
            fallbackMessage: getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }),
          });
        }
      } finally {
        setBusyTripId(null);
      }
    },
    [t, safeRefetch],
  );

  const handleAssignConfirm = () => {
    const { trip, driverId, vehicleId } = assignModal;
    if (!trip || (!driverId && !vehicleId)) return;
    setAssignModal((s) => ({ ...s, open: false }));
    setBusyTripId(trip.id);
    void (async () => {
      try {
        await tripService.dispatchAction(trip.id, 'assign', { driver_id: driverId, vehicle_id: vehicleId });
        toast.success(t('notifications.updateSuccess', { item: t('trips.title') }));
        await safeRefetch(true);
      } catch (error) {
        if (shouldShowLocalErrorToast(error)) {
          notifyErrorOnce('trips-assign', error, {
            fallbackMessage: getErrorMessage(error) || t('notifications.updateError', { item: t('trips.title') }),
          });
        }
      } finally {
        setBusyTripId(null);
      }
    })();
  };

  const handleAction = useCallback((trip: Trip, action: string) => {
    if (action === 'assign') {
      setAssignModal({ open: true, trip, driverId: undefined, vehicleId: undefined });
      return;
    }
    if (REASON_ACTIONS.has(action)) {
      const titleMap: Record<string, string> = {
        cancel:    'trips.confirmCancelTitle',
        emergency: 'trips.confirmEmergencyTitle',
        delay:     'trips.confirmDelayTitle',
      };
      const reasonMap: Record<string, string> = {
        cancel:    'trips.cancelReason',
        emergency: 'trips.emergencyReason',
        delay:     'trips.delayReason',
      };
      setReasonValue('');
      setReasonModal({ open: true, trip, action, titleKey: titleMap[action], reasonKey: reasonMap[action] });
      return;
    }
    void dispatchAction(trip, action);
  }, [dispatchAction]);

  const handleReasonConfirm = () => {
    const { trip, action } = reasonModal;
    if (!trip) return;
    setReasonModal((s) => ({ ...s, open: false }));
    void dispatchAction(trip, action, reasonValue);
  };

  const tripRowMenu = useCallback(
    (record: Trip): MenuProps => {
      const isBusy = busyTripId === record.id;
      const isTerminal = TERMINAL_TRIP_STATUSES.includes(record.status as never);
      const actions = getAvailableActions(record.status);

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
          disabled: isTerminal,
          onClick: () => handleEdit(record.id),
        },
      ];

      if (actions.length > 0) {
        items.push({ type: 'divider' });
        actions.forEach((cfg) => {
          items.push({
            key: cfg.action,
            label: t(cfg.labelKey as Parameters<typeof t>[0]),
            danger: cfg.danger,
            disabled: isBusy,
            onClick: () => handleAction(record, cfg.action),
          });
        });
      }

      items.push({ type: 'divider' });
      items.push({
        key: 'delete',
        icon: <DeleteOutlined />,
        label: t('common.delete'),
        danger: true,
        disabled: isTerminal,
        title: isTerminal ? 'Đơn đã hoàn thành/hủy không thể xóa' : undefined,
        onClick: () => handleDelete(record),
      });
      return { items };
    },
    [t, show, busyTripId, handleEdit, handleDelete, handleAction],
  );

  const columns = useMemo<DataTableColumn<Trip>[]>(
    () => [
      { key: 'code', header: t('trips.code'), dataIndex: 'code' },
      { key: 'start_point', header: t('trips.startPoint'), dataIndex: 'start_point' },
      { key: 'end_point',   header: t('trips.endPoint'),   dataIndex: 'end_point' },
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
          <Tag color={getTripStatusTagColor(item.status ?? '')}>{getTripStatusLabel(item.status, t)}</Tag>
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
        <div>
          <h2 className="text-base font-semibold text-slate-900">{t('trips.title')}</h2>
          <p className="text-sm text-slate-500">
            {total} {t('common.records')}
          </p>
        </div>
        <Form
          form={filterForm}
          layout="vertical"
          requiredMark={false}
          colon={false}
          className="contents min-w-0 w-full"
          onValuesChange={(changed) => {
            if ('company_id' in changed) {
              setAppliedOfficeId(undefined);
            }
          }}
        >
          <ListPageFilters variant="grid-2" className="rounded-xl border bg-white p-4">
            <div className="grid min-w-0 w-full grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <FormItemSelect
                noStyle
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
              />
              <FormItemSelect
                noStyle
                name="status"
                label={null}
                placeholder={t('common.status')}
                options={statusOptions}
                allowClear
                classNames={{ root: 'list-page-filters__select' }}
              />
            </div>
          </ListPageFilters>
          <div className="list-page-filters__btn-row">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </div>
        </Form>

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
          onClose={() => { setFormOpen(false); setEditingId(undefined); }}
          onSuccess={() => { void safeRefetch(true); }}
        />
      )}

      <Modal
        open={reasonModal.open}
        title={reasonModal.titleKey ? t(reasonModal.titleKey as Parameters<typeof t>[0]) : ''}
        okButtonProps={{ danger: true, disabled: reasonModal.action !== 'delay' && !reasonValue.trim() }}
        onOk={handleReasonConfirm}
        onCancel={() => setReasonModal((s) => ({ ...s, open: false }))}
        destroyOnClose
      >
        <Input.TextArea
          rows={3}
          placeholder={reasonModal.reasonKey ? t(reasonModal.reasonKey as Parameters<typeof t>[0]) : ''}
          value={reasonValue}
          onChange={(e) => setReasonValue(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>

      <Modal
        open={assignModal.open}
        title={`Phân công chuyến: ${assignModal.trip?.code ?? ''}`}
        okText="Xác nhận phân công"
        cancelText={t('common.cancel')}
        okButtonProps={{ disabled: !assignModal.driverId && !assignModal.vehicleId }}
        onOk={handleAssignConfirm}
        onCancel={() => setAssignModal((s) => ({ ...s, open: false }))}
        destroyOnClose
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginTop: 8 }}>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Tài xế</div>
            <Select
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              allowClear
              placeholder="Chọn tài xế"
              options={driverOptions}
              value={assignModal.driverId}
              onChange={(v) => setAssignModal((s) => ({ ...s, driverId: v }))}
            />
          </div>
          <div>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>Xe (chỉ xe đang hoạt động)</div>
            <Select
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              allowClear
              placeholder="Chọn xe"
              options={vehicleOptions}
              value={assignModal.vehicleId}
              onChange={(v) => setAssignModal((s) => ({ ...s, vehicleId: v }))}
            />
          </div>
        </div>
      </Modal>
    </>
  );
}
