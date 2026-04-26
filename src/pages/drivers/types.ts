export type { DriverSchedule, PublicHoliday, LeaveRequest, AbsenceRecord, DayKind } from '@/types';

export interface SchedulePageProps {
  officeId?: number;
  driverId?: number;
  embedded?: boolean;
}

export type ScheduleAction = 'approve' | 'reject' | 'lock' | 'submit' | 'override';

export function scheduleStatusColor(status: string): string {
  switch (status) {
    case 'approved': return 'success';
    case 'rejected': return 'error';
    case 'locked': return 'purple';
    case 'submitted': return 'processing';
    default: return 'default';
  }
}

export function scheduleStatusLabel(status: string): string {
  const map: Record<string, string> = {
    draft: 'Nháp',
    submitted: 'Đã gửi',
    approved: 'Đã duyệt',
    rejected: 'Từ chối',
    locked: 'Đã khóa',
  };
  return map[status] ?? status;
}
