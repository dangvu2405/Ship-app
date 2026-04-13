import { useCallback, useMemo, useState } from 'react';
import { useInvalidate, useNavigation } from '@refinedev/core';
import { Button, Card, Tag } from 'antd';
import { CheckCircleOutlined, DownloadOutlined, EditOutlined, EyeOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { useTranslation } from '@/hooks/useTranslation';
import type { Payroll } from '@/types';
import { ROUTES } from '@/routes';
import payrollService from '@/services/payroll.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useAuth } from '@/hooks/useAuth';
import { PayrollFormDialog } from './PayrollFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

const MONTH_KEYS = [
  'payrolls.month1', 'payrolls.month2', 'payrolls.month3', 'payrolls.month4',
  'payrolls.month5', 'payrolls.month6', 'payrolls.month7', 'payrolls.month8',
  'payrolls.month9', 'payrolls.month10', 'payrolls.month11', 'payrolls.month12',
] as const;

type Translate = ReturnType<typeof useTranslation>['t'];

function payrollStatusText(status: string, t: Translate): string {
  switch (status) {
    case 'locked':
      return t('payrolls.statusLocked');
    case 'approved':
      return t('payrolls.statusApproved');
    case 'generated':
    case 'draft':
      return t('payrolls.statusGenerated');
    default:
      return status;
  }
}

function payrollStatusTagColor(status: string): string {
  if (status === 'approved') return 'success';
  if (status === 'locked') return 'error';
  return 'processing';
}

export function PayrollsList() {
  const { t } = useTranslation();
  const { hasRole } = useAuth();
  const { show } = useNavigation();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [busy, setBusy] = useState<{ id: number; op: 'approve' | 'lock' | 'export' } | null>(null);
  const isAdmin = hasRole('admin');

  const { data, isLoading, isError, refetch } = useResourceListQuery<Payroll>({
    resource: 'payrolls',
    current,
    pageSize: 15,
  });

  const safeRefetch = useSafeRefetch('payrolls-payrollslist', refetch);

  const afterMutation = useCallback(async () => {
    await invalidate({ resource: 'payrolls', invalidates: ['list'] });
    await safeRefetch(true);
  }, [invalidate, safeRefetch]);

  const run = useCallback(
    async (id: number, op: 'approve' | 'lock' | 'export') => {
      setBusy({ id, op });
      try {
        if (op === 'approve') {
          await payrollService.approve(id);
        } else if (op === 'lock') {
          await payrollService.lock(id);
        } else {
          await payrollService.downloadExport(id);
        }
        toast.success(
          op === 'export'
            ? t('payrolls.exportJson')
            : t('notifications.updateSuccess', { item: t('payrolls.title') })
        );
        if (op !== 'export') {
          await afterMutation();
        }
      } catch (error) {
        if (!shouldShowLocalErrorToast(error)) {
          return;
        }
        toast.error(
          getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') })
        );
      } finally {
        setBusy(null);
      }
    },
    [t, afterMutation]
  );

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

  const columns = useMemo<DataTableColumn<Payroll>[]>(
    () => [
    {
      key: 'month',
      header: t('payrolls.month'),
      dataIndex: 'month',
      render: (item) => {
        const monthNum = item.month;
        return monthNum >= 1 && monthNum <= 12 ? t(MONTH_KEYS[monthNum - 1]) : monthNum;
      },
    },
    { key: 'year', header: t('payrolls.year'), dataIndex: 'year' },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Tag color={payrollStatusTagColor(item.status)}>
          {payrollStatusText(item.status, t)}
        </Tag>
      ),
    },
    {
      key: 'locked_at',
      header: t('payrolls.lockedAt'),
      dataIndex: 'locked_at',
      render: (item) => <DateTimeBadge value={item.locked_at} mode="datetime" />,
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => {
        const locked = record.status === 'locked';
        const canApprove = record.status === 'generated' || record.status === 'draft';
        const canLock = record.status === 'approved' && isAdmin;
        const isBusy = busy?.id === record.id;
        return (
          <div role="presentation" className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              onClick={() => show('payrolls', record.id)}
              title={t('common.view')}
              aria-label={t('common.view')}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              onClick={() => handleEdit(record.id)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            />
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined aria-hidden />}
              disabled={locked || isBusy || !canApprove}
              loading={isBusy && busy?.op === 'approve'}
              title={t('payrolls.approve')}
              aria-label={t('payrolls.approve')}
              onClick={() => void run(record.id, 'approve')}
            />
            <Button
              type="text"
              size="small"
              icon={<LockOutlined aria-hidden />}
              disabled={locked || isBusy || !canLock}
              loading={isBusy && busy?.op === 'lock'}
              title={isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              aria-label={isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              onClick={() => void run(record.id, 'lock')}
            />
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined aria-hidden />}
              disabled={isBusy}
              loading={isBusy && busy?.op === 'export'}
              title={t('payrolls.exportJson')}
              aria-label={t('payrolls.exportJson')}
              onClick={() => void run(record.id, 'export')}
            />
          </div>
        );
      },
    },
  ],
    [t, show, isAdmin, busy, handleEdit, run]
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('payrolls.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;

  return (
    <>
      <PageHeader
        title={t('payrolls.title')}
        description={t('payrolls.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('payrolls.createPayroll')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Payroll>
              data={listData}
              columns={columns}
              onRowClick={(record) => show('payrolls', record.id)}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('payrolls.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('payrolls.createPayroll')}
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
      </Card>
      {formOpen && (
        <PayrollFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void afterMutation();
          }}
        />
      )}
    </>
  );
}
