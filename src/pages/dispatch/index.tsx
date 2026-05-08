import { useCallback, useMemo, useState } from 'react';
import { Alert, Button, Card, Col, DatePicker, Empty, Result, Row, Segmented, Select, Space, Spin, Tag, Typography } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import type { BaseRecord } from '@refinedev/core';
import { useCustom } from '@refinedev/core';
import { useSearchParams } from 'react-router-dom';
import dayjs from 'dayjs';
import { PageHeader } from '@/components/common/PageHeader';
import { useTranslation } from '@/hooks/useTranslation';
import { useDispatchDailySummary } from '@/hooks/useDispatchDailySummary';
import { ENDPOINTS } from '@/services/endpoints';
import type {
  DispatchBoardDriver,
  DispatchBoardPayload,
  DispatchTrip,
  DispatchVehicle,
} from '@/types/api/dispatch';
import { DispatchSummary } from './components/DispatchSummary';
import { UnassignedTripList } from './components/UnassignedTripList';
import { ResourceStatusBoard, type DriverRowItem, type ResourceBucket, type VehicleRowItem } from './components/ResourceStatusBoard';
import { VehicleHourMatrix } from './components/VehicleHourMatrix';
import { QuickAssignModal } from './components/QuickAssignModal';
import { isDriverBusyFromTrips, isVehicleBusyFromTrips } from './dispatch-utils';

function normalizeUnassignedPayload(data: unknown): DispatchTrip[] {
  if (data == null) return [];
  if (Array.isArray(data)) return data as DispatchTrip[];
  if (typeof data === 'object' && data !== null && 'data' in data) {
    const inner = (data as { data: unknown }).data;
    if (Array.isArray(inner)) return inner as DispatchTrip[];
    if (inner && typeof inner === 'object' && inner !== null && 'data' in inner) {
      const nested = (inner as { data: unknown }).data;
      if (Array.isArray(nested)) return nested as DispatchTrip[];
    }
  }
  return [];
}

type BoardColumnKey = 'running' | 'ready' | 'maintenance' | 'done';

interface BoardCardItem {
  id: string;
  code: string;
  subtitle: string;
  caption?: string;
  statusText: string;
}

interface BoardColumnConfig {
  key: BoardColumnKey;
  title: string;
  dotClassName: string;
  statusTagColor: 'cyan' | 'green' | 'orange' | 'default';
}

const BOARD_COLUMNS: BoardColumnConfig[] = [
  { key: 'running', title: 'Đang chạy', dotClassName: 'bg-cyan-500', statusTagColor: 'cyan' },
  { key: 'ready', title: 'Sẵn sàng', dotClassName: 'bg-green-500', statusTagColor: 'green' },
  { key: 'maintenance', title: 'Bảo dưỡng', dotClassName: 'bg-orange-500', statusTagColor: 'orange' },
  { key: 'done', title: 'Hoàn thành', dotClassName: 'bg-slate-400', statusTagColor: 'default' },
];

const RUNNING_TRIP_STATUSES = ['running', 'in_transit', 'in-progress', 'in_progress'] as const;
const DONE_TRIP_STATUSES = ['completed', 'delivered', 'done', 'closed'] as const;
const READY_VEHICLE_STATUSES = ['available', 'ready', 'idle', 'active'] as const;
const MAINTENANCE_VEHICLE_STATUSES = ['maintenance', 'broken', 'inactive'] as const;

function normalizeTripStatus(status?: string): string {
  return String(status ?? '').toLowerCase();
}

function normalizeVehicleStatus(status?: string): string {
  return String(status ?? '').toLowerCase();
}

function vehicleBucket(vehicle: DispatchVehicle, allTrips: DispatchTrip[]): ResourceBucket {
  const status = normalizeVehicleStatus(vehicle.status);
  if (MAINTENANCE_VEHICLE_STATUSES.includes(status as (typeof MAINTENANCE_VEHICLE_STATUSES)[number])) {
    return 'offline';
  }
  if (isVehicleBusyFromTrips(vehicle.id, allTrips)) {
    return 'busy';
  }
  return 'available';
}

function driverBucket(driver: DispatchBoardDriver, allTrips: DispatchTrip[]): ResourceBucket {
  const status = String(driver.status ?? '').toLowerCase();
  if (status === 'inactive' || status === 'on_leave' || status === 'off') return 'offline';
  if (isDriverBusyFromTrips(driver.id, allTrips)) return 'busy';
  return 'available';
}

export default function DispatchBoardPage() {
  const { t } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const dateParam = searchParams.get('date');
  const dateStr = dateParam && dayjs(dateParam).isValid() ? dayjs(dateParam).format('YYYY-MM-DD') : dayjs().format('YYYY-MM-DD');

  const [vehicleType, setVehicleType] = useState<string | undefined>(undefined);
  const [teamId, setTeamId] = useState<number | undefined>(undefined);
  const [assignTrip, setAssignTrip] = useState<DispatchTrip | null>(null);
  const [boardView, setBoardView] = useState<'matrix' | 'columns'>('matrix');

  const {
    data: boardResult,
    isLoading: boardLoading,
    isError: boardError,
    error: boardErr,
    refetch: refetchBoard,
  } = useCustom<DispatchBoardPayload & BaseRecord>({
    url: ENDPOINTS.dispatch.board,
    method: 'get',
    config: { query: { date: dateStr } },
    queryOptions: { staleTime: 20_000 },
  });

  const {
    data: unassignedResult,
    isLoading: unassignedLoading,
    isError: unassignedError,
    error: unassignedErr,
    refetch: refetchUnassigned,
  } = useCustom<BaseRecord>({
    url: ENDPOINTS.dispatch.unassignedTrips,
    method: 'get',
    config: { query: { date: dateStr } },
    queryOptions: { staleTime: 20_000 },
  });

  const { data: dailySummary, refetch: refetchSummary } = useDispatchDailySummary(dateStr);

  const board = boardResult?.data;
  const trips = board?.trips ?? [];
  const vehicles = board?.vehicles ?? [];
  const drivers = board?.drivers ?? [];

  const driverNameMap = useMemo(() => {
    const map = new Map<number, string>();
    for (const d of drivers ?? []) {
      if (d.name) map.set(d.id, d.name);
    }
    return map;
  }, [drivers]);

  const unassignedTrips = useMemo(() => {
    const all = normalizeUnassignedPayload(unassignedResult?.data);
    if (vehicleType) {
      return all.filter((t) => (t as unknown as { vehicle_type?: string })?.vehicle_type === vehicleType);
    }
    return all;
  }, [unassignedResult?.data, vehicleType]);

  const filteredVehicles = useMemo(() => {
    if (!vehicleType) return vehicles;
    return vehicles.filter((v) => (v.type ?? '').toLowerCase() === vehicleType);
  }, [vehicles, vehicleType]);

  const filteredDrivers = useMemo(() => {
    if (!teamId) return drivers;
    return drivers.filter((d) => (d as unknown as { team_id?: number })?.team_id === teamId);
  }, [drivers, teamId]);

  const driverRows: DriverRowItem[] = useMemo(
    () =>
      filteredDrivers.map((d) => ({
        ...d,
        bucket: driverBucket(d, trips),
      })),
    [filteredDrivers, trips],
  );

  const vehicleRows: VehicleRowItem[] = useMemo(
    () =>
      filteredVehicles.map((v) => ({
        ...v,
        bucket: vehicleBucket(v, trips),
      })),
    [filteredVehicles, trips],
  );

  const pageLoading = boardLoading || unassignedLoading;

  const refetchAll = useCallback(() => {
    void refetchBoard();
    void refetchUnassigned();
    void refetchSummary();
  }, [refetchBoard, refetchUnassigned, refetchSummary]);

  const onAssignSuccess = useCallback(() => {
    void refetchAll();
  }, [refetchAll]);

  const summaryNew = dailySummary?.unassigned ?? unassignedTrips.length;
  const summaryRunning = dailySummary?.in_progress ?? trips.filter((t) => RUNNING_TRIP_STATUSES.includes(normalizeTripStatus(t.status) as (typeof RUNNING_TRIP_STATUSES)[number])).length;
  const summaryCompleted = dailySummary?.completed ?? trips.filter((t) => DONE_TRIP_STATUSES.includes(normalizeTripStatus(t.status) as (typeof DONE_TRIP_STATUSES)[number])).length;

  const excludedDriverIds = useMemo(() => {
    const s = new Set<number>();
    drivers.forEach((d) => {
      if (driverBucket(d, trips) !== 'available') s.add(d.id);
    });
    return s;
  }, [drivers, trips]);

  const columnData = useMemo(() => {
    const runningTrips = trips.filter((trip) => RUNNING_TRIP_STATUSES.includes(normalizeTripStatus(trip.status) as (typeof RUNNING_TRIP_STATUSES)[number]));
    const doneTrips = trips.filter((trip) => DONE_TRIP_STATUSES.includes(normalizeTripStatus(trip.status) as (typeof DONE_TRIP_STATUSES)[number]));
    const readyVehicles = filteredVehicles.filter((vehicle: DispatchVehicle) => READY_VEHICLE_STATUSES.includes(normalizeVehicleStatus(vehicle.status) as (typeof READY_VEHICLE_STATUSES)[number]));
    const maintenanceVehicles = filteredVehicles.filter((vehicle: DispatchVehicle) => MAINTENANCE_VEHICLE_STATUSES.includes(normalizeVehicleStatus(vehicle.status) as (typeof MAINTENANCE_VEHICLE_STATUSES)[number]));

    const running: BoardCardItem[] = runningTrips.map((trip) => ({
      id: `running-${trip.id}`,
      code: trip.code,
      subtitle: `${trip.start_point ?? '—'} → ${trip.end_point ?? '—'}`,
      caption: trip.driver_id != null ? (driverNameMap.get(trip.driver_id) ?? `#${trip.driver_id}`) : undefined,
      statusText: 'Đang chạy',
    }));

    const ready: BoardCardItem[] = [
      ...unassignedTrips.map((trip) => ({
        id: `ready-trip-${trip.id}`,
        code: trip.code,
        subtitle: `${trip.start_point ?? '—'} → ${trip.end_point ?? '—'}`,
        caption: trip.customer?.name ?? undefined,
        statusText: 'Sẵn sàng',
      })),
      ...readyVehicles.map((vehicle) => ({
        id: `ready-vehicle-${vehicle.id}`,
        code: vehicle.plate_number,
        subtitle: vehicle.type ?? 'Xe',
        caption: vehicle.office_id != null ? `Đội ${vehicle.office_id}` : undefined,
        statusText: 'Sẵn sàng',
      })),
    ];

    const maintenance: BoardCardItem[] = maintenanceVehicles.map((vehicle) => ({
      id: `maintenance-${vehicle.id}`,
      code: vehicle.plate_number,
      subtitle: vehicle.type ?? 'Xe',
      caption: vehicle.office_id != null ? `Đội ${vehicle.office_id}` : undefined,
      statusText: 'Bảo dưỡng',
    }));

    const done: BoardCardItem[] = doneTrips.map((trip) => ({
      id: `done-${trip.id}`,
      code: trip.code,
      subtitle: `${trip.start_point ?? '—'} → ${trip.end_point ?? '—'}`,
      caption: trip.driver_id != null ? (driverNameMap.get(trip.driver_id) ?? `#${trip.driver_id}`) : undefined,
      statusText: 'Hoàn thành',
    }));

    return { running, ready, maintenance, done };
  }, [trips, filteredVehicles, unassignedTrips, driverNameMap]);

  const setDate = (newDate: string) => {
    const next = new URLSearchParams(searchParams);
    next.set('date', newDate);
    setSearchParams(next, { replace: true });
  };

  return (
    <div className="dispatch-board enterprise-page space-y-3">
      <PageHeader
        title="Bảng điều phối"
        breadcrumb={[{ label: 'Điều phối' }, { label: 'Bảng điều phối' }]}
        description="Theo dõi tình trạng đội xe theo thời gian thực."
        actions={
          <Space>
            <DatePicker
              value={dayjs(dateStr)}
              format="DD/MM/YYYY"
              allowClear={false}
              onChange={(d) => d && setDate(d.format('YYYY-MM-DD'))}
            />
            <Segmented
              value={boardView}
              onChange={(v) => setBoardView(v as 'matrix' | 'columns')}
              options={[
                { label: 'Lịch xe theo giờ', value: 'matrix' },
                { label: 'Theo cột trạng thái', value: 'columns' },
              ]}
            />
            <Button
              icon={<ReloadOutlined />}
              onClick={() => void refetchAll()}
              loading={pageLoading}
            >
              Làm mới
            </Button>
          </Space>
        }
      />

      <DispatchSummary
        loading={pageLoading}
        newCount={summaryNew}
        runningCount={summaryRunning}
        completedCount={summaryCompleted}
      />

      <Space wrap>
        <Select
          allowClear
          placeholder="Loại xe"
          style={{ minWidth: 180 }}
          value={vehicleType}
          onChange={setVehicleType}
          options={[
            { label: 'Container', value: 'container' },
            { label: 'Tải nhỏ', value: 'small_truck' },
            { label: 'Tải lớn', value: 'large_truck' },
          ]}
        />
        <Select
          allowClear
          placeholder="Đội tài xế"
          style={{ minWidth: 180 }}
          value={teamId}
          onChange={setTeamId}
          options={[]}
        />
      </Space>

      {(() => {
        const status = (boardErr as { statusCode?: number; response?: { status?: number } } | null | undefined)?.statusCode
          ?? (boardErr as { response?: { status?: number } } | null | undefined)?.response?.status;
        if (boardError && status === 403) {
          return (
            <Result
              status="403"
              title="Bạn chưa có quyền truy cập bảng điều phối"
              subTitle="Liên hệ quản trị viên để cấp quyền dispatcher hoặc manager."
            />
          );
        }
        if (boardError) {
          return (
            <Alert
              type="error"
              showIcon
              message="Không tải được bảng điều phối"
              description={boardErr instanceof Error ? boardErr.message : 'Lỗi không xác định'}
            />
          );
        }
        return null;
      })()}
      {unassignedError ? (
        <Alert
          type="warning"
          showIcon
          message="Không tải được danh sách đơn sẵn sàng"
          description={unassignedErr instanceof Error ? unassignedErr.message : 'Lỗi không xác định'}
        />
      ) : null}

      <Row gutter={[12, 12]}>
        <Col xs={24} xl={8}>
          <UnassignedTripList
            trips={unassignedTrips}
            loading={unassignedLoading}
            onSelectTrip={(trip) => setAssignTrip(trip)}
          />
        </Col>
        <Col xs={24} xl={16}>
          {boardView === 'matrix' ? (
            <VehicleHourMatrix
              vehicles={filteredVehicles}
              trips={trips}
              loading={boardLoading}
              onCellClick={(vehicleId) => {
                const firstUnassigned = unassignedTrips[0];
                if (firstUnassigned) {
                  setAssignTrip({ ...firstUnassigned, vehicle_id: vehicleId });
                }
              }}
            />
          ) : (
            <ResourceStatusBoard
              drivers={driverRows}
              vehicles={vehicleRows}
              loading={boardLoading}
            />
          )}
        </Col>
      </Row>

      <Typography.Text type="secondary" className="dispatch-meta block">
        Dữ liệu ngày {dayjs(dateStr).format('DD/MM/YYYY')}
      </Typography.Text>

      <Spin spinning={pageLoading}>
        <Row gutter={[12, 12]}>
          {BOARD_COLUMNS.map((column) => {
            const items = columnData[column.key];
            return (
              <Col key={column.key} xs={24} md={12} xl={6}>
                <Card
                  size="small"
                  title={
                    <span className="flex items-center gap-2 text-sm">
                      <span className={`h-2 w-2 rounded-full ${column.dotClassName}`} />
                      {column.title}
                    </span>
                  }
                  extra={<Typography.Text type="secondary">{items.length}</Typography.Text>}
                  className="enterprise-section-card dispatch-column-card h-full"
                  styles={{ body: { padding: 8 } }}
                >
                  <Space direction="vertical" style={{ width: '100%' }} size={8}>
                    {items.length === 0 ? (
                      <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description={t('common.noData')} />
                    ) : (
                      items.map((item) => (
                        <Card key={item.id} size="small" className="dispatch-item-card rounded-lg border border-slate-200">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <Typography.Text strong className="block">
                                {item.code}
                              </Typography.Text>
                              <Typography.Text type="secondary" className="block text-xs">
                                {item.subtitle}
                              </Typography.Text>
                              {item.caption ? (
                                <Typography.Text type="secondary" className="block text-xs">
                                  {item.caption}
                                </Typography.Text>
                              ) : null}
                            </div>
                            <Tag color={column.statusTagColor} className="m-0">
                              {item.statusText}
                            </Tag>
                          </div>
                        </Card>
                      ))
                    )}
                  </Space>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Spin>

      <QuickAssignModal
        open={!!assignTrip}
        trip={assignTrip}
        dateStr={dateStr}
        boardTrips={trips}
        excludedDriverIds={excludedDriverIds}
        onClose={() => setAssignTrip(null)}
        onSuccess={onAssignSuccess}
      />
    </div>
  );
}
