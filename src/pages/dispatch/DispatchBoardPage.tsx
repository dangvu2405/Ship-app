import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  DatePicker,
  Empty,
  Row,
  Space,
  Spin,
  Tag,
  theme,
  Tooltip,
  Typography,
} from 'antd';
import type { GlobalToken } from 'antd/es/theme/interface';
import {
  CarOutlined,
  LeftOutlined,
  RightOutlined,
  UserOutlined,
  ToolOutlined,
  CalendarOutlined,
} from '@ant-design/icons';
import { useList, useNavigation } from '@refinedev/core';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import type { Vehicle, Trip } from '@/types';
import { getTripStatusConfig, getTripStatusLabel } from '@/utils/tripStatus';

const { Text } = Typography;

const HOURS = Array.from({ length: 17 }, (_, i) => i + 5); // 05:00 → 21:00

function tripBarBackground(status: string, token: GlobalToken): string {
  const raw = getTripStatusConfig(status).color;
  if (raw.startsWith('#')) return raw;
  const palette: Record<string, string> = {
    blue: token.colorPrimary,
    geekblue: token.colorInfo,
    orange: token.colorWarning,
    gold: token.colorWarning,
    cyan: token.colorInfo,
    lime: token.colorSuccess,
    success: token.colorSuccess,
    error: token.colorError,
    red: token.colorError,
    volcano: token.colorWarning,
  };
  return palette[raw] ?? token.colorFillSecondary;
}

interface TripBarProps {
  trip: Trip;
  token: GlobalToken;
  statusLabel: string;
  onClick: () => void;
}

function TripBar({ trip, token, statusLabel, onClick }: TripBarProps) {
  const bg = tripBarBackground(trip.status ?? '', token);
  return (
    <Tooltip
      title={
        <div>
          <div>
            <strong>{trip.code}</strong>
          </div>
          <div>
            {trip.start_point} → {trip.end_point}
          </div>
          <div>{statusLabel}</div>
        </div>
      }
    >
      <Button
        type="text"
        block
        size="small"
        onClick={onClick}
        style={{
          background: bg,
          color: token.colorTextLightSolid,
          borderRadius: token.borderRadiusSM,
          padding: '2px 6px',
          fontSize: 11,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          marginBottom: 2,
          height: 'auto',
          lineHeight: 1.35,
        }}
      >
        {trip.code} · {trip.start_point}
      </Button>
    </Tooltip>
  );
}

export function DispatchBoardPage() {
  const { t, locale } = useTranslation();
  const { token } = theme.useToken();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const { show } = useNavigation();

  useEffect(() => {
    dayjs.locale(locale === 'vi' ? 'vi' : 'en');
  }, [locale]);

  const dateStr = selectedDate.format('YYYY-MM-DD');

  const { data: vehiclesData, isLoading: vehiclesLoading } = useList<Vehicle>({
    resource: 'vehicles',
    filters: [{ field: 'status', operator: 'eq', value: 'active' }],
    pagination: { pageSize: 50 },
  });

  const { data: tripsDataRaw, isLoading: tripsLoading } = useList<Trip>({
    resource: 'trips',
    filters: [
      { field: 'scheduled_date', operator: 'gte', value: dateStr },
      { field: 'scheduled_date', operator: 'lte', value: dateStr },
    ],
    pagination: { pageSize: 100 },
  });

  const { data: unassignedTripsData } = useList<Trip>({
    resource: 'trips',
    filters: [{ field: 'status', operator: 'eq', value: 'pending' }],
    pagination: { pageSize: 50 },
    sorters: [{ field: 'scheduled_date', order: 'asc' }],
  });

  const vehicles = vehiclesData?.data ?? [];

  const dayTrips = useMemo(() => {
    const rows = tripsDataRaw?.data ?? [];
    return rows.filter((trip) => trip.status !== 'cancelled');
  }, [tripsDataRaw?.data]);

  const unassigned = useMemo(() => {
    const rows = unassignedTripsData?.data ?? [];
    return rows.filter((trip) => !trip.vehicle_id);
  }, [unassignedTripsData?.data]);

  const tripsByVehicle = useMemo(() => {
    const map = new Map<number, Trip[]>();
    for (const trip of dayTrips) {
      if (!trip.vehicle_id) continue;
      if (!map.has(trip.vehicle_id)) map.set(trip.vehicle_id, []);
      map.get(trip.vehicle_id)!.push(trip);
    }
    return map;
  }, [dayTrips]);

  const isLoading = vehiclesLoading || tripsLoading;

  const goDay = (delta: number): void => {
    setSelectedDate((d) => d.add(delta, 'day'));
  };

  const headerCellStyle = (extra?: CSSProperties): CSSProperties => ({
    flex: 1,
    minWidth: 52,
    padding: '8px 4px',
    textAlign: 'center',
    fontSize: 11,
    color: token.colorTextSecondary,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillAlter,
    ...extra,
  });

  return (
    <div>
      <PageHeader
        title={t('dispatchBoard.title')}
        breadcrumb={[{ label: t('dispatchBoard.breadcrumb') }]}
        actions={
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => goDay(-1)} />
            <DatePicker
              value={selectedDate}
              onChange={(d) => d && setSelectedDate(d)}
              format="DD/MM/YYYY"
              allowClear={false}
            />
            <Button onClick={() => setSelectedDate(dayjs())}>{t('dispatchBoard.today')}</Button>
            <Button icon={<RightOutlined />} onClick={() => goDay(1)} />
          </Space>
        }
      />

      <Row gutter={16}>
        <Col xs={24} lg={17}>
          <Card
            title={
              <Space>
                <CalendarOutlined />
                <Text strong>{selectedDate.format('dddd, DD/MM/YYYY')}</Text>
                {isLoading && <Spin size="small" />}
              </Space>
            }
            styles={{ body: { padding: 0, overflowX: 'auto' } }}
          >
            <div style={{ display: 'flex', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
              <div
                style={{
                  width: 160,
                  minWidth: 160,
                  padding: '8px 12px',
                  fontWeight: 600,
                  fontSize: 12,
                  borderRight: `1px solid ${token.colorBorderSecondary}`,
                  background: token.colorFillAlter,
                }}
              >
                {t('dispatchBoard.vehicleColumn')}
              </div>
              {HOURS.map((h) => (
                <div key={h} style={headerCellStyle()}>
                  {String(h).padStart(2, '0')}:00
                </div>
              ))}
            </div>

            {vehicles.length === 0 && !isLoading && (
              <Empty description={t('dispatchBoard.noActiveVehicles')} style={{ padding: 40 }} />
            )}
            {vehicles.map((vehicle) => {
              const vehicleTrips = tripsByVehicle.get(vehicle.id) ?? [];
              const statusHighlight =
                vehicle.status === 'maintenance'
                  ? token.colorWarningBg
                  : vehicle.status === 'broken'
                    ? token.colorErrorBg
                    : undefined;

              return (
                <div
                  key={vehicle.id}
                  style={{
                    display: 'flex',
                    borderBottom: `1px solid ${token.colorSplit}`,
                    minHeight: 56,
                  }}
                >
                  <div
                    style={{
                      width: 160,
                      minWidth: 160,
                      padding: '6px 12px',
                      borderRight: `1px solid ${token.colorBorderSecondary}`,
                      background: statusHighlight,
                    }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12 }}>
                      <CarOutlined style={{ marginRight: 4 }} />
                      {vehicle.plate_number}
                    </div>
                    <div style={{ fontSize: 11, color: token.colorTextSecondary }}>
                      <UserOutlined style={{ marginRight: 2 }} />
                      {vehicle.type}
                    </div>
                    {vehicle.status === 'maintenance' && (
                      <Tag color="orange" style={{ fontSize: 10, marginTop: 2 }}>
                        <ToolOutlined /> {t('dispatchBoard.inMaintenance')}
                      </Tag>
                    )}
                  </div>

                  {vehicle.status === 'maintenance' || vehicle.status === 'broken' ? (
                    <div
                      style={{
                        flex: 1,
                        background: token.colorWarningBg,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 12px',
                        color: token.colorWarning,
                        fontSize: 12,
                      }}
                    >
                      <ToolOutlined style={{ marginRight: 6 }} />
                      {vehicle.status === 'maintenance'
                        ? t('dispatchBoard.inMaintenance')
                        : t('dispatchBoard.brokenVehicle')}
                    </div>
                  ) : (
                    <div style={{ flex: 1, padding: '4px 6px', position: 'relative' }}>
                      {vehicleTrips.length === 0 ? (
                        <Text type="secondary" style={{ fontSize: 11, lineHeight: '48px' }}>
                          {t('dispatchBoard.idle')}
                        </Text>
                      ) : (
                        vehicleTrips.map((trip) => (
                          <TripBar
                            key={trip.id}
                            trip={trip}
                            token={token}
                            statusLabel={t('dispatchBoard.tripStatus', {
                              status: getTripStatusLabel(trip.status ?? '', t),
                            })}
                            onClick={() => show('trips', trip.id)}
                          />
                        ))
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </Card>
        </Col>

        <Col xs={24} lg={7}>
          <Card
            title={
              <Space>
                <Text strong>{t('dispatchBoard.poolTitle', { count: unassigned.length })}</Text>
              </Space>
            }
            size="small"
          >
            {unassigned.length === 0 ? (
              <Empty description={t('dispatchBoard.poolEmpty')} image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={4}>
                {unassigned.map((trip) => (
                  <Card
                    key={trip.id}
                    size="small"
                    hoverable
                    onClick={() => show('trips', trip.id)}
                    styles={{ body: { cursor: 'pointer' } }}
                  >
                    <div style={{ fontWeight: 600, fontSize: 12 }}>{trip.code}</div>
                    <div style={{ fontSize: 11, color: token.colorTextSecondary, marginTop: 2 }}>
                      {trip.start_point} → {trip.end_point}
                    </div>
                    <div style={{ marginTop: 4 }}>
                      <Button
                        type="primary"
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          show('trips', trip.id);
                        }}
                      >
                        {t('dispatchBoard.assign')}
                      </Button>
                    </div>
                  </Card>
                ))}
              </Space>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
