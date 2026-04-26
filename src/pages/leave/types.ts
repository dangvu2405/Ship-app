export type { LeaveRequest } from '@/types';
export type { LeaveType } from '@/services/leave.service';

export interface LeaveListProps {
  companyId?: number;
  officeId?: number;
  embedded?: boolean;
}

export function leaveStatusColor(status: string): string {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'cancelled': return 'default';
    default: return 'processing';
  }
}

export function leaveStatusLabel(status: string): string {
  const map: Record<string, string> = {
    pending: 'Chờ duyệt',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    cancelled: 'Đã hủy',
  };
  return map[status] ?? status;
}
