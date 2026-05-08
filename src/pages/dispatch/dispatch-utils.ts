import type { DispatchTrip } from '@/types/api/dispatch';
import { ACTIVE_TRIP_STATUSES } from '@/utils/tripStatus';

export function parseTimeToMinutes(value?: string | null): number | null {
  if (value == null || value === '') return null;
  const matched = String(value).match(/^(\d{1,2}):(\d{2})/);
  if (matched) {
    const h = Number(matched[1]);
    const m = Number(matched[2]);
    if (Number.isFinite(h) && Number.isFinite(m)) return h * 60 + m;
  }
  return null;
}

export function tripTimeWindowMinutes(trip: {
  scheduled_time_from?: string | null;
  scheduled_time_to?: string | null;
}): { start: number; end: number } | null {
  const start = parseTimeToMinutes(trip.scheduled_time_from);
  if (start == null) return null;
  let end = parseTimeToMinutes(trip.scheduled_time_to);
  if (end == null) end = start + 120;
  if (end <= start) end = start + 60;
  return { start, end };
}

export function rangesOverlap(
  a: { start: number; end: number },
  b: { start: number; end: number },
): boolean {
  return a.start < b.end && b.start < a.end;
}

export function vehicleHasInTransitOverlap(
  vehicleId: number,
  candidateTrip: DispatchTrip,
  allTrips: DispatchTrip[],
): boolean {
  const win = tripTimeWindowMinutes(candidateTrip);
  if (!win) return false;
  for (const t of allTrips) {
    if (t.id === candidateTrip.id) continue;
    if (t.vehicle_id !== vehicleId) continue;
    if (t.status !== 'in_transit') continue;
    const other = tripTimeWindowMinutes(t);
    if (!other) continue;
    if (rangesOverlap(win, other)) return true;
  }
  return false;
}

const ACTIVE = ACTIVE_TRIP_STATUSES as readonly string[];

export function isDriverBusyFromTrips(driverId: number, trips: DispatchTrip[]): boolean {
  return trips.some(
    (t) => t.driver_id === driverId && t.status != null && ACTIVE.includes(t.status),
  );
}

export function isVehicleBusyFromTrips(vehicleId: number, trips: DispatchTrip[]): boolean {
  return trips.some(
    (t) => t.vehicle_id === vehicleId && t.status != null && ACTIVE.includes(t.status),
  );
}
