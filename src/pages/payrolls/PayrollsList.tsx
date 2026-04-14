import { useCallback, useMemo, useState } from 'react';
import { useDelete, useInvalidate, useList, useNavigation, type CrudFilter } from '@refinedev/core';
import { Alert, Button, Card, Flex, Input, InputNumber, Progress, Select, Tag, Typography } from 'antd';
import { CheckCircleOutlined, DeleteOutlined, DownloadOutlined, EditOutlined, EyeOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { PageHeader } from '@/components/common/PageHeader';
import { DateTimeBadge } from '@/components/common/DateTimeBadge';
import { PageLoadingOverlay } from '@/components/common/PageLoadingOverlay';
import { ErrorState } from '@/components/common/ErrorState';
import { DataTable, type DataTableColumn } from '@/components/table';
import { useTranslation } from '@/hooks/useTranslation';
import type { Company, Payroll } from '@/types';
import { ROUTES } from '@/routes';
import payrollService from '@/services/payroll.service';
import toast from 'react-hot-toast';
import { getErrorMessage, shouldShowLocalErrorToast } from '@/utils/errorHandler';
import { useAuth } from '@/hooks/useAuth';
import { PayrollFormDialog } from './PayrollFormDialog';
import { useSafeRefetch } from '@/hooks/useSafeRefetch';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';
import { formatDate, formatMoney, formatStatusLabel } from '@/utils/displayFormat';
import './payrolls-list.scss';

type Translate = ReturnType<typeof useTranslation>['t'];

function toNumber(value: unknown): number {
  if (typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function payrollStatusText(status: string, t: Translate): string {
  return formatStatusLabel(status, {
    running: 'Running',
    locked: t('payrolls.statusLocked'),
    approved: t('payrolls.statusApproved'),
    generated: t('payrolls.statusGenerated'),
    draft: t('payrolls.statusGenerated'),
  });
}

function payrollStatusTagColor(status: string): string {
  if (status === 'approved') return 'processing';
  if (status === 'locked') return 'success';
  if (status === 'draft' || status === 'generated') return 'default';
  if (status === 'running') return 'warning';
  return 'processing';
}

export function PayrollsList() {
  const { t } = useTranslation();
  const { hasRole, user } = useAuth();
  const { show } = useNavigation();
  const invalidate = useInvalidate();
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<'create' | 'edit'>('create');
  const [editingId, setEditingId] = useState<number | undefined>(undefined);
  const [current, setCurrent] = useState(1);
  const [companyFilter, setCompanyFilter] = useState<number | undefined>(undefined);
  const [monthFilter, setMonthFilter] = useState<number | undefined>(undefined);
  const [yearFilter, setYearFilter] = useState<number | undefined>(new Date().getFullYear());
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [keywordFilter, setKeywordFilter] = useState<string>('');
  const [busy, setBusy] = useState<{ id: number; op: 'approve' | 'lock' | 'export' } | null>(null);
  const [previewedPayrollIds, setPreviewedPayrollIds] = useState<Set<number>>(new Set());
  const isAdmin = hasRole('admin');
  const { mutate: deletePayroll } = useDelete();

  const filters = useMemo<CrudFilter[]>(() => {
    const items: CrudFilter[] = [];
    if (companyFilter != null) items.push({ field: 'company_id', operator: 'eq', value: companyFilter });
    if (monthFilter != null) items.push({ field: 'month', operator: 'eq', value: monthFilter });
    if (yearFilter != null) items.push({ field: 'year', operator: 'eq', value: yearFilter });
    if (statusFilter) items.push({ field: 'status', operator: 'eq', value: statusFilter });
    return items;
  }, [companyFilter, monthFilter, yearFilter, statusFilter]);

  const { data, isLoading, isError, refetch } = useResourceListQuery<Payroll>({
    resource: 'payrolls',
    current,
    pageSize: 15,
    filters,
  });

  const { data: companiesData } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 200 },
  });

  const safeRefetch = useSafeRefetch('payrolls-payrollslist', refetch);

  const afterMutation = useCallback(async () => {
    await invalidate({ resource: 'payrolls', invalidates: ['list'] });
    await safeRefetch(true);
  }, [invalidate, safeRefetch]);

  const run = useCallback(
    async (id: number, op: 'approve' | 'lock' | 'export') => {
      setBusy({ id, op });
      try {
        if (op === 'approve') {
          await payrollService.approve(id);
        } else if (op === 'lock') {
          await payrollService.lock(id);
        } else {
          await payrollService.downloadExport(id);
        }
        toast.success(
          op === 'export'
            ? t('payrolls.exportJson')
            : t('notifications.updateSuccess', { item: t('payrolls.title') })
        );
        if (op !== 'export') {
          await afterMutation();
        }
      } catch (error) {
        if (!shouldShowLocalErrorToast(error)) {
          return;
        }
        toast.error(
          getErrorMessage(error) || t('notifications.updateError', { item: t('payrolls.title') })
        );
      } finally {
        setBusy(null);
      }
    },
    [t, afterMutation]
  );

  const handleDelete = useCallback(
    (id: number) => {
      deletePayroll(
        { resource: 'payrolls', id },
        {
          onSuccess: () => {
            toast.success(t('notifications.deleteSuccess', { item: t('payrolls.title') }));
            void afterMutation();
          },
          onError: (error) => {
            if (!shouldShowLocalErrorToast(error)) return;
            toast.error(getErrorMessage(error) || t('notifications.deleteError', { item: t('payrolls.title') }));
          },
        },
      );
    },
    [afterMutation, deletePayroll, t],
  );

  const handleCreate = () => {
    setFormMode('create');
    setEditingId(undefined);
    setFormOpen(true);
  };

  const handleEdit = useCallback((id: number) => {
    setFormMode('edit');
    setEditingId(id);
    setFormOpen(true);
  }, []);

  const markAsPreviewed = useCallback((id: number) => {
    setPreviewedPayrollIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const columns = useMemo<DataTableColumn<Payroll>[]>(
    () => [
    { key: 'id', header: 'Payroll ID', dataIndex: 'id' },
    {
      key: 'company',
      header: t('payrolls.company'),
      render: (item) => item.company?.name || `ID ${item.company_id}`,
    },
    {
      key: 'period',
      header: 'Period',
      render: (item) => `${String(item.month).padStart(2, '0')}/${item.year}`,
    },
    {
      key: 'status',
      header: t('common.status'),
      dataIndex: 'status',
      render: (item) => (
        <Tag color={payrollStatusTagColor(item.status)}>
          {payrollStatusText(item.status, t)}
        </Tag>
      ),
    },
    {
      key: 'approved_at',
      header: 'Approved At',
      dataIndex: 'approved_at',
      render: (item) => <DateTimeBadge value={item.approved_at} mode="datetime" />,
    },
    {
      key: 'locked_at',
      header: 'Locked At',
      dataIndex: 'locked_at',
      render: (item) => <DateTimeBadge value={item.locked_at} mode="datetime" />,
    },
    {
      key: 'notes',
      header: 'Notes',
      render: (item) => (
        <Typography.Text ellipsis={{ tooltip: item.notes || '-' }} style={{ maxWidth: 240 }}>
          {item.notes || '-'}
        </Typography.Text>
      ),
    },
    {
      key: 'actions',
      header: t('common.actions'),
      render: (record) => {
        const isRunning = record.status === 'running';
        const isCreator =
          typeof user?.id === 'number' && typeof record.created_by === 'number' && user.id === record.created_by;
        const hasPreviewed = previewedPayrollIds.has(record.id);
        const isDraft = record.status === 'draft' || record.status === 'generated';
        const canApprove =
          isDraft &&
          !isRunning &&
          !isCreator &&
          hasPreviewed;
        const canLock = record.status === 'approved' && isAdmin && !isRunning;
        const isBusy = busy?.id === record.id;
        const approveTitle = isRunning
          ? 'Batch is running'
          : isCreator
            ? 'SoD: creator cannot approve this payroll'
            : !hasPreviewed
              ? 'Open payroll detail to review preview before approve'
              : t('payrolls.approve');
        return (
          <div role="presentation" className="flex flex-wrap gap-1" onClick={(e) => e.stopPropagation()}>
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined aria-hidden />}
              onClick={() => {
                markAsPreviewed(record.id);
                show('payrolls', record.id);
              }}
              title={t('common.view')}
              aria-label={t('common.view')}
            />
            <Button
              type="text"
              size="small"
              icon={<EditOutlined aria-hidden />}
              disabled={!isDraft || isBusy}
              onClick={() => handleEdit(record.id)}
              title={t('common.edit')}
              aria-label={t('common.edit')}
            />
            <Button
              type="text"
              size="small"
              icon={<CheckCircleOutlined aria-hidden />}
              disabled={isBusy || !canApprove}
              loading={isBusy && busy?.op === 'approve'}
              title={approveTitle}
              aria-label={approveTitle}
              onClick={() => void run(record.id, 'approve')}
            />
            <Button
              type="text"
              size="small"
              icon={<LockOutlined aria-hidden />}
              disabled={isBusy || !canLock}
              loading={isBusy && busy?.op === 'lock'}
              title={isRunning ? 'Batch is running' : isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              aria-label={isRunning ? 'Batch is running' : isAdmin ? t('payrolls.lock') : t('messages.accessDenied')}
              onClick={() => void run(record.id, 'lock')}
            />
            {isDraft ? (
              <Button
                type="text"
                size="small"
                danger
                icon={<DeleteOutlined aria-hidden />}
                disabled={isBusy}
                title={t('common.delete')}
                aria-label={t('common.delete')}
                onClick={() => handleDelete(record.id)}
              />
            ) : null}
            <Button
              type="text"
              size="small"
              icon={<DownloadOutlined aria-hidden />}
              disabled={isBusy}
              loading={isBusy && busy?.op === 'export'}
              title={t('payrolls.exportJson')}
              aria-label={t('payrolls.exportJson')}
              onClick={() => void run(record.id, 'export')}
            />
          </div>
        );
      },
    },
  ],
    [t, show, isAdmin, busy, handleEdit, run, markAsPreviewed, previewedPayrollIds, user?.id, handleDelete]
  );

  const breadcrumb = [
    { label: t('dashboard.title'), path: ROUTES.dashboard },
    { label: t('payrolls.title') },
  ];

  const listData = data?.data ?? [];
  const total = data?.total ?? 0;
  const pageSize = 15;
  const recentPayroll = listData[0];
  const pendingPayrollCount = listData.filter((item) => ['draft', 'generated', 'running'].includes(item.status)).length;
  const approvedPayrollCount = listData.filter((item) => item.status === 'approved').length;
  const getPayrollAmount = useCallback(
    (item: Payroll) =>
      toNumber(
        (item as Payroll & {
          total_net_salary?: number | string;
          net_salary?: number | string;
          total_amount?: number | string;
          amount?: number | string;
        }).total_net_salary ??
          (item as Payroll & { net_salary?: number | string }).net_salary ??
          (item as Payroll & { total_amount?: number | string }).total_amount ??
          (item as Payroll & { amount?: number | string }).amount,
      ),
    [],
  );
  const getPayrollDeduction = useCallback(
    (item: Payroll) =>
      toNumber(
        (item as Payroll & {
          total_deduction?: number | string;
          deduction?: number | string;
        }).total_deduction ?? (item as Payroll & { deduction?: number | string }).deduction,
      ),
    [],
  );
  const chartByMonth = Array.from({ length: 12 }, (_, i) => {
    const month = i + 1;
    const inMonth = listData.filter((item) => item.month === month && (!yearFilter || item.year === yearFilter));
    let net = inMonth.reduce((acc, item) => acc + getPayrollAmount(item), 0);
    let deduction = inMonth.reduce((acc, item) => acc + getPayrollDeduction(item), 0);
    // Backend list may omit aggregated salary fields; fallback to count-based bars.
    if (net === 0 && deduction === 0) {
      net = inMonth.filter((item) => item.status === 'approved' || item.status === 'locked').length;
      deduction = inMonth.filter((item) => item.status === 'draft' || item.status === 'generated' || item.status === 'running').length;
    }
    return { month, net, deduction };
  });
  const maxBarValue = Math.max(1, ...chartByMonth.map((it) => Math.max(it.net, it.deduction)));
  const filteredListData = listData.filter((item) => {
    const keyword = keywordFilter.trim().toLowerCase();
    if (!keyword) return true;
    const companyName = item.company?.name?.toLowerCase() ?? '';
    const notes = (item.notes || '').toLowerCase();
    const status = (item.status || '').toLowerCase();
    return (
      companyName.includes(keyword) ||
      notes.includes(keyword) ||
      status.includes(keyword) ||
      String(item.id).includes(keyword)
    );
  });
  const totalLoans = useMemo(
    () =>
      filteredListData.reduce((acc, item) => {
        const row = item as Payroll & {
          total_loans?: number | string;
          loan_total?: number | string;
          loans_amount?: number | string;
        };
        return acc + toNumber(row.total_loans ?? row.loan_total ?? row.loans_amount);
      }, 0),
    [filteredListData],
  );
  const totalAdvances = useMemo(
    () =>
      filteredListData.reduce((acc, item) => {
        const row = item as Payroll & {
          total_advances?: number | string;
          advance_total?: number | string;
          salary_advance_amount?: number | string;
        };
        return acc + toNumber(row.total_advances ?? row.advance_total ?? row.salary_advance_amount);
      }, 0),
    [filteredListData],
  );
  const totalLoanAdvance = totalLoans + totalAdvances;

  return (
    <>
      <PageHeader
        title={t('payrolls.title')}
        description={t('payrolls.description')}
        breadcrumb={breadcrumb}
        actions={
          <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
            {t('payrolls.createPayroll')}
          </Button>
        }
      />

      <Card className="rounded-xl shadow-sm border" styles={{ body: { padding: 24 } }}>
        <div className="payroll-figma-layout">
          <Alert
            showIcon
            type="warning"
            className="payroll-alert-banner"
            message="Payroll submission for the current pay period is due soon. Review and finalize all employee payroll details."
          />

          <Flex gap={12} wrap className="payroll-stats-grid">
            <Card className="payroll-stat-card" size="small">
              <Typography.Text type="secondary">Most recent payroll</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {recentPayroll ? `#${recentPayroll.id}` : '-'}
              </Typography.Title>
              <Typography.Text type="secondary">
                {recentPayroll ? `${String(recentPayroll.month).padStart(2, '0')}/${recentPayroll.year}` : t('common.noData')}
              </Typography.Text>
            </Card>
            <Card className="payroll-stat-card" size="small">
              <Typography.Text type="secondary">Payroll records</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {total}
              </Typography.Title>
              <Typography.Text type="secondary">Total records</Typography.Text>
            </Card>
            <Card className="payroll-stat-card" size="small">
              <Typography.Text type="secondary">Pending salary approvals</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {pendingPayrollCount}
              </Typography.Title>
              <Typography.Text type="secondary">{approvedPayrollCount} approved</Typography.Text>
            </Card>
            <Card className="payroll-stat-card" size="small">
              <Typography.Text type="secondary">Next salary date</Typography.Text>
              <Typography.Title level={3} style={{ margin: 0 }}>
                {formatDate(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0))}
              </Typography.Title>
              <Typography.Text type="secondary">This month</Typography.Text>
            </Card>
          </Flex>

          <Flex gap={12} wrap className="payroll-overview-grid">
            <Card className="payroll-overview-card" title="Employee payroll overview" size="small">
              <div className="payroll-overview-chart">
                {chartByMonth.map((item) => (
                  <div className="payroll-overview-bar-col" key={item.month}>
                    <div className="payroll-overview-bars">
                      <div
                        className="bar-deduction"
                        style={{ height: `${Math.max(6, (item.deduction / maxBarValue) * 120)}px` }}
                      />
                      <div
                        className="bar-net"
                        style={{ height: `${Math.max(6, (item.net / maxBarValue) * 120)}px` }}
                      />
                    </div>
                    <Typography.Text type="secondary" className="bar-month-label">
                      {item.month}
                    </Typography.Text>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="payroll-overview-card payroll-loans-card" title="Loans & Salary Advances" size="small">
              <Progress
                type="dashboard"
                percent={totalLoanAdvance ? Math.round((totalLoans / totalLoanAdvance) * 100) : 0}
                format={() => formatMoney(totalLoanAdvance)}
              />
              <Flex justify="space-between">
                <Typography.Text>{formatMoney(totalLoans)} Loans</Typography.Text>
                <Typography.Text>{formatMoney(totalAdvances)} Advances</Typography.Text>
              </Flex>
            </Card>
          </Flex>
        </div>

        <Flex wrap="wrap" gap={12} style={{ marginBottom: 16 }}>
          <Input
            style={{ minWidth: 220 }}
            placeholder="Search payroll id, company, status, notes"
            value={keywordFilter}
            onChange={(e) => setKeywordFilter(e.target.value)}
          />
          <Select
            allowClear
            style={{ minWidth: 220 }}
            placeholder="Company"
            value={companyFilter}
            onChange={(v) => {
              setCurrent(1);
              setCompanyFilter(v);
            }}
            options={(companiesData?.data ?? []).map((c) => ({ label: c.name, value: c.id }))}
          />
          <Select
            allowClear
            style={{ width: 140 }}
            placeholder="Month"
            value={monthFilter}
            onChange={(v) => {
              setCurrent(1);
              setMonthFilter(v);
            }}
            options={Array.from({ length: 12 }, (_, i) => ({ label: String(i + 1), value: i + 1 }))}
          />
          <InputNumber
            style={{ width: 140 }}
            placeholder="Year"
            value={yearFilter}
            onChange={(v) => {
              setCurrent(1);
              setYearFilter(v ?? undefined);
            }}
          />
          <Select
            allowClear
            style={{ width: 160 }}
            placeholder="Status"
            value={statusFilter}
            onChange={(v) => {
              setCurrent(1);
              setStatusFilter(v);
            }}
            options={[
              { label: 'draft', value: 'draft' },
              { label: 'approved', value: 'approved' },
              { label: 'locked', value: 'locked' },
            ]}
          />
        </Flex>
        {isError ? (
          <ErrorState
            title={t('common.loadError')}
            description={t('common.tryAgainDescription')}
            onRetry={() => void safeRefetch(true)}
          />
        ) : (
          <PageLoadingOverlay loading={isLoading} className="overflow-hidden rounded-lg">
            <DataTable<Payroll>
              data={filteredListData}
              columns={columns}
              onRowClick={(record) => {
                markAsPreviewed(record.id);
                show('payrolls', record.id);
              }}
              emptyMessage={t('common.noData')}
              emptyDescription={t('emptyState.listDescription', { resource: t('payrolls.title') })}
              emptyAction={
                <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
                  {t('payrolls.createPayroll')}
                </Button>
              }
              pagination={{
                current,
                total,
                pageSize,
                onPageChange: setCurrent,
              }}
            />
          </PageLoadingOverlay>
        )}
      </Card>
      {formOpen && (
        <PayrollFormDialog
          open={formOpen}
          mode={formMode}
          recordId={editingId}
          onClose={() => {
            setFormOpen(false);
            setEditingId(undefined);
          }}
          onSuccess={() => {
            void afterMutation();
          }}
        />
      )}
    </>
  );
}
