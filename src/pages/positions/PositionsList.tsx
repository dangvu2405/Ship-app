import { useState } from 'react';
import { useDelete, useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import type { Position } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

export function PositionsList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Position | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');

  const { data, isLoading, isError, refetch } = useList<Position>({
    resource: 'positions',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
    ],
  });

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setAppliedKeyword('');
    setCurrent(1);
  };

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'positions', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('positions.title') }));
          setDeleteOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('positions.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Position>[] = [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    {
      key: 'base_salary',
      header: t('positions.baseSalary'),
      dataIndex: 'base_salary',
      render: (row) => formatMoney(row.base_salary),
    },
    { key: 'level', header: t('positions.level'), dataIndex: 'level' },
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
              show('positions', record.id);
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
              edit('positions', record.id);
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
        title={t('positions.title')}
        description={t('positions.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('positions.title') },
        ]}
        actions={
          <Button onClick={() => create('positions')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('positions.createPosition')}
          </Button>
        }
      />
      <div className="bg-card shadow rounded-lg border p-6">
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
          <Input
            placeholder={t('common.search')}
            value={searchKeyword}
            onChange={(event) => setSearchKeyword(event.target.value)}
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
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Position>
            data={listData}
            columns={columns}
            onRowClick={(r) => show('positions', r.id)}
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
