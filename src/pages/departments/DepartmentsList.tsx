import { useCallback, useMemo, useState } from 'react';
import { useNavigation } from '@refinedev/core';
import { Form } from 'antd';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ShopOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { DepartmentFormDialog } from './DepartmentFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import TrashIcon from 'lucide-react/dist/esm/icons/trash-2';
import type { Department, Office } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';

type DepartmentFilterForm = {
  office_id?: number;
};

export function DepartmentsList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('departments');
  const [filterForm] = Form.useForm<DepartmentFilterForm>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Department | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedOfficeId, setAppliedOfficeId] = useState<number | undefined>(undefined);

  const mapOfficeOption = useCallback(
    (o: Office) => ({ label: o.name ?? `#${o.id}`, value: o.id }),
    [],
  );
  const officesSelect = usePaginatedResourceSelectOptions<Office>({
    resource: 'offices',
    sorters: [{ field: 'name', order: 'asc' }],
    mapOption: mapOfficeOption,
  });

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Department>({
    resource: 'departments',
    current,
    pageSize: 15,
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedOfficeId ? [{ field: 'office_id', operator: 'eq' as const, value: appliedOfficeId }] : []),
    ],
  });

  const safeRefetch = useSafeRefetch('departments-departmentslist', refetch);

  const handleSearchFilters = () => {
    const { office_id } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedOfficeId(office_id);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
    setAppliedKeyword('');
    setAppliedOfficeId(undefined);
    setCurrent(1);
  };

  const handleOpenDialog = useCallback((mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  }, []);

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('departments.title') }));
          setDeleteOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('departments.title') }));
        },
      }
    );
  };

  const columns = useMemo<DataTableColumn<Department>[]>(
    () => [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    {
      key: 'office',
      header: t('employees.office'),
      render: (row) => row.office?.name ? <Badge variant="outline">{row.office.name}</Badge> : '—',
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
              show('departments', record.id);
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
              handleOpenDialog('edit', record.id);
            }}
          >
            <PencilIcon className="h-4 w-4" aria-hidden />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-destructive"
            aria-label={t('common.delete')}
            onClick={(e) => {
              e.stopPropagation();
              setSelected(record);
              setDeleteOpen(true);
            }}
          >
            <TrashIcon className="h-4 w-4" aria-hidden />
          </Button>
        </div>
      ),
    },
  ],
    [t, show, handleOpenDialog]
  );

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
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('departments.createDepartment')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
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
            <DataTable<Department>
              data={listData}
              columns={columns}
              onRowClick={(r) => show('departments', r.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('departments.title') })}
              emptyAction={
                <Button onClick={() => handleOpenDialog('create')} className="gap-2">
                  <PlusIcon className="h-4 w-4" />
                  {t('departments.createDepartment')}
                </Button>
              }
              pagination={{ current, total, pageSize: 15, onPageChange: setCurrent }}
            />
            </PageLoadingOverlay>
          )}
        </CardContent>
      </Card>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />
      <DepartmentFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          void safeRefetch(true);
        }}
      />
    </>
  );
}
