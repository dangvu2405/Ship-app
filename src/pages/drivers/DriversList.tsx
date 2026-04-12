import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useNavigation } from '@refinedev/core';
import { Form } from 'antd';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import CalendarDaysIcon from 'lucide-react/dist/esm/icons/calendar-days';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
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
        const variant = r.available_status === 'available' ? 'default' : r.available_status === 'on_trip' ? 'secondary' : 'outline';
        const label = r.available_status === 'available'
          ? t('drivers.statusAvailable')
          : r.available_status === 'on_trip'
            ? t('drivers.statusOnTrip')
            : t('drivers.statusOff');
        return <Badge variant={variant}>{label}</Badge>;
      },
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={t('common.view')}
            onClick={(e) => {
              e.stopPropagation();
              show('drivers', record.id);
            }}
          >
            <EyeIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            aria-label={t('common.edit')}
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(record.id);
            }}
          >
            <PencilIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
            aria-label={t('common.delete')}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteDialogOpen(true);
            }}
          >
            <Trash2Icon className="h-4 w-4" aria-hidden />
          </Button>
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
            <Button variant="outline" asChild className="gap-2">
              <Link to={ROUTES.admin.driversSchedule}>
                <CalendarDaysIcon className="h-4 w-4" aria-hidden />
                {t('drivers.openScheduleButton')}
              </Link>
            </Button>
            <Button onClick={handleCreate} className="gap-2">
              <PlusIcon className="h-4 w-4" />
              {t('drivers.createDriver')}
            </Button>
          </div>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="available">{t('drivers.statusAvailable')}</TabsTrigger>
              <TabsTrigger value="on_trip">{t('drivers.statusOnTrip')}</TabsTrigger>
              <TabsTrigger value="off">{t('drivers.statusOff')}</TabsTrigger>
            </TabsList>
          </Tabs>

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
                  <Button onClick={handleCreate} className="gap-2">
                    <PlusIcon className="h-4 w-4" />
                    {t('drivers.createDriver')}
                  </Button>
                }
                pagination={{ current, total, pageSize, onPageChange: setCurrent }}
              />
            </PageLoadingOverlay>
          )}
        </CardContent>
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
