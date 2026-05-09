import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { AbsenceRecord, DayKind, DriverSchedule, LeaveRequest, PublicHoliday } from '@/types';

/** Lấy YYYY-MM-DD từ chuỗi API; ưu tiên phần ngày đầu chuỗi để tránh lệch ngày khi có Zulu ISO. */
function calendarDateKey(value: string | null | undefined): string {
  if (value == null || value === '') return '';
  const s = String(value).trim();
  const m = /^(\d{4}-\d{2}-\d{2})/.exec(s);
  if (m) return m[1];
  return dayjs(s).format('YYYY-MM-DD');
}

export interface DayInfo {
  kind: DayKind;
  schedule?: DriverSchedule;
  leave?: LeaveRequest;
  absence?: AbsenceRecord;
  holiday?: PublicHoliday;
}

interface Params {
  schedules: DriverSchedule[];
  leaveRequests: LeaveRequest[];
  absences: AbsenceRecord[];
  publicHolidays: PublicHoliday[];
}

export function useDriverDayMap({ schedules, leaveRequests, absences, publicHolidays }: Params) {
  return useMemo(() => {
    const map = new Map<string, DayInfo>();

    publicHolidays.forEach((holiday) => {
      const key = calendarDateKey(holiday.date);
      if (key) map.set(key, { kind: 'holiday', holiday });
    });

    leaveRequests
      .filter((leaveRequest) => leaveRequest.status === 'approved')
      .forEach((leaveRequest) => {
        let cursor = dayjs(calendarDateKey(leaveRequest.from_date));
        const end = dayjs(calendarDateKey(leaveRequest.to_date));
        if (!cursor.isValid() || !end.isValid()) return;
        while (!cursor.isAfter(end)) {
          const key = cursor.format('YYYY-MM-DD');
          if (!map.has(key)) {
            map.set(key, { kind: 'leave', leave: leaveRequest });
          }
          cursor = cursor.add(1, 'day');
        }
      });

    absences.forEach((absence) => {
      const key = calendarDateKey(absence.date);
      if (key && !map.has(key)) {
        map.set(key, { kind: 'noleave', absence });
      }
    });

    schedules.forEach((schedule) => {
      const key = calendarDateKey(schedule.work_date);
      if (!key) return;
      map.set(key, { kind: 'working', schedule });
    });

    return map;
  }, [schedules, leaveRequests, absences, publicHolidays]);
}
