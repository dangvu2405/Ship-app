import type { Driver } from '@/types';

export const SCHEDULE_STATUS_COLOR: Record<string, string> = {
  draft: 'default',
  submitted: 'gold',
  approved: 'success',
  locked: 'purple',
  rejected: 'error',
};

export const BULK_STATUS_COLOR: Record<string, string> = {
  locked: 'blue',
  conflict: 'red',
  rejected: 'red',
  approved: 'green',
  submitted: 'gold',
};

export function scheduleStatusLabel(s: string): string {
  const m: Record<string, string> = {
    draft: 'Nháp',
    submitted: 'Đã nộp',
    approved: 'Đã duyệt',
    locked: 'Đã khóa',
    rejected: 'Từ chối',
  };
  return m[s] ?? s;
}

export type WorkStatusFilter = 'all' | 'working' | 'leave' | 'absent';

export const SHIFT_OPTIONS = [
  { label: 'Ca ngày (day)', value: 'day' },
  { label: 'Ca đêm (night)', value: 'night' },
  { label: 'Ca tách (split)', value: 'split' },
  { label: 'Ca sáng (morning)', value: 'morning' },
  { label: 'Ca chiều (afternoon)', value: 'afternoon' },
  { label: 'Tuỳ chỉnh (custom)', value: 'custom' },
];

export function toFiniteNumber(v: unknown): number | undefined {
  if (v == null || v === '') return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function driverOfficeId(d: Driver): number | undefined {
  const row = d as unknown as Record<string, unknown>;
  const top = toFiniteNumber(row.office_id);
  if (top != null) return top;
  const emp = d.employee as Record<string, unknown> | undefined;
  if (!emp) return undefined;
  const fromFlat = toFiniteNumber(emp.office_id ?? emp.officeId);
  if (fromFlat != null) return fromFlat;
  const office = emp.office as { id?: unknown } | undefined;
  return toFiniteNumber(office?.id);
}
