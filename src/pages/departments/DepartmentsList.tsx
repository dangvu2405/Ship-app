import { useState } from 'react';
import { useDelete, useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import TrashIcon from 'lucide-react/dist/esm/icons/trash-2';
import type { Department, Office } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function DepartmentsList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedOfficeId, setSelectedOfficeId] = useState<number | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);

  const { data: officesData } = useList<Office>({
    resource: 'offices',
    pagination: { current: 1, pageSize: 200 },
  });

  const { data, isLoading, isError, refetch } = useList<Department>({
    resource: 'departments',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedOfficeId ? [{ field: 'office_id', operator: 'eq' as const, value: appliedOfficeId }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedOfficeId(selectedOfficeId);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedOfficeId(undefined);
    setAppliedKeyword('');
    setAppliedOfficeId(undefined);
    setCurrent(1);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'departments', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('departments.title') }));
          setDeleteOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('departments.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Department>[] = [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    {
      key: 'office',
      header: t('employees.office'),
      render: (row) => row.office?.name ?? '—',
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
            onClick={(e) => {
              e.stopPropagation();
              show('departments', record.id);
            }}
          >
            <EyeIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            onClick={(e) => {
              e.stopPropagation();
              edit('departments', record.id);
            }}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteOpen(true);
            }}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('departments.title')}
        description={t('departments.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('departments.title') },
        ]}
        actions={
          <Button onClick={() => create('departments')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('departments.createDepartment')}
          </Button>
        }
      />
      <div className="bg-card shadow rounded-lg border p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-4">
          <Input
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
          />

          <Select
            allowClear
            showSearch
            placeholder={t('employees.office')}
            value={selectedOfficeId}
            onChange={setSelectedOfficeId}
            options={(officesData?.data ?? []).map((office) => ({
              label: office.name,
              value: office.id,
            }))}
            optionFilterProp="label"
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
            title="Unable to load departments"
            description="Please try again."
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Department>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('departments', r.id)}
            emptyMessage={t('common.noData')}
            pagination={{ current, total, pageSize: 15, onPageChange: setCurrent }}
          />
        )}
      </div>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />
    </>
  );
}
