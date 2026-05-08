import { memo, useMemo } from 'react';
import { Card, Empty, Popover, Typography } from 'antd';
import dayjs from 'dayjs';
import type { DispatchTrip, DispatchVehicle } from '@/types/api/dispatch';

const { Text } = Typography;

const HOURS = Array.from({ length: 13 }, (_, i) => 7 + i); // 07..19

type CellKind = 'idle' | 'busy' | 'leave' | 'maintenance';

interface MatrixCell {
  kind: CellKind;
  trip?: DispatchTrip;
}

const KIND_COLOR: Record<CellKind, string> = {
  idle: '#f0f5ff',
  busy: '#1677ff',
  leave: '#faad14',
  maintenance: '#ff4d4f',
};

const KIND_LABEL: Record<CellKind, string> = {
  idle: 'Rảnh',
  busy: 'Có chuyến',
  leave: 'Nghỉ phép',
  maintenance: 'Bảo dưỡng',
};

const tripCoversHour = (trip: DispatchTrip, hour: number): boolean => {
  const from = trip.scheduled_time_from ?? null;
  const to = trip.scheduled_time_to ?? null;
  if (!from && !to) return false;
  const startHour = from ? dayjs(from).hour() : hour;
  const endHour = to ? dayjs(to).hour() : startHour;
  if (Number.isNaN(startHour) || Number.isNaN(endHour)) return false;
  if (endHour < startHour) return hour >= startHour;
  return hour >= startHour && hour <= endHour;
};

export interface VehicleHourMatrixProps {
  vehicles: DispatchVehicle[];
  trips: DispatchTrip[];
  loading?: boolean;
  onCellClick?: (vehicleId: number, hour: number) => void;
}

function VehicleHourMatrixInner({ vehicles, trips, loading, onCellClick }: VehicleHourMatrixProps) {
  const matrix = useMemo(() => {
    const out = new Map<number, MatrixCell[]>();
    vehicles.forEach((vehicle) => {
      const status = (vehicle.status ?? '').toLowerCase();
      const cells: MatrixCell[] = HOURS.map((h) => {
        if (status === 'maintenance' || status === 'broken') {
          return { kind: 'maintenance' as CellKind };
        }
        const trip = trips.find((tx) => tx.vehicle_id === vehicle.id && tripCoversHour(tx, h));
        if (trip) return { kind: 'busy' as CellKind, trip };
        return { kind: 'idle' as CellKind };
      });
      out.set(vehicle.id, cells);
    });
    return out;
  }, [vehicles, trips]);

  return (
    <Card
      title={<Text strong>Lịch xe theo giờ (07:00 — 19:00)</Text>}
      loading={loading}
      className="rounded-2xl border border-slate-200/80 shadow-sm"
    >
      {vehicles.length === 0 ? (
        <Empty description="Không có xe để hiển thị" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, tableLayout: 'fixed', minWidth: 720 }}>
            <thead>
              <tr>
                <th
                  style={{
                    position: 'sticky',
                    left: 0,
                    background: '#fff',
                    zIndex: 1,
                    textAlign: 'left',
                    padding: '6px 8px',
                    borderBottom: '1px solid #f0f0f0',
                    minWidth: 120,
                  }}
                >
                  Biển số
                </th>
                {HOURS.map((h) => (
                  <th
                    key={`th-${h}`}
                    style={{
                      textAlign: 'center',
                      fontSize: 11,
                      color: '#8c8c8c',
                      padding: '6px 4px',
                      borderBottom: '1px solid #f0f0f0',
                      width: 38,
                    }}
                  >
                    {String(h).padStart(2, '0')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {vehicles.map((vehicle) => {
                const cells = matrix.get(vehicle.id) ?? [];
                return (
                  <tr key={vehicle.id}>
                    <td
                      style={{
                        position: 'sticky',
                        left: 0,
                        background: '#fff',
                        zIndex: 1,
                        padding: '6px 8px',
                        borderBottom: '1px solid #f5f5f5',
                        fontWeight: 500,
                      }}
                    >
                      {vehicle.plate_number}
                      <div style={{ fontSize: 11, color: '#8c8c8c' }}>{vehicle.type ?? '—'}</div>
                    </td>
                    {cells.map((cell, idx) => {
                      const hour = HOURS[idx];
                      const node = (
                        <div
                          role={onCellClick ? 'button' : undefined}
                          tabIndex={onCellClick ? 0 : -1}
                          onClick={() => {
                            if (cell.kind === 'idle') onCellClick?.(vehicle.id, hour);
                          }}
                          style={{
                            margin: 2,
                            height: 28,
                            background: KIND_COLOR[cell.kind],
                            borderRadius: 4,
                            cursor: cell.kind === 'idle' && onCellClick ? 'pointer' : 'default',
                            opacity: cell.kind === 'idle' ? 0.55 : 1,
                          }}
                        />
                      );
                      if (cell.kind === 'busy' && cell.trip) {
                        return (
                          <td key={`c-${vehicle.id}-${hour}`} style={{ padding: 0, borderBottom: '1px solid #f5f5f5' }}>
                            <Popover
                              placement="top"
                              content={
                                <div style={{ maxWidth: 240 }}>
                                  <Text strong>{cell.trip.code}</Text>
                                  <div style={{ fontSize: 12, color: '#595959' }}>
                                    {cell.trip.start_point ?? '—'} → {cell.trip.end_point ?? '—'}
                                  </div>
                                  <div style={{ fontSize: 11, color: '#8c8c8c', marginTop: 4 }}>
                                    {cell.trip.scheduled_time_from ? dayjs(cell.trip.scheduled_time_from).format('HH:mm') : '?'}
                                    {' — '}
                                    {cell.trip.scheduled_time_to ? dayjs(cell.trip.scheduled_time_to).format('HH:mm') : '?'}
                                  </div>
                                </div>
                              }
                            >
                              {node}
                            </Popover>
                          </td>
                        );
                      }
                      return (
                        <td key={`c-${vehicle.id}-${hour}`} style={{ padding: 0, borderBottom: '1px solid #f5f5f5' }}>
                          {node}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginTop: 12, fontSize: 12, color: '#595959' }}>
        {(['idle', 'busy', 'leave', 'maintenance'] as CellKind[]).map((k) => (
          <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <span style={{ width: 14, height: 14, background: KIND_COLOR[k], borderRadius: 3, display: 'inline-block' }} />
            <span>{KIND_LABEL[k]}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export const VehicleHourMatrix = memo(VehicleHourMatrixInner);
