import type { Translate } from '@/hooks/useTranslation';

export type TripStatus =
  | 'pending'
  | 'assigned'
  | 'driver_accepted'
  | 'en_route_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'delayed'
  | 'emergency';

interface TripStatusConfig {
  labelKey: string;
  color: string;
  /** Ant Design Tag color */
  tagColor: string;
}

const STATUS_CONFIG: Record<TripStatus, TripStatusConfig> = {
  pending:         { labelKey: 'trips.statusPending',        color: '#8c8c8c', tagColor: 'default' },
  assigned:        { labelKey: 'trips.statusAssigned',       color: '#1677ff', tagColor: 'blue' },
  driver_accepted: { labelKey: 'trips.statusDriverAccepted', color: '#0958d9', tagColor: 'geekblue' },
  en_route_pickup: { labelKey: 'trips.statusEnRoutePickup',  color: '#fa8c16', tagColor: 'orange' },
  picked_up:       { labelKey: 'trips.statusPickedUp',       color: '#faad14', tagColor: 'gold' },
  in_transit:      { labelKey: 'trips.statusInTransit',      color: '#13c2c2', tagColor: 'cyan' },
  arrived:         { labelKey: 'trips.statusArrived',        color: '#52c41a', tagColor: 'lime' },
  completed:       { labelKey: 'trips.statusCompleted',      color: '#52c41a', tagColor: 'success' },
  cancelled:       { labelKey: 'trips.statusCancelled',      color: '#ff4d4f', tagColor: 'error' },
  delayed:         { labelKey: 'trips.statusDelayed',        color: '#fa541c', tagColor: 'volcano' },
  emergency:       { labelKey: 'trips.statusEmergency',      color: '#a8071a', tagColor: 'red' },
};

export function getTripStatusConfig(status: string): TripStatusConfig {
  return STATUS_CONFIG[status as TripStatus] ?? STATUS_CONFIG.pending;
}

export function getTripStatusLabel(status: string, t: Translate): string {
  const cfg = getTripStatusConfig(status);
  return t(cfg.labelKey as Parameters<Translate>[0]);
}

export function getTripStatusTagColor(status: string): string {
  return getTripStatusConfig(status).tagColor;
}

/** Các trạng thái đang hoạt động (chưa kết thúc). */
export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  'assigned', 'driver_accepted', 'en_route_pickup', 'picked_up', 'in_transit', 'arrived', 'delayed',
];

/** Trạng thái cuối — không thể chuyển tiếp. */
export const TERMINAL_TRIP_STATUSES: TripStatus[] = ['completed', 'cancelled', 'emergency'];

type TripAction =
  | 'assign'
  | 'accept'
  | 'start'
  | 'pickup'
  | 'transit'
  | 'arrive'
  | 'complete'
  | 'cancel'
  | 'delay'
  | 'emergency'
  | 'resume';

interface TripActionConfig {
  action: TripAction;
  labelKey: string;
  nextStatus: TripStatus;
  danger?: boolean;
  requiresReason?: boolean;
}

/** Map trạng thái → danh sách hành động có thể thực hiện. */
export const TRIP_TRANSITIONS: Partial<Record<TripStatus, TripActionConfig[]>> = {
  pending: [
    { action: 'assign', labelKey: 'trips.actionAssign', nextStatus: 'assigned' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  assigned: [
    { action: 'start',     labelKey: 'trips.actionStart',    nextStatus: 'en_route_pickup' },
    { action: 'delay',     labelKey: 'trips.actionDelay',    nextStatus: 'delayed' },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  driver_accepted: [
    { action: 'start',     labelKey: 'trips.actionStart',    nextStatus: 'en_route_pickup' },
    { action: 'delay',     labelKey: 'trips.actionDelay',    nextStatus: 'delayed' },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  en_route_pickup: [
    { action: 'pickup',    labelKey: 'trips.actionPickup',   nextStatus: 'picked_up' },
    { action: 'delay',     labelKey: 'trips.actionDelay',    nextStatus: 'delayed' },
    { action: 'emergency', labelKey: 'trips.actionEmergency', nextStatus: 'emergency', danger: true, requiresReason: true },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  picked_up: [
    { action: 'transit',   labelKey: 'trips.actionTransit',  nextStatus: 'in_transit' },
    { action: 'delay',     labelKey: 'trips.actionDelay',    nextStatus: 'delayed' },
    { action: 'emergency', labelKey: 'trips.actionEmergency', nextStatus: 'emergency', danger: true, requiresReason: true },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  in_transit: [
    { action: 'arrive',    labelKey: 'trips.actionArrive',   nextStatus: 'arrived' },
    { action: 'delay',     labelKey: 'trips.actionDelay',    nextStatus: 'delayed' },
    { action: 'emergency', labelKey: 'trips.actionEmergency', nextStatus: 'emergency', danger: true, requiresReason: true },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  arrived: [
    { action: 'complete',  labelKey: 'trips.actionComplete', nextStatus: 'completed' },
    { action: 'emergency', labelKey: 'trips.actionEmergency', nextStatus: 'emergency', danger: true, requiresReason: true },
  ],
  delayed: [
    { action: 'resume',    labelKey: 'trips.actionResume',   nextStatus: 'in_transit' },
    { action: 'cancel',    labelKey: 'trips.actionCancel',   nextStatus: 'cancelled', danger: true, requiresReason: true },
    { action: 'emergency', labelKey: 'trips.actionEmergency', nextStatus: 'emergency', danger: true, requiresReason: true },
  ],
};

export function getAvailableActions(status: string): TripActionConfig[] {
  return TRIP_TRANSITIONS[status as TripStatus] ?? [];
}
