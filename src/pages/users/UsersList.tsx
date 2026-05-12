import { useCallback, useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { App, Button, Card, Dropdown, Input, Result, Select, Space, Table, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  DeleteOutlined,
  EditOutlined,
  EyeOutlined,
  KeyOutlined,
  MoreOutlined,
  PlusOutlined,
  StopOutlined,
  CheckCircleOutlined,
} from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useListFilters } from '@/hooks/useListFilters';
import { useAuth } from '@/hooks/useAuth';
import type { Role, User } from '@/types';

import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast, getErrorMessage } from '@/utils/errorHandler';
import { UserFormDialog } from './UserFormDialog';
import api from '@/services/api';
import { ENDPOINTS } from '@/services/endpoints';

const { Text } = Typography;

export function UsersList() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const canCreateUser = hasRole('super_admin') || hasRole('admin_company');
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const { message, modal } = App.useApp();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [current, setCurrent] = useState(1);

  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFilters } = useListFilters({
    keyword: '',
    status: undefined as string | undefined,
    roleIds: [] as number[],
  });

  const { data: rolesData } = useList<Role>({
    resource: 'roles',
    pagination: { current: 1, pageSize: 100 },
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const roleOptions = useMemo(
    () => (rolesData?.data ?? []).map((r) => ({ label: r.name, value: r.id })),
    [rolesData?.data],
  );

  const { data, isLoading, isError, error: listError, refetch } = useList<User>({
    resource: 'users',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(filterApplied.keyword.trim() ? [{ field: 'search', operator: 'contains' as const, value: filterApplied.keyword.trim() }] : []),
      ...(filterApplied.status ? [{ field: 'status', operator: 'eq' as const, value: filterApplied.status }] : []),
      ...(filterApplied.roleIds.length ? [{ field: 'role_ids', operator: 'in' as const, value: filterApplied.roleIds }] : []),
    ],
  });

  const handleApplyFilters = useCallback(() => { applyFilters(); setCurrent(1); }, [applyFilters]);
  const handleClearFilters = useCallback(() => { clearFilters(); setCurrent(1); }, [clearFilters]);

  const handleCreate = useCallback(() => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  }, []);

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const handleToggleStatus = useCallback((user: User) => {
    const nextStatus = user.status === 'active' ? 'inactive' : 'active';
    modal.confirm({
      title: nextStatus === 'inactive' ? 'Vô hiệu hóa người dùng?' : 'Kích hoạt người dùng?',
      content: `${user.username} sẽ ${nextStatus === 'active' ? 'có thể' : 'không thể'} đăng nhập sau khi xác nhận.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      okButtonProps: nextStatus === 'inactive' ? { danger: true } : undefined,
      onOk: async () => {
        try {
          await api.patch(ENDPOINTS.users.status(user.id), { status: nextStatus });
          message.success('Đã cập nhật trạng thái');
          void refetch();
        } catch (err) {
          if (shouldShowLocalErrorToast(err)) {
            message.error(getErrorMessage(err) || 'Cập nhật thất bại');
          }
        }
      },
    });
  }, [modal, message, refetch]);

  const handleResetPassword = useCallback((user: User) => {
    modal.confirm({
      title: 'Đặt lại mật khẩu?',
      content: `Mật khẩu của người dùng ${user.username} sẽ được đặt lại về giá trị mặc định.`,
      okText: 'Xác nhận',
      cancelText: 'Hủy',
      onOk: async () => {
        try {
          await api.post(ENDPOINTS.users.resetPassword(user.id));
          message.success('Đã đặt lại mật khẩu thành công');
        } catch (err) {
          if (shouldShowLocalErrorToast(err)) {
            message.error(getErrorMessage(err) || 'Thao tác thất bại');
          }
        }
      },
    });
  }, [modal, message]);

  const confirmDelete = () => {
    if (!selectedUser) return;
    deleteItem(
      { resource: 'users', id: selectedUser.id },
      {
        onSuccess: () => {
          message.success(t('notifications.deleteSuccess', { item: t('users.title') }));
          setDeleteDialogOpen(false);
          setSelectedUser(null);
          void refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          message.error(t('notifications.deleteError', { item: t('users.title') }));
        },
      }
    );
  };

  const columns = useMemo<ColumnsType<User>>(() => [
    {
      title: t('users.username'),
      dataIndex: 'username',
      key: 'username',
      render: (v: string, row) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => show('users', row.id)}>
          {v}
        </Button>
      ),
    },
    { title: t('users.email'), dataIndex: 'email', key: 'email', ellipsis: true },
    {
      title: t('users.employee'),
      key: 'employee',
      render: (_, row) => row.employee?.name ?? '—',
    },
    {
      title: t('users.roles'),
      key: 'roles',
      render: (_, row) =>
        row.roles && row.roles.length > 0 ? (
          <Space size={4} wrap>
            {row.roles.map((r) => (
              <Tag key={r.id} color="blue">
                {r.name}
              </Tag>
            ))}
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      width: 110,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'success' : 'default'}>
          {s === 'active' ? t('common.active') : t('common.inactive')}
        </Tag>
      ),
    },
    {
      title: t('common.actions'),
      key: 'actions',
      fixed: 'right',
      width: 160,
      render: (_, row) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={() => show('users', row.id)} />
          <Button type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} onClick={() => handleEdit(row.id)} />
          <Dropdown
            trigger={['click']}
            menu={{
              items: [
                {
                  key: 'toggle',
                  label: row.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt',
                  icon: row.status === 'active' ? <StopOutlined /> : <CheckCircleOutlined />,
                  onClick: () => handleToggleStatus(row),
                },
                {
                  key: 'reset',
                  label: 'Đặt lại mật khẩu',
                  icon: <KeyOutlined />,
                  onClick: () => handleResetPassword(row),
                },
                { type: 'divider' as const },
                {
                  key: 'delete',
                  label: t('common.delete'),
                  icon: <DeleteOutlined />,
                  danger: true,
                  onClick: () => { setSelectedUser(row); setDeleteDialogOpen(true); },
                },
              ],
            }}
          >
            <Button type="text" size="small" icon={<MoreOutlined />} />
          </Dropdown>
        </Space>
      ),
    },
  ], [show, t, handleToggleStatus, handleResetPassword, handleEdit]);

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('users.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isError) {
    const status = (listError as { statusCode?: number; status?: number })?.statusCode ?? (listError as { status?: number })?.status;
    if (status === 403) {
      return (
        <>
          <PageHeader title={t('users.title')} description={t('users.description')} breadcrumb={breadcrumb} />
          <Result status="403" title="403" subTitle={t('common.forbidden')} />
        </>
      );
    }
    return (
      <>
        <PageHeader title={t('users.title')} description={t('users.description')} breadcrumb={breadcrumb} />
        <ErrorState title={t('common.loadError')} description={t('common.tryAgainDescription')} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('users.title')}
        description={t('users.description')}
        breadcrumb={breadcrumb}
        actions={
          canCreateUser ? (
            <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
              {t('users.createUser')}
            </Button>
          ) : undefined
        }
      />

      <Card className="enterprise-section-card" styles={{ body: { padding: 16 } }}>
        <div className="mb-4">
          <h2 className="enterprise-title text-slate-900">{t('users.title')}</h2>
          <Text type="secondary" className="enterprise-record-count">
            {total} {t('common.records')}
          </Text>
        </div>

        <ListPageFilters variant="grid-3" className="enterprise-filter-bar mb-4">
          <Input
            placeholder={t('common.search')}
            value={filterInputs.keyword}
            onChange={(e) => setFilterInput('keyword', e.target.value)}
            allowClear
            onPressEnter={handleApplyFilters}
          />
          <Select
            className="w-full"
            mode="multiple"
            allowClear
            placeholder={t('users.roles')}
            value={filterInputs.roleIds}
            onChange={(v) => setFilterInput('roleIds', v as number[])}
            options={roleOptions}
            maxTagCount="responsive"
          />
          <Select
            className="w-full"
            allowClear
            placeholder={t('common.status')}
            value={filterInputs.status}
            onChange={(v) => setFilterInput('status', v)}
            options={[
              { label: t('common.active'), value: 'active' },
              { label: t('common.inactive'), value: 'inactive' },
            ]}
          />
          <div className="list-page-filters__btn-row col-span-full">
            <ListPageFilters.Actions onSearch={handleApplyFilters} onReset={handleClearFilters} busy={isLoading} />
          </div>
        </ListPageFilters>

        <Table<User>
          rowKey="id"
          columns={columns}
          dataSource={listData}
          loading={isLoading}
          scroll={{ x: 'max-content' }}
          className="enterprise-table"
          pagination={{
            current,
            total,
            pageSize: 15,
            showSizeChanger: false,
            showTotal: (n) => `${n} ${t('common.records')}`,
            onChange: (page) => setCurrent(page),
          }}
          onRow={(row) => ({
            onClick: () => show('users', row.id),
            style: { cursor: 'pointer' },
          })}
        />
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
          onClose={() => { setFormOpen(false); setEditingId(undefined); }}
          onSuccess={() => void refetch()}
        />
      )}
    </div>
  );
}
