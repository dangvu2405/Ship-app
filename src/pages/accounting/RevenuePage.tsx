import { useState } from 'react';
import { App, Button, Card, Col, DatePicker, Empty, Row, Select, Space, Statistic, Table, Tag, theme } from 'antd';
import { ArrowUpOutlined, DollarOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { getTripStatusLabel, getTripStatusTagColor } from '@/utils/tripStatus';
import { useTripReportList } from '@/hooks/useAccounting';

const { RangePicker } = DatePicker;

export function RevenuePage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const filters = [
    { field: 'scheduled_date', operator: 'gte' as const, value: dateRange[0].format('YYYY-MM-DD') },
    { field: 'scheduled_date', operator: 'lte' as const, value: dateRange[1].format('YYYY-MM-DD') },
    ...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : []),
  ];

  const { trips, loading: isLoading } = useTripReportList({
    filters,
    pageSize: 50,
    sorters: [{ field: 'created_at', order: 'desc' }],
  });
  const totalRevenue = trips.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const completedRevenue = trips
    .filter((trip) => trip.status === 'completed')
    .reduce((sum, trip) => sum + (trip.price ?? 0), 0);

  const statusOptions = [
    { value: 'completed', label: t('trips.statusCompleted') },
    { value: 'in_transit', label: t('trips.statusInTransit') },
    { value: 'pending', label: t('trips.statusPending') },
  ];

  return (
    <div>
      <PageHeader
        title={t('accountingPages.revenueTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.revenueTitle') },
        ]}
        actions={
          <Button
            icon={<ExportOutlined />}
            onClick={() => message.info(t('accountingPages.exportSoon'))}
          >
            {t('accountingPages.exportExcel')}
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            format="DD/MM/YYYY"
          />
          <Select
            placeholder={t('accountingPages.statusPlaceholder')}
            allowClear
            style={{ width: 160 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={statusOptions}
          />
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: token.marginMD }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.revenueStatTotal')}
              value={totalRevenue}
              formatter={(v) => formatMoney(Number(v))}
              prefix={<DollarOutlined />}
              valueStyle={{ color: token.colorSuccess }}
              suffix={<ArrowUpOutlined />}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.revenueStatCompleted')}
              value={completedRevenue}
              formatter={(v) => formatMoney(Number(v))}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.revenueStatTrips')}
              value={trips.length}
              suffix={t('accountingPages.revenueTripUnit')}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.revenueStatCompletedLabel')}
              value={trips.filter((trip) => trip.status === 'completed').length}
              suffix={`/ ${trips.length}`}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Table<Trip>
          dataSource={trips}
          loading={isLoading}
          rowKey="id"
          size="small"
          locale={{
            emptyText: isLoading
              ? t('common.loading')
              : <Empty description="Không có doanh thu trong kỳ này" image={Empty.PRESENTED_IMAGE_SIMPLE} />,
          }}
          pagination={{
            pageSize: 20,
            size: 'small',
            showTotal: (total) => t('accountingPages.revenueShowTotal', { count: total }),
          }}
          summary={(rows) => {
            const sum = rows.reduce((s, r) => s + (r.price ?? 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={4}>
                  <strong>{t('accountingPages.revenueGrandTotal')}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} align="right">
                  <strong>{formatMoney(sum)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} />
              </Table.Summary.Row>
            );
          }}
          columns={[
            { title: t('accountingPages.revenueTableCode'), dataIndex: 'code', key: 'code', width: 130 },
            {
              title: t('accountingPages.revenueTableCustomer'),
              key: 'customer',
              render: (_, r) =>
                (r.customer as { name?: string })?.name ??
                t('accountingPages.revenueCustomerFallback', { id: r.customer_id }),
            },
            {
              title: t('accountingPages.revenueTablePickup'),
              dataIndex: 'start_point',
              key: 'start_point',
              ellipsis: true,
            },
            {
              title: t('accountingPages.revenueTableDropoff'),
              dataIndex: 'end_point',
              key: 'end_point',
              ellipsis: true,
            },
            {
              title: t('accountingPages.revenueTableAmount'),
              dataIndex: 'price',
              key: 'price',
              align: 'right',
              render: (v: number) => formatMoney(v),
            },
            {
              title: t('accountingPages.revenueTableStatus'),
              dataIndex: 'status',
              key: 'status',
              render: (v: string) => (
                <Tag color={getTripStatusTagColor(v)}>{getTripStatusLabel(v, t)}</Tag>
              ),
            },
            {
              title: t('accountingPages.revenueTableDate'),
              dataIndex: 'scheduled_date',
              key: 'scheduled_date',
              render: (v: string | undefined) => (v ? formatDate(v) : '—'),
              width: 100,
            },
          ]}
        />
      </Card>
    </div>
  );
}
