import { useCallback, useMemo, useState } from 'react';
import { useListFilters } from '@/hooks/useListFilters';
import { Link } from 'react-router-dom';
import { useNavigation, useList } from '@refinedev/core';
import { Button, Card, Flex, Form, Space, Table, Tabs, Tag, Tooltip } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import {
  CalendarOutlined,
  DeleteOutlined,
  DownloadOutlined,
  EditOutlined,
  EyeOutlined,
  PlusOutlined,
  UserOutlined,
  WarningOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { FormItemSelect } from '@/components/form';
import { PageHeader } from '@/components/common/PageHeader';
import { ListPageFilters } from '@/components/common/ListPageFilters';
import { ErrorState } from '@/components/common/ErrorState';
import { DeleteConfirmDialog } from '@/components/common/DeleteConfirmDialog';
import { useTranslation } from '@/hooks/useTranslation';
import { useAppFeedback } from '@/hooks/useAppFeedback';
import type { Driver } from '@/types';
import { ROUTES } from '@/routes';
import { shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { DriverFormDialog } from './DriverFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceDeleteMutation } from '@/hooks/useResourceDeleteMutation';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { tableDefaults } from '@/utils/tableDefaults';

type DriverFilterForm = {
  available_status?: string;
  team_id?: number;
};

interface DriverWithVehicle extends Driver {
  current_vehicle?: { id?: number; plate_number?: string } | null;
}

const STATUS_TAG_COLOR: Record<string, string> = {
  available: 'success',
  busy: 'processing',
  offline: 'default',
};

export function DriversList() {
  const { t } = useTranslation();
  const feedback = useAppFeedback();
  const { show } = useNavigation();
  const { mutate: deleteItem } = useResourceDeleteMutation('drivers');
  const [filterForm] = Form.useForm<DriverFilterForm>();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selected, setSelected] = useState<Driver | null>(null);
  const [current, setCurrent] = useState(1);
  const {
    inputs: filterInputs,
    applied: filterApplied,
    setInput: setFilterInput,
    apply: applyFilters,
    clear: clearFiltersBase,
  } = useListFilters({
    keyword: '',
    status: undefined as string | undefined,
    team_id: undefined as number | undefined,
  });

  const { data: teamsData } = useList<{ id: number; name: string }>({
    resource: 'driver-teams',
    pagination: { current: 1, pageSize: 100 },
    queryOptions: { retry: false },
  });
  const teamOptions = useMemo(
    () => (teamsData?.data ?? []).map((tm) => ({ label: tm.name, value: tm.id })),
    [teamsData?.data],
  );

  const availableStatusOptions = useMemo(
    () => [
      { label: t('drivers.statusAvailable'), value: 'available' },
      { label: t('drivers.statusOnTrip'), value: 'busy' },
      { label: t('drivers.statusOff'), value: 'offline' },
    ],
    [t],
  );

  const statusTabsItems = useMemo(
    () => [
      { key: 'all', label: t('common.all') },
      { key: 'available', label: t('drivers.statusAvailable') },
      { key: 'busy', label: t('drivers.statusOnTrip') },
      { key: 'offline', label: t('drivers.statusOff') },
    ],
    [t],
  );

  const { data, isLoading, isFetching, isError, refetch } = useResourceListQuery<DriverWithVehicle>({
    resource: 'drivers',
    current,
    pageSize: 15,
    filters: [
      ...(filterApplied.keyword
        ? [{ field: 'search', operator: 'contains' as const, value: filterApplied.keyword }]
        : []),
      ...(filterApplied.status
        ? [{ field: 'available_status', operator: 'eq' as const, value: filterApplied.status }]
        : []),
      ...(filterApplied.team_id
        ? [{ field: 'team_id', operator: 'eq' as const, value: filterApplied.team_id }]
        : []),
    ],
  });

  const safeRefetch = useSafeRefetch('drivers-driverslist', refetch);

  const handleSearchFilters = () => {
    applyFilters();
    setCurrent(1);
  };

  const handleClearFilters = () => {
    clearFiltersBase();
    filterForm.resetFields();
    setCurrent(1);
  };

  const handleStatusTabChange = (value: string) => {
    const next = value === 'all' ? undefined : value;
    filterForm.setFieldsValue({ available_status: next });
    setFilterInput('status', next);
    setCurrent(1);
  };

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const confirmDelete = () => {
    if (!selected) return;
    deleteItem(
      { id: selected.id },
      {
        onSuccess: () => {
          feedback.success(t('notifications.deleteSuccess', { item: t('drivers.title') }));
          setDeleteDialogOpen(false);
          setSelected(null);
          void safeRefetch(true);
        },
        onError: (error) => {
          if (!shouldShowLocalErrorToast(error)) return;
          feedback.error(t('notifications.deleteError', { item: t('drivers.title') }));
        },
      },
    );
  };

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  const handleExportCsv = () => {
    const header = ['code', 'name', 'phone', 'license_no', 'license_expired_date', 'available_status'];
    const csv = [
      header.join(','),
      ...listData.map((driver) =>
        [
          driver.code ?? '',
          driver.employee?.name ?? driver.name ?? '',
          driver.phone ?? driver.employee?.phone ?? '',
          driver.license_no ?? '',
          driver.expired_date ?? '',
          driver.available_status ?? '',
        ]
          .map((value) => JSON.stringify(String(value)))
          .join(','),
      ),
    ].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'drivers.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  const columns = useMemo<ColumnsType<DriverWithVehicle>>(
    () => [
      {
        title: 'Mã TX',
        dataIndex: 'code',
        key: 'code',
        width: 120,
        fixed: 'left',
        render: (code: string | undefined, row) => (
          <Button type="link" style={{ padding: 0 }} onClick={() => show('drivers', row.id)}>
            {code ?? `#${row.id}`}
          </Button>
        ),
      },
      {
        title: 'Họ tên',
        key: 'name',
        ellipsis: true,
        render: (_, row) => row.employee?.name ?? row.name ?? '—',
      },
      {
        title: 'SĐT',
        key: 'phone',
        width: 140,
        render: (_, row) => row.phone ?? row.employee?.phone ?? '—',
      },
      {
        title: 'Xe phụ trách',
        key: 'vehicle',
        width: 140,
        render: (_, row) => row.current_vehicle?.plate_number ?? '—',
      },
      {
        title: t('common.status'),
        dataIndex: 'available_status',
        key: 'available_status',
        width: 140,
        render: (s: string | undefined) => {
          const label =
            s === 'available'
              ? t('drivers.statusAvailable')
              : s === 'busy'
                ? t('drivers.statusOnTrip')
                : t('drivers.statusOff');
          return <Tag color={STATUS_TAG_COLOR[s ?? 'offline']}>{label}</Tag>;
        },
      },
      {
        title: t('dashboard.alertsTitle'),
        key: 'warnings',
        width: 140,
        render: (_, row) => {
          if (!row.expired_date) return '—';
          const date = dayjs(row.expired_date);
          if (!date.isValid()) return '—';
          const days = date.diff(dayjs(), 'day');
          if (days < 0) {
            return (
              <Tooltip title={`GPLX hết hạn ${date.format('DD/MM/YYYY')}`}>
                <Tag icon={<WarningOutlined />} color="error">GPLX hết hạn</Tag>
              </Tooltip>
            );
          }
          if (days <= 30) {
            return (
              <Tooltip title={`Còn ${days} ngày tới hạn`}>
                <Tag icon={<WarningOutlined />} color="warning">{`Sắp hết hạn (${days}d)`}</Tag>
              </Tooltip>
            );
          }
          return '—';
        },
      },
      {
        title: t('common.actions'),
        key: 'actions',
        fixed: 'right',
        width: 132,
        render: (_, row) => (
          <Space size={4}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              aria-label={t('common.view')}
              onClick={() => show('drivers', row.id)}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              aria-label={t('common.edit')}
              onClick={() => handleEdit(row.id)}
            />
            <Button
              type="text"
              size="small"
              danger
              icon={<DeleteOutlined aria-hidden />}
              aria-label={t('common.delete')}
              onClick={() => {
                setSelected(row);
                setDeleteDialogOpen(true);
              }}
            />
          </Space>
        ),
      },
    ],
    [t, show, handleEdit],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('drivers.title')}
        description={t('drivers.description')}
        breadcrumb={[{ label: t('dashboard.title'), path: ROUTES.dashboard }, { label: t('drivers.title') }]}
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to={ROUTES.admin.driversSchedule}>
              <Button icon={<CalendarOutlined aria-hidden />}>{t('drivers.openScheduleButton')}</Button>
            </Link>
            <Button icon={<DownloadOutlined aria-hidden />} onClick={handleExportCsv}>
              {t('common.export')}
            </Button>
            <Button type="primary" icon={<PlusOutlined aria-hidden />} onClick={handleCreate}>
              {t('drivers.createDriver')}
            </Button>
          </div>
        }
      />
      <Card
        className="enterprise-section-card"
        title={
          <Flex align="center" gap={8}>
            <UserOutlined />
            <span>{t('drivers.title')}</span>
          </Flex>
        }
        extra={
          <Tag>
            {total} {t('common.records')}
          </Tag>
        }
        styles={{ body: { padding: 16, display: 'flex', flexDirection: 'column', gap: 12 } }}
      >
        <Tabs activeKey={filterApplied.status ?? 'all'} onChange={handleStatusTabChange} items={statusTabsItems} />
        <Form
          form={filterForm}
          layout="vertical"
          requiredMark={false}
          colon={false}
          className="contents min-w-0 w-full"
        >
          <ListPageFilters variant="grid-2" className="enterprise-filter-bar">
            <ListPageFilters.Search
              placeholder={t('common.search')}
              value={filterInputs.keyword}
              onChange={(v) => setFilterInput('keyword', v)}
            />
            <FormItemSelect
              noStyle
              name="available_status"
              label={null}
              placeholder={t('drivers.availableStatus')}
              options={availableStatusOptions}
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
            />
            <FormItemSelect
              noStyle
              name="team_id"
              label={null}
              placeholder="Đội tài xế"
              options={teamOptions}
              showSearch
              allowClear
              classNames={{ root: 'list-page-filters__select' }}
              onChange={(v) => setFilterInput('team_id', v as number | undefined)}
            />
          </ListPageFilters>
          <div className="list-page-filters__btn-row">
            <ListPageFilters.Actions
              onSearch={handleSearchFilters}
              onReset={handleClearFilters}
              busy={isFetching && !isLoading}
            />
          </div>
        </Form>

        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <Table<DriverWithVehicle>
            {...tableDefaults}
            rowKey="id"
            loading={isLoading}
            dataSource={listData}
            columns={columns}
            pagination={{
              current,
              total,
              pageSize,
              onChange: setCurrent,
              showSizeChanger: false,
            }}
            className="enterprise-table"
            locale={{ emptyText: t('emptyState.listDescription', { resource: t('drivers.title') }) }}
          />
        )}
      </Card>
      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        onConfirm={confirmDelete}
        itemName={selected?.license_no}
      />
      {formOpen && (
        <DriverFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void safeRefetch(true);
          }}
        />
      )}
    </div>
  );
}
