import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCustom, useList } from '@refinedev/core';
import { DownloadOutlined } from '@ant-design/icons';
import { Avatar, Button, Card, Col, Flex, Progress, Row, Segmented, Select, Space, Statistic, Table, Tag, Typography, theme } from 'antd';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import type { Company } from '@/types';
import type { PayrollSummaryData } from '@/services/reports.service';
import { ENDPOINTS } from '@/services/endpoints';
import { downloadCsvRows } from '@/utils/csvDownload';
import { formatMoney } from '@/utils/displayFormat';
import { useReport, useExportReport } from '@/hooks/useReports';
import { useAppFeedback } from '@/hooks/useAppFeedback';

import {
  WalletOutlined,
  TeamOutlined,
  TruckOutlined,
  FileTextOutlined,
  LineChartOutlined,
  DollarOutlined,
} from '@ant-design/icons';

const now = () => {
  const d = new Date();
  return { month: d.getMonth() + 1, year: d.getFullYear() };
};

function readMonthFromSearch(): number {
  const raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('month') : null;
  const m = Number(raw);
  return Number.isFinite(m) && m >= 1 && m <= 12 ? m : now().month;
}

function readYearFromSearch(): number {
  const raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('year') : null;
  const y = Number(raw);
  return Number.isFinite(y) && y >= 1900 && y <= 2100 ? y : now().year;
}

function readCompanyFromSearch(): string {
  const raw = typeof window !== 'undefined' ? new URLSearchParams(window.location.search).get('company') : null;
  return raw && /^\d+$/.test(raw) ? raw : '';
}

function buildReportCsvRows(
  t: (key: string) => string,
  input: {
    month: number;
    year: number;
    companiesCount: number | null;
    payrollsInPeriod: number | null;
    companyId: string;
    companies: Company[];
    payrollSummary: PayrollSummaryData | null | undefined;
  },
): (string | number)[][] {
  const { month, year, companiesCount, payrollsInPeriod, companyId, companies, payrollSummary } = input;
  const rows: (string | number)[][] = [];

  rows.push([t('reports.csvSectionSnapshot')]);
  rows.push([t('reports.month'), month]);
  rows.push([t('reports.year'), year]);
  rows.push([t('reports.companiesInPeriod'), companiesCount ?? '']);
  rows.push([t('reports.payrollsInPeriod'), payrollsInPeriod ?? '']);
  rows.push([]);

  rows.push([t('reports.csvSectionPayroll')]);
  const companyName = companies.find((c) => String(c.id) === companyId)?.name ?? '';
  rows.push([t('reports.selectCompany'), companyName]);

  if (!payrollSummary?.payroll) {
    rows.push([t('reports.csvNoPayrollSummary')]);
    return rows;
  }

  const { payroll, total_net, employees_count } = payrollSummary;
  rows.push([t('reports.csvPayrollId'), payroll.id]);
  rows.push([t('reports.csvPayrollStatus'), payroll.status ?? '']);
  rows.push([t('reports.totalNet'), total_net]);
  rows.push([t('reports.employeesOnPayroll'), employees_count]);

  const details = payroll.details ?? [];
  if (details.length === 0) {
    return rows;
  }

  rows.push([]);
  rows.push([t('reports.csvSectionLines')]);
  rows.push([
    t('reports.csvColEmployeeCode'),
    t('reports.csvColEmployeeName'),
    t('reports.csvColBaseSalary'),
    t('reports.csvColWorkingDays'),
    t('reports.csvColOvertime'),
    t('reports.csvColBonus'),
    t('reports.csvColAllowance'),
    t('reports.csvColDeduction'),
    t('reports.csvColFuelCost'),
    t('reports.csvColTax'),
    t('reports.csvColNetSalary'),
  ]);

  for (const d of details) {
    rows.push([
      d.employee?.code ?? '',
      d.employee?.name ?? '',
      d.base_salary,
      d.working_days,
      d.overtime,
      d.bonus,
      d.allowance,
      d.deduction,
      d.fuel_cost ?? '',
      d.tax,
      d.net_salary,
    ]);
  }

  return rows;
}



const reportTypes = [
  { id: 'revenue', label: 'Báo cáo doanh thu', icon: DollarOutlined, desc: 'Thống kê doanh thu theo kỳ, theo tuyến, theo khách hàng' },
  { id: 'costs', label: 'Báo cáo chi phí', icon: WalletOutlined, desc: 'Theo loại, theo xe/tài xế, ngưỡng vượt' },
  { id: 'profit', label: 'Báo cáo lợi nhuận', icon: LineChartOutlined, desc: 'Doanh thu trừ chi phí theo kỳ' },
  { id: 'trips', label: 'Báo cáo chuyến đi', icon: TruckOutlined, desc: 'Phân tích chuyến theo trạng thái, tuyến đường, tài xế' },
  { id: 'vehicles', label: 'Báo cáo phương tiện', icon: TruckOutlined, desc: 'Sử dụng xe, hiệu suất, chi phí trên xe' },
  { id: 'drivers', label: 'Báo cáo tài xế', icon: TeamOutlined, desc: 'Hiệu suất làm việc, vi phạm, chấm công' },
  { id: 'maintenance', label: 'Báo cáo bảo dưỡng', icon: FileTextOutlined, desc: 'Lịch và chi phí bảo dưỡng định kỳ' },
  { id: 'debt', label: 'Báo cáo công nợ', icon: DollarOutlined, desc: 'Theo kỳ, theo khách, aging' },
];

type ServerReportType = 'revenue' | 'costs' | 'profit' | 'trips' | 'vehicles' | 'drivers' | 'maintenance' | 'debt';

export function Reports() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const feedback = useAppFeedback();
  const [, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(readMonthFromSearch);
  const [year, setYear] = useState(readYearFromSearch);
  const [companyId, setCompanyId] = useState(readCompanyFromSearch);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | ServerReportType>('overview');

  const { exportReport } = useExportReport();


  const { data: companiesData, isLoading: companiesLoading } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 200 },
  });
  const companies = useMemo<Company[]>(() => companiesData?.data ?? [], [companiesData]);

  const syncUrl = useCallback(
    (m: number, y: number, c: string) => {
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set('month', String(m));
          next.set('year', String(y));
          if (c) {
            next.set('company', c);
          } else {
            next.delete('company');
          }
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  useEffect(() => {
    syncUrl(month, year, companyId);
  }, [month, year, companyId, syncUrl]);

  const currentYear = new Date().getFullYear();
  const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: String(i + 1),
    label: String(i + 1),
  }));
  const yearOptions = Array.from({ length: 6 }, (_, i) => ({
    value: String(currentYear - 2 + i),
    label: String(currentYear - 2 + i),
  }));

  const {
    data: snapshotResult,
  } = useCustom<Record<string, unknown>>({
    url: ENDPOINTS.reports.dashboard,
    method: 'get',
    config: { query: { month, year } },
  });
  const snapshotRaw = snapshotResult?.data as Record<string, unknown> | null | undefined;
  const companiesCount: number | null = snapshotRaw ? Number(snapshotRaw.companies_count ?? 0) : null;
  const payrollsInPeriod: number | null = snapshotRaw ? Number(snapshotRaw.payrolls_count ?? 0) : null;

  const revenueMonthly = (snapshotRaw?.revenue_monthly as Array<{month: string, revenue: number, trips: number}>) ?? [];
  const tripsData = (snapshotRaw?.trips_data as Array<{week: string, completed: number, cancelled: number, inProgress: number}>) ?? [];
  const driverPerformance = (snapshotRaw?.driver_performance as Array<{name: string, trips: number, rating: number, revenue: number}>) ?? [];
  const routeStats = (snapshotRaw?.route_stats as Array<{route: string, trips: number, avgRevenue: number}>) ?? [];

  const {
    data: summaryResult,
  } = useCustom<PayrollSummaryData>({
    url: ENDPOINTS.reports.payrollSummary,
    method: 'get',
    config: { query: { company_id: Number(companyId), month, year } },
    queryOptions: { enabled: !!companyId },
  });
  const payrollSummary = (summaryResult?.data ?? null) as PayrollSummaryData | null;

  useEffect(() => {
    if (!companies.length) {
      return;
    }
    if (companyId && companies.some((c) => String(c.id) === companyId)) {
      return;
    }
    setCompanyId(String(companies[0].id));
  }, [companies, companyId]);

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('reports.title') },
  ];

  const companySelectOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));
  const monthlyRevenueValue = formatMoney(Number(snapshotRaw?.revenue_total ?? 0), { withCurrency: true });
  const totalTripsSnapshot = Number(snapshotRaw?.trips_total ?? 0);
  const totalCompletedTrips = tripsData.reduce((sum, item) => sum + item.completed, 0);
  const completionRate = totalTripsSnapshot > 0 ? `${Math.round((totalCompletedTrips / totalTripsSnapshot) * 100)}%` : '0%';
  const showOverview = activeTab === 'overview';
  const showRevenue = activeTab === 'overview' || activeTab === 'revenue';
  const showTrips = activeTab === 'overview' || activeTab === 'trips';
  const showDrivers = activeTab === 'overview' || activeTab === 'drivers';

  const reportFilter = useMemo(
    () => ({
      month,
      year,
      company_id: companyId ? Number(companyId) : undefined,
    }),
    [month, year, companyId],
  );

  const serverReportType: ServerReportType | null = activeTab === 'overview' ? null : (activeTab as ServerReportType);
  const { data: activeReportData, loading: activeReportLoading } = useReport<Record<string, unknown>>(
    (serverReportType ?? 'revenue') as ServerReportType,
    reportFilter,
    serverReportType !== null,
  );
  const handleExportCsv = useCallback(() => {
    const rows = buildReportCsvRows(t, {
      month,
      year,
      companiesCount,
      payrollsInPeriod,
      companyId,
      companies,
      payrollSummary,
    });
    const safeCompany = companyId ? companyId : 'all';
    downloadCsvRows(`report-${year}-${String(month).padStart(2, '0')}-company-${safeCompany}.csv`, rows);
  }, [t, month, year, companiesCount, payrollsInPeriod, companyId, companies, payrollSummary]);

  const handleServerExport = useCallback(
    async (type: ServerReportType, format: 'csv' | 'xlsx' = 'xlsx') => {
      try {
        const result = await exportReport(type, reportFilter, format);
        if (result?.url || result?.file) {
          window.open(result.url ?? result.file ?? '', '_blank');
          feedback.success('Đã xuất báo cáo');
        } else {
          feedback.info('Endpoint xuất báo cáo chưa sẵn sàng — fallback CSV');
          handleExportCsv();
        }
      } catch {
        feedback.error('Xuất báo cáo thất bại');
      }
    },
    [exportReport, reportFilter, handleExportCsv, feedback],
  );

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<DownloadOutlined />} onClick={handleExportCsv}>
            {t('reports.exportCsv')}
          </Button>
        }
      />

      <Flex vertical gap={token.paddingLG}>
        <Card styles={{ body: { padding: token.paddingLG } }}>
          <Flex wrap="wrap" gap={12} align="flex-end">
            <div>
              <Typography.Text type="secondary">{t('reports.month')}</Typography.Text>
              <Select
                className="min-w-[120px] block"
                value={String(month)}
                options={monthOptions}
                onChange={(v) => setMonth(Number(v))}
              />
            </div>
            <div>
              <Typography.Text type="secondary">{t('reports.year')}</Typography.Text>
              <Select
                className="min-w-[120px] block"
                value={String(year)}
                options={yearOptions}
                onChange={(v) => setYear(Number(v))}
              />
            </div>
            <div className="min-w-[200px] flex-1">
              <Typography.Text type="secondary">{t('reports.selectCompany')}</Typography.Text>
              <Select
                className="w-full block"
                value={companyId || undefined}
                placeholder={t('reports.selectCompany')}
                options={companySelectOptions}
                onChange={(v) => setCompanyId(v ?? '')}
                loading={companiesLoading}
              />
            </div>
            <Button icon={<DownloadOutlined />} onClick={handleExportCsv}>
              {t('reports.exportCsv')}
            </Button>
          </Flex>
        </Card>

        <Card styles={{ body: { padding: token.paddingLG } }}>
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <Typography.Title level={5} style={{ margin: 0 }}>
              {t('reports.title')}
            </Typography.Title>
            <Space>
              <Typography.Text type="secondary">Chu kỳ</Typography.Text>
              <Segmented
                value={dateRange}
                onChange={(value) => setDateRange(value as 'month' | 'quarter' | 'year')}
                options={[
                  { value: 'month', label: 'Tháng' },
                  { value: 'quarter', label: 'Quý' },
                  { value: 'year', label: 'Năm' },
                ]}
              />
            </Space>
          </Flex>
          <Segmented
            style={{ marginTop: 12 }}
            value={activeTab}
            onChange={(value) => setActiveTab(value as 'overview' | ServerReportType)}
            options={[
              { value: 'overview', label: 'Tổng quan' },
              { value: 'revenue', label: 'Doanh thu' },
              { value: 'costs', label: 'Chi phí' },
              { value: 'profit', label: 'Lợi nhuận' },
              { value: 'trips', label: 'Chuyến đi' },
              { value: 'vehicles', label: 'Phương tiện' },
              { value: 'drivers', label: 'Tài xế' },
              { value: 'maintenance', label: 'Bảo dưỡng' },
              { value: 'debt', label: 'Công nợ' },
            ]}
          />
          {serverReportType && (
            <Card size="small" style={{ marginTop: 12 }} loading={activeReportLoading}>
              {activeReportData ? (
                <pre style={{ margin: 0, fontFamily: 'monospace', fontSize: 12, maxHeight: 220, overflow: 'auto' }}>
                  {JSON.stringify(activeReportData, null, 2)}
                </pre>
              ) : (
                <Typography.Text type="secondary">
                  Báo cáo {serverReportType} hiện chưa có dữ liệu.
                </Typography.Text>
              )}
              <div style={{ marginTop: 8, textAlign: 'right' }}>
                <Space>
                  <Button onClick={() => void handleServerExport(serverReportType, 'csv')}>Xuất CSV</Button>
                  <Button type="primary" onClick={() => void handleServerExport(serverReportType, 'xlsx')}>
                    Xuất Excel
                  </Button>
                </Space>
              </div>
            </Card>
          )}
        </Card>

        {showOverview ? (
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small">
                <Statistic title="Doanh thu kỳ này" value={monthlyRevenueValue} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small">
                <Statistic title="Bảng lương trong kỳ" value={payrollsInPeriod ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small">
                <Statistic title="Công ty có phát sinh" value={companiesCount ?? 0} />
              </Card>
            </Col>
            <Col xs={24} sm={12} xl={6}>
              <Card size="small">
                <Statistic title="Tỷ lệ hoàn thành" value={completionRate} />
              </Card>
            </Col>
          </Row>
        ) : null}

        {showRevenue || showTrips ? (
          <Row gutter={[12, 12]}>
            {showRevenue ? (
              <Col xs={24} xl={12}>
              <Card size="small" styles={{ body: { padding: token.paddingLG } }}>
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <Typography.Title level={5} style={{ margin: 0 }} className="text-gray-800">Doanh thu theo tháng</Typography.Title>
                    <p className="mt-0.5 text-xs text-gray-400">Triệu đồng VNĐ</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={revenueMonthly} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revGradReport" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.15} />
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} fill="url(#revGradReport)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Card>
              </Col>
            ) : null}
            {showTrips ? (
              <Col xs={24} xl={12}>
              <Card size="small" styles={{ body: { padding: token.paddingLG } }}>
                <div className="mb-5">
                  <Typography.Title level={5} style={{ margin: 0 }} className="text-gray-800">Chuyến đi theo tuần</Typography.Title>
                  <p className="mt-0.5 text-xs text-gray-400">Tháng {month}/{year}</p>
                </div>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={tripsData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Bar dataKey="completed" fill="#22c55e" radius={[2, 2, 0, 0]} name="Hoàn thành" />
                    <Bar dataKey="inProgress" fill="#3b82f6" radius={[2, 2, 0, 0]} name="Đang chạy" />
                    <Bar dataKey="cancelled" fill="#ef4444" radius={[2, 2, 0, 0]} name="Hủy" />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
              </Col>
            ) : null}
          </Row>
        ) : null}

        {showDrivers ? (
          <Row gutter={[12, 12]}>
            <Col xs={24} xl={12}>
            <Card size="small" styles={{ body: { padding: token.paddingLG } }}>
              <Flex justify="space-between" align="center" style={{ marginBottom: token.marginSM }}>
                <Typography.Title level={5} style={{ margin: 0 }}>Top tài xế tháng {month}</Typography.Title>
                <Typography.Text type="secondary">Theo doanh thu</Typography.Text>
              </Flex>
              <Space direction="vertical" size={10} style={{ width: '100%' }}>
                {driverPerformance.map((driver, index) => {
                  const percent = Math.round((driver.revenue / (driverPerformance[0]?.revenue || 1)) * 100);
                  return (
                    <Card key={driver.name} size="small" styles={{ body: { padding: token.paddingSM } }}>
                      <Flex align="center" justify="space-between" gap={12}>
                        <Flex align="center" gap={10} style={{ minWidth: 0 }}>
                          <Avatar
                            size="small"
                            style={{ backgroundColor: index < 3 ? token.colorPrimary : token.colorFillSecondary }}
                          >
                            {index + 1}
                          </Avatar>
                          <div style={{ minWidth: 0 }}>
                            <Typography.Text strong ellipsis style={{ maxWidth: 220, display: 'block' }}>
                              {driver.name}
                            </Typography.Text>
                            <Typography.Text type="secondary">{driver.trips} chuyến</Typography.Text>
                          </div>
                        </Flex>
                        <Typography.Text strong>{formatMoney(driver.revenue, { withCurrency: true })}</Typography.Text>
                      </Flex>
                      <Progress
                        percent={percent}
                        showInfo={false}
                        strokeColor={token.colorPrimary}
                        trailColor={token.colorFillSecondary}
                        size="small"
                        style={{ marginTop: 8, marginBottom: 2 }}
                      />
                    </Card>
                  );
                })}
              </Space>
            </Card>
            </Col>
            <Col xs={24} xl={12}>
            <Card
              size="small"
              title="Top tuyến đường"
              extra={<Typography.Text type="secondary">Theo số chuyến</Typography.Text>}
              styles={{ body: { padding: token.paddingSM } }}
            >
              <Table
                rowKey="route"
                dataSource={routeStats}
                scroll={{ x: 'max-content' }}
                columns={[
                  {
                    title: 'Tuyến đường',
                    dataIndex: 'route',
                    key: 'route',
                    render: (value: string) => <Typography.Text strong>{value}</Typography.Text>,
                  },
                  {
                    title: 'Số chuyến',
                    dataIndex: 'trips',
                    key: 'trips',
                    width: 120,
                    align: 'right',
                    render: (value: number) => <Tag color="blue">{value}</Tag>,
                  },
                  {
                    title: 'Tỷ trọng',
                    key: 'ratio',
                    width: 180,
                    render: (_, row) => {
                      const maxTrip = Math.max(...routeStats.map((r) => r.trips));
                      const percent = Math.round((row.trips / maxTrip) * 100);
                      return <Progress percent={percent} size="small" showInfo={false} />;
                    },
                  },
                  {
                    title: 'Doanh thu TB',
                    dataIndex: 'avgRevenue',
                    key: 'avgRevenue',
                    width: 180,
                    align: 'right',
                    render: (value: number) => formatMoney(value, { withCurrency: true }),
                  },
                ]}
                pagination={false}
                size="small"
              />
            </Card>
            </Col>
          </Row>
        ) : null}

        <Card
          title="Xuất báo cáo theo loại"
          extra={<Typography.Text type="secondary">Chọn nhóm báo cáo để xuất CSV</Typography.Text>}
          styles={{ body: { padding: token.paddingLG } }}
        >
          <Row gutter={[12, 12]}>
            {reportTypes.map((report) => (
              <Col xs={24} sm={12} xl={6} key={report.id}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setActiveTab(report.id as ServerReportType)}
                  style={{ cursor: 'pointer', height: '100%' }}
                >
                  <Space direction="vertical" size={6}>
                    <Flex align="center" gap={8}>
                      <report.icon style={{ color: token.colorPrimary }} />
                      <Typography.Text strong>{report.label}</Typography.Text>
                    </Flex>
                    <Typography.Text type="secondary">{report.desc}</Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 11 }}>
                      Xem chi tiết →
                    </Typography.Text>
                  </Space>
                </Card>
              </Col>
            ))}
          </Row>
        </Card>
      </Flex>

    </>
  );
}
