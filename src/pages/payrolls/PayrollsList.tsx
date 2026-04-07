import { useState } from 'react';
import { useInvalidate, useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { useTranslation } from '@/hooks/useTranslation';
import PlusIcon from 'lucide-react/dist/esm/icons/plus';
import EyeIcon from 'lucide-react/dist/esm/icons/eye';
import PencilIcon from 'lucide-react/dist/esm/icons/pencil';
import CheckCircleIcon from 'lucide-react/dist/esm/icons/check-circle';
import LockIcon from 'lucide-react/dist/esm/icons/lock';
import DownloadIcon from 'lucide-react/dist/esm/icons/download';
import type { Payroll } from '@/types';
import { ROUTES } from '@/routes';
import payrollService from '@/services/payroll.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';

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
    case 'paid':
      return t('payrolls.statusPaid');
    default:
      return t('payrolls.statusDraft');
  }
}

export function PayrollsList() {
  const { t } = useTranslation();
  const { show, create, edit } = useNavigation();
  const invalidate = useInvalidate();
  const [current, setCurrent] = useState(1);
  const [busy, setBusy] = useState<{ id: number; op: 'approve' | 'lock' | 'export' } | null>(null);

  const { data, isLoading, isError, refetch } = useList<Payroll>({
    resource: 'payrolls',
    pagination: {
      current,
      pageSize: 15,
    },
  });

  const afterMutation = async () => {
    await invalidate({ resource: 'payrolls', invalidates: ['list'] });
    await refetch();
  };

  const run = async (id: number, op: 'approve' | 'lock' | 'export') => {
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
  };

  const columns: DataTableColumn<Payroll>[] = [
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
        <span className="text-sm text-muted-foreground capitalize">
          {payrollStatusText(item.status, t)}
        </span>
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
        const isBusy = busy?.id === record.id;
        return (
          <div className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => show('payrolls', record.id)}
              className="h-8 w-8 p-0"
              title={t('common.view')}
            >
              <EyeIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => edit('payrolls', record.id)}
              className="h-8 w-8 p-0"
              title={t('common.edit')}
            >
              <PencilIcon className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={locked || isBusy}
              title={t('payrolls.approve')}
              onClick={() => void run(record.id, 'approve')}
            >
              {isBusy && busy?.op === 'approve' ? (
                <span className="text-xs">…</span>
              ) : (
                <CheckCircleIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={locked || isBusy}
              title={t('payrolls.lock')}
              onClick={() => void run(record.id, 'lock')}
            >
              {isBusy && busy?.op === 'lock' ? (
                <span className="text-xs">…</span>
              ) : (
                <LockIcon className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              disabled={isBusy}
              title={t('payrolls.exportJson')}
              onClick={() => void run(record.id, 'export')}
            >
              {isBusy && busy?.op === 'export' ? (
                <span className="text-xs">…</span>
              ) : (
                <DownloadIcon className="h-4 w-4" />
              )}
            </Button>
          </div>
        );
      },
    },
  ];

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
          <Button onClick={() => create('payrolls')} className="gap-2">
            <PlusIcon className="h-4 w-4" />
            {t('payrolls.createPayroll')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
        ) : isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => refetch()}
          />
        ) : (
          <DataTable<Payroll>
            data={listData}
            columns={columns}
            onRowClick={(record) => show('payrolls', record.id)}
            emptyMessage={t('common.noData')}
            pagination={{
              current,
              total,
              pageSize,
              onPageChange: setCurrent,
            }}
          />
        )}
      </div>
    </>
  );
}
