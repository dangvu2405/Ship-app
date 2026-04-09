import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useList } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import reportsService from '@/services/reports.service';
import type { Company } from '@/types';
import type { PayrollSummaryData } from '@/services/reports.service';
import { notifyErrorOnce } from '@/utils/errorToast';
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
  const monthOptions = Array.from({ length: 12 }, (_, i) => i + 1);
  const yearOptions = Array.from({ length: 6 }, (_, i) => currentYear - 2 + i);

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

  return (
    <>
      <PageHeader
        title={t('reports.title')}
        description={t('reports.description')}
        breadcrumb={breadcrumb}
      />

      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{t('reports.dashboardSnapshot')}</CardTitle>
            <CardDescription>{t('reports.dashboardSnapshotHint')}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2">
              <Label>{t('reports.month')}</Label>
              <Select
                value={String(month)}
                onValueChange={(v) => setMonth(Number(v))}
                disabled={snapshotLoading}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {monthOptions.map((m) => (
                    <SelectItem key={m} value={String(m)}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>{t('reports.year')}</Label>
              <Select
                value={String(year)}
                onValueChange={(v) => setYear(Number(v))}
                disabled={snapshotLoading}
              >
                <SelectTrigger className="w-[120px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {yearOptions.map((y) => (
                    <SelectItem key={y} value={String(y)}>
                      {y}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button type="button" variant="secondary" onClick={() => void loadSnapshot()} loading={snapshotLoading}>
              {t('reports.refresh')}
            </Button>
          </CardContent>
          {snapshotErrorMessage ? (
            <CardContent className="pt-0">
              <p className="text-sm text-destructive">{snapshotErrorMessage}</p>
            </CardContent>
          ) : null}
          <CardContent className="grid gap-4 sm:grid-cols-2 pt-0">
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
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t('reports.payrollSummarySection')}</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap items-end gap-4">
            <div className="space-y-2 min-w-[200px] flex-1">
              <Label>{t('reports.selectCompany')}</Label>
              <Select value={companyId} onValueChange={setCompanyId} disabled={companiesLoading}>
                <SelectTrigger>
                  <SelectValue placeholder={t('reports.selectCompany')} />
                </SelectTrigger>
                <SelectContent>
                  {companies.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="secondary"
              onClick={() => void loadPayrollSummary(true)}
              loading={summaryLoading}
              disabled={!companyId}
            >
              {t('reports.refresh')}
            </Button>
          </CardContent>
          {summaryErrorMessage ? (
            <CardContent className="pt-0">
              <p className="text-sm text-destructive">{summaryErrorMessage}</p>
            </CardContent>
          ) : null}
          <CardContent className="pt-0">
            {summaryLoading ? (
              <p className="text-sm text-muted-foreground">{t('common.loading')}</p>
            ) : payrollSummary === null || payrollSummary === undefined ? (
              <p className="text-sm text-muted-foreground py-4">
                {payrollSummary === null ? t('reports.noPayrollForPeriod') : t('reports.selectCompany')}
              </p>
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
          </CardContent>
        </Card>
      </div>
    </>
  );
}
