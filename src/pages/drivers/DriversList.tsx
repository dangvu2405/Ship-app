import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@refinedev/core';
import { Button, Card, Form, Tabs, Tag } from 'antd';
import { CalendarOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Driver } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { DriverFormDialog } from './DriverFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

type DriverFilterForm = {
  available_status?: string;
};

export function DriversList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('drivers');
  const [filterForm] = Form.useForm<DriverFilterForm>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const availableStatusOptions = useMemo(
    () => [
      { label: t('drivers.statusAvailable'), value: 'available' },
      { label: t('drivers.statusOnTrip'), value: 'on_trip' },
      { label: t('drivers.statusOff'), value: 'off' },
    ],
    [t],
  );

  const statusTabsItems = useMemo(
    () => [
      { key: 'all', label: t('common.all') },
      { key: 'available', label: t('drivers.statusAvailable') },
      { key: 'on_trip', label: t('drivers.statusOnTrip') },
      { key: 'off', label: t('drivers.statusOff') },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Driver>({
    resource: 'drivers',
    current,
    pageSize: 15,
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus
        ? [{ field: 'available_status', operator: 'eq' as const, value: appliedStatus }]
        : []),
    ],
  });

  const safeRefetch = useSafeRefetch('drivers-driverslist', refetch);

  const handleSearchFilters = () => {
    const { available_status } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(available_status);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
    setAppliedKeyword('');
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    const next = value === 'all' ? undefined : value;
    filterForm.setFieldsValue({ available_status: next });
    setAppliedStatus(next);
    setCurrent(1);
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('drivers.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('drivers.title') }));
        },
      }
    );
  };

  const columns = useMemo<DataTableColumn<Driver>[]>(
    () => [
    {
      key: 'employee',
      header: t('drivers.employee'),
      render: (r) => r.employee?.name ?? `#${r.employee_id}`,
    },
    { key: 'license_no', header: t('drivers.licenseNo'), dataIndex: 'license_no' },
    { key: 'license_class', header: t('drivers.licenseClass'), dataIndex: 'license_class' },
    {
      key: 'expired_date',
      header: t('drivers.expiredDate'),
      dataIndex: 'expired_date',
      render: (r) => <DateTimeBadge value={r.expired_date} mode="date" />,
    },
    {
      key: 'available_status',
      header: t('drivers.availableStatus'),
      dataIndex: 'available_status',
      render: (r) => {
        const label = r.available_status === 'available'
          ? t('drivers.statusAvailable')
          : r.available_status === 'on_trip'
            ? t('drivers.statusOnTrip')
            : t('drivers.statusOff');
        const color =
          r.available_status === 'available' ? 'success' : r.available_status === 'on_trip' ? 'processing' : undefined;
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-1">
          <Button
            type="text"
            size="small"
            icon={<EyeOutlined aria-hidden />}
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('drivers', record.id);
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined aria-hidden />}
            aria-label={t('common.edit')}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record.id);
            }}
          />
          <Button
            type="text"
            size="small"
            danger
            icon={<DeleteOutlined aria-hidden />}
            aria-label={t('common.delete')}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteDialogOpen(true);
            }}
          />
        </div>
      ),
    },
  ],
    [t, show, handleEdit]
  );

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('drivers.title')}
        description={t('drivers.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('drivers.title') }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.admin.driversSchedule}>
              <Button icon={<CalendarOutlined aria-hidden />}>{t('drivers.openScheduleButton')}</Button>
            </Link>
            <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={handleCreate}>
              {t('drivers.createDriver')}
            </Button>
          </div>
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
            <Form
              form={filterForm}
              layout="vertical"
              requiredMark={false}
              colon={false}
              className="contents min-w-0 w-full"
            >
              <FormItemSelect
                noStyle
                name="available_status"
                label={null}
                placeholder={t('drivers.availableStatus')}
                options={availableStatusOptions}
                allowClear
                selectProps={{
                  classNames: { root: 'list-page-filters__select' },
                }}
              />
            </Form>
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
              <DataTable<Driver>
                data={listData}
                columns={columns}
                onRowClick={(r) => show('drivers', r.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('drivers.title') })}
                emptyAction={
                  <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={handleCreate}>
                    {t('drivers.createDriver')}
                  </Button>
                }
                pagination={{ current, total, pageSize, onPageChange: setCurrent }}
              />
            </PageLoadingOverlay>
          )}
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.license_no} />
      {formOpen && (
        <DriverFormDialog
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
