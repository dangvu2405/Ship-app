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
    case 'submitted': return 'processing';
    default: return 'processing';
  }
}

export function leaveStatusLabel(status: string, t: (key: string) => string): string {
  const map: Record<string, string> = {
    pending: 'leavePages.status.pending',
    submitted: 'leavePages.status.submitted',
    approved: 'leavePages.status.approved',
    rejected: 'leavePages.status.rejected',
    cancelled: 'leavePages.status.cancelled',
  };
  return map[status] ? t(map[status]) : status;
}
