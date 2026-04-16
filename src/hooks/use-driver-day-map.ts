import { useMemo } from 'react';
import dayjs from 'dayjs';
import type { AbsenceRecord, DayKind, DriverSchedule, LeaveRequest, PublicHoliday } from '@/types';

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
      map.set(holiday.date, { kind: 'holiday', holiday });
    });

    leaveRequests
      .filter((leaveRequest) => leaveRequest.status === 'approved')
      .forEach((leaveRequest) => {
        let cursor = dayjs(leaveRequest.from_date);
        const end = dayjs(leaveRequest.to_date);
        while (!cursor.isAfter(end)) {
          const key = cursor.format('YYYY-MM-DD');
          if (!map.has(key)) {
            map.set(key, { kind: 'leave', leave: leaveRequest });
          }
          cursor = cursor.add(1, 'day');
        }
      });

    absences.forEach((absence) => {
      if (!map.has(absence.date)) {
        map.set(absence.date, { kind: 'noleave', absence });
      }
    });

    schedules.forEach((schedule) => {
      const key = dayjs(schedule.work_date).format('YYYY-MM-DD');
      if (!map.has(key)) {
        map.set(key, { kind: 'working', schedule });
      }
    });

    return map;
  }, [schedules, leaveRequests, absences, publicHolidays]);
}
