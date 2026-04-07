import { useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2 } from 'lucide-react';
import type { Employee } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function EmployeesList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [selectedStatus, setSelectedStatus] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isError, refetch } = useList<Employee>({
    resource: 'employees',
    pagination: {
      current,
      pageSize: 15,
    },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedType ? [{ field: 'type', operator: 'eq' as const, value: appliedType }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedType(selectedType);
    setAppliedStatus(selectedStatus);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedType(undefined);
    setSelectedStatus(undefined);
    setAppliedKeyword('');
    setAppliedType(undefined);
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleDelete = (employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedEmployee) return;

    deleteItem(
      {
        resource: 'employees',
        id: selectedEmployee.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('employees.title') }));
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('employees.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Employee>[] = [
    { key: 'code', header: t('employees.code'), dataIndex: 'code' },
    { key: 'name', header: t('employees.name'), dataIndex: 'name' },
    { key: 'email', header: t('employees.email'), dataIndex: 'email' },
    { key: 'phone', header: t('employees.phone'), dataIndex: 'phone' },
    {
      key: 'type',
      header: t('employees.type'),
      dataIndex: 'type',
      render: (item) => (
        <span className="capitalize">{item.type === 'office' ? t('employees.typeOffice') : t('employees.typeDriver')}</span>
      ),
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <span className={item.status === 'active' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </span>
      ),
    },
    { key: 'office', header: t('employees.office'), dataIndex: ['office', 'name'] },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('employees', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); edit('employees', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); handleDelete(record); }}
            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('employees.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('employees.title')}
        description={t('employees.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => create('employees')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('employees.createEmployee')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-5">
          <Input
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <Select
            allowClear
            placeholder={t('employees.type')}
            value={selectedType}
            onChange={setSelectedType}
            options={[
              { label: t('employees.typeOffice'), value: 'office' },
              { label: t('employees.typeDriver'), value: 'driver' },
            ]}
          />

          <Select
            allowClear
            placeholder={t('common.status')}
            value={selectedStatus}
            onChange={setSelectedStatus}
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]}
          />

          <Button type="button" onClick={handleSearchFilters}>
            {t('common.search')}
          </Button>

          <Button type="button" variant="outline" onClick={handleClearFilters}>
            {t('common.reset')}
          </Button>
        </div>

        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title="Unable to load employees"
            description="Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Employee>
            data={listData}
            columns={columns}
            onRowClick={(record) => show('employees', record.id)}
            emptyMessage={t('common.noData')}
            pagination={{
              current,
              total,
              pageSize,
              onPageChange: setCurrent,
            }}
          />
        )}
      </div>

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selectedEmployee?.name}
      />
    </>
  );
}
