import { useMemo, useState } from 'react';
import {
  App,
  Button,
  Card,
  DatePicker,
  Flex,
  Popconfirm,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { DownloadOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useTable } from '@refinedev/antd';
import { useList } from '@refinedev/core';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import { useSearchParams } from 'react-router-dom';
import type { Driver } from '@/types';
import type { PayrollDriverLine, SalaryAdjustment } from '@/types/domain/payroll';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { formatCurrencyVND } from '@/utils/format';
import { usePayrollPermission } from '@/hooks/usePayrollPermission';
import payrollService from '@/services/payroll.service';
import salaryAdjustmentService from '@/services/salary-adjustment.service';
import { PayrollDetailDrawer } from '@/pages/payroll/PayrollDetailDrawer';
import { SalaryAdjustmentModal, type SalaryAdjustmentFormValues } from '@/pages/payroll/SalaryAdjustmentModal';

function sumFinesAndDeductions(row: PayrollDriverLine): number {
  return (
    Number(row.deduction ?? 0) +
    Number(row.violation_deduction ?? 0) +
    Number(row.fuel_excess_deduction ?? 0) +
    Number(row.leave_unpaid_deduction ?? 0)
  );
}

function payrollLineColumns(t: (k: string) => string): ColumnsType<PayrollDriverLine> {
  return [
    {
      title: t('payrolls.driverName'),
      key: 'name',
      render: (_: unknown, row) => row.driver?.name ?? row.employee?.name ?? '—',
    },
    {
      title: t('payrolls.baseSalary'),
      dataIndex: 'base_salary',
      align: 'right',
      render: (v: number) => formatCurrencyVND(v),
    },
    {
      title: t('payrolls.tripBonus'),
      key: 'trip_bonus',
      align: 'right',
      render: (_: unknown, row) => formatCurrencyVND(row.trip_bonus ?? row.bonus),
    },
    {
      title: t('payrolls.finesDeductionsTotal'),
      key: 'fines',
      align: 'right',
      render: (_: unknown, row) => formatCurrencyVND(sumFinesAndDeductions(row)),
    },
    {
      title: t('payrolls.pitShort'),
      key: 'pit',
      align: 'right',
      render: (_: unknown, row) => formatCurrencyVND(row.pit ?? row.tax),
    },
    {
      title: t('payrolls.netSalary'),
      dataIndex: 'net_salary',
      align: 'right',
      render: (v: number) => formatCurrencyVND(v),
    },
  ];
}

export function PayrollListPage() {
  const { t } = useTranslation();
  const { message, notification } = App.useApp();
  const { canManagePayroll, isDriverUser } = usePayrollPermission();
  const isDriverSelfView = isDriverUser && !canManagePayroll;

  const [searchParams, setSearchParams] = useSearchParams();
  const month = Number(searchParams.get('month')) || dayjs().month() + 1;
  const year = Number(searchParams.get('year')) || dayjs().year();
  const driverIdParam = searchParams.get('driver_id');
  const driverIdNum = driverIdParam ? Number(driverIdParam) : undefined;

  const setPeriod = (d: dayjs.Dayjs | null) => {
    if (!d) return;
    const next = new URLSearchParams(searchParams);
    next.set('month', String(d.month() + 1));
    next.set('year', String(d.year()));
    setSearchParams(next, { replace: true });
  };

  const setDriverFilter = (id: number | undefined) => {
    const next = new URLSearchParams(searchParams);
    if (id == null) next.delete('driver_id');
    else next.set('driver_id', String(id));
    setSearchParams(next, { replace: true });
  };

  const permanentFilters = useMemo(
    () =>
      [
        { field: 'month', operator: 'eq' as const, value: month },
        { field: 'year', operator: 'eq' as const, value: year },
        ...(driverIdNum != null && !Number.isNaN(driverIdNum)
          ? [{ field: 'driver_id', operator: 'eq' as const, value: driverIdNum }]
          : []),
      ] as const,
    [month, year, driverIdNum],
  );

  const { tableProps, tableQuery } = useTable<PayrollDriverLine>({
    resource: 'payroll-driver-lines',
    syncWithLocation: true,
    filters: { permanent: [...permanentFilters] },
    pagination: { pageSize: 15 },
    queryOptions: { enabled: !isDriverSelfView },
  });

  const mySalaryQuery = useQuery({
    queryKey: ['payrolls', 'my-salary', month, year],
    queryFn: async () => {
      const res = await payrollService.getMySalary(month, year);
      if (!res.success || !res.data) throw new Error(res.message);
      return res.data;
    },
    enabled: isDriverSelfView,
  });

  const { data: driversList } = useList<Driver>({
    resource: 'drivers',
    pagination: { pageSize: 100 },
    queryOptions: { enabled: canManagePayroll },
  });

  const driverOptions = useMemo(
    () =>
      (driversList?.data ?? []).map((d) => ({
        value: d.id,
        label: d.employee?.name ?? d.name ?? d.code ?? `#${d.id}`,
      })),
    [driversList?.data],
  );

  const activePayrollId = useMemo(() => {
    if (isDriverSelfView && mySalaryQuery.data?.payroll?.id) {
      return mySalaryQuery.data.payroll.id;
    }
    const rows = tableQuery.data?.data ?? [];
    const first = rows[0] as PayrollDriverLine | undefined;
    return first?.payroll_id ?? first?.payroll?.id ?? null;
  }, [isDriverSelfView, mySalaryQuery.data, tableQuery.data?.data]);

  const adjustmentsQuery = useQuery({
    queryKey: ['salary-adjustments', month, year, activePayrollId],
    queryFn: () =>
      salaryAdjustmentService.list({
        month,
        year,
        payroll_id: activePayrollId ?? undefined,
        per_page: 100,
      }),
    enabled: canManagePayroll,
  });

  const [drawerLine, setDrawerLine] = useState<PayrollDriverLine | null>(null);
  const [adjOpen, setAdjOpen] = useState(false);

  const generateMutation = useMutation({
    mutationFn: () => payrollService.generatePayroll({ month, year }),
    onSuccess: (res) => {
      if (res.success) {
        notification.success({ message: t('payrolls.generateSuccess') });
        void tableQuery.refetch();
      } else {
        notification.error({ message: res.message || t('payrolls.generateError') });
      }
    },
    onError: () => {
      notification.error({ message: t('payrolls.generateError') });
    },
  });

  const exportMutation = useMutation({
    mutationFn: async () => {
      await payrollService.downloadPayrollAggregateExport({
        month,
        year,
        driver_id: driverIdNum,
      });
    },
    onSuccess: () => message.success(t('payrolls.exportSuccess')),
    onError: () => message.error(t('payrolls.exportError')),
  });

  const createAdjMutation = useMutation({
    mutationFn: async (values: SalaryAdjustmentFormValues) => {
      await salaryAdjustmentService.create({
        type: values.type,
        amount: values.amount,
        reason: values.reason,
        applied_date: values.applied_date.format('YYYY-MM-DD'),
        payroll_id: activePayrollId ?? undefined,
        driver_id: values.driver_id,
      });
    },
    onSuccess: () => {
      message.success(t('payrolls.adjustmentCreated'));
      setAdjOpen(false);
      void adjustmentsQuery.refetch();
    },
    onError: () => message.error(t('payrolls.adjustmentCreateError')),
  });

  const cancelAdjMutation = useMutation({
    mutationFn: (id: number) => salaryAdjustmentService.cancel(id),
    onSuccess: () => {
      message.success(t('payrolls.adjustmentCancelled'));
      void adjustmentsQuery.refetch();
    },
    onError: () => message.error(t('payrolls.adjustmentCancelError')),
  });

  const columns = useMemo(() => payrollLineColumns(t), [t]);

  const driverRows: PayrollDriverLine[] = useMemo(() => {
    if (!isDriverSelfView || !mySalaryQuery.data?.line) return [];
    const { payroll, line } = mySalaryQuery.data;
    return [{ ...line, payroll }];
  }, [isDriverSelfView, mySalaryQuery.data]);

  const tableLoading = isDriverSelfView ? mySalaryQuery.isLoading : tableQuery.isLoading;

  const openAdjustmentModal = () => {
    if (activePayrollId == null) {
      message.warning(t('payrolls.noPayrollForPeriod'));
      return;
    }
    setAdjOpen(true);
  };

  const adjustmentColumns: ColumnsType<SalaryAdjustment> = [
    { title: t('payrolls.adjustmentType'), dataIndex: 'type', key: 'type' },
    {
      title: t('payrolls.adjustmentAmount'),
      dataIndex: 'amount',
      align: 'right',
      render: (v: number) => formatCurrencyVND(v),
    },
    { title: t('payrolls.adjustmentReason'), dataIndex: 'reason', key: 'reason', ellipsis: true },
    { title: t('payrolls.appliedDate'), dataIndex: 'applied_date', key: 'applied_date' },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (s: string) => <Tag>{s}</Tag>,
    },
    {
      title: t('common.actions'),
      key: 'actions',
      render: (_: unknown, row) =>
        canManagePayroll && row.status !== 'cancelled' ? (
          <Popconfirm
            title={t('payrolls.confirmCancelAdjustment')}
            onConfirm={() => cancelAdjMutation.mutate(row.id)}
            okButtonProps={{ loading: cancelAdjMutation.isPending }}
          >
            <Button type="link" danger size="small">
              {t('payrolls.cancelAdjustment')}
            </Button>
          </Popconfirm>
        ) : null,
    },
  ];

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('payrolls.title')}
        description={t('payrolls.listDescription')}
        breadcrumb={[
          { label: t('dashboard.title'), path: ROUTES.dashboard },
          { label: t('payrolls.title') },
        ]}
      />

      <Card className="enterprise-section-card">
        <Flex gap={12} wrap="wrap" align="center">
          <DatePicker.MonthPicker
            allowClear={false}
            value={dayjs(`${year}-${String(month).padStart(2, '0')}-01`)}
            onChange={(d) => setPeriod(d)}
            format="MM/YYYY"
          />
          {canManagePayroll ? (
            <Select
              allowClear
              placeholder={t('payrolls.driverSelectPlaceholder')}
              style={{ minWidth: 220 }}
              value={driverIdNum}
              onChange={(v) => setDriverFilter(v)}
              options={driverOptions}
              showSearch
              optionFilterProp="label"
            />
          ) : null}
          <Space>
            {canManagePayroll ? (
              <Button
                type="primary"
                icon={<ThunderboltOutlined />}
                loading={generateMutation.isPending}
                onClick={() => generateMutation.mutate()}
              >
                {t('payrolls.generateMonthly')}
              </Button>
            ) : null}
            {canManagePayroll ? (
              <Button
                type="primary"
                className="!bg-green-600 hover:!bg-green-700"
                icon={<DownloadOutlined />}
                loading={exportMutation.isPending}
                onClick={() => exportMutation.mutate()}
              >
                {t('payrolls.exportExcel')}
              </Button>
            ) : null}
            {canManagePayroll ? (
              <Button type="default" icon={<PlusOutlined />} onClick={openAdjustmentModal}>
                {t('payrolls.addAdjustment')}
              </Button>
            ) : null}
          </Space>
        </Flex>
      </Card>

      {tableLoading ? (
        <Skeleton active paragraph={{ rows: 8 }} />
      ) : isDriverSelfView ? (
        <Table<PayrollDriverLine>
          rowKey="id"
          columns={columns}
          dataSource={driverRows}
          pagination={false}
          scroll={{ x: 960 }}
          locale={{ emptyText: t('payrolls.driverEmptyPeriod') }}
          onRow={(record) => ({
            onClick: () => setDrawerLine(record),
            style: { cursor: 'pointer' },
          })}
          className="enterprise-table"
        />
      ) : (
        <Table<PayrollDriverLine>
          {...tableProps}
          rowKey="id"
          columns={columns}
          scroll={{ x: 960 }}
          onRow={(record) => ({
            onClick: () => setDrawerLine(record),
            style: { cursor: 'pointer' },
          })}
          className="enterprise-table"
        />
      )}

      {canManagePayroll ? (
        <Card title={t('payrolls.adjustmentsSection')} className="enterprise-section-card">
          {adjustmentsQuery.isLoading ? (
            <Skeleton active />
          ) : (
            <Table<SalaryAdjustment>
              rowKey="id"
              size="small"
              columns={adjustmentColumns}
              dataSource={adjustmentsQuery.data?.data ?? []}
              pagination={false}
              className="enterprise-table"
            />
          )}
        </Card>
      ) : null}

      <PayrollDetailDrawer open={drawerLine != null} onClose={() => setDrawerLine(null)} line={drawerLine} />

      <SalaryAdjustmentModal
        open={adjOpen}
        onClose={() => setAdjOpen(false)}
        onSubmit={async (v) => createAdjMutation.mutateAsync(v)}
        loading={createAdjMutation.isPending}
        driverOptions={driverOptions}
      />
    </div>
  );
}
