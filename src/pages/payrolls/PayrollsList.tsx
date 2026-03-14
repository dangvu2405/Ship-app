import { useState } from 'react';
import { useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { DataTable, type DataTableColumn } from '@/components/table';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit } from 'lucide-react';
import type { Payroll } from '@/types';
import { ROUTES } from '@/routes';

const MONTH_KEYS = [
  'payrolls.month1', 'payrolls.month2', 'payrolls.month3', 'payrolls.month4',
  'payrolls.month5', 'payrolls.month6', 'payrolls.month7', 'payrolls.month8',
  'payrolls.month9', 'payrolls.month10', 'payrolls.month11', 'payrolls.month12',
] as const;

export function PayrollsList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();
  const [current, setCurrent] = useState(1);

  const { data, isLoading } = useList<Payroll>({
    resource: 'payrolls',
    pagination: {
      current,
      pageSize: 15,
    },
  });

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
        <span className={item.status === 'locked' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {item.status === 'locked' ? t('payrolls.statusLocked') : t('payrolls.statusDraft')}
        </span>
      ),
    },
    {
      key: 'locked_at',
      header: t('payrolls.lockedAt'),
      dataIndex: 'locked_at',
      render: (item) => item.locked_at ? new Date(item.locked_at).toLocaleString() : '-',
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); show('payrolls', record.id); }}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
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
            <Plus className="h-4 w-4" />
            {t('payrolls.createPayroll')}
          </Button>
        }
      />

      <div className="bg-white dark:bg-gray-800 shadow rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        {isLoading ? (
          <TableSkeleton rows={5} columns={columns.length} />
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
