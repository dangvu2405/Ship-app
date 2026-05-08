import { Card, Table, Typography } from 'antd';
import { DollarOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { TableSkeleton } from '@/components/common/TableSkeleton';
import { ErrorState } from '@/components/common/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import { useDashboardRevenueByOffice, type OfficeRevenueRow } from '@/hooks/useDashboardRevenueByOffice';
import type { Office } from '@/types';

function formatVnd(n: number) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);
}

export function DashboardRevenueByOffice({
  offices,
  companyId,
  officeId,
  month,
  year,
}: {
  offices: Office[];
  companyId?: number;
  officeId?: number;
  month: number;
  year: number;
}) {
  const { t } = useTranslation();
  const { rows, loading, error, refetch } = useDashboardRevenueByOffice({
    offices,
    companyId,
    officeId,
    month,
    year,
  });

  const columns: ColumnsType<OfficeRevenueRow> = [
    {
      title: t('offices.title'),
      dataIndex: 'officeName',
      key: 'officeName',
      ellipsis: true,
      render: (name: string) => (
        <span className="font-medium">
          {name === '__UNASSIGNED__' ? t('dashboard.chart.unassigned') : name}
        </span>
      ),
    },
    {
      title: t('dashboard.revenueByOfficeTrips'),
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
      title={t('dashboard.revenueByOffice')}
      extra={<DollarOutlined className="text-muted-foreground text-lg" aria-hidden />}
    >
      <Typography.Paragraph type="secondary" className="-mt-2 mb-4">
        {t('dashboard.revenueByOfficeDescription', { month, year })}
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
          {t('dashboard.revenueByOfficeEmpty')}
        </Typography.Text>
      ) : (
        <Table<OfficeRevenueRow>
          size="small"
          pagination={false}
          dataSource={rows}
          rowKey="key"
          columns={columns}
          scroll={{ x: 'max-content' }}
          rowClassName={(_, index) => (index % 2 === 0 ? 'bg-white' : 'bg-slate-50/60')}
          onRow={(_, index = 0) => ({
            style: {
              transition: 'background-color 150ms ease',
              cursor: 'default',
            },
            onMouseEnter: (event) => {
              (event.currentTarget as HTMLTableRowElement).style.backgroundColor = '#eef4ff';
            },
            onMouseLeave: (event) => {
              (event.currentTarget as HTMLTableRowElement).style.backgroundColor =
                index % 2 === 0 ? '#ffffff' : '#f8fafc';
            },
          })}
        />
      )}
    </Card>
  );
}
