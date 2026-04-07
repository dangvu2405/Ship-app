import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchField } from '@/components/common/SearchField';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import Trash2Icon from 'lucide-react/dist/esm/icons/trash-2';
import type { Driver } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function DriversList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<Driver>({
    resource: 'drivers',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus
        ? [{ field: 'available_status', operator: 'eq' as const, value: appliedStatus }]
        : []),
    ],
  });

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

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'drivers', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('drivers.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('drivers.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Driver>[] = [
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
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); show('drivers', record.id); }}>
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={(e) => { e.stopPropagation(); edit('drivers', record.id); }}>
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSelected(record); setDeleteDialogOpen(true); }}>
            <Trash2Icon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

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
          <Button onClick={() => create('drivers')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('drivers.createDriver')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="available">{t('drivers.statusAvailable')}</TabsTrigger>
              <TabsTrigger value="on_trip">{t('drivers.statusOnTrip')}</TabsTrigger>
              <TabsTrigger value="off">{t('drivers.statusOff')}</TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="grid grid-cols-1 gap-3 md:grid-cols-4">
            <SearchField
              placeholder={t('common.search')}
              value={searchKeyword}
              onChange={setSearchKeyword}
            />
            <Select
              allowClear
              placeholder={t('drivers.availableStatus')}
              value={selectedStatus}
              onChange={setSelectedStatus}
              options={[
                { label: t('drivers.statusAvailable'), value: 'available' },
                { label: t('drivers.statusOnTrip'), value: 'on_trip' },
                { label: t('drivers.statusOff'), value: 'off' },
              ]}
            />
            <Button type="button" onClick={handleSearchFilters}>{t('common.search')}</Button>
            <Button type="button" variant="outline" onClick={handleClearFilters}>{t('common.reset')}</Button>
          </div>

          {isLoading ? (
            <TableSkeleton rows={5} columns={columns.length} />
          ) : isError ? (
            <ErrorState
              title={t('common.loadError')}
              description={t('common.tryAgainDescription')}
              onRetry={() => refetch()}
            />
          ) : (
            <DataTable<Driver>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('drivers', r.id)}
              emptyMessage={t('common.noData')}
              pagination={{ current, total, pageSize, onPageChange: setCurrent }}
            />
          )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen} onConfirm={confirmDelete} itemName={selected?.license_no} />
    </>
  );
}
