import { useCallback, useMemo, useState } from 'react';
import { useDelete, useList, useNavigation } from '@refinedev/core';
import { Button, Card, Form, Tag } from 'antd';
import { ApartmentOutlined, DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { OfficeFormDialog } from './OfficeFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Office } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { usePaginatedResourceSelectOptions } from '@/hooks/usePaginatedResourceSelectOptions';

type OfficeFilterForm = {
  company_id?: number;
};

export function OfficesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [filterForm] = Form.useForm<OfficeFilterForm>();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selected, setSelected] = useState<Office | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedCompanyId, setAppliedCompanyId] = useState<number | undefined>(undefined);

  const companyFilters = useMemo(
    () => [{ field: 'status', operator: 'eq' as const, value: 'active' }],
    [],
  );
  const mapCompanyOption = useCallback(
    (c: Company) => ({ label: c.name ?? `#${c.id}`, value: c.id }),
    [],
  );
  const companiesSelect = usePaginatedResourceSelectOptions<Company>({
    resource: 'companies',
    filters: companyFilters,
    sorters: [{ field: 'name', order: 'asc' }],
    mapOption: mapCompanyOption,
  });

  const { data, isLoading, isFetching, isError, refetch } = useList<Office>({
    resource: 'offices',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedCompanyId
        ? [{ field: 'company_id', operator: 'eq' as const, value: appliedCompanyId }]
        : []),
    ],
  });

  const handleSearchFilters = () => {
    const { company_id } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedCompanyId(company_id);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    filterForm.resetFields();
    setAppliedKeyword('');
    setAppliedCompanyId(undefined);
    setCurrent(1);
  };

  const handleOpenDialog = (mode: 'create' | 'edit' | 'show', id?: number) => {
    setDialogMode(mode);
    setActiveId(id);
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setDialogMode('create');
    setActiveId(undefined);
  };

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { resource: 'offices', id: selected.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('offices.title') }));
          setDeleteOpen(false);
          setSelected(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('offices.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Office>[] = [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    {
      key: 'company',
      header: t('payrolls.company'),
      render: (row) => row.company?.name ? <Tag>{row.company.name}</Tag> : `—`,
    },
    { key: 'address', header: t('companies.address'), dataIndex: 'address' },
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
              show('offices', record.id);
            }}
          />
          <Button
            type="text"
            size="small"
            icon={<EditOutlined aria-hidden />}
            aria-label={t('common.edit')}
            onClick={(e) => {
              e.stopPropagation();
              handleOpenDialog('edit', record.id);
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
              setDeleteOpen(true);
            }}
          />
        </div>
      ),
    },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;

  return (
    <>
      <PageHeader
        title={t('offices.title')}
        description={t('offices.description')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('offices.title') },
        ]}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
            {t('offices.createOffice')}
          </Button>
        }
      />
      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24, display: 'flex', flexDirection: 'column', gap: 16 } }}>
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
              onRetry={() => refetch()}
            />
          ) : (
            <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
              <DataTable<Office>
                data={listData}
                columns={columns}
                onRowClick={(r) => show('offices', r.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('offices.title') })}
                emptyAction={
                  <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
                    {t('offices.createOffice')}
                  </Button>
                }
                pagination={{ current, total, pageSize: 15, onPageChange: setCurrent }}
              />
            </PageLoadingOverlay>
          )}
      </Card>
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        onConfirm={confirmDelete}
        itemName={selected?.name}
      />
      <OfficeFormDialog
        open={dialogOpen}
        mode={dialogMode}
        recordId={activeId}
        onClose={handleCloseDialog}
        onSuccess={() => {
          refetch();
        }}
      />
    </>
  );
}
