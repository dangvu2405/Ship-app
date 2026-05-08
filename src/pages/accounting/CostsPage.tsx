import { useMemo, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, theme } from 'antd';
import { AuditOutlined, ExportOutlined, WalletOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { Link } from 'react-router-dom';
import { ROUTES } from '@/routes';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation, type Translate } from '@/hooks/useTranslation';
import type { VehicleExpense } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useVehicleExpenseReportList } from '@/hooks/useAccounting';
import { useReport, useExportReport } from '@/hooks/useReports';

const { RangePicker } = DatePicker;

const EXPENSE_TYPE_KEYS = [
  'fuel',
  'toll',
  'maintenance',
  'repair',
  'other',
] as const;

function expenseTypeLabel(type: string, t: Translate): string {
  const map: Record<string, string> = {
    fuel: 'accountingPages.expenseTypeFuel',
    toll: 'accountingPages.expenseTypeToll',
    maintenance: 'accountingPages.expenseTypeMaintenance',
    repair: 'accountingPages.expenseTypeRepair',
    other: 'accountingPages.expenseTypeOther',
  };
  const key = map[type];
  return key ? t(key) : type;
}

export function CostsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [typeFilter, setTypeFilter] = useState<string | undefined>(undefined);

  const dateFrom = dateRange[0].format('YYYY-MM-DD');
  const dateTo = dateRange[1].format('YYYY-MM-DD');

  const { expenses, loading: isLoading } = useVehicleExpenseReportList({
    pageSize: 100,
    filters: [
      { field: 'expense_date', operator: 'gte', value: dateFrom },
      { field: 'expense_date', operator: 'lte', value: dateTo },
      ...(typeFilter ? [{ field: 'type', operator: 'eq' as const, value: typeFilter }] : []),
    ],
    sorters: [{ field: 'expense_date', order: 'desc' }],
  });

  const { data: aggregate } = useReport<{
    total_cost?: number;
    by_type?: Record<string, number>;
  }>('costs', { date_from: dateFrom, date_to: dateTo });

  const totalCost =
    aggregate?.total_cost ?? expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const costByType =
    aggregate?.by_type ??
    expenses.reduce<Record<string, number>>((acc, e) => {
      acc[e.type] = (acc[e.type] ?? 0) + (e.amount ?? 0);
      return acc;
    }, {});

  const { exportReport } = useExportReport();
  const handleExport = async () => {
    try {
      const result = await exportReport(
        'costs',
        { date_from: dateFrom, date_to: dateTo, status: typeFilter },
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

  const typeOptions = useMemo(
    () =>
      EXPENSE_TYPE_KEYS.map((value) => ({
        value,
        label: expenseTypeLabel(value, t),
      })),
    [t],
  );

  return (
    <div className="enterprise-page space-y-4">
      <PageHeader
        title={t('accountingPages.costsTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.costsTitle') },
        ]}
        actions={
          <Space>
            <Link to={ROUTES.admin.accounting.approvals}>
              <Button icon={<AuditOutlined />}>Phê duyệt chi phí</Button>
            </Link>
            <Button icon={<ExportOutlined />} onClick={handleExport}>
              {t('accountingPages.exportExcel')}
            </Button>
          </Space>
        }
      />

      <Card size="small" className="enterprise-section-card">
        <Space wrap>
          <RangePicker
            value={dateRange}
            onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            format="DD/MM/YYYY"
          />
          <Select
            placeholder={t('accountingPages.expenseTypePlaceholder')}
            allowClear
            style={{ width: 160 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
          />
        </Space>
      </Card>

      <Row gutter={[12, 12]}>
        <Col xs={12} sm={6}>
          <Card className="enterprise-kpi-card">
            <Statistic
              title={t('accountingPages.costsStatTotal')}
              value={totalCost}
              formatter={(v) => formatMoney(Number(v))}
              prefix={<WalletOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        {Object.entries(costByType)
          .slice(0, 3)
          .map(([type, amount]) => (
            <Col xs={12} sm={6} key={type}>
              <Card className="enterprise-kpi-card">
                <Statistic
                  title={expenseTypeLabel(type, t)}
                  value={amount}
                  formatter={(v) => formatMoney(Number(v))}
                />
              </Card>
            </Col>
          ))}
      </Row>

      <Card className="enterprise-section-card">
        <Table<VehicleExpense>
          dataSource={expenses}
          loading={isLoading}
          rowKey="id"
          size="small"
          scroll={{ x: 'max-content' }}
          pagination={{
            pageSize: 20,
            size: 'small',
            showTotal: (total) => t('accountingPages.costsRecords', { count: total }),
          }}
          summary={(rows) => {
            const sum = rows.reduce((s, r) => s + (r.amount ?? 0), 0);
            return (
              <Table.Summary.Row>
                <Table.Summary.Cell index={0} colSpan={3}>
                  <strong>{t('accountingPages.revenueGrandTotal')}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={3} align="right">
                  <strong>{formatMoney(sum)}</strong>
                </Table.Summary.Cell>
                <Table.Summary.Cell index={4} />
              </Table.Summary.Row>
            );
          }}
          columns={[
            {
              title: t('accountingPages.costsTableVehicle'),
              key: 'vehicle',
              render: (_, r) =>
                (r.vehicle as { plate_number?: string })?.plate_number ??
                t('accountingPages.costsVehicleFallback', { id: r.vehicle_id }),
            },
            {
              title: t('accountingPages.costsTableType'),
              dataIndex: 'type',
              key: 'type',
              render: (v: string) => <Tag>{expenseTypeLabel(v, t)}</Tag>,
            },
            {
              title: t('accountingPages.costsTableDate'),
              dataIndex: 'expense_date',
              key: 'expense_date',
              render: (v) => formatDate(v),
              width: 100,
            },
            {
              title: t('accountingPages.costsTableAmount'),
              dataIndex: 'amount',
              key: 'amount',
              align: 'right',
              render: (v: number) => formatMoney(v),
            },
            {
              title: t('accountingPages.costsTableNote'),
              dataIndex: 'note',
              key: 'note',
              ellipsis: true,
              render: (v) => v ?? '—',
            },
          ]}
          className="enterprise-table"
        />
      </Card>
    </div>
  );
}
