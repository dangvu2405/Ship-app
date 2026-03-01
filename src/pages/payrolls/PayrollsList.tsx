import { useList, useNavigation } from '@refinedev/core';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { BaseTable } from '@/components/table/BaseTable';
import { useTranslation } from '@/hooks/useTranslation';
import { Plus, Edit } from 'lucide-react';
import type { Payroll } from '@/types';
import type { BaseTableColumn } from '@/components/table/types';

export function PayrollsList() {
  const { t } = useTranslation();
  const { show, create } = useNavigation();

  const { data, isLoading } = useList<Payroll>({
    resource: 'payrolls',
    pagination: {
      current: 1,
      pageSize: 15,
    },
  });

  const columns: BaseTableColumn<Payroll>[] = [
    {
      title: t('payrolls.month'),
      dataIndex: 'month',
      key: 'month',
      render: (month: number) => {
        const monthNames = [
          t('payrolls.month1'), t('payrolls.month2'), t('payrolls.month3'), t('payrolls.month4'),
          t('payrolls.month5'), t('payrolls.month6'), t('payrolls.month7'), t('payrolls.month8'),
          t('payrolls.month9'), t('payrolls.month10'), t('payrolls.month11'), t('payrolls.month12'),
        ];
        return monthNames[month - 1] || month;
      },
    },
    {
      title: t('payrolls.year'),
      dataIndex: 'year',
      key: 'year',
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => (
        <span className={status === 'locked' ? 'text-green-600 dark:text-green-400' : 'text-gray-500 dark:text-gray-400'}>
          {status === 'locked' ? t('payrolls.statusLocked') : t('payrolls.statusDraft')}
        </span>
      ),
    },
    {
      title: t('payrolls.lockedAt'),
      dataIndex: 'locked_at',
      key: 'locked_at',
      render: (time: string) => time ? new Date(time).toLocaleString() : '-',
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, record: Payroll) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => show('payrolls', record.id)}
            className="h-8 w-8 p-0"
          >
            <Edit className="h-4 w-4" />
          </Button>
        </div>
      ),
    },
  ];

  const breadcrumb = [
    { label: t('dashboard.title'), path: '/dashboard' },
    { label: t('payrolls.title') },
  ];

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
          <TableSkeleton rows={5} columns={5} />
        ) : (
          <BaseTable<Payroll>
            dataSource={data?.data || []}
            loading={isLoading}
            columns={columns}
            resource="payrolls"
            pagination={{
              current: data?.current || 1,
              pageSize: data?.pageSize || 15,
              total: data?.total || 0,
            }}
            onEdit={(record) => show('payrolls', record.id)}
            useRefineDelete={false}
          />
        )}
      </div>
    </>
  );
}
