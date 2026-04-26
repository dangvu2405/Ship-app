export type { ViolationRecord } from '@/types';

export interface ViolationsListProps {
  companyId?: number;
  officeId?: number;
  embedded?: boolean;
}

export const VIOLATION_TYPES = [
  { label: 'Vượt tốc độ', value: 'speeding' },
  { label: 'Lệch tuyến đường', value: 'route_deviation' },
  { label: 'Lạm dụng nhiên liệu', value: 'fuel_misuse' },
  { label: 'Hành vi', value: 'behavior' },
  { label: 'Tai nạn', value: 'accident' },
  { label: 'Khác', value: 'other' },
] as const;

export function violationStatusColor(status: string): string {
  switch (status) {
    case 'confirmed': return 'orange';
    case 'disputed': return 'blue';
    case 'waived': return 'default';
    case 'deducted': return 'red';
    default: return 'gold';
  }
}

export function violationStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Chờ xác nhận',
    confirmed: 'Đã xác nhận',
    disputed: 'Đang khiếu nại',
    waived: 'Đã miễn',
    deducted: 'Đã trừ lương',
  };
  return map[status] ?? status;
}
