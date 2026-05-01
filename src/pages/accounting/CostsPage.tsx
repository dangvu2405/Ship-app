import { useMemo, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Row, Select, Space, Statistic, Table, Tag, theme } from 'antd';
import { ExportOutlined, WalletOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation, type Translate } from '@/hooks/useTranslation';
import type { VehicleExpense } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';

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

  const { data, isLoading } = useList<VehicleExpense>({
    resource: 'vehicle_expenses',
    filters: [
      { field: 'expense_date', operator: 'gte', value: dateRange[0].format('YYYY-MM-DD') },
      { field: 'expense_date', operator: 'lte', value: dateRange[1].format('YYYY-MM-DD') },
      ...(typeFilter ? [{ field: 'type', operator: 'eq' as const, value: typeFilter }] : []),
    ],
    pagination: { pageSize: 100 },
    sorters: [{ field: 'expense_date', order: 'desc' }],
  });

  const expenses = data?.data ?? [];
  const totalCost = expenses.reduce((sum, e) => sum + (e.amount ?? 0), 0);

  const costByType = expenses.reduce<Record<string, number>>((acc, e) => {
    acc[e.type] = (acc[e.type] ?? 0) + (e.amount ?? 0);
    return acc;
  }, {});

  const typeOptions = useMemo(
    () =>
      EXPENSE_TYPE_KEYS.map((value) => ({
        value,
        label: expenseTypeLabel(value, t),
      })),
    [t],
  );

  return (
    <div>
      <PageHeader
        title={t('accountingPages.costsTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.costsTitle') },
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
            placeholder={t('accountingPages.expenseTypePlaceholder')}
            allowClear
            style={{ width: 160 }}
            value={typeFilter}
            onChange={setTypeFilter}
            options={typeOptions}
          />
        </Space>
      </Card>

      <Row gutter={16} style={{ marginBottom: token.marginMD }}>
        <Col xs={12} sm={6}>
          <Card>
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
              <Card>
                <Statistic
                  title={expenseTypeLabel(type, t)}
                  value={amount}
                  formatter={(v) => formatMoney(Number(v))}
                />
              </Card>
            </Col>
          ))}
      </Row>

      <Card>
        <Table<VehicleExpense>
          dataSource={expenses}
          loading={isLoading}
          rowKey="id"
          size="small"
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
        />
      </Card>
    </div>
  );
}
