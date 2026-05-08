import { useMemo, useState } from 'react';
import { useList, useDelete, useNavigation } from '@refinedev/core';
import { Button, Card, Input, Result, Select, Space, Table, Tabs, Tag, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DeleteOutlined, EditOutlined, EyeOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { CompanyFormDialog } from './CompanyFormDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useListFilters } from '@/hooks/useListFilters';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Company } from '@/types';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';

const { Text } = Typography;

export function CompaniesList() {
  const { t } = useTranslation();
  const toast = useAppFeedback();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useDelete();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState<'create' | 'edit' | 'show'>('create');
  const [activeId, setActiveId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);

  const { inputs: filterInputs, applied: filterApplied, setInput: setFilterInput, apply: applyFilters, clear: clearFilters } = useListFilters({
    keyword: '',
    status: undefined as string | undefined,
  });

  const { data, isLoading, isError, error: listError, refetch } = useList<Company>({
    resource: 'companies',
    pagination: { current, pageSize: 15 },
    filters: [
      ...(filterApplied.keyword.trim() ? [{ field: 'search', operator: 'contains' as const, value: filterApplied.keyword.trim() }] : []),
      ...(filterApplied.status ? [{ field: 'status', operator: 'eq' as const, value: filterApplied.status }] : []),
    ],
  });

  const handleApplyFilters = () => { applyFilters(); setCurrent(1); };
  const handleClearFilters = () => { clearFilters(); setCurrent(1); };

  const handleStatusTabChange = (value: string) => {
    const next = value === 'all' ? undefined : value;
    setFilterInput('status', next);
    applyFilters();
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
    if (!selectedCompany) return;
    deleteItem(
      { resource: 'companies', id: selectedCompany.id },
      {
        onSuccess: () => {
          toast.success(t('notifications.deleteSuccess', { item: t('companies.title') }));
          setDeleteDialogOpen(false);
          setSelectedCompany(null);
          void refetch();
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          toast.error(t('notifications.deleteError', { item: t('companies.title') }));
        },
      }
    );
  };

  const columns = useMemo<ColumnsType<Company>>(() => [
    {
      title: t('companies.code'),
      dataIndex: 'code',
      key: 'code',
      width: 120,
      render: (code: string, row) => (
        <Button type="link" style={{ padding: 0 }} onClick={() => show('companies', row.id)}>
          {code ?? `#${row.id}`}
        </Button>
      ),
    },
    { title: t('companies.name'), dataIndex: 'name', key: 'name', ellipsis: true },
    { title: t('companies.taxCode'), dataIndex: 'tax_code', key: 'tax_code', width: 140 },
    { title: t('companies.phone'), dataIndex: 'phone', key: 'phone', width: 130 },
    { title: t('companies.email'), dataIndex: 'email', key: 'email', ellipsis: true },
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
      width: 120,
      render: (_, row) => (
        <Space size="small">
          <Button type="text" size="small" icon={<EyeOutlined aria-hidden />} aria-label={t('common.view')} onClick={() => show('companies', row.id)} />
          <Button type="text" size="small" icon={<EditOutlined aria-hidden />} aria-label={t('common.edit')} onClick={() => handleOpenDialog('edit', row.id)} />
          <Button type="text" size="small" danger icon={<DeleteOutlined aria-hidden />} aria-label={t('common.delete')}
            onClick={() => { setSelectedCompany(row); setDeleteDialogOpen(true); }} />
        </Space>
      ),
    },
  ], [show, t]);

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('companies.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;

  if (isError) {
    const status = (listError as { statusCode?: number; status?: number })?.statusCode ?? (listError as { status?: number })?.status;
    if (status === 403) {
      return (
        <>
          <PageHeader title={t('companies.title')} description={t('companies.description')} breadcrumb={breadcrumb} />
          <Result status="403" title="403" subTitle={t('common.forbidden')} />
        </>
      );
    }
    return (
      <>
        <PageHeader title={t('companies.title')} description={t('companies.description')} breadcrumb={breadcrumb} />
        <ErrorState title={t('common.loadError')} description={t('common.tryAgainDescription')} onRetry={() => void refetch()} />
      </>
    );
  }

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('companies.title')}
        description={t('companies.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => handleOpenDialog('create')}>
            {t('companies.createCompany')}
          </Button>
        }
      />

      <Card className="enterprise-section-card" styles={{ body: { padding: 16 } }}>
        <div className="mb-3">
          <h2 className="enterprise-title text-slate-900">{t('companies.title')}</h2>
          <Text type="secondary" className="enterprise-record-count">
            {total} {t('common.records')}
          </Text>
        </div>

        <Tabs
          activeKey={filterApplied.status ?? 'all'}
          onChange={handleStatusTabChange}
          className="mb-3"
          items={[
            { key: 'all', label: t('common.all') },
            { key: 'active', label: t('common.active') },
            { key: 'inactive', label: t('common.inactive') },
          ]}
        />

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

        <Table<Company>
          rowKey="id"
          columns={columns}
          dataSource={listData}
          loading={isLoading}
          scroll={{ x: 900 }}
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
            onClick: () => show('companies', row.id),
            style: { cursor: 'pointer' },
          })}
        />
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
        onSuccess={() => void refetch()}
      />
    </div>
  );
}
