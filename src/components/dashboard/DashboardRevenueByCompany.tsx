import { Card, Table, Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardRevenueByCompany, type CompanyRevenueRow } from '@/hooks/useDashboardRevenueByCompany';
import type { Company } from '@/types';

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export function DashboardRevenueByCompany({
  companies,
  companyId,
  month,
  year,
}: {
  companies: Company[];
  companyId?: number;
  month: number;
  year: number;
}) {
  const { t } = useTranslation();
  const { rows, loading, error, refetch } = useDashboardRevenueByCompany({
    companies,
    companyId,
    month,
    year,
  });

  const columns: ColumnsType<CompanyRevenueRow> = [
    {
      title: t('companies.name'),
      dataIndex: 'companyName',
      key: 'companyName',
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium">
          {name === '__UNASSIGNED__' ? t('dashboard.chart.unassigned') : name}
        </span>
      ),
    },
    {
      title: t('dashboard.revenueByCompanyTrips'),
      dataIndex: 'completedTrips',
      key: 'completedTrips',
      width: 120,
      align: 'right',
      className: 'tabular-nums',
    },
    {
      title: t('dashboard.cards.totalRevenue'),
      dataIndex: 'revenue',
      key: 'revenue',
      width: 160,
      align: 'right',
      className: 'tabular-nums font-medium',
      render: (v: number) => formatVnd(v),
    },
  ];

  return (
    <Card
      title={t('dashboard.revenueByCompany')}
      extra={<DollarOutlined className="text-muted-foreground text-lg" aria-hidden />}
    >
      <Typography.Paragraph type="secondary" className="-mt-2 mb-4">
        {t('dashboard.revenueByCompanyDescription', { month, year })}
      </Typography.Paragraph>
      {loading ? (
        <TableSkeleton rows={6} columns={3} />
      ) : error ? (
        <ErrorState
          title={t('common.loadError')}
          description={t('common.tryAgainDescription')}
          onRetry={() => void refetch()}
          className="py-10"
        />
      ) : rows.length === 0 ? (
        <Typography.Text type="secondary" className="block py-6 text-center text-sm">
          {t('dashboard.revenueByCompanyEmpty')}
        </Typography.Text>
      ) : (
        <Table<CompanyRevenueRow>
          size="small"
          pagination={false}
          dataSource={rows}
          rowKey="key"
          columns={columns}
        />
      )}
    </Card>
  );
}
