import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useList } from '@refinedev/core';
import { DownloadOutlined } from '@ant-design/icons';
import { Button, Card, Flex, Select, Typography } from 'antd';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import reportsService from '@/services/reports.service';
import type { Company } from '@/types';
import type { PayrollSummaryData } from '@/services/reports.service';
import { notifyErrorOnce } from '@/utils/errorToast';
import { downloadCsvRows } from '@/utils/csvDownload';
import BuildingIcon from 'lucide-react/dist/esm/icons/building-2';
import WalletIcon from 'lucide-react/dist/esm/icons/wallet';
import UsersIcon from 'lucide-react/dist/esm/icons/users';

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
      d.fuel_cost,
      d.tax,
      d.net_salary,
    ]);
  }

  return rows;
}

export function Reports() {
  const { t } = useTranslation();
  const [, setSearchParams] = useSearchParams();
  const [month, setMonth] = useState(readMonthFromSearch);
  const [year, setYear] = useState(readYearFromSearch);
  const [companyId, setCompanyId] = useState(readCompanyFromSearch);

  const [snapshotLoading, setSnapshotLoading] = useState(false);
  const [companiesCount, setCompaniesCount] = useState<number | null>(null);
  const [payrollsInPeriod, setPayrollsInPeriod] = useState<number | null>(null);
  const [snapshotErrorMessage, setSnapshotErrorMessage] = useState('');

  const [summaryLoading, setSummaryLoading] = useState(false);
  const [payrollSummary, setPayrollSummary] = useState<PayrollSummaryData | null | undefined>(undefined);
  const [summaryErrorMessage, setSummaryErrorMessage] = useState('');
  const summaryRequestRef = useRef<{ inFlight: boolean; key: string; lastAt: number }>({
    inFlight: false,
    key: '',
    lastAt: 0,
  });

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

  const loadSnapshot = useCallback(async () => {
    try {
      setSnapshotErrorMessage('');
      setSnapshotLoading(true);
      const res = await reportsService.getDashboard(month, year);
      if (res.success && res.data && typeof res.data === 'object') {
        const d = res.data as Record<string, unknown>;
        setCompaniesCount(Number(d.companies_count ?? 0));
        setPayrollsInPeriod(Number(d.payrolls_count ?? 0));
      } else {
        setCompaniesCount(null);
        setPayrollsInPeriod(null);
        setSnapshotErrorMessage(res.message ?? t('reports.snapshotLoadFailed'));
      }
    } catch (e) {
      setCompaniesCount(null);
      setPayrollsInPeriod(null);
      const message = notifyErrorOnce('reports-snapshot', e, { fallbackMessage: t('reports.snapshotLoadFailed') });
      setSnapshotErrorMessage(message);
    } finally {
      setSnapshotLoading(false);
    }
  }, [month, year, t]);

  const loadPayrollSummary = useCallback(
    async (force = false) => {
      const cid = Number(companyId);
      if (!cid) {
        setPayrollSummary(undefined);
        return;
      }
      const requestKey = `${cid}-${month}-${year}`;
      const nowTs = Date.now();
      const sameKey = summaryRequestRef.current.key === requestKey;
      if (!force) {
        if (sameKey && summaryRequestRef.current.inFlight) return;
        if (sameKey && nowTs - summaryRequestRef.current.lastAt < 1200) return;
      }

      summaryRequestRef.current = { inFlight: true, key: requestKey, lastAt: nowTs };
      try {
        setSummaryErrorMessage('');
        setSummaryLoading(true);
        const res = await reportsService.getPayrollSummary(cid, month, year);
        if (res.success) {
          setPayrollSummary(res.data ?? null);
        } else {
          setPayrollSummary(null);
          setSummaryErrorMessage(res.message ?? t('reports.summaryLoadFailed'));
        }
      } catch (e) {
        const message = notifyErrorOnce('reports-payroll-summary', e, { fallbackMessage: t('reports.summaryLoadFailed') });
        setSummaryErrorMessage(message);
        setPayrollSummary(null);
      } finally {
        setSummaryLoading(false);
        summaryRequestRef.current = { inFlight: false, key: requestKey, lastAt: Date.now() };
      }
    },
    [companyId, month, year, t]
  );

  useEffect(() => {
    void loadSnapshot();
  }, [loadSnapshot]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void loadPayrollSummary();
    }, 250);
    return () => window.clearTimeout(timer);
  }, [loadPayrollSummary]);

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

  const formatMoney = (n: number) =>
    new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

  const companySelectOptions = companies.map((c) => ({ value: String(c.id), label: c.name }));

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
        <Card
          title={t('reports.dashboardSnapshot')}
        >
          <Typography.Paragraph type="secondary" className="mb-4">
            {t('reports.dashboardSnapshotHint')}
          </Typography.Paragraph>
          <Flex wrap="wrap" gap={16} align="flex-end" className="mb-4">
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
            <Button onClick={() => void loadSnapshot()} loading={snapshotLoading}>
              {t('reports.refresh')}
            </Button>
          </Flex>
          {snapshotErrorMessage ? (
            <Typography.Paragraph type="danger" className="mb-4 text-sm">
              {snapshotErrorMessage}
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

        <Card title={t('reports.payrollSummarySection')}>
          <Flex wrap="wrap" gap={16} align="flex-end" className="mb-4">
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
              onClick={() => void loadPayrollSummary(true)}
              loading={summaryLoading}
              disabled={!companyId}
            >
              {t('reports.refresh')}
            </Button>
          </Flex>
          {summaryErrorMessage ? (
            <Typography.Paragraph type="danger" className="mb-4 text-sm">
              {summaryErrorMessage}
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
                  <p className="text-xl font-semibold tabular-nums">{formatMoney(payrollSummary.total_net)}</p>
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
