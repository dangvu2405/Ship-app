import type { CSSProperties } from 'react';
import type { Translate } from '@/hooks/useTranslation';

export type TripStatus =
  | 'pending'
  | 'assigned'
  | 'en_route_pickup'
  | 'picked_up'
  | 'in_transit'
  | 'arrived'
  | 'completed'
  | 'cancelled'
  | 'delayed'
  | 'emergency'
  | 'draft';

interface TripStatusConfig {
  labelKey: string;
  color: string;
  tagColor: string;
}

/** Chuẩn màn 3.3–3.5: pending=xám, assigned=x.dương, đang chạy=vàng, đã giao=tím, hoàn thành=x.lá, hủy=đỏ */
const STATUS_CONFIG: Record<TripStatus, TripStatusConfig> = {
  pending:         { labelKey: 'trips.statusPending',        color: '#8c8c8c', tagColor: 'default' },
  assigned:        { labelKey: 'trips.statusAssigned',       color: '#3B82F6', tagColor: 'blue' },
  en_route_pickup: { labelKey: 'trips.statusEnRoutePickup',  color: '#d4b106', tagColor: 'gold' },
  picked_up:       { labelKey: 'trips.statusPickedUp',       color: '#d4b106', tagColor: 'gold' },
  in_transit:      { labelKey: 'trips.statusInTransit',      color: '#d4b106', tagColor: 'gold' },
  delayed:         { labelKey: 'trips.statusDelayed',        color: '#d4b106', tagColor: 'gold' },
  arrived:         { labelKey: 'trips.statusArrived',        color: '#722ed1', tagColor: 'purple' },
  completed:       { labelKey: 'trips.statusCompleted',      color: '#52c41a', tagColor: 'success' },
  cancelled:       { labelKey: 'trips.statusCancelled',      color: '#ff4d4f', tagColor: 'error' },
  emergency:       { labelKey: 'trips.statusEmergency',      color: '#ff4d4f', tagColor: 'error' },
  draft:           { labelKey: 'trips.statusDraft',          color: '#bfbfbf', tagColor: 'default' },
};

const UPPERCASE_ALIAS: Record<string, TripStatus> = {
  PENDING: 'pending',
  ASSIGNED: 'assigned',
  DRIVER_ACCEPTED: 'assigned',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'arrived',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  CANCELED: 'cancelled',
};

const LOWERCASE_ALIAS: Record<string, TripStatus> = {
  driver_accepted: 'assigned',
  delivered: 'arrived',
  canceled: 'cancelled',
};

export function normalizeTripStatusKey(status?: string): TripStatus | '' {
  if (status == null || status === '') return '';
  const u = status.toUpperCase();
  if (u in UPPERCASE_ALIAS) return UPPERCASE_ALIAS[u];
  const lower = status.toLowerCase();
  if (lower in LOWERCASE_ALIAS) return LOWERCASE_ALIAS[lower];
  return lower as TripStatus;
}

export function getTripStatusConfig(status: string): TripStatusConfig {
  const key = normalizeTripStatusKey(status);
  if (key && key in STATUS_CONFIG) return STATUS_CONFIG[key];
  return STATUS_CONFIG.pending;
}

export function getTripStatusLabel(status: string, t: Translate): string {
  const cfg = getTripStatusConfig(status);
  return t(cfg.labelKey as Parameters<Translate>[0]);
}

export function getTripStatusTagColor(status: string): string {
  return getTripStatusConfig(status).tagColor;
}

export const ACTIVE_TRIP_STATUSES: TripStatus[] = [
  'assigned',
  'en_route_pickup',
  'picked_up',
  'in_transit',
  'arrived',
  'delayed',
];

export const TERMINAL_TRIP_STATUSES: TripStatus[] = ['completed', 'cancelled', 'emergency'];

type TripAction =
  | 'assign'
  | 'accept'
  | 'start'
  | 'pickup'
  | 'transit'
  | 'arrive'
  | 'deliver'
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

/** Workflow PATCH theo API mục 12: assign → start → deliver → complete; hủy có lý do. */
export const TRIP_TRANSITIONS: Partial<Record<TripStatus, TripActionConfig[]>> = {
  pending: [
    { action: 'assign', labelKey: 'trips.actionAssign', nextStatus: 'assigned' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  assigned: [
    { action: 'start', labelKey: 'trips.actionStart', nextStatus: 'en_route_pickup' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  en_route_pickup: [
    { action: 'pickup', labelKey: 'trips.actionPickup', nextStatus: 'picked_up' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  picked_up: [
    { action: 'transit', labelKey: 'trips.actionTransit', nextStatus: 'in_transit' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  in_transit: [
    { action: 'arrive', labelKey: 'trips.actionArrive', nextStatus: 'arrived' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  delayed: [
    { action: 'resume', labelKey: 'trips.actionResume', nextStatus: 'in_transit' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
  arrived: [
    { action: 'complete', labelKey: 'trips.actionComplete', nextStatus: 'completed' },
    { action: 'cancel', labelKey: 'trips.actionCancel', nextStatus: 'cancelled', danger: true, requiresReason: true },
  ],
};

export function getAvailableActions(status: string): TripActionConfig[] {
  const key = normalizeTripStatusKey(status);
  if (!key) return [];
  return TRIP_TRANSITIONS[key] ?? [];
}

export function isTripCompleted(status: string): boolean {
  return normalizeTripStatusKey(status) === 'completed';
}

export type ConventionOrderListBucket =
  | 'new'
  | 'assigned'
  | 'in_transit'
  | 'delivered'
  | 'completed'
  | 'cancelled';

/** CONVENTION §3.3 — six list badges (NEW / ASSIGNED / IN_TRANSIT / DELIVERED / COMPLETED / CANCELLED). */
export function getConventionOrderListBucket(status: string): ConventionOrderListBucket {
  const key = normalizeTripStatusKey(status);
  if (!key || key === 'pending') return 'new';
  if (key === 'assigned') return 'assigned';
  if (key === 'completed') return 'completed';
  if (key === 'cancelled' || key === 'emergency') return 'cancelled';
  if (key === 'arrived') return 'delivered';
  return 'in_transit';
}

export function getConventionOrderListTagProps(status: string): {
  color?: string;
  style?: CSSProperties;
} {
  const bucket = getConventionOrderListBucket(status);
  switch (bucket) {
    case 'new':
      return {
        color: 'default',
        style: {
          background: '#ffffff',
          border: '1px solid #d9d9d9',
          color: 'rgba(0, 0, 0, 0.88)',
        },
      };
    case 'assigned':
      return { color: 'blue' };
    case 'in_transit':
      return { color: 'gold' };
    case 'delivered':
      return { color: 'purple' };
    case 'completed':
      return { color: 'success' };
    case 'cancelled':
      return { color: 'error' };
    default:
      return { color: 'default' };
  }
}

export function getConventionOrderListLabel(status: string, t: Translate): string {
  const bucket = getConventionOrderListBucket(status);
  const keys: Record<ConventionOrderListBucket, Parameters<Translate>[0]> = {
    new: 'trips.conventionStatusNew',
    assigned: 'trips.conventionStatusAssigned',
    in_transit: 'trips.conventionStatusInTransit',
    delivered: 'trips.conventionStatusDelivered',
    completed: 'trips.conventionStatusCompleted',
    cancelled: 'trips.conventionStatusCancelled',
  };
  return t(keys[bucket]);
}

/** Single call for rendering an exact-status <Tag>: `<Tag color={color}>{label}</Tag>` */
export function getTripStatusDisplay(
  status: string,
  t: Translate,
): { label: string; color: string } {
  return { label: getTripStatusLabel(status, t), color: getTripStatusTagColor(status) };
}

/** Single call for rendering a convention-bucketed <Tag>: `<Tag color={color} style={style}>{label}</Tag>` */
export function getTripConventionDisplay(
  status: string,
  t: Translate,
): { label: string; color?: string; style?: CSSProperties } {
  const { color, style } = getConventionOrderListTagProps(status);
  return { label: getConventionOrderListLabel(status, t), color, style };
}
