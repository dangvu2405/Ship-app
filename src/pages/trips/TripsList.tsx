import { useCallback, useMemo, useState } from 'react';
import { Form } from 'antd';
import { useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { ApartmentOutlined, ShopOutlined } from '@ant-design/icons';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { FormItemSelect } from '@/components/form';
import { useTranslation } from '@/hooks/useTranslation';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import Play from 'lucide-react/dist/esm/icons/play';
import CheckCircle from 'lucide-react/dist/esm/icons/check-circle';
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

/** Tab lọc nhanh theo trạng thái chuyến (đồng bộ filter API `status`). */
const TRIP_STATUS_TABS: { value: string; labelKey: string }[] = [
  { value: 'all', labelKey: 'common.all' },
  { value: 'pending', labelKey: 'trips.statusPending' },
  { value: 'in_progress', labelKey: 'trips.statusInProgress' },
  { value: 'completed', labelKey: 'trips.statusCompleted' },
  { value: 'cancelled', labelKey: 'trips.statusCancelled' },
];

const getTripStatusVariant = (status: string): 'default' | 'secondary' | 'destructive' | 'outline' => {
  switch (status) {
    case 'completed':
      return 'default';
    case 'in_progress':
      return 'secondary';
    case 'cancelled':
      return 'destructive';
    default:
      return 'outline';
  }
};

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

  const handleStatusTabChange = (value: string) => {
    setAppliedStatus(value === 'all' ? undefined : value);
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
        <Badge variant={getTripStatusVariant(item.status)}>
          {getTripStatusLabel(item.status, t)}
        </Badge>
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
        <div role="presentation" className="flex items-center" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0" aria-label={t('common.actions')}>
                <MoreHorizontal className="h-4 w-4" aria-hidden />
              </Button>
            </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => show('trips', record.id)}>
                  <Eye className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.view')}
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleEdit(record.id)}>
                  <Edit className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.edit')}
                </DropdownMenuItem>
                {/* Start trip: pending → in_progress */}
                {record.status === 'pending' && (
                  <DropdownMenuItem
                    disabled={busyTripId === record.id}
                    onClick={() => void handleStatusChange(record, 'in_progress')}
                  >
                    <Play className="h-4 w-4 mr-2" aria-hidden />
                    {t('trips.startTrip')}
                  </DropdownMenuItem>
                )}
                {/* Complete trip: in_progress → completed */}
                {record.status === 'in_progress' && (
                  <DropdownMenuItem
                    disabled={busyTripId === record.id}
                    onClick={() => void handleStatusChange(record, 'completed')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" aria-hidden />
                    {t('trips.completeTrip')}
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem variant="destructive" onClick={() => handleDelete(record)}>
                  <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                  {t('common.delete')}
                </DropdownMenuItem>
              </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ],
    [t, show, busyTripId, handleEdit, handleDelete, handleStatusChange]
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
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('trips.createTrip')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
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
                  <Button onClick={handleCreate} className="gap-2">
                    <Plus className="h-4 w-4" />
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
        </CardContent>
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
