import type { CSSProperties } from 'react';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Avatar,
  Button,
  Card,
  Col,
  DatePicker,
  Divider,
  Empty,
  Flex,
  Row,
  Select,
  Space,
  Spin,
  Tag,
  Tooltip,
  Typography,
  theme,
} from 'antd';
import type { GlobalToken } from 'antd/es/theme/interface';
import {
  CarOutlined,
  ClockCircleOutlined,
  LeftOutlined,
  ReloadOutlined,
  RightOutlined,
  ToolOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { useNavigation } from '@refinedev/core';
import dayjs, { Dayjs } from 'dayjs';
import 'dayjs/locale/en';
import 'dayjs/locale/vi';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useDispatchBoard } from '@/hooks/useDispatchBoard';
import type { Trip } from '@/types';
import type { DispatchTrip, DispatchVehicle } from '@/types/api/dispatch';
import { getTripStatusConfig, getTripStatusLabel } from '@/utils/tripStatus';

const { Text, Paragraph } = Typography;

const START_HOUR = 5;
const END_HOUR = 21;
const HOURS = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, index) => START_HOUR + index);
const HOUR_WIDTH = 72;
const TIMELINE_WIDTH = HOURS.length * HOUR_WIDTH;
const VEHICLE_COLUMN_WIDTH = 196;

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

function getInitials(value?: string): string {
  const parts = (value ?? '').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'D';
  if (parts.length === 1) return parts[0].slice(0, 1).toUpperCase();
  return `${parts[0].slice(0, 1)}${parts[parts.length - 1].slice(0, 1)}`.toUpperCase();
}

function parseHourMinute(value?: string | null): number | null {
  if (!value) return null;
  const matched = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (matched) {
    const hour = Number(matched[1]);
    const minute = Number(matched[2]);
    return Number.isFinite(hour) && Number.isFinite(minute) ? hour + minute / 60 : null;
  }

  const parsed = dayjs(value);
  if (!parsed.isValid()) return null;
  return parsed.hour() + parsed.minute() / 60;
}

function getTripWindow(trip: DispatchTrip, index: number) {
  const fallbackStart = START_HOUR + index * 0.85;
  const start = parseHourMinute(trip.scheduled_time_from) ?? fallbackStart;
  const end = parseHourMinute(trip.scheduled_time_to) ?? start + 1.35;
  const safeStart = Math.max(START_HOUR, Math.min(start, END_HOUR - 0.5));
  const safeEnd = Math.max(safeStart + 0.5, Math.min(end, END_HOUR + 1));
  const left = ((safeStart - START_HOUR) / (END_HOUR - START_HOUR)) * 100;
  const width = Math.max(((safeEnd - safeStart) / (END_HOUR - START_HOUR)) * 100, 7.5);
  return {
    left: Math.min(Math.max(left, 0), 100),
    width: Math.min(width, 100),
  };
}

interface TripBarProps {
  trip: Trip | DispatchTrip;
  token: GlobalToken;
  statusLabel: string;
  onClick: () => void;
  compact?: boolean;
}

function TripBar({ trip, token, statusLabel, onClick, compact = false }: TripBarProps) {
  const bg = tripBarBackground(trip.status ?? '', token);
  return (
    <Tooltip
      title={
        <div style={{ maxWidth: 280 }}>
          <div>
            <strong>
              {trip.code}
              {trip.customer ? ` · ${trip.customer.code ? `${trip.customer.code} — ` : ''}${trip.customer.name}` : ''}
            </strong>
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
        onClick={onClick}
        style={{
          position: 'absolute',
          left: 0,
          top: compact ? 0 : 10,
          width: '100%',
          height: compact ? 32 : 44,
          background: bg,
          color: token.colorTextLightSolid,
          borderRadius: 14,
          border: 'none',
          padding: compact ? '4px 10px' : '6px 12px',
          textAlign: 'left',
          overflow: 'hidden',
          boxShadow: '0 8px 18px rgba(15, 23, 42, 0.16)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
          <Text strong style={{ color: token.colorTextLightSolid, fontSize: 11, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {trip.code}
          </Text>
          <Text style={{ color: token.colorTextLightSolid, fontSize: 10, opacity: 0.9, whiteSpace: 'nowrap' }}>
            {trip.scheduled_time_from ? String(trip.scheduled_time_from).slice(0, 5) : '—'}
          </Text>
        </div>
        <Text style={{ color: token.colorTextLightSolid, fontSize: 10, opacity: 0.92, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {trip.customer ? `${trip.customer.code ? `${trip.customer.code} — ` : ''}${trip.customer.name}` : trip.start_point}
        </Text>
      </Button>
    </Tooltip>
  );
}

function formatVehicleLabel(vehicle: DispatchVehicle): string {
  return vehicle.type || 'Xe';
}

export function DispatchBoardPage() {
  const { t, locale } = useTranslation();
  const { token } = theme.useToken();
  const [selectedDate, setSelectedDate] = useState<Dayjs>(dayjs());
  const [selectedVehicleType, setSelectedVehicleType] = useState<string | undefined>();
  const [selectedTeamId, setSelectedTeamId] = useState<number | undefined>();
  const { show } = useNavigation();

  useEffect(() => {
    dayjs.locale(locale === 'vi' ? 'vi' : 'en');
  }, [locale]);

  const dateStr = selectedDate.format('YYYY-MM-DD');
  const { vehicles, trips, unassigned, loading: boardLoading, error, refetch } = useDispatchBoard(dateStr);

  const activeVehicles = useMemo(() => {
    return (vehicles ?? []).filter((vehicle) => {
      if (selectedVehicleType && vehicle.type !== selectedVehicleType) return false;
      if (selectedTeamId != null && vehicle.office_id !== selectedTeamId) return false;
      return true;
    });
  }, [selectedTeamId, selectedVehicleType, vehicles]);

  const dayTrips = useMemo(() => {
    return (trips ?? []).filter((trip) => trip.status !== 'cancelled');
  }, [trips]);

  const unassignedList = useMemo(() => {
    return (unassigned ?? []).filter((trip) => !trip.vehicle_id);
  }, [unassigned]);

  const tripsByVehicle = useMemo(() => {
    const map = new Map<number, DispatchTrip[]>();
    for (const trip of dayTrips) {
      if (!trip.vehicle_id) continue;
      if (!map.has(trip.vehicle_id)) map.set(trip.vehicle_id, []);
      map.get(trip.vehicle_id)!.push(trip);
    }

    for (const rows of map.values()) {
      rows.sort((left, right) => {
        const leftStart = parseHourMinute(left.scheduled_time_from) ?? 999;
        const rightStart = parseHourMinute(right.scheduled_time_from) ?? 999;
        return leftStart - rightStart;
      });
    }

    return map;
  }, [dayTrips]);

  const vehicleTypeOptions = useMemo(() => {
    return Array.from(new Set((vehicles ?? []).map((vehicle) => vehicle.type).filter((value): value is string => Boolean(value)))).map((value) => ({
      label: value,
      value,
    }));
  }, [vehicles]);

  const teamOptions = useMemo(() => {
    return Array.from(new Set((vehicles ?? []).map((vehicle) => vehicle.office_id).filter((value): value is number => Number.isFinite(value)))).map((value) => ({
      label: `Đội ${value}`,
      value,
    }));
  }, [vehicles]);

  const summary = useMemo(() => {
    const maintenance = (vehicles ?? []).filter((vehicle) => vehicle.status === 'maintenance').length;
    const broken = (vehicles ?? []).filter((vehicle) => vehicle.status === 'broken').length;
    const idle = activeVehicles.filter((vehicle) => !tripsByVehicle.get(vehicle.id)?.length && vehicle.status !== 'maintenance' && vehicle.status !== 'broken').length;
    return {
      total: activeVehicles.length,
      maintenance,
      broken,
      idle,
      pool: unassignedList.length,
    };
  }, [activeVehicles, tripsByVehicle, unassignedList.length, vehicles]);

  const goDay = (delta: number): void => {
    setSelectedDate((current) => current.add(delta, 'day'));
  };

  const headerCellStyle = (extra?: CSSProperties): CSSProperties => ({
    flex: 1,
    minWidth: HOUR_WIDTH,
    padding: '10px 4px',
    textAlign: 'center',
    fontSize: 11,
    color: token.colorTextSecondary,
    borderRight: `1px solid ${token.colorBorderSecondary}`,
    background: token.colorFillAlter,
    ...extra,
  });

  const rowStripedStyle: CSSProperties = {
    backgroundImage: `linear-gradient(to right, ${token.colorBorderSecondary} 1px, transparent 1px)`,
    backgroundSize: `${HOUR_WIDTH}px 100%`,
    backgroundPosition: '0 0',
  };

  return (
    <div className="space-y-4 px-4 pb-6 lg:px-6">
      <PageHeader
        title="Bảng Điều Vận"
        breadcrumb={[{ label: 'Bảng Điều Vận' }]}
        actions={
          <Space>
            <Button icon={<LeftOutlined />} onClick={() => goDay(-1)} />
            <DatePicker value={selectedDate} onChange={(value) => value && setSelectedDate(value)} format="DD/MM/YYYY" allowClear={false} />
            <Button onClick={() => setSelectedDate(dayjs())}>Hôm nay</Button>
            <Button icon={<RightOutlined />} onClick={() => goDay(1)} />
          </Space>
        }
      />

      <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm" styles={{ body: { padding: 20 } }}>
        <Flex justify="space-between" align="start" gap={16} wrap>
          <div>
            <Text className="block text-xs font-medium uppercase tracking-[0.2em] text-slate-500">Bảng điều vận</Text>
            <Typography.Title level={3} style={{ margin: '6px 0 4px' }}>
              {selectedDate.format('dddd, DD/MM/YYYY')}
            </Typography.Title>
            <Paragraph type="secondary" style={{ marginBottom: 0 }}>
              Click ô trống để gán đơn từ pool. Click ô đã có để xem chi tiết đơn.
            </Paragraph>
          </div>

          <Space wrap>
            <Tag color="blue" className="m-0 rounded-full px-3 py-1 text-xs font-medium">
              Tổng xe: {summary.total}
            </Tag>
            <Tag color="gold" className="m-0 rounded-full px-3 py-1 text-xs font-medium">
              Bảo dưỡng: {summary.maintenance}
            </Tag>
            <Tag color="red" className="m-0 rounded-full px-3 py-1 text-xs font-medium">
              Hỏng: {summary.broken}
            </Tag>
            <Tag color="green" className="m-0 rounded-full px-3 py-1 text-xs font-medium">
              Rảnh: {summary.idle}
            </Tag>
            <Tag color="purple" className="m-0 rounded-full px-3 py-1 text-xs font-medium">
              Pool: {summary.pool}
            </Tag>
          </Space>
        </Flex>

        <Divider style={{ margin: '16px 0' }} />

        <Flex wrap gap={12} align="center">
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả loại xe"
            value={selectedVehicleType}
            onChange={setSelectedVehicleType}
            options={vehicleTypeOptions}
            style={{ minWidth: 220 }}
          />
          <Select
            allowClear
            showSearch
            optionFilterProp="label"
            placeholder="Tất cả đội"
            value={selectedTeamId}
            onChange={setSelectedTeamId}
            options={teamOptions}
            style={{ minWidth: 180 }}
          />
          <Button icon={<ReloadOutlined />} onClick={() => void refetch()} loading={boardLoading}>
            Làm mới
          </Button>
          {boardLoading ? <Spin size="small" /> : null}
        </Flex>

        {error ? (
          <div className="mt-4">
            <Alert type="error" showIcon message="Không tải được bảng điều vận" description={error} action={<Button size="small" onClick={() => void refetch()}>Thử lại</Button>} />
          </div>
        ) : null}
      </Card>

      <Row gutter={16}>
        <Col xs={24} xl={17}>
          <Card className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm" styles={{ body: { padding: 0, overflowX: 'auto' } }}>
            <div style={{ minWidth: VEHICLE_COLUMN_WIDTH + TIMELINE_WIDTH }}>
              <div style={{ display: 'flex', borderBottom: `1px solid ${token.colorBorderSecondary}` }}>
                <div
                  style={{
                    width: VEHICLE_COLUMN_WIDTH,
                    minWidth: VEHICLE_COLUMN_WIDTH,
                    padding: '12px 14px',
                    fontWeight: 600,
                    fontSize: 12,
                    borderRight: `1px solid ${token.colorBorderSecondary}`,
                    background: token.colorFillAlter,
                  }}
                >
                  Xe / TX
                </div>
                <div style={{ display: 'flex', minWidth: TIMELINE_WIDTH, flex: 1 }}>
                  {HOURS.map((hour) => (
                    <div key={hour} style={headerCellStyle()}>
                      {String(hour).padStart(2, '0')}:00
                    </div>
                  ))}
                </div>
              </div>

              {activeVehicles.length === 0 && !boardLoading ? (
                <Empty description="Không có xe phù hợp bộ lọc" style={{ padding: 40 }} />
              ) : null}

              {activeVehicles.map((vehicle) => {
                const vehicleTrips = tripsByVehicle.get(vehicle.id) ?? [];
                const vehicleBadgeColor =
                  vehicle.status === 'maintenance'
                    ? 'gold'
                    : vehicle.status === 'broken'
                      ? 'red'
                      : vehicleTrips.length > 0
                        ? 'blue'
                        : 'green';

                return (
                  <div
                    key={vehicle.id}
                    style={{
                      display: 'flex',
                      minHeight: 74,
                      borderBottom: `1px solid ${token.colorSplit}`,
                    }}
                  >
                    <div
                      style={{
                        width: VEHICLE_COLUMN_WIDTH,
                        minWidth: VEHICLE_COLUMN_WIDTH,
                        padding: '10px 14px',
                        borderRight: `1px solid ${token.colorBorderSecondary}`,
                        background:
                          vehicle.status === 'maintenance'
                            ? token.colorWarningBg
                            : vehicle.status === 'broken'
                              ? token.colorErrorBg
                              : token.colorBgContainer,
                      }}
                    >
                      <Flex align="center" gap={10}>
                        <Avatar size={34} style={{ background: '#1677ff' }} icon={<CarOutlined />} />
                        <div className="min-w-0 flex-1">
                          <Flex align="center" gap={6} wrap>
                            <Text strong style={{ fontSize: 12 }}>
                              {vehicle.plate_number}
                            </Text>
                            <Tag color={vehicleBadgeColor} className="m-0 rounded-full px-2 py-0 text-[10px] font-medium">
                              {vehicle.status === 'maintenance'
                                ? 'Bảo dưỡng'
                                : vehicle.status === 'broken'
                                  ? 'Hỏng'
                                  : vehicleTrips.length > 0
                                    ? 'Đang chạy'
                                    : 'Rảnh'}
                            </Tag>
                          </Flex>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            {formatVehicleLabel(vehicle)}
                          </Text>
                          <Text type="secondary" style={{ fontSize: 11, display: 'block' }}>
                            <UserOutlined style={{ marginRight: 4 }} />
                            Đội {vehicle.office_id ?? '-'}
                          </Text>
                        </div>
                      </Flex>
                    </div>

                    <div
                      style={{
                        flex: 1,
                        minWidth: TIMELINE_WIDTH,
                        position: 'relative',
                        ...rowStripedStyle,
                        backgroundColor:
                          vehicle.status === 'maintenance'
                            ? token.colorWarningBg
                            : vehicle.status === 'broken'
                              ? token.colorErrorBg
                              : token.colorBgContainer,
                      }}
                    >
                      {vehicle.status === 'maintenance' || vehicle.status === 'broken' ? (
                        <Flex align="center" justify="center" style={{ height: '100%', color: token.colorWarning, fontSize: 12, fontWeight: 600 }} gap={8}>
                          <ToolOutlined />
                          {vehicle.status === 'maintenance' ? 'BẢO DƯỠNG (cả ngày)' : 'BỊ HỎNG (cả ngày)'}
                        </Flex>
                      ) : vehicleTrips.length === 0 ? (
                        <Flex align="center" justify="center" style={{ height: '100%' }}>
                          <Tag className="m-0 rounded-full px-3 py-1 text-xs font-medium" color="default">
                            [RẢNH]
                          </Tag>
                        </Flex>
                      ) : (
                        <div style={{ position: 'relative', height: '100%' }}>
                          {vehicleTrips.map((trip, index) => {
                            const position = getTripWindow(trip, index);
                            const statusLabel = t('dispatchBoard.tripStatus', {
                              status: getTripStatusLabel(trip.status ?? '', t),
                            });

                            return (
                              <div
                                key={trip.id}
                                style={{
                                  position: 'absolute',
                                  top: 10 + index * 8,
                                  left: `calc(${position.left}% + 6px)`,
                                  width: `calc(${position.width}% - 12px)`,
                                  minWidth: 140,
                                  maxWidth: `calc(100% - ${position.left}%)`,
                                  zIndex: 2 + index,
                                }}
                              >
                                <TripBar
                                  trip={trip}
                                  token={token}
                                  statusLabel={statusLabel}
                                  onClick={() => show('trips', trip.id)}
                                  compact={position.width < 14}
                                />
                                <div style={{ paddingTop: 48, fontSize: 10, color: token.colorTextSecondary, paddingLeft: 4 }}>
                                  <ClockCircleOutlined style={{ marginRight: 4 }} />
                                  {trip.start_point} → {trip.end_point}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </Col>

        <Col xs={24} xl={7}>
          <Card
            className="rounded-3xl border border-slate-200 shadow-sm"
            title={<Text strong>{'5 ĐƠN CHƯA PHÂN CÔNG'}</Text>}
            extra={<Tag color="blue" className="m-0 rounded-full px-3 py-1 text-xs font-medium">{selectedDate.format('DD/MM')}</Tag>}
          >
            {unassignedList.length === 0 ? (
              <Empty description="Không có đơn chờ phân công" image={Empty.PRESENTED_IMAGE_SIMPLE} />
            ) : (
              <Space direction="vertical" style={{ width: '100%' }} size={8}>
                {unassignedList.slice(0, 5).map((trip) => (
                  <Card
                    key={trip.id}
                    size="small"
                    hoverable
                    onClick={() => show('trips', trip.id)}
                    styles={{ body: { cursor: 'pointer' } }}
                  >
                    <Flex align="start" justify="space-between" gap={12}>
                      <div className="min-w-0 flex-1">
                        <Text strong style={{ fontSize: 12, display: 'block' }}>
                          {trip.code}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                          {trip.customer ? `${trip.customer.code ? `${trip.customer.code} — ` : ''}${trip.customer.name}` : 'Khách hàng chưa xác định'}
                        </Text>
                        <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 2 }}>
                          {trip.start_point} → {trip.end_point}
                        </Text>
                      </div>
                      <Avatar size={32} style={{ background: '#4f8cff' }}>
                        {getInitials(trip.customer?.name ?? trip.customer?.code ?? trip.code)}
                      </Avatar>
                    </Flex>
                    <Divider style={{ margin: '10px 0' }} />
                    <Flex justify="space-between" align="center" gap={8} wrap>
                      <Tag color="geekblue" className="m-0 rounded-full px-2 py-0 text-[10px] font-medium">
                        {trip.scheduled_time_from ? String(trip.scheduled_time_from).slice(0, 5) : '--:--'}
                      </Tag>
                      <Button
                        type="primary"
                        size="small"
                        onClick={(event) => {
                          event.stopPropagation();
                          show('trips', trip.id);
                        }}
                      >
                        Gán ngay
                      </Button>
                    </Flex>
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

