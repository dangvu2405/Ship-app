import { useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Flex,
  Progress,
  Row,
  Select,
  Skeleton,
  Space,
  Table,
  Tag,
  Typography,
  theme,
} from 'antd';
import { useList } from '@refinedev/core';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import type { ColumnsType } from 'antd/es/table';
import {
  AppstoreOutlined,
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  DollarCircleOutlined,
  FileTextOutlined,
  ReloadOutlined,
  RightOutlined,
  TruckOutlined,
} from '@ant-design/icons';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { useDashboardTodayKpis } from '@/hooks/useDashboardTodayKpis';
import { useDispatchDailySummary } from '@/hooks/useDispatchDailySummary';
import { useNotifications } from '@/hooks/useNotifications';
import { useTopDrivers } from '@/hooks/useTopDrivers';
import { ExpirationAlerts } from '@/pages/dashboard/components/ExpirationAlerts';
import { DashboardRevenueByOffice } from '@/pages/dashboard/components/DashboardRevenueByOffice';
import { ChartAreaInteractive } from '@/pages/dashboard/components/ChartAreaInteractive';
import { formatMoney } from '@/utils/displayFormat';
import type { Company, Office, Trip, Vehicle } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { ROUTES } from '@/routes';
import { getTripConventionDisplay } from '@/utils/tripStatus';
import { useAuthStore } from '@/stores/auth.store';

const { Text, Title } = Typography;

// ─── KPI Card ────────────────────────────────────────────────────────────────

interface KpiCardProps {
  title: string;
  value: number;
  loading?: boolean;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  formatter?: (v: number) => string;
  description?: string;
}

function KpiCard({ title, value, loading, icon, iconBg, iconColor, formatter, description }: KpiCardProps) {
  const { token } = theme.useToken();
  return (
    <Card
      style={{
        borderRadius: token.borderRadiusLG,
        border: `1px solid ${token.colorBorderSecondary}`,
        height: '100%',
      }}
      styles={{ body: { padding: '20px 24px' } }}
    >
      <Flex align="flex-start" gap={16}>
        <Avatar
          size={52}
          style={{ background: iconBg, color: iconColor, flexShrink: 0, borderRadius: token.borderRadiusLG }}
          icon={icon}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 6 }}>
            {title}
          </Text>
          {loading ? (
            <Skeleton active title={{ width: 100, style: { margin: 0, height: 28 } }} paragraph={false} />
          ) : (
            <Title level={3} style={{ margin: 0, lineHeight: 1.15 }}>
              {formatter ? formatter(value) : value.toLocaleString('vi-VN')}
            </Title>
          )}
          {description && (
            <Text type="secondary" style={{ fontSize: 12, marginTop: 4, display: 'block' }}>
              {description}
            </Text>
          )}
        </div>
      </Flex>
    </Card>
  );
}

// ─── Vehicle chip ─────────────────────────────────────────────────────────────

function VehicleChip({ vehicle }: { vehicle: Vehicle }) {
  const { token } = theme.useToken();
  return (
    <Flex
      align="center"
      gap={10}
      style={{
        padding: '8px 12px',
        borderRadius: token.borderRadius,
        background: token.colorFillAlter,
        border: `1px solid ${token.colorBorderSecondary}`,
      }}
    >
      <Avatar size={28} icon={<CarOutlined />} style={{ background: '#e6f4ff', color: '#1677ff', flexShrink: 0 }} />
      <Text style={{ flex: 1, fontSize: 13 }}>{vehicle.plate_number}</Text>
      <Tag color="success" style={{ margin: 0, fontSize: 11 }}>
        Hoạt động
      </Tag>
    </Flex>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { token } = theme.useToken();
  const { user } = useAuthStore();

  const [companyId, setCompanyId] = useState<number | undefined>(undefined);
  const [selectedDate, setSelectedDate] = useState(dayjs());

  const period = useMemo(
    () => ({ month: selectedDate.month() + 1, year: selectedDate.year() }),
    [selectedDate],
  );

  const { data: companiesData } = useList<Company>({
    resource: 'companies',
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    sorters: [{ field: 'name', order: 'asc' }],
  });
  const companies = useMemo(() => companiesData?.data ?? [], [companiesData]);
  const effectiveCompanyId = companyId ?? companies[0]?.id;

  const { data: officesData } = useList<Office>({
    resource: 'offices',
    pagination: { current: 1, pageSize: 100 },
  });
  const offices = useMemo(() => officesData?.data ?? [], [officesData]);

  const { stats, statsLoading, statsError, refetchStats } = useDashboardStats({
    enablePolling: true,
    pollingInterval: 60_000,
    companyId: effectiveCompanyId,
  });
  const todayKpis = useDashboardTodayKpis(effectiveCompanyId);
  const today = dayjs().format('YYYY-MM-DD');
  const { data: dailySummary } = useDispatchDailySummary(today);
  const { unreadCount } = useNotifications({ enablePolling: true, pollingInterval: 60_000, fetchList: false });
  const { rows: topDrivers, loading: topDriversLoading } = useTopDrivers({
    companyId: effectiveCompanyId,
    month: period.month,
    year: period.year,
    limit: 5,
  });

  const { data: recentTripsData, isLoading: recentTripsLoading } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 8 },
    sorters: [{ field: 'created_at', order: 'desc' }],
    filters:
      effectiveCompanyId != null
        ? [{ field: 'company_id', operator: 'eq', value: effectiveCompanyId }]
        : [],
  });

  const { data: activeVehiclesData, isLoading: activeVehiclesLoading } = useList<Vehicle>({
    resource: 'vehicles',
    pagination: { current: 1, pageSize: 6 },
    sorters: [{ field: 'updated_at', order: 'desc' }],
    filters: [
      { field: 'status', operator: 'eq', value: 'active' },
      ...(effectiveCompanyId != null
        ? [{ field: 'company_id', operator: 'eq' as const, value: effectiveCompanyId }]
        : []),
    ],
  });

  const { data: unassignedTripsData } = useList<Trip>({
    resource: 'trips',
    pagination: { current: 1, pageSize: 1 },
    filters: [
      { field: 'status', operator: 'eq', value: 'pending' },
      ...(effectiveCompanyId != null
        ? [{ field: 'company_id', operator: 'eq' as const, value: effectiveCompanyId }]
        : []),
    ],
  });

  const unassignedCount = dailySummary?.unassigned ?? unassignedTripsData?.total ?? 0;
  const activeVehicles = activeVehiclesData?.data ?? [];
  const recentTrips = recentTripsData?.data ?? [];
  const maxTopDriverRevenue = topDrivers.reduce((max, d) => Math.max(max, d.revenue), 0);
  const sectionCardStyle = {
    borderRadius: token.borderRadiusLG,
    border: `1px solid ${token.colorBorderSecondary}`,
    height: '100%',
  } as const;

  const completionRate = useMemo(() => {
    const total = stats?.trips?.total ?? 0;
    const completed = stats?.trips?.completed ?? 0;
    return total > 0 ? Math.round((completed / total) * 100) : 0;
  }, [stats]);

  const recentTripColumns = useMemo<ColumnsType<Trip>>(
    () => [
      {
        title: t('trips.code'),
        dataIndex: 'code',
        key: 'code',
        width: 120,
        render: (v: string) => <Text strong style={{ fontSize: 13 }}>{v}</Text>,
      },
      {
        title: t('customers.title'),
        dataIndex: ['customer', 'name'],
        key: 'customer',
        ellipsis: true,
        render: (v: string) => <Text>{v ?? '—'}</Text>,
      },
      {
        title: t('trips.route'),
        key: 'route',
        ellipsis: true,
        render: (_: unknown, row: Trip) => (
          <Text type="secondary" style={{ fontSize: 12 }}>
            {row.start_point} → {row.end_point}
          </Text>
        ),
      },
      {
        title: t('common.status'),
        dataIndex: 'status',
        key: 'status',
        width: 120,
        render: (value: string) => {
          const { label, color, style } = getTripConventionDisplay(value, t);
          return (
            <Tag color={color} style={{ ...style, fontSize: 11 }}>
              {label}
            </Tag>
          );
        },
      },
    ],
    [t],
  );

  return (
    <div style={{ padding: '0 0 24px' }}>
      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <div
        style={{
          background: `linear-gradient(135deg, ${token.colorPrimary} 0%, #0958d9 100%)`,
          borderRadius: `0 0 ${token.borderRadiusLG}px ${token.borderRadiusLG}px`,
          padding: '24px 28px 32px',
          marginBottom: -16,
        }}
      >
        <Flex justify="space-between" align="flex-start" wrap="wrap" gap={16}>
          <div>
            <Title level={3} style={{ margin: 0, color: '#fff' }}>
              {t('dashboard.title')}
            </Title>
            <Text style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, marginTop: 4, display: 'block' }}>
              {t('dashboard.welcome')}, <strong style={{ color: '#fff' }}>{user?.username ?? 'User'}</strong>
              {' · '}{dayjs().format('dddd, DD/MM/YYYY')}
            </Text>
          </div>
          <Space wrap>
            <Select
              value={effectiveCompanyId}
              onChange={setCompanyId}
              options={companies.map((c) => ({ label: c.name, value: c.id }))}
              placeholder={t('dashboard.filterByCompany')}
              style={{ minWidth: 200, background: 'rgba(255,255,255,0.15)' }}
              allowClear
            />
            <DatePicker
              value={selectedDate}
              onChange={(v) => setSelectedDate(v ?? dayjs())}
              picker="month"
              format="MM/YYYY"
              allowClear={false}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void refetchStats()}
              style={{ background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.3)', color: '#fff' }}
            >
              {t('common.refresh')}
            </Button>
          </Space>
        </Flex>
      </div>

      <div style={{ padding: '0 24px' }}>
        {statsError && (
          <Alert
            type="error"
            showIcon
            message={t('common.loadError')}
            description={String(statsError)}
            style={{ marginBottom: 16, marginTop: 24 }}
          />
        )}

        {/* ── KPI strip ───────────────────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginTop: 24 }}>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title={t('dashboard.todayNewOrders')}
              value={todayKpis.newCount}
              loading={todayKpis.loading}
              icon={<FileTextOutlined />}
              iconBg="#e6f4ff"
              iconColor="#1677ff"
              description="Đơn mới trong ngày"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title={t('dashboard.todayInProgress')}
              value={todayKpis.runningCount}
              loading={todayKpis.loading}
              icon={<TruckOutlined />}
              iconBg="#fff7e6"
              iconColor="#fa8c16"
              description="Chuyến đang vận chuyển"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title={t('dashboard.todayCompleted')}
              value={todayKpis.completedCount}
              loading={todayKpis.loading}
              icon={<CheckCircleOutlined />}
              iconBg="#f6ffed"
              iconColor="#52c41a"
              description="Chuyến hoàn thành hôm nay"
            />
          </Col>
          <Col xs={24} sm={12} xl={6}>
            <KpiCard
              title={t('dashboard.todayRevenue')}
              value={todayKpis.revenueToday}
              loading={todayKpis.loading}
              icon={<DollarCircleOutlined />}
              iconBg="#fff0f6"
              iconColor="#eb2f96"
              formatter={(v) => formatMoney(v, { withCurrency: true })}
              description="Doanh thu trong ngày"
            />
          </Col>
        </Row>

        {/* ── Alerts + Recent trips ──────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card style={sectionCardStyle} styles={{ body: { padding: 0 } }}>
              <div style={{ padding: '16px 20px 0' }}>
                <Flex align="center" gap={8} justify="space-between">
                  <Flex align="center" gap={8}>
                    <ClockCircleOutlined style={{ color: '#faad14', fontSize: 16 }} />
                    <Text strong style={{ fontSize: 15 }}>
                      {t('dashboard.alertsTitle')}
                    </Text>
                  </Flex>
                  <Button
                    type="link"
                    size="small"
                    icon={<RightOutlined />}
                    onClick={() => navigate(ROUTES.admin.dispatch.board)}
                    style={{ padding: 0 }}
                  >
                    Điều phối
                  </Button>
                </Flex>
              </div>
              <div style={{ padding: '12px 20px 20px' }}>
                <ExpirationAlerts />
              </div>
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <TruckOutlined style={{ color: token.colorPrimary }} />
                  <span>{t('dashboard.recentTrips')}</span>
                </Flex>
              }
              extra={
                <Button
                  type="link"
                  size="small"
                  icon={<RightOutlined />}
                  onClick={() => navigate(ROUTES.admin.trips.list)}
                  style={{ padding: 0 }}
                >
                  Xem tất cả
                </Button>
              }
              style={sectionCardStyle}
              styles={{ body: { padding: 0 } }}
            >
              <Table<Trip>
                rowKey="id"
                columns={recentTripColumns}
                dataSource={recentTrips}
                loading={recentTripsLoading}
                pagination={false}
                size="small"
                scroll={{ x: 560 }}
                onRow={(record) => ({
                  style: { cursor: 'pointer' },
                  onClick: () => navigate(ROUTES.admin.trips.showById(record.id)),
                })}
                locale={{ emptyText: t('common.noData') }}
              />
            </Card>
          </Col>
        </Row>

        {/* ── Chart + Stats ─────────────────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} xl={16}>
            <ChartAreaInteractive
              companyId={effectiveCompanyId}
              companies={companies}
              offices={offices}
            />
          </Col>
          <Col xs={24} xl={8}>
            <Card
              style={sectionCardStyle}
              styles={{ body: { padding: '20px 24px', height: '100%' } }}
              loading={statsLoading}
            >
              <Flex vertical gap={0} style={{ height: '100%' }}>
                <Flex align="center" gap={8} style={{ marginBottom: 20 }}>
                  <AppstoreOutlined style={{ color: token.colorPrimary }} />
                  <Text strong style={{ fontSize: 15 }}>
                    Tháng {period.month}/{period.year}
                  </Text>
                </Flex>

                <Flex vertical gap={20} style={{ flex: 1 }}>
                  <div>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                      <Text type="secondary" style={{ fontSize: 12 }}>Tổng chuyến</Text>
                      <Text strong style={{ fontSize: 22 }}>{(stats?.trips?.total ?? 0).toLocaleString('vi-VN')}</Text>
                    </Flex>
                  </div>

                  <div>
                    <Flex justify="space-between" align="center" style={{ marginBottom: 8 }}>
                      <Flex align="center" gap={6}>
                        <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 14 }} />
                        <Text type="secondary" style={{ fontSize: 12 }}>Hoàn thành</Text>
                      </Flex>
                      <Text strong>{(stats?.trips?.completed ?? 0).toLocaleString('vi-VN')}</Text>
                    </Flex>
                    <Progress
                      percent={completionRate}
                      size="small"
                      strokeColor="#52c41a"
                      trailColor={token.colorFillAlter}
                      format={(p) => <Text style={{ fontSize: 11 }}>{p}%</Text>}
                    />
                  </div>

                  <div>
                    <Flex align="center" gap={6} style={{ marginBottom: 6 }}>
                      <DollarCircleOutlined style={{ color: '#faad14', fontSize: 14 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>Doanh thu tháng</Text>
                    </Flex>
                    <Text strong style={{ fontSize: 18 }}>
                      {formatMoney(stats?.revenue?.total ?? 0, { withCurrency: true })}
                    </Text>
                  </div>

                  {unassignedCount > 0 && (
                    <Alert
                      type="warning"
                      showIcon
                      message={`${unassignedCount} chuyến chờ phân công`}
                      action={
                        <Button
                          size="small"
                          type="link"
                          icon={<RightOutlined />}
                          onClick={() => navigate(ROUTES.admin.dispatch.board)}
                          style={{ padding: 0 }}
                        >
                          Phân công
                        </Button>
                      }
                    />
                  )}

                  <div style={{ marginTop: 'auto' }}>
                    <Flex align="center" gap={6} style={{ marginBottom: 10 }}>
                      <CarOutlined style={{ color: token.colorPrimary, fontSize: 14 }} />
                      <Text type="secondary" style={{ fontSize: 12 }}>Xe đang hoạt động ({activeVehicles.length})</Text>
                    </Flex>
                    {activeVehiclesLoading ? (
                      <Skeleton active paragraph={{ rows: 3, width: '100%' }} title={false} />
                    ) : activeVehicles.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
                    ) : (
                      <Flex vertical gap={6}>
                        {activeVehicles.slice(0, 4).map((v) => (
                          <VehicleChip key={v.id} vehicle={v} />
                        ))}
                        {activeVehicles.length > 4 && (
                          <Button
                            type="link"
                            size="small"
                            style={{ padding: 0, height: 'auto', textAlign: 'left' }}
                            onClick={() => navigate(ROUTES.admin.vehicles.list)}
                          >
                            Xem thêm {activeVehicles.length - 4} xe khác
                          </Button>
                        )}
                      </Flex>
                    )}
                  </div>
                </Flex>
              </Flex>
            </Card>
          </Col>
        </Row>

        {/* ── Top drivers + Daily summary ─────────────────────────────────── */}
        <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <TruckOutlined style={{ color: token.colorPrimary }} />
                  <span>Top tài xế tháng {period.month}/{period.year}</span>
                </Flex>
              }
              style={{
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
                height: '100%',
              }}
              styles={{ body: { padding: 16 } }}
              loading={topDriversLoading}
            >
              {topDrivers.length === 0 ? (
                <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
              ) : (
                <Flex vertical gap={12}>
                  {topDrivers.map((row, idx) => (
                    <div key={row.driverId}>
                      <Flex justify="space-between" align="center" style={{ marginBottom: 6 }}>
                        <Flex align="center" gap={10}>
                          <Avatar
                            size={28}
                            style={{
                              background: idx === 0 ? '#fff7e6' : token.colorFillAlter,
                              color: idx === 0 ? '#fa8c16' : token.colorTextSecondary,
                              fontWeight: 600,
                            }}
                          >
                            {idx + 1}
                          </Avatar>
                          <div>
                            <Text strong style={{ fontSize: 13 }}>{row.driverName}</Text>
                            <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                              {row.trips} chuyến
                            </Text>
                          </div>
                        </Flex>
                        <Text strong style={{ color: token.colorPrimary }}>
                          {formatMoney(row.revenue, { withCurrency: true })}
                        </Text>
                      </Flex>
                      <Progress
                        percent={maxTopDriverRevenue > 0 ? Math.round((row.revenue / maxTopDriverRevenue) * 100) : 0}
                        size="small"
                        showInfo={false}
                        strokeColor={token.colorPrimary}
                      />
                    </div>
                  ))}
                </Flex>
              )}
            </Card>
          </Col>
          <Col xs={24} lg={12}>
            <Card
              title={
                <Flex align="center" gap={8}>
                  <AppstoreOutlined style={{ color: token.colorPrimary }} />
                  <span>Tổng quan hôm nay</span>
                </Flex>
              }
              style={{
                borderRadius: token.borderRadiusLG,
                border: `1px solid ${token.colorBorderSecondary}`,
                height: '100%',
              }}
              styles={{ body: { padding: 16 } }}
            >
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Card size="small" styles={{ body: { padding: 12 } }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Chưa phân công</Text>
                    <Title level={4} style={{ margin: '4px 0 0' }}>{dailySummary?.unassigned ?? unassignedCount}</Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" styles={{ body: { padding: 12 } }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Đang chạy</Text>
                    <Title level={4} style={{ margin: '4px 0 0' }}>{dailySummary?.in_transit ?? todayKpis.runningCount}</Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" styles={{ body: { padding: 12 } }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Tài xế bận / sẵn sàng</Text>
                    <Title level={4} style={{ margin: '4px 0 0' }}>
                      {dailySummary?.busy_drivers ?? '—'} / {dailySummary?.available_drivers ?? '—'}
                    </Title>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card size="small" styles={{ body: { padding: 12 } }}>
                    <Text type="secondary" style={{ fontSize: 12 }}>Xe bận / sẵn sàng</Text>
                    <Title level={4} style={{ margin: '4px 0 0' }}>
                      {dailySummary?.busy_vehicles ?? '—'} / {dailySummary?.available_vehicles ?? '—'}
                    </Title>
                  </Card>
                </Col>
                {unreadCount > 0 && (
                  <Col span={24}>
                    <Alert
                      type="info"
                      showIcon
                      message={`Bạn có ${unreadCount} thông báo chưa đọc`}
                      action={
                        <Button
                          size="small"
                          type="link"
                          onClick={() => navigate(ROUTES.admin.notifications)}
                          style={{ padding: 0 }}
                        >
                          Xem
                        </Button>
                      }
                    />
                  </Col>
                )}
              </Row>
            </Card>
          </Col>
        </Row>

        {/* ── Revenue by office ──────────────────────────────────────────── */}
        <div style={{ marginTop: 16 }}>
          <DashboardRevenueByOffice
            offices={offices}
            companyId={effectiveCompanyId}
            officeId={undefined}
            month={period.month}
            year={period.year}
          />
        </div>

        <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 16, textAlign: 'right' }}>
          {t('dashboard.todayKpiHint', { date: `${period.month}/${period.year}` })}
        </Text>
      </div>
    </div>
  );
}
