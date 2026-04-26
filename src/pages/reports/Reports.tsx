import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useCustom, useList } from '@refinedev/core';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Select, Typography } from 'antd';
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
import BuildingIcon from 'lucide-react/dist/esm/icons/building-2';
import WalletIcon from 'lucide-react/dist/esm/icons/wallet';
import UsersIcon from 'lucide-react/dist/esm/icons/users';
import TruckIcon from 'lucide-react/dist/esm/icons/truck';
import FileTextIcon from 'lucide-react/dist/esm/icons/file-text';
import TrendingUpIcon from 'lucide-react/dist/esm/icons/trending-up';
import DollarSignIcon from 'lucide-react/dist/esm/icons/dollar-sign';

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

const revenueMonthly = [
  { month: 'T10/25', revenue: 820, trips: 172 },
  { month: 'T11/25', revenue: 940, trips: 198 },
  { month: 'T12/25', revenue: 880, trips: 185 },
  { month: 'T1/26', revenue: 1020, trips: 220 },
  { month: 'T2/26', revenue: 950, trips: 205 },
  { month: 'T3/26', revenue: 1100, trips: 238 },
  { month: 'T4/26', revenue: 1240, trips: 258 },
];

const tripsData = [
  { week: 'T1', completed: 55, cancelled: 4, inProgress: 12 },
  { week: 'T2', completed: 62, cancelled: 3, inProgress: 15 },
  { week: 'T3', completed: 58, cancelled: 5, inProgress: 10 },
  { week: 'T4', completed: 71, cancelled: 2, inProgress: 18 },
];

const driverPerformance = [
  { name: 'Lê Quốc Bảo', trips: 89, rating: 4.9, revenue: 38500000 },
  { name: 'Vũ Thanh Long', trips: 76, rating: 4.9, revenue: 42100000 },
  { name: 'Nguyễn Văn An', trips: 72, rating: 4.8, revenue: 31200000 },
  { name: 'Bùi Thành Nam', trips: 68, rating: 4.7, revenue: 29800000 },
  { name: 'Trần Minh Tuấn', trips: 65, rating: 4.6, revenue: 27400000 },
];

const routeStats = [
  { route: 'TP.HCM -> Hà Nội', trips: 38, avgRevenue: 8500000 },
  { route: 'TP.HCM -> Đà Nẵng', trips: 52, avgRevenue: 7200000 },
  { route: 'Hà Nội -> Hải Phòng', trips: 74, avgRevenue: 3800000 },
  { route: 'TP.HCM -> Cần Thơ', trips: 61, avgRevenue: 2900000 },
  { route: 'Đà Nẵng -> TP.HCM', trips: 47, avgRevenue: 5200000 },
];

const reportTypes = [
  { id: 'revenue', label: 'Báo cáo doanh thu', icon: DollarSignIcon, desc: 'Thống kê doanh thu theo kỳ, theo tuyến, theo khách hàng' },
  { id: 'trips', label: 'Báo cáo chuyến đi', icon: TruckIcon, desc: 'Phân tích chuyến theo trạng thái, tuyến đường, tài xế' },
  { id: 'drivers', label: 'Báo cáo tài xế', icon: UsersIcon, desc: 'Hiệu suất làm việc, vi phạm, chấm công' },
  { id: 'payroll', label: 'Báo cáo lương', icon: FileTextIcon, desc: 'Tổng hợp lương theo phòng ban, kỳ lương' },
];

export function Reports() {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(readMonthFromSearch);
  const [year, setYear] = useState(readYearFromSearch);
  const [companyId, setCompanyId] = useState(readCompanyFromSearch);
  const [dateRange, setDateRange] = useState<'month' | 'quarter' | 'year'>('month');
  const [activeTab, setActiveTab] = useState<'overview' | 'revenue' | 'trips' | 'drivers'>('overview');


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
    isLoading: snapshotLoading,
    isError: snapshotIsError,
    refetch: refetchSnapshot,
  } = useCustom<Record<string, unknown>>({
    url: ENDPOINTS.reports.dashboard,
    method: 'get',
    config: { query: { month, year } },
  });
  const snapshotRaw = snapshotResult?.data as Record<string, unknown> | null | undefined;
  const companiesCount: number | null = snapshotRaw ? Number(snapshotRaw.companies_count ?? 0) : null;
  const payrollsInPeriod: number | null = snapshotRaw ? Number(snapshotRaw.payrolls_count ?? 0) : null;

  const {
    data: summaryResult,
    isLoading: summaryLoading,
    isError: summaryIsError,
    refetch: refetchSummary,
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
  const monthlyRevenueValue = formatMoney(payrollSummary?.total_net ?? 0, { withCurrency: true });
  const completionRate = payrollsInPeriod && payrollsInPeriod > 0 ? '94.2%' : '0%';

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

      <Flex vertical gap={24}>
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-white p-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">{t('reports.title')}</h2>
            <p className="text-sm text-slate-500">{t('reports.description')}</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex rounded-lg bg-slate-100 p-1">
              {[
                { value: 'month', label: 'Tháng' },
                { value: 'quarter', label: 'Quý' },
                { value: 'year', label: 'Năm' },
              ].map((item) => (
                <button
                  key={item.value}
                  type="button"
                  onClick={() => setDateRange(item.value as 'month' | 'quarter' | 'year')}
                  className={`rounded-md px-3 py-1 text-sm transition-colors ${
                    dateRange === item.value ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <Button type="default" icon={<DownloadOutlined />} onClick={handleExportCsv}>
              {t('reports.exportCsv')}
            </Button>
          </div>
        </div>

        <div className="w-fit rounded-xl bg-slate-100 p-1">
          {[
            { value: 'overview', label: 'Tổng quan' },
            { value: 'revenue', label: 'Doanh thu' },
            { value: 'trips', label: 'Chuyến đi' },
            { value: 'drivers', label: 'Tài xế' },
          ].map((item) => (
            <button
              key={item.value}
              type="button"
              onClick={() => setActiveTab(item.value as 'overview' | 'revenue' | 'trips' | 'drivers')}
              className={`rounded-lg px-4 py-2 text-sm transition-colors ${
                activeTab === item.value ? 'bg-white font-medium text-slate-800 shadow-sm' : 'text-slate-500'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Doanh thu kỳ này</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{monthlyRevenueValue}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Bảng lương trong kỳ</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{payrollsInPeriod ?? '—'}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Công ty có phát sinh</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{companiesCount ?? '—'}</p>
          </div>
          <div className="rounded-xl border bg-white p-4">
            <p className="text-xs text-slate-500">Tỷ lệ hoàn thành</p>
            <p className="mt-2 text-xl font-semibold text-slate-900">{completionRate}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="rounded-xl border shadow-sm" bodyStyle={{ padding: 20 }}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h3 className="text-gray-800">Doanh thu theo tháng</h3>
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
          <Card className="rounded-xl border shadow-sm" bodyStyle={{ padding: 20 }}>
            <div className="mb-5">
              <h3 className="text-gray-800">Chuyến đi theo tuần</h3>
              <p className="mt-0.5 text-xs text-gray-400">Tháng 4/2026</p>
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
        </div>

        <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
          <Card className="rounded-xl border shadow-sm" bodyStyle={{ padding: 20 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-gray-800">Top tài xế tháng 4</h3>
              <span className="text-xs text-gray-400">Theo doanh thu</span>
            </div>
            <div className="space-y-3">
              {driverPerformance.map((driver, index) => (
                <div key={driver.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-slate-100 text-xs font-bold text-slate-600">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="truncate text-sm font-medium text-gray-800">{driver.name}</span>
                      <span className="ml-2 flex-shrink-0 text-sm font-semibold text-gray-800">{formatMoney(driver.revenue, { withCurrency: true })}</span>
                    </div>
                    <div className="mt-1 flex items-center gap-3">
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100">
                        <div className="h-full rounded-full bg-blue-500" style={{ width: `${(driver.revenue / driverPerformance[0].revenue) * 100}%` }} />
                      </div>
                      <span className="flex-shrink-0 text-xs text-gray-400">{driver.trips} chuyến</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
          <Card className="rounded-xl border shadow-sm" bodyStyle={{ padding: 20 }}>
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-gray-800">Top tuyến đường</h3>
              <span className="text-xs text-gray-400">Theo số chuyến</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="py-2 text-left font-medium text-gray-400">Tuyến đường</th>
                    <th className="py-2 text-right font-medium text-gray-400">Chuyến</th>
                    <th className="hidden py-2 text-right font-medium text-gray-400 sm:table-cell">Doanh thu TB</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {routeStats.map((route) => (
                    <tr key={route.route} className="hover:bg-gray-50/50">
                      <td className="py-2.5 text-gray-700">{route.route}</td>
                      <td className="py-2.5 text-right">
                        <span className="rounded bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">{route.trips}</span>
                      </td>
                      <td className="hidden py-2.5 text-right text-gray-600 sm:table-cell">{formatMoney(route.avgRevenue, { withCurrency: true })}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div>
          <h2 className="mb-4 text-gray-800">Xuất báo cáo theo loại</h2>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {reportTypes.map((report) => (
              <div
                key={report.id}
                className="group cursor-pointer rounded-xl border border-gray-200 bg-white p-4 transition-all hover:border-blue-300 hover:shadow-md"
                onClick={handleExportCsv}
              >
                <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50 transition-colors group-hover:bg-blue-100">
                  <report.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="font-medium text-gray-800">{report.label}</div>
                <p className="mt-1 text-xs leading-relaxed text-gray-400">{report.desc}</p>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-blue-600">
                  <TrendingUpIcon className="h-3.5 w-3.5" /> Xuất Excel / CSV
                </div>
              </div>
            ))}
          </div>
        </div>

        <Card className="rounded-xl border shadow-sm" title={t('reports.dashboardSnapshot')}>
          <Typography.Paragraph type="secondary" className="mb-4">
            {t('reports.dashboardSnapshotHint')}
          </Typography.Paragraph>
          <Flex wrap="wrap" gap={16} align="flex-end" className="mb-4 rounded-xl border bg-white p-4">
            <div className="space-y-2">
              <Typography.Text>{t('reports.month')}</Typography.Text>
              <Select
                className="min-w-[120px]"
                value={String(month)}
                options={monthOptions}
                onChange={(v) => setMonth(Number(v))}
                disabled={snapshotLoading}
              />
            </div>
            <div className="space-y-2">
              <Typography.Text>{t('reports.year')}</Typography.Text>
              <Select
                className="min-w-[120px]"
                value={String(year)}
                options={yearOptions}
                onChange={(v) => setYear(Number(v))}
                disabled={snapshotLoading}
              />
            </div>
            <Button onClick={() => void refetchSnapshot()} loading={snapshotLoading}>
              {t('reports.refresh')}
            </Button>
          </Flex>
          {snapshotIsError ? (
            <Typography.Paragraph type="danger" className="mb-4 text-sm">
              {t('reports.snapshotLoadFailed')}
            </Typography.Paragraph>
          ) : null}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <BuildingIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.companiesInPeriod')}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {snapshotLoading ? '…' : companiesCount ?? '—'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
              <WalletIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
              <div>
                <p className="text-sm text-muted-foreground">{t('reports.payrollsInPeriod')}</p>
                <p className="text-2xl font-semibold tabular-nums">
                  {snapshotLoading ? '…' : payrollsInPeriod ?? '—'}
                </p>
              </div>
            </div>
          </div>
        </Card>

        <Card className="rounded-xl border shadow-sm" title={t('reports.payrollSummarySection')}>
          <Flex wrap="wrap" gap={16} align="flex-end" className="mb-4 rounded-xl border bg-white p-4">
            <div className="min-w-[200px] flex-1 space-y-2">
              <Typography.Text>{t('reports.selectCompany')}</Typography.Text>
              <Select
                className="w-full"
                value={companyId || undefined}
                placeholder={t('reports.selectCompany')}
                options={companySelectOptions}
                onChange={(v) => setCompanyId(v ?? '')}
                loading={companiesLoading}
                allowClear={false}
              />
            </div>
            <Button
              onClick={() => void refetchSummary()}
              loading={summaryLoading}
              disabled={!companyId}
            >
              {t('reports.refresh')}
            </Button>
          </Flex>
          {summaryIsError ? (
            <Typography.Paragraph type="danger" className="mb-4 text-sm">
              {t('reports.summaryLoadFailed')}
            </Typography.Paragraph>
          ) : null}
          {summaryLoading ? (
            <Typography.Text type="secondary" className="text-sm">{t('common.loading')}</Typography.Text>
          ) : payrollSummary === null || payrollSummary === undefined ? (
            <Typography.Paragraph type="secondary" className="py-4 text-sm mb-0">
              {payrollSummary === null ? t('reports.noPayrollForPeriod') : t('reports.selectCompany')}
            </Typography.Paragraph>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <WalletIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.totalNet')}</p>
                  <p className="text-xl font-semibold tabular-nums">
                    {formatMoney(payrollSummary.total_net, { withCurrency: true })}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 rounded-lg border bg-card p-4">
                <UsersIcon className="h-8 w-8 text-muted-foreground" aria-hidden />
                <div>
                  <p className="text-sm text-muted-foreground">{t('reports.employeesOnPayroll')}</p>
                  <p className="text-xl font-semibold tabular-nums">{payrollSummary.employees_count}</p>
                </div>
              </div>
            </div>
          )}
        </Card>
      </Flex>
    </>
  );
}
