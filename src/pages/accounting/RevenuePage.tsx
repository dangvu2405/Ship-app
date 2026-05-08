import { useMemo, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tabs, Tag, theme } from 'antd';
import { ArrowUpOutlined, DollarOutlined, ExportOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { getTripStatusDisplay } from '@/utils/tripStatus';
import { useTripReportList, useCustomerNamesForReport } from '@/hooks/useAccounting';
import { useReport, useExportReport } from '@/hooks/useReports';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

const { RangePicker } = DatePicker;

interface RevenueAggregate {
  total_revenue?: number;
  completed_revenue?: number;
  pending_revenue?: number;
  trips_count?: number;
  completed_count?: number;
  by_customer?: Array<{ customer_id?: number; customer_name?: string; total?: number }>;
}

interface InvoiceRow {
  id: number;
  number?: string;
  customer?: { name?: string };
  customer_id?: number;
  total?: number;
  amount?: number;
  status?: string;
  payment_status?: 'paid' | 'unpaid' | 'partial';
  issued_at?: string;
  due_date?: string;
}

export function RevenuePage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();

  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [customerId, setCustomerId] = useState<number | undefined>(undefined);
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'unpaid' | 'partial' | undefined>(undefined);
  const [tab, setTab] = useState<'trips' | 'invoices'>('trips');

  const dateFrom = dateRange[0].format('YYYY-MM-DD');
  const dateTo = dateRange[1].format('YYYY-MM-DD');

  const tripFilters = useMemo(
    () => [
      { field: 'scheduled_date', operator: 'gte' as const, value: dateFrom },
      { field: 'scheduled_date', operator: 'lte' as const, value: dateTo },
      ...(statusFilter ? [{ field: 'status', operator: 'eq' as const, value: statusFilter }] : []),
      ...(customerId != null ? [{ field: 'customer_id', operator: 'eq' as const, value: customerId }] : []),
      ...(paymentStatus ? [{ field: 'payment_status', operator: 'eq' as const, value: paymentStatus }] : []),
    ],
    [dateFrom, dateTo, statusFilter, customerId, paymentStatus],
  );

  const { trips, loading: tripsLoading } = useTripReportList({
    filters: tripFilters,
    pageSize: 50,
    sorters: [{ field: 'created_at', order: 'desc' }],
    enabled: tab === 'trips',
  });

  const { data: aggregate } = useReport<RevenueAggregate>(
    'revenue',
    {
      date_from: dateFrom,
      date_to: dateTo,
      customer_id: customerId,
      payment_status: paymentStatus,
      status: statusFilter,
    },
  );

  const totalRevenue = aggregate?.total_revenue ?? trips.reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const completedRevenue =
    aggregate?.completed_revenue ??
    trips.filter((trip) => trip.status === 'completed').reduce((sum, trip) => sum + (trip.price ?? 0), 0);
  const tripsCount = aggregate?.trips_count ?? trips.length;
  const completedCount =
    aggregate?.completed_count ?? trips.filter((trip) => trip.status === 'completed').length;

  const { customers } = useCustomerNamesForReport(200);
  const customerOptions = useMemo(
    () => customers.map((c) => ({ label: c.name, value: c.id })),
    [customers],
  );

  const invoiceFilters = useMemo(
    () => [
      { field: 'issued_at', operator: 'gte' as const, value: dateFrom },
      { field: 'issued_at', operator: 'lte' as const, value: dateTo },
      ...(customerId != null ? [{ field: 'customer_id', operator: 'eq' as const, value: customerId }] : []),
      ...(paymentStatus ? [{ field: 'payment_status', operator: 'eq' as const, value: paymentStatus }] : []),
    ],
    [dateFrom, dateTo, customerId, paymentStatus],
  );

  const { data: invoiceData, isLoading: invoicesLoading } = useResourceListQuery<InvoiceRow>({
    resource: 'invoices',
    current: 1,
    pageSize: 50,
    filters: invoiceFilters,
    sorters: [{ field: 'issued_at', order: 'desc' }],
    enabled: tab === 'invoices',
  });
  const invoices = invoiceData?.data ?? [];

  const { exportReport } = useExportReport();

  const handleExport = async () => {
    try {
      const result = await exportReport(
        tab === 'trips' ? 'revenue' : 'revenue',
        {
          date_from: dateFrom,
          date_to: dateTo,
          customer_id: customerId,
          payment_status: paymentStatus,
          status: statusFilter,
        },
        'xlsx',
      );
      if (result?.url || result?.file) {
        window.open(result.url ?? result.file ?? '', '_blank');
      } else {
        message.info(t('accountingPages.exportSoon'));
      }
    } catch {
      message.error('Xuất báo cáo thất bại');
    }
  };

  const statusOptions = [
    { value: 'completed', label: t('trips.statusCompleted') },
    { value: 'in_transit', label: t('trips.statusInTransit') },
    { value: 'pending', label: t('trips.statusPending') },
  ];

  const paymentStatusOptions = [
    { value: 'paid', label: 'Đã thanh toán' },
    { value: 'unpaid', label: 'Chưa thanh toán' },
    { value: 'partial', label: 'Thanh toán một phần' },
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
          <Button icon={<ExportOutlined />} onClick={handleExport}>
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
          <Select
            placeholder="Khách hàng"
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 240 }}
            value={customerId}
            onChange={(v) => setCustomerId(v as number | undefined)}
            options={customerOptions}
          />
          <Select
            placeholder="Tình trạng thanh toán"
            allowClear
            style={{ width: 200 }}
            value={paymentStatus}
            onChange={(v) => setPaymentStatus(v as 'paid' | 'unpaid' | 'partial' | undefined)}
            options={paymentStatusOptions}
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
              value={tripsCount}
              suffix={t('accountingPages.revenueTripUnit')}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.revenueStatCompletedLabel')}
              value={completedCount}
              suffix={`/ ${tripsCount}`}
              valueStyle={{ color: token.colorSuccess }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Tabs
          activeKey={tab}
          onChange={(k) => setTab(k as 'trips' | 'invoices')}
          items={[
            {
              key: 'trips',
              label: 'Theo chuyến',
              children: (
                <Table<Trip>
                  dataSource={trips}
                  loading={tripsLoading}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 'max-content' }}
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
                      render: (v: string) => {
                        const { label, color } = getTripStatusDisplay(v, t);
                        return <Tag color={color}>{label}</Tag>;
                      },
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
              ),
            },
            {
              key: 'invoices',
              label: 'Theo hóa đơn',
              children: (
                <Table<InvoiceRow>
                  dataSource={invoices}
                  loading={invoicesLoading}
                  rowKey="id"
                  size="small"
                  scroll={{ x: 'max-content' }}
                  pagination={{ pageSize: 20, size: 'small' }}
                  columns={[
                    { title: 'Số hóa đơn', dataIndex: 'number', key: 'number', width: 140 },
                    {
                      title: 'Khách hàng',
                      key: 'customer',
                      render: (_, r) => r.customer?.name ?? `KH #${r.customer_id ?? ''}`,
                    },
                    {
                      title: 'Ngày phát hành',
                      dataIndex: 'issued_at',
                      key: 'issued_at',
                      render: (v?: string) => (v ? formatDate(v) : '—'),
                      width: 130,
                    },
                    {
                      title: 'Hạn thanh toán',
                      dataIndex: 'due_date',
                      key: 'due_date',
                      render: (v?: string) => (v ? formatDate(v) : '—'),
                      width: 130,
                    },
                    {
                      title: 'Tiền',
                      key: 'amount',
                      align: 'right',
                      render: (_, r) => formatMoney(Number(r.total ?? r.amount ?? 0)),
                    },
                    {
                      title: 'Trạng thái',
                      dataIndex: 'payment_status',
                      key: 'payment_status',
                      render: (v?: string) => {
                        const map: Record<string, { color: string; label: string }> = {
                          paid: { color: 'success', label: 'Đã thanh toán' },
                          unpaid: { color: 'warning', label: 'Chưa thanh toán' },
                          partial: { color: 'processing', label: 'Một phần' },
                        };
                        const cfg = map[v ?? ''] ?? { color: 'default', label: v ?? '—' };
                        return <Tag color={cfg.color}>{cfg.label}</Tag>;
                      },
                    },
                  ]}
                />
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
