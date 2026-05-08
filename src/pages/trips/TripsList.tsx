import { useCallback, useMemo, useState } from 'react';
import { useInvalidate, useList, useNavigation } from '@refinedev/core';
import type { CrudFilter } from '@refinedev/core';
import { Button, Card, DatePicker, Flex, Form, Input, Modal } from 'antd';
import dayjs from 'dayjs';
import type { MenuProps } from 'antd';
import {
  ApartmentOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageHeader } from '@/components/common/PageHeader';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Company, Customer, Driver, Trip, Vehicle } from '@/types';
import { ROUTES } from '@/routes';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import tripService from '@/services/trip.service';
import { TripFormDialog } from './TripFormDialog';
import { TripTable } from '@/pages/trips/components/TripTable';
import { notifyErrorOnce } from '@/utils/errorToast';
import { getAvailableActions, isTripCompleted, TERMINAL_TRIP_STATUSES } from '@/utils/tripStatus';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';
import { useExport } from '@/hooks/useExport';
import { recordAuditIntent } from '@/lib/audit-action';

type TripFilterForm = {
  company_id?: number;
  status?: string[];
  search?: string;
  customer_id?: number;
  driver_id?: number;
  vehicle_id?: number;
  date_from?: string;
  date_to?: string;
};

interface ReasonModalState {
  open: boolean;
  trip: Trip | null;
  action: string;
  titleKey: string;
  reasonKey: string;
}

const REASON_ACTIONS = new Set(['cancel', 'emergency', 'delay']);

export function TripsList() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { show } = useNavigation();
  const invalidate = useInvalidate();
  const { mutate: deleteItem } = useResourceDeleteMutation('trips');
  const [filterForm] = Form.useForm<TripFilterForm>();

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);
  const [appliedFilters, setAppliedFilters] = useState<TripFilterForm>({});
  const [busyTripId, setBusyTripId] = useState<number | null>(null);
  const [reasonModal, setReasonModal] = useState<ReasonModalState>({
    open: false, trip: null, action: '', titleKey: '', reasonKey: '',
  });
  const [reasonValue, setReasonValue] = useState('');
  const companyFilters = useMemo(
    () => [{ field: 'status', operator: 'eq' as const, value: 'active' }],
    [],
  );

  const mapCompanyOption = useCallback((c: Company) => ({ label: c.name ?? `#${c.id}`, value: c.id }), []);

  const companiesSelect = usePaginatedResourceSelectOptions<Company>({
    resource: 'companies', filters: companyFilters, sorters: [{ field: 'name', order: 'asc' }], mapOption: mapCompanyOption,
  });

  const { data: customersMini } = useList<Customer>({
    resource: 'customers',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const { data: driversMini } = useList<Driver>({
    resource: 'drivers',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'id', order: 'desc' }],
  });
  const { data: vehiclesMini } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: 'plate_number', order: 'asc' }],
  });

  const customerFilterOptions = useMemo(
    () => (customersMini?.data ?? []).map((c) => ({
      label: `${c.code ? `${c.code} — ` : ''}${c.name}`,
      value: c.id,
    })),
    [customersMini?.data],
  );
  const driverFilterOptions = useMemo(
    () => (driversMini?.data ?? []).map((d) => ({
      label: d.employee?.name ?? d.name ?? d.code ?? `#${d.id}`,
      value: d.id,
    })),
    [driversMini?.data],
  );
  const vehicleFilterOptions = useMemo(
    () => (vehiclesMini?.data ?? []).map((v) => ({
      label: v.plate_number,
      value: v.id,
    })),
    [vehiclesMini?.data],
  );
  const statusOptions = useMemo(() => [
    { label: t('trips.statusPending'),        value: 'pending' },
    { label: t('trips.statusAssigned'),       value: 'assigned' },
    { label: t('trips.statusDriverAccepted'), value: 'driver_accepted' },
    { label: t('trips.statusEnRoutePickup'),  value: 'en_route_pickup' },
    { label: t('trips.statusPickedUp'),       value: 'picked_up' },
    { label: t('trips.statusInTransit'),      value: 'in_transit' },
    { label: t('trips.statusArrived'),        value: 'arrived' },
    { label: t('trips.statusDelivered'),     value: 'delivered' },
    { label: t('trips.statusCompleted'),      value: 'completed' },
    { label: t('trips.statusCancelled'),      value: 'cancelled' },
    { label: t('trips.statusDelayed'),        value: 'delayed' },
    { label: t('trips.statusEmergency'),      value: 'emergency' },
  ], [t]);

  const permanentFilters = useMemo<CrudFilter[]>(() => {
    const f = appliedFilters;
    const statusValue = Array.isArray(f.status) && f.status.length > 0 ? f.status : undefined;
    return [
      ...(f.company_id  ? [{ field: 'company_id',  operator: 'eq' as const, value: f.company_id  }] : []),
      ...(f.search?.trim() ? [{ field: 'search',   operator: 'eq' as const, value: f.search.trim() }] : []),
      ...(statusValue   ? [{ field: 'status',      operator: 'in' as const, value: statusValue   }] : []),
      ...(f.customer_id ? [{ field: 'customer_id', operator: 'eq' as const, value: f.customer_id }] : []),
      ...(f.driver_id   ? [{ field: 'driver_id',   operator: 'eq' as const, value: f.driver_id   }] : []),
      ...(f.vehicle_id  ? [{ field: 'vehicle_id',  operator: 'eq' as const, value: f.vehicle_id  }] : []),
      ...(f.date_from   ? [{ field: 'date_from',   operator: 'eq' as const, value: f.date_from   }] : []),
      ...(f.date_to     ? [{ field: 'date_to',     operator: 'eq' as const, value: f.date_to     }] : []),
    ];
  }, [appliedFilters]);

  const refreshTripList = useCallback(() => {
    void invalidate({ resource: 'trips', invalidates: ['list'] });
  }, [invalidate]);

  const handleSearchFilters = () => {
    setAppliedFilters(filterForm.getFieldsValue());
  };

  const handleClearFilters = () => {
    filterForm.resetFields();
    setAppliedFilters({});
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
          recordAuditIntent({ resource: 'trips', kind: 'delete', recordId: selectedTrip.id });
          feedback.success(t('notifications.deleteSuccess', { item: t('trips.title') }));
          setDeleteDialogOpen(false);
          setSelectedTrip(null);
          refreshTripList();
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
        recordAuditIntent({ resource: 'trips', kind: 'update', recordId: trip.id, meta: { action, reason } });
        feedback.success(t('notifications.updateSuccess', { item: t('trips.title') }));
        refreshTripList();
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
    [t, refreshTripList, feedback],
  );

  const handleAction = useCallback((trip: Trip, action: string) => {
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
    if (action !== 'delay' && !reasonValue.trim()) {
      return;
    }
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
      if (!isTripCompleted(record.status) && !isTerminal) {
        items.push({
          key: 'delete',
          icon: <DeleteOutlined />,
          label: t('common.delete'),
          danger: true,
          onClick: () => handleDelete(record),
        });
      }
      return { items };
    },
    [t, show, busyTripId, handleEdit, handleDelete, handleAction],
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('trips.title') },
  ];

  const exportParams = useMemo(() => {
    const f = appliedFilters;
    return {
      ...(f.company_id ? { company_id: f.company_id } : {}),
      ...(f.search?.trim() ? { keyword: f.search.trim() } : {}),
      ...(Array.isArray(f.status) && f.status.length > 0 ? { status: f.status.join(',') } : {}),
      ...(f.customer_id ? { customer_id: f.customer_id } : {}),
      ...(f.driver_id ? { driver_id: f.driver_id } : {}),
      ...(f.vehicle_id ? { vehicle_id: f.vehicle_id } : {}),
      ...(f.date_from ? { date_from: f.date_from } : {}),
      ...(f.date_to ? { date_to: f.date_to } : {}),
      format: 'csv',
    } as Record<string, unknown>;
  }, [appliedFilters]);

  const { exportFile, isExporting } = useExport({
    url: '/trips/export',
    params: exportParams,
    filename: `trips-${dayjs().format('YYYYMMDD')}.csv`,
  });

  const handleExport = useCallback(async () => {
    try {
      await exportFile();
      feedback.success('Xuất danh sách thành công');
      recordAuditIntent({ resource: 'trips', kind: 'export', meta: exportParams });
    } catch (err) {
      const msg = getErrorMessage(err) || 'Xuất danh sách thất bại';
      feedback.error(msg);
    }
  }, [exportFile, exportParams, feedback]);

  return (
    <div className="enterprise-page trips-page space-y-4">
      <PageHeader
        title={t('trips.title')}
        description={t('trips.description')}
        breadcrumb={breadcrumb}
        actions={
          <Flex gap={8}>
            <Button icon={<DownloadOutlined />} loading={isExporting} onClick={handleExport}>
              Xuất CSV
            </Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('trips.createTrip')}
            </Button>
          </Flex>
        }
      />

      <Card
        className="enterprise-section-card"
        title={<Flex align="center" gap={8}><TruckOutlined /><span>{t('trips.title')}</span></Flex>}
        styles={{ body: { padding: 16 } }}
      >
        <Form
          form={filterForm}
          layout="vertical"
          requiredMark={false}
          colon={false}
        >
          <div className="enterprise-filter-bar mb-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <Form.Item noStyle name="search">
              <Input allowClear placeholder={t('trips.filterKeyword')} />
            </Form.Item>
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
              name="customer_id"
              label={null}
              placeholder={t('invoices.customer')}
              options={customerFilterOptions}
              showSearch
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
            <FormItemSelect
              noStyle
              name="driver_id"
              label={null}
              placeholder={t('drivers.title')}
              options={driverFilterOptions}
              showSearch
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
            <FormItemSelect
              noStyle
              name="vehicle_id"
              label={null}
              placeholder={t('vehicles.title')}
              options={vehicleFilterOptions}
              showSearch
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
            <FormItemSelect
              noStyle
              name="status"
              label={null}
              placeholder={t('common.status')}
              options={statusOptions}
              mode="multiple"
              maxTagCount="responsive"
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
            <Form.Item noStyle name="date_from">
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('trips.filterDateFrom')}
                format="DD/MM/YYYY"
                onChange={(_, dateStr) => {
                  filterForm.setFieldValue(
                    'date_from',
                    typeof dateStr === 'string' && dateStr
                      ? dayjs(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD')
                      : undefined,
                  );
                }}
              />
            </Form.Item>
            <Form.Item noStyle name="date_to">
              <DatePicker
                style={{ width: '100%' }}
                placeholder={t('trips.filterDateTo')}
                format="DD/MM/YYYY"
                onChange={(_, dateStr) => {
                  filterForm.setFieldValue(
                    'date_to',
                    typeof dateStr === 'string' && dateStr
                      ? dayjs(dateStr, 'DD/MM/YYYY').format('YYYY-MM-DD')
                      : undefined,
                  );
                }}
              />
            </Form.Item>
          </div>
          <div className="list-page-filters__btn-row mb-3">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={false}
            />
          </div>
        </Form>

        <TripTable
          permanentFilters={permanentFilters}
          tripRowMenu={tripRowMenu}
          onRowClick={(record) => show('trips', record.id)}
        />
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
          onSuccess={() => { refreshTripList(); }}
        />
      )}

      <Modal
        open={reasonModal.open}
        title={reasonModal.titleKey ? t(reasonModal.titleKey as Parameters<typeof t>[0]) : ''}
        okButtonProps={{ danger: true, disabled: reasonModal.action !== 'delay' && !reasonValue.trim() }}
        onOk={handleReasonConfirm}
        onCancel={() => setReasonModal((s) => ({ ...s, open: false }))}
        destroyOnHidden
      >
        <Input.TextArea
          rows={3}
          placeholder={reasonModal.reasonKey ? t(reasonModal.reasonKey as Parameters<typeof t>[0]) : ''}
          value={reasonValue}
          onChange={(e) => setReasonValue(e.target.value)}
          style={{ marginTop: 8 }}
        />
      </Modal>
    </div>
  );
}
