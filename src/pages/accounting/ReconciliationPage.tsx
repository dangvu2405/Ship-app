import { useState } from 'react';
import { Button, Card, Col, DatePicker, Empty, InputNumber, Row, Select, Space, Statistic, Table, Tag, theme, Tooltip, Typography } from 'antd';
import { CheckOutlined, PlusOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Trip } from '@/types';
import { formatDate, formatMoney } from '@/utils/displayFormat';
import { useCustomerList } from '@/hooks/useCustomers';
import { useTripReportList } from '@/hooks/useAccounting';

const { RangePicker } = DatePicker;
const { Text } = Typography;

export function ReconciliationPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(undefined);
  const [dateRange, setDateRange] = useState<[dayjs.Dayjs, dayjs.Dayjs]>([
    dayjs().startOf('month'),
    dayjs().endOf('month'),
  ]);
  const [sessionTrips, setSessionTrips] = useState<Trip[]>([]);
  const [adjustments, setAdjustments] = useState<Record<number, number>>({});
  const [sessionCreated, setSessionCreated] = useState(false);

  const { data: customers } = useCustomerList({ current: 1, pageSize: 100 });
  const { trips, loading: tripsLoading } = useTripReportList({
    pageSize: 100,
    enabled: !!selectedCustomerId,
    filters: [
      { field: 'customer_id', operator: 'eq', value: selectedCustomerId! },
      { field: 'status', operator: 'eq', value: 'completed' },
      { field: 'scheduled_date', operator: 'gte', value: dateRange[0].format('YYYY-MM-DD') },
      { field: 'scheduled_date', operator: 'lte', value: dateRange[1].format('YYYY-MM-DD') },
    ],
  });

  const handleCreateSession = (): void => {
    setSessionTrips(trips);
    setAdjustments({});
    setSessionCreated(true);
  };

  const tripRevenue = (trip: Trip) => trip.total_revenue ?? ((trip.base_price ?? trip.price ?? 0) + (trip.surcharge_amount ?? 0));
  const totalOriginal = sessionTrips.reduce((s, trip) => s + tripRevenue(trip), 0);
  const totalAdjusted = sessionTrips.reduce((s, trip) => s + (adjustments[trip.id] ?? tripRevenue(trip)), 0);
  const totalAdjustment = totalAdjusted - totalOriginal;

  return (
    <div>
      <PageHeader
        title={t('accountingPages.reconciliationTitle')}
        breadcrumb={[
          { label: t('accountingPages.breadcrumbAccounting') },
          { label: t('accountingPages.reconciliationTitle') },
        ]}
      />

      <Card size="small" style={{ marginBottom: token.marginMD }}>
        <Space wrap>
            <Select
            placeholder={t('accountingPages.selectCustomer')}
            style={{ width: 280 }}
            showSearch
            optionFilterProp="label"
              value={selectedCustomerId}
            onChange={setSelectedCustomerId}
              options={customers.map((c) => ({ value: c.id, label: c.name }))}
          />
          <RangePicker
            value={dateRange}
            onChange={(v) => v && setDateRange(v as [dayjs.Dayjs, dayjs.Dayjs])}
            format="DD/MM/YYYY"
          />
          <Button
            type="primary"
            icon={<PlusOutlined />}
            loading={tripsLoading}
            disabled={!selectedCustomerId}
            onClick={handleCreateSession}
          >
            {t('accountingPages.createSession')}
          </Button>
        </Space>
      </Card>

      {!sessionCreated ? (
        <Card>
          <Empty description={t('accountingPages.reconciliationEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
        </Card>
      ) : (
        <>
          <Card
            title={
              <Space>
                <Text strong>
                  {customers.find((c) => c.id === selectedCustomerId)?.name} |{' '}
                  {dateRange[0].format('DD/MM/YYYY')} → {dateRange[1].format('DD/MM/YYYY')}
                </Text>
                <Tag color="orange">{t('accountingPages.reconciliationDraftTag')}</Tag>
              </Space>
            }
            style={{ marginBottom: token.marginMD }}
          >
            <Row gutter={24}>
              <Col>
                <Statistic
                  title={t('accountingPages.reconciliationStatTrips')}
                  value={sessionTrips.length}
                  suffix={t('accountingPages.revenueTripUnit')}
                />
              </Col>
              <Col>
                <Statistic
                  title={t('accountingPages.reconciliationStatOriginal')}
                  value={totalOriginal}
                  formatter={(v) => formatMoney(Number(v))}
                />
              </Col>
              <Col>
                <Statistic
                  title={t('accountingPages.reconciliationStatAdjustment')}
                  value={totalAdjustment}
                  formatter={(v) => formatMoney(Number(v))}
                  valueStyle={{
                    color: totalAdjustment < 0 ? token.colorError : token.colorSuccess,
                  }}
                />
              </Col>
              <Col>
                <Statistic
                  title={t('accountingPages.reconciliationStatFinal')}
                  value={totalAdjusted}
                  formatter={(v) => formatMoney(Number(v))}
                  valueStyle={{ color: token.colorPrimary, fontWeight: 600 }}
                />
              </Col>
            </Row>
          </Card>

          <Card>
            <Table<Trip>
              dataSource={sessionTrips}
              rowKey="id"
              size="small"
              pagination={false}
              columns={[
                { title: t('accountingPages.revenueTableCode'), dataIndex: 'code', key: 'code', width: 130 },
                {
                  title: t('accountingPages.revenueTableDate'),
                  key: 'date',
                  render: (_, r) => {
                    const d = r.scheduled_date ?? r.start_time;
                    return d ? formatDate(d) : '—';
                  },
                  width: 100,
                },
                {
                  title: t('accountingPages.reconciliationRoute'),
                  key: 'route',
                  render: (_, r) => `${r.start_point} → ${r.end_point}`,
                  ellipsis: true,
                },
                {
                  title: t('accountingPages.reconciliationStatOriginal'),
                  key: 'price',
                  align: 'right',
                  render: (_: unknown, r) => formatMoney(tripRevenue(r)),
                  width: 130,
                },
                {
                  title: t('accountingPages.reconciliationAdjustedAmount'),
                  key: 'adjusted',
                  width: 160,
                  render: (_, r) => (
                    <InputNumber
                      size="small"
                      style={{ width: '100%' }}
                      value={adjustments[r.id] ?? tripRevenue(r)}
                      min={0}
                      formatter={(v) => `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}
                      onChange={(v) => {
                        if (v === null) return;
                        setAdjustments((prev) => ({ ...prev, [r.id]: v }));
                      }}
                    />
                  ),
                },
              ]}
              summary={() => (
                <Table.Summary.Row>
                  <Table.Summary.Cell index={0} colSpan={3}>
                    <strong>{t('accountingPages.reconciliationTableTotal')}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={3} align="right">
                    <strong>{formatMoney(totalOriginal)}</strong>
                  </Table.Summary.Cell>
                  <Table.Summary.Cell index={4} align="right">
                    <strong>{formatMoney(totalAdjusted)}</strong>
                  </Table.Summary.Cell>
                </Table.Summary.Row>
              )}
            />
            <div style={{ marginTop: token.marginMD, textAlign: 'right' }}>
              <Space>
                <Tooltip title="Tính năng đang hoàn thiện — backend chưa sẵn sàng">
                  <Button disabled>{t('accountingPages.reconciliationSaveDraft')}</Button>
                </Tooltip>
                <Tooltip title="Tính năng đang hoàn thiện — backend chưa sẵn sàng">
                  <Button type="primary" icon={<CheckOutlined />} disabled>
                    {t('accountingPages.reconciliationConfirm')}
                  </Button>
                </Tooltip>
              </Space>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
