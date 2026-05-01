import { useState } from 'react';
import { App, Button, Card, Col, Empty, Row, Select, Space, Statistic, Table, Tag, theme } from 'antd';
import { ExportOutlined, WarningOutlined } from '@ant-design/icons';
import { useList } from '@refinedev/core';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Customer, Trip } from '@/types';
import { formatMoney } from '@/utils/displayFormat';

interface DebtRow {
  customer: Customer;
  totalRevenue: number;
  tripCount: number;
  overdueTrips: number;
}

export function DebtPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);

  const { data: customersData, isLoading: customersLoading } = useList<Customer>({
    resource: 'customers',
    pagination: { pageSize: 100 },
  });

  const { data: tripsData } = useList<Trip>({
    resource: 'trips',
    filters: [{ field: 'status', operator: 'eq', value: 'completed' }],
    pagination: { pageSize: 200 },
  });

  const customers = customersData?.data ?? [];
  const completedTrips = tripsData?.data ?? [];

  const debtRows: DebtRow[] = customers
    .map((customer) => {
      const customerTrips = completedTrips.filter((trip) => trip.customer_id === customer.id);
      const totalRevenue = customerTrips.reduce((s, trip) => s + (trip.price ?? 0), 0);
      return {
        customer,
        totalRevenue,
        tripCount: customerTrips.length,
        overdueTrips: customerTrips.filter((trip) => {
          const end = trip.end_time ? new Date(trip.end_time) : null;
          return end && Date.now() - end.getTime() > 30 * 86400000;
        }).length,
      };
    })
    .filter((r) => r.totalRevenue > 0)
    .sort((a, b) => b.totalRevenue - a.totalRevenue);

  const totalDebt = debtRows.reduce((s, r) => s + r.totalRevenue, 0);
  const overdueRows = debtRows.filter((r) => r.overdueTrips > 0);
  const overdueDebt = overdueRows.reduce((s, r) => s + r.totalRevenue, 0);

  const filtered =
    statusFilter === 'overdue' ? debtRows.filter((r) => r.overdueTrips > 0) : debtRows;

  return (
    <div>
      <PageHeader
        title={t('accountingPages.debtTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.debtTitle') },
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

      <Row gutter={16} style={{ marginBottom: token.marginMD }}>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatTotal')}
              value={totalDebt}
              formatter={(v) => formatMoney(Number(v))}
              valueStyle={{ color: token.colorPrimary }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatOverdue30')}
              value={overdueDebt}
              formatter={(v) => formatMoney(Number(v))}
              prefix={<WarningOutlined />}
              valueStyle={{ color: token.colorError }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatCustomers')}
              value={debtRows.length}
              suffix={t('accountingPages.debtCustomersSuffix')}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card>
            <Statistic
              title={t('accountingPages.debtStatOverdueCustomers')}
              value={overdueRows.length}
              suffix={t('accountingPages.debtCustomersSuffix')}
              valueStyle={{ color: overdueRows.length > 0 ? token.colorError : undefined }}
            />
          </Card>
        </Col>
      </Row>

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space>
          <Select
            placeholder={t('accountingPages.debtFilterStatus')}
            allowClear
            style={{ width: 200 }}
            value={statusFilter}
            onChange={setStatusFilter}
            options={[
              { value: 'overdue', label: t('accountingPages.debtFilterOverdue') },
            ]}
          />
        </Space>
      </Card>

      <Card>
        {filtered.length === 0 ? (
          <Empty description={t('accountingPages.debtEmpty')} />
        ) : (
          <Table<DebtRow>
            dataSource={filtered}
            loading={customersLoading}
            rowKey={(r) => r.customer.id}
            size="small"
            pagination={{ pageSize: 20, size: 'small' }}
            columns={[
              {
                title: t('accountingPages.debtColCustomer'),
                key: 'customer',
                render: (_, r) => r.customer.name,
              },
              {
                title: t('accountingPages.debtColType'),
                key: 'type',
                render: (_, r) => (
                  <Tag color={r.customer.type === 'company' ? 'blue' : 'purple'}>
                    {r.customer.type === 'company'
                      ? t('accountingPages.debtTypeCompany')
                      : t('accountingPages.debtTypePerson')}
                  </Tag>
                ),
                width: 90,
              },
              {
                title: t('accountingPages.debtColTrips'),
                key: 'trips',
                render: (_, r) => r.tripCount,
                align: 'center',
                width: 90,
              },
              {
                title: t('accountingPages.debtColTotal'),
                key: 'debt',
                align: 'right',
                render: (_, r) => formatMoney(r.totalRevenue),
              },
              {
                title: t('accountingPages.debtColOverdue'),
                key: 'overdue',
                align: 'center',
                render: (_, r) =>
                  r.overdueTrips > 0 ? (
                    <Tag color="red">
                      <WarningOutlined /> {t('accountingPages.debtOverdueTag', { count: r.overdueTrips })}
                    </Tag>
                  ) : (
                    <Tag color="green">{t('accountingPages.debtOnTimeTag')}</Tag>
                  ),
              },
              {
                title: t('accountingPages.debtColPhone'),
                key: 'phone',
                render: (_, r) => r.customer.phone ?? '—',
              },
            ]}
          />
        )}
      </Card>
    </div>
  );
}
