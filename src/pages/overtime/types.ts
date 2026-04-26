export type { OvertimeRequest } from '@/types';

export interface OvertimeListProps {
  companyId?: number;
  officeId?: number;
  embedded?: boolean;
}

export const OT_CAP_HOURS = 40;

export function otStatusColor(status: string): string {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'paid': return 'green';
    default: return 'processing';
  }
}

export function otStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt',
    submitted: 'Đã gửi',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    paid: 'Đã thanh toán',
  };
  return map[status] ?? status;
}
