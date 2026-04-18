export const SCHEDULE_STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  locked: 'purple',
};

export const LEAVE_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  cancelled: 'warning',
};

export const OT_STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  submitted: 'processing',
  approved: 'success',
  rejected: 'error',
  paid: 'purple',
};

export const VIOLATION_STATUS_COLOR: Record<string, string> = {
  pending: 'default',
  pending_review: 'default',
  confirmed: 'error',
  disputed: 'warning',
  resolved: 'success',
  waived: 'default',
  deducted: 'purple',
};

export const ATTENDANCE_STATUS_COLOR: Record<string, string> = {
  present: 'success',
  late: 'warning',
  absent: 'error',
  partial: 'processing',
};

export interface ActionConfirmState {
  open: boolean;
  title: string;
  requireReason: boolean;
  placeholder?: string;
  onConfirm: (reason: string) => Promise<void>;
}

export const DEFAULT_ACTION_CONFIRM: ActionConfirmState = {
  open: false,
  title: '',
  requireReason: false,
  onConfirm: async () => {},
};

export type DetailKind = 'leave' | 'overtime' | 'violations' | 'attendance';
