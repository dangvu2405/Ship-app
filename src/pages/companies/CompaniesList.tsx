import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Form } from 'antd';
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
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { CompanyFormDialog } from './CompanyFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import type { Company } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

type CompanyFilterForm = {
  status?: string;
};

export function CompaniesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [filterForm] = Form.useForm<CompanyFilterForm>();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const statusFilterOptions = useMemo(
    () => [
      { label: t('common.active'), value: 'active' },
      { label: t('common.inactive'), value: 'inactive' },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useList<Company>({
    resource: 'companies',
    pagination: {
      current,
      pageSize: 15,
    },
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const handleSearchFilters = () => {
    const { status } = filterForm.getFieldsValue();
    setAppliedKeyword(searchKeyword.trim());
    setAppliedStatus(status);
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
    const nextStatus = value === 'all' ? undefined : value;
    filterForm.setFieldsValue({ status: nextStatus });
    setAppliedStatus(nextStatus);
    setCurrent(1);
  };

  const handleDelete = (company: Company) => {
    setSelectedCompany(company);
    setDeleteDialogOpen(true);
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
    if (!selectedCompany) return;

    deleteItem(
      {
        resource: 'companies',
        id: selectedCompany.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('companies.title') }));
          setDeleteDialogOpen(false);
          setSelectedCompany(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('companies.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<Company>[] = [
    { key: 'code', header: t('companies.code'), dataIndex: 'code' },
    { key: 'name', header: t('companies.name'), dataIndex: 'name' },
    { key: 'tax_code', header: t('companies.taxCode'), dataIndex: 'tax_code' },
    { key: 'address', header: t('companies.address'), dataIndex: 'address' },
    { key: 'phone', header: t('companies.phone'), dataIndex: 'phone' },
    { key: 'email', header: t('companies.email'), dataIndex: 'email' },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
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
            <DropdownMenuContent align="end" className="w-40">
              <DropdownMenuItem onClick={() => show('companies', record.id)}>
                <Eye className="h-4 w-4 mr-2" aria-hidden />
                {t('common.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleOpenDialog('edit', record.id)}>
                <Edit className="h-4 w-4 mr-2" aria-hidden />
                {t('common.edit')}
              </DropdownMenuItem>
              <DropdownMenuItem variant="destructive" onClick={() => handleDelete(record)}>
                <Trash2 className="h-4 w-4 mr-2" aria-hidden />
                {t('common.delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('companies.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('companies.title')}
        description={t('companies.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('companies.createCompany')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6 space-y-4">
          <Tabs value={appliedStatus ?? 'all'} onValueChange={handleStatusTabChange}>
            <TabsList variant="line" className="w-full justify-start">
              <TabsTrigger value="all">{t('common.all')}</TabsTrigger>
              <TabsTrigger value="active">{t('common.active')}</TabsTrigger>
              <TabsTrigger value="inactive">{t('common.inactive')}</TabsTrigger>
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
                name="status"
                label={null}
                placeholder={t('common.status')}
                options={statusFilterOptions}
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
              onRetry={() => refetch()}
            />
          ) : (
            <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
              <DataTable<Company>
                data={listData}
                columns={columns}
                onRowClick={(record) => show('companies', record.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('companies.title') })}
                emptyAction={
                  <Button onClick={() => handleOpenDialog('create')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('companies.createCompany')}
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
        itemName={selectedCompany?.name}
      />
      <CompanyFormDialog
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
