import { useMemo, useState } from 'react';
import { Alert, App, Button, Card, Col, DatePicker, Empty, Row, Select, Space, Statistic, Table, Tag, theme } from 'antd';
import { ExportOutlined, WalletOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { ErrorState } from '@/components/common/ErrorState';
import { useTranslation } from '@/hooks/useTranslation';
import { useReport, useExportReport } from '@/hooks/useReports';
import type { CostCategory } from '@/types';
import type { CostsReportData, CostsReportRow, ReportFilter } from '@/services/reports.service';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useResourceListQuery } from '@/hooks/useResourceListQuery';

const { RangePicker } = DatePicker;

const COST_STATUS_OPTIONS = ['pending', 'approved', 'rejected'] as const;

function costStatusColor(status: string): string {
  switch (status) {
    case 'approved':
      return 'success';
    case 'rejected':
      return 'error';
    case 'pending':
    default:
      return 'processing';
  }
}

export function CostsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const { exportReport } = useExportReport();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<number | undefined>(undefined);
  const [exporting, setExporting] = useState(false);

  const reportFilter = useMemo<ReportFilter>(() => ({
    date_from: dateRange[0].format('YYYY-MM-DD'),
    date_to: dateRange[1].format('YYYY-MM-DD'),
    status: statusFilter,
    cost_category_id: categoryFilter,
  }), [categoryFilter, dateRange, statusFilter]);

  const { data, loading, isError, error, refetch } = useReport<CostsReportData>('costs', reportFilter);
  const { data: categoriesData } = useResourceListQuery<CostCategory>({
    resource: 'cost-categories',
    current: 1,
    pageSize: 100,
  });

  const rows = data?.rows ?? [];
  const categoryOptions = useMemo(
    () => (categoriesData?.data ?? []).map((item) => ({ value: item.id, label: item.name })),
    [categoriesData?.data],
  );

  const handleExport = async () => {
    setExporting(true);
    try {
      const result = await exportReport('costs', reportFilter, 'xlsx');
      if (result?.url || result?.file) {
        message.success(t('accountingPages.exportReady'));
      } else {
        message.info(t('accountingPages.exportSoon'));
      }
    } catch {
      message.error(t('accountingPages.exportFailed'));
    } finally {
      setExporting(false);
    }
  };

  const columns: ColumnsType<CostsReportRow> = [
    {
      title: t('accountingPages.costsTableTrip'),
      dataIndex: 'trip_code',
      key: 'trip_code',
      render: (value, row) => value ?? `#${row.trip_id}`,
    },
    {
      title: t('accountingPages.costsTableVehicle'),
      key: 'vehicle',
      render: (_, row) =>
        row.vehicle_plate_number ??
        (row.vehicle_id != null ? t('accountingPages.costsVehicleFallback', { id: row.vehicle_id }) : '—'),
    },
    {
      title: t('drivers.title'),
      key: 'driver',
      render: (_, row) => row.driver_name ?? (row.driver_id != null ? `${t('drivers.title')} #${row.driver_id}` : '—'),
    },
    {
      title: t('accountingPages.costsTableType'),
      dataIndex: 'cost_category_name',
      key: 'cost_category_name',
      render: (value, row) => value ?? `#${row.cost_category_id}`,
    },
    {
      title: t('accountingPages.costsTableDate'),
      dataIndex: 'incurred_date',
      key: 'incurred_date',
      render: (value) => formatDate(value),
      width: 130,
    },
    {
      title: t('accountingPages.costsTableAmount'),
      dataIndex: 'amount',
      key: 'amount',
      align: 'right',
      render: (value: number) => formatMoney(value),
    },
    {
      title: t('common.status'),
      dataIndex: 'status',
      key: 'status',
      render: (value: string, row) => (
        <Space size={4}>
          <Tag color={costStatusColor(value)}>{t(`accountingPages.costStatus.${value}`)}</Tag>
          {row.approval_required ? <Tag color="warning">{t('accountingPages.approvalRequired')}</Tag> : null}
        </Space>
      ),
    },
    {
      title: t('accountingPages.costsTableNote'),
      key: 'note',
      ellipsis: true,
      render: (_, row) => row.description ?? row.notes ?? '—',
    },
  ];

  if (isError) {
    return (
      <>
        <PageHeader
          title={t('accountingPages.costsTitle')}
          breadcrumb={[
            { label: t('accountingPages.breadcrumbAccounting') },
            { label: t('accountingPages.costsTitle') },
          ]}
        />
        <ErrorState
          title={t('common.loadError')}
          description={error instanceof Error ? error.message : t('common.tryAgainDescription')}
          onRetry={() => void refetch()}
        />
      </>
    );
  }

  return (
    <div>
      <PageHeader
        title={t('accountingPages.costsTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.costsTitle') },
        ]}
        actions={
          <Button icon={<ExportOutlined />} loading={exporting} onClick={() => void handleExport()}>
            {t('accountingPages.exportExcel')}
          </Button>
        }
      />

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(value) => {
              if (value?.[0] && value[1]) {
                setDateRange([value[0], value[1]]);
              }
            }}
            format="DD/MM/YYYY"
          />
          <Select
            placeholder={t('accountingPages.statusPlaceholder')}
            allowClear
            style={{ width: 180 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={COST_STATUS_OPTIONS.map((status) => ({
              value: status,
              label: t(`accountingPages.costStatus.${status}`),
            }))}
          />
          <Select
            placeholder={t('accountingPages.expenseTypePlaceholder')}
            allowClear
            showSearch
            optionFilterProp="label"
            style={{ width: 220 }}
            value={categoryFilter}
            onChange={setCategoryFilter}
            options={categoryOptions}
          />
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: token.marginMD }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.costsStatTotal')}
              value={data?.total_costs ?? 0}
              formatter={(value) => formatMoney(Number(value))}
              prefix={<WalletOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('accountingPages.costStatus.pending')} value={data?.pending_costs ?? 0} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('accountingPages.costStatus.approved')} value={data?.approved_costs ?? 0} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic title={t('accountingPages.costStatus.rejected')} value={data?.rejected_costs ?? 0} formatter={(value) => formatMoney(Number(value))} />
          </Card>
        </Col>
      </Row>

      <Alert
        type="info"
        showIcon
        style={{ marginBottom: token.marginMD }}
        message={t('accountingPages.costsReportHint')}
      />

      <Card>
        <Table<CostsReportRow>
          dataSource={rows}
          loading={loading}
          rowKey="id"
          size="small"
          columns={columns}
          locale={{ emptyText: loading ? t('common.loading') : <Empty description={t('accountingPages.costsEmpty')} /> }}
          pagination={{
            pageSize: 20,
            size: 'small',
            showTotal: (total) => t('accountingPages.costsRecords', { count: total }),
          }}
          summary={(currentRows) => {
            const sum = currentRows.reduce((total, row) => total + (row.amount ?? 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={5}>
                  <strong>{t('accountingPages.revenueGrandTotal')}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={5} align="right">
                  <strong>{formatMoney(sum)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={6} />
                <Table.Summary.Cell index={7} />
              </Table.Summary.Row>
            );
          }}
        />
      </Card>
    </div>
  );
}
