import { useCallback, useMemo, useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { EmployeeFormDialog } from './EmployeeFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import Plus from 'lucide-react/dist/esm/icons/plus';
import Eye from 'lucide-react/dist/esm/icons/eye';
import Edit from 'lucide-react/dist/esm/icons/edit';
import Trash2 from 'lucide-react/dist/esm/icons/trash-2';
import MoreHorizontal from 'lucide-react/dist/esm/icons/more-horizontal';
import type { Employee } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

export function EmployeesList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('employees');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [selectedType, setSelectedType] = useState<string | undefined>(undefined);
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedType, setAppliedType] = useState<string | undefined>(undefined);
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<Employee>({
    resource: 'employees',
    current,
    pageSize: 15,
    filters: [
      ...(appliedKeyword ? [{ field: 'search', operator: 'contains' as const, value: appliedKeyword }] : []),
      ...(appliedType ? [{ field: 'type', operator: 'eq' as const, value: appliedType }] : []),
      ...(appliedStatus ? [{ field: 'status', operator: 'eq' as const, value: appliedStatus }] : []),
    ],
  });

  const safeRefetch = useSafeRefetch('employees-employeeslist', refetch);

  const handleSearchFilters = () => {
    setAppliedKeyword(searchKeyword.trim());
    setAppliedType(selectedType);
    setCurrent(1);
  };

  const handleClearFilters = () => {
    setSearchKeyword('');
    setSelectedType(undefined);
    setAppliedKeyword('');
    setAppliedType(undefined);
    setAppliedStatus(undefined);
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    setAppliedStatus(value === 'all' ? undefined : value);
    setCurrent(1);
  };

  const handleDelete = useCallback((employee: Employee) => {
    setSelectedEmployee(employee);
    setDeleteDialogOpen(true);
  }, []);

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
    if (!selectedEmployee) return;

    deleteItem(
      { id: selectedEmployee.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('employees.title') }));
          setDeleteDialogOpen(false);
          setSelectedEmployee(null);
          void safeRefetch(true);
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

  const columns = useMemo<DataTableColumn<Employee>[]>(
    () => [
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
        <Badge variant={item.status === 'active' ? 'default' : 'secondary'}>
          {item.status === 'active' ? t('common.active') : t('common.inactive')}
        </Badge>
      ),
    },
    { key: 'office', header: t('employees.office'), dataIndex: ['office', 'name'] },
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
              <DropdownMenuItem onClick={() => show('employees', record.id)}>
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
  ],
    [t, show, handleDelete, handleOpenDialog]
  );

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
          <Button onClick={() => handleOpenDialog('create')} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('employees.createEmployee')}
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

            <Select
              value={selectedType ?? 'all'}
              onValueChange={(value) => setSelectedType(value === 'all' ? undefined : value)}
            >
              <SelectTrigger className="list-page-filters__radix-select">
                <SelectValue placeholder={t('employees.type')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('common.all')}</SelectItem>
                <SelectItem value="office">{t('employees.typeOffice')}</SelectItem>
                <SelectItem value="driver">{t('employees.typeDriver')}</SelectItem>
              </SelectContent>
            </Select>

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
              <DataTable<Employee>
                data={listData}
                columns={columns}
                onRowClick={(record) => show('employees', record.id)}
                emptyMessage={t('common.noData')}
                emptyDescription={t('emptyState.listDescription', { resource: t('employees.title') })}
                emptyAction={
                  <Button onClick={() => handleOpenDialog('create')} className="gap-2">
                    <Plus className="h-4 w-4" />
                    {t('employees.createEmployee')}
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
        itemName={selectedEmployee?.name}
      />
      <EmployeeFormDialog
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
