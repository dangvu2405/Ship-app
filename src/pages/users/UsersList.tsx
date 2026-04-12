import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Form } from 'antd';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Eye, Edit, Trash2, MoreHorizontal } from 'lucide-react';
import type { User } from '@/types';
import toast from 'react-hot-toast';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { UserFormDialog } from './UserFormDialog';

type UserFilterForm = {
  status?: string;
};

export function UsersList() {
  const { t } = useTranslation();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [filterForm] = Form.useForm<UserFilterForm>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [current, setCurrent] = useState(1);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [appliedKeyword, setAppliedKeyword] = useState('');
  const [appliedStatus, setAppliedStatus] = useState<string | undefined>(undefined);

  const userStatusOptions = useMemo(
    () => [
      { label: t('common.active'), value: 'active' },
      { label: t('common.inactive'), value: 'inactive' },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useList<User>({
    resource: 'users',
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

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = (id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  };

  const handleDelete = (user: User) => {
    setSelectedUser(user);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (!selectedUser) return;

    deleteItem(
      {
        resource: 'users',
        id: selectedUser.id,
      },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('users.title') }));
          setDeleteDialogOpen(false);
          setSelectedUser(null);
          refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) {
            return;
          }

          toast.error(t('notifications.deleteError', { item: t('users.title') }));
        },
      }
    );
  };

  const columns: DataTableColumn<User>[] = [
    { key: 'username', header: t('users.username'), dataIndex: 'username' },
    { key: 'email', header: t('users.email'), dataIndex: 'email' },
    { key: 'employee', header: t('users.employee'), dataIndex: ['employee', 'name'] },
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
      key: 'roles',
      header: t('users.roles'),
      dataIndex: 'roles',
      render: (item) => item.roles?.map((r: { name: string }) => r.name).join(', ') || '-',
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
              <DropdownMenuItem onClick={() => show('users', record.id)}>
                <Eye className="h-4 w-4 mr-2" aria-hidden />
                {t('common.view')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => handleEdit(record.id)}>
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
    { label: t('users.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button onClick={handleCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            {t('users.createUser')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border">
        <CardContent className="p-6">
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
              options={userStatusOptions}
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
            <DataTable<User>
              data={listData}
              columns={columns}
              onRowClick={(record) => show('users', record.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('users.title') })}
              emptyAction={
                <Button onClick={handleCreate} className="gap-2">
                  <Plus className="h-4 w-4" />
                  {t('users.createUser')}
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
        itemName={selectedUser?.username}
      />

      {formOpen && (
        <UserFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            refetch();
          }}
        />
      )}
    </>
  );
}
