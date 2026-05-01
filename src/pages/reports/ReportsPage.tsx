import React, { useMemo, useState } from 'react';
import { App, Button, Card, Col, DatePicker, Row, Space, Table, Tag, Typography, theme } from 'antd';
import {
  CarOutlined,
  DollarOutlined,
  ExportOutlined,
  FileTextOutlined,
  LineChartOutlined,
  UserOutlined,
  WalletOutlined,
} from '@ant-design/icons';
import { useList, useNavigation } from '@refinedev/core';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import type { Trip, Vehicle, Driver } from '@/types';
import { formatMoney } from '@/utils/displayFormat';
import { ROUTES } from '@/routes';
import { useTranslation } from '@/hooks/useTranslation';
import { getTripStatusLabel, getTripStatusTagColor } from '@/utils/tripStatus';

const { Text } = Typography;

interface StatItem {
  label: string;
  value: number | string;
  suffix?: string;
  format?: 'money';
  color?: string;
}

export function ReportsPage() {
  const { t } = useTranslation();
  const { token } = theme.useToken();
  const { message } = App.useApp();
  const [period, setPeriod] = useState<dayjs.Dayjs>(dayjs());
  const { push } = useNavigation();

  const startOfMonth = period.startOf('month').format('YYYY-MM-DD');
  const endOfMonth = period.endOf('month').format('YYYY-MM-DD');

  const { data: tripsData, isLoading: tripsLoading } = useList<Trip>({
    resource: 'trips',
    filters: [
      { field: 'created_at', operator: 'gte', value: startOfMonth },
      { field: 'created_at', operator: 'lte', value: endOfMonth },
    ],
    pagination: { pageSize: 200 },
  });

  const { data: vehiclesData } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { pageSize: 50 },
  });

  const { data: driversData } = useList<Driver>({
    resource: 'drivers',
    pagination: { pageSize: 50 },
  });

  const trips = tripsData?.data ?? [];
  const vehicles = vehiclesData?.data ?? [];
  const drivers = driversData?.data ?? [];

  const totalTrips = trips.length;
  const completedTrips = trips.filter((trip) => trip.status === 'completed').length;
  const cancelledTrips = trips.filter((trip) => trip.status === 'cancelled').length;
  const completionRate = totalTrips ? Math.round((completedTrips / totalTrips) * 100) : 0;

  const totalRevenue = trips
    .filter((trip) => trip.status === 'completed')
    .reduce((s, trip) => s + (trip.price ?? 0), 0);

  const avgTripsPerDriver = drivers.length ? (totalTrips / drivers.length).toFixed(1) : '0';

  const activeVehicles = vehicles.filter((v) => v.status === 'active').length;
  const vehicleUtilRate = vehicles.length
    ? Math.round((activeVehicles / vehicles.length) * 100)
    : 0;

  const summaryCards = useMemo(
    (): Array<{ icon: React.ReactNode; title: string; stats: StatItem[]; link?: string }> => [
      {
        icon: <FileTextOutlined style={{ fontSize: 24, color: token.colorPrimary }} />,
        title: t('reports.cardOrders'),
        stats: [
          { label: t('reports.cardOrdersTotal'), value: totalTrips, suffix: t('reports.ordersUnit') },
          { label: t('reports.cardOrdersCompleted'), value: completedTrips, suffix: t('reports.ordersUnit'), color: token.colorSuccess },
          { label: t('reports.cardOrdersCancelled'), value: cancelledTrips, suffix: t('reports.ordersUnit'), color: cancelledTrips > 0 ? token.colorError : undefined },
          { label: t('reports.cardCompletionRate'), value: completionRate, suffix: '%', color: token.colorSuccess },
        ],
        link: ROUTES.admin.trips.list,
      },
      {
        icon: <DollarOutlined style={{ fontSize: 24, color: token.colorSuccess }} />,
        title: t('reports.cardRevenue'),
        stats: [
          { label: t('reports.cardRevenueTotal'), value: totalRevenue, format: 'money' },
          {
            label: t('reports.cardRevenuePerTrip'),
            value: completedTrips ? Math.round(totalRevenue / completedTrips) : 0,
            format: 'money',
          },
        ],
        link: ROUTES.admin.accounting.revenue,
      },
      {
        icon: <CarOutlined style={{ fontSize: 24, color: token.colorWarning }} />,
        title: t('reports.cardFleet'),
        stats: [
          { label: t('reports.cardFleetTotal'), value: vehicles.length, suffix: '' },
          { label: t('reports.cardFleetActive'), value: activeVehicles, suffix: '', color: token.colorSuccess },
          { label: t('reports.cardFleetUtil'), value: vehicleUtilRate, suffix: '%' },
        ],
        link: ROUTES.admin.vehicles.list,
      },
      {
        icon: <UserOutlined style={{ fontSize: 24, color: token.colorInfo }} />,
        title: t('reports.cardDrivers'),
        stats: [
          { label: t('reports.cardDriversTotal'), value: drivers.length, suffix: t('reports.peopleUnit') },
          { label: t('reports.cardDriversAvgTrips'), value: avgTripsPerDriver, suffix: t('reports.ordersUnit') },
        ],
        link: ROUTES.admin.drivers.list,
      },
      {
        icon: <WalletOutlined style={{ fontSize: 24, color: token.colorError }} />,
        title: t('reports.cardDebt'),
        stats: [{ label: t('reports.cardDebtHint'), value: '—' }],
        link: ROUTES.admin.accounting.debt,
      },
    ],
    [
      t,
      token.colorPrimary,
      token.colorSuccess,
      token.colorWarning,
      token.colorInfo,
      token.colorError,
      totalTrips,
      completedTrips,
      cancelledTrips,
      completionRate,
      totalRevenue,
      avgTripsPerDriver,
      vehicles.length,
      activeVehicles,
      vehicleUtilRate,
      drivers.length,
    ],
  );

  const onExportSoon = (): void => {
    message.info(t('reports.comingSoon'));
  };

  return (
    <div>
      <PageHeader
        title={t('reports.analyticsTitle')}
        breadcrumb={[{ label: t('reports.analyticsBreadcrumb') }]}
        actions={
          <Space>
            <DatePicker.MonthPicker
              value={period}
              onChange={(v) => v && setPeriod(v)}
              format="MM/YYYY"
              placeholder={t('reports.periodPlaceholder')}
            />
            <Button icon={<ExportOutlined />} onClick={onExportSoon}>
              {t('reports.exportExcel')}
            </Button>
            <Button icon={<ExportOutlined />} onClick={onExportSoon}>
              {t('reports.exportPdf')}
            </Button>
          </Space>
        }
      />

      <Row gutter={[16, 16]}>
        {summaryCards.map((card, idx) => (
          <Col xs={24} sm={12} xl={8} key={`${card.title}-${idx}`}>
            <Card
              hoverable
              onClick={() => card.link && push(card.link)}
              style={{ cursor: card.link ? 'pointer' : 'default' }}
            >
              <Space align="start" size="middle">
                {card.icon}
                <div>
                  <Text strong style={{ fontSize: 15 }}>{card.title}</Text>
                  <div style={{ marginTop: 8 }}>
                    {card.stats.map((s) => (
                      <div key={s.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 24, minWidth: 180 }}>
                        <Text type="secondary" style={{ fontSize: 12 }}>{s.label}</Text>
                        <Text strong style={{ color: s.color, fontSize: 13 }}>
                          {s.format === 'money'
                            ? formatMoney(Number(s.value))
                            : `${s.value}${s.suffix ? ` ${s.suffix}` : ''}`}
                        </Text>
                      </div>
                    ))}
                  </div>
                  {card.link && (
                    <div style={{ marginTop: 8 }}>
                      <Text type="secondary" style={{ fontSize: 11 }}>{t('reports.viewDetail')} →</Text>
                    </div>
                  )}
                </div>
              </Space>
            </Card>
          </Col>
        ))}
      </Row>

      <Card title={<><LineChartOutlined /> {t('reports.tripsInPeriod')}</>} style={{ marginTop: 16 }}>
        <Table<Trip>
          dataSource={trips.slice(0, 10)}
          loading={tripsLoading}
          rowKey="id"
          size="small"
          pagination={false}
          locale={{ emptyText: t('common.noData') }}
          columns={[
            { title: t('trips.code'), dataIndex: 'code', key: 'code', width: 130 },
            {
              title: t('customers.name'),
              key: 'customer',
              render: (_, r) => (r.customer as { name?: string })?.name ?? `KH #${r.customer_id}`,
            },
            { title: t('dashboard.operations.route'), key: 'route', render: (_, r) => `${r.start_point} → ${r.end_point}`, ellipsis: true },
            {
              title: t('trips.price'),
              dataIndex: 'price',
              key: 'price',
              align: 'right',
              render: (v: number) => formatMoney(v),
            },
            {
              title: t('common.status'),
              dataIndex: 'status',
              key: 'status',
              render: (v: string) => (
                <Tag color={getTripStatusTagColor(v)}>{getTripStatusLabel(v, t)}</Tag>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
}
