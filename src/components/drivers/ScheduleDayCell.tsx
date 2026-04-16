import { Badge, Space, Tag, Tooltip } from 'antd';
import type { Dayjs } from 'dayjs';
import { useTranslation } from '@/hooks/useTranslation';
import type { DayInfo } from '@/hooks/use-driver-day-map';

interface Props {
  date: Dayjs;
  info: DayInfo | undefined;
}

const KIND_STYLE: Record<string, { bg: string; border: string }> = {
  working: { bg: '#E6F1FB', border: '#85B7EB' },
  leave: { bg: '#EAF3DE', border: '#97C459' },
  noleave: { bg: '#FCEBEB', border: '#F09595' },
  holiday: { bg: '#EEEDFE', border: '#AFA9EC' },
  weekend: { bg: '#F5F5F5', border: '#D9D9D9' },
};

const SHIFT_COLOR: Record<string, string> = {
  morning: 'blue',
  afternoon: 'cyan',
  night: 'purple',
  day: 'geekblue',
};

const STATUS_BADGE: Record<string, 'default' | 'processing' | 'success' | 'error'> = {
  draft: 'default',
  confirmed: 'processing',
  approved: 'processing',
  locked: 'success',
  rejected: 'error',
};

export function ScheduleDayCell({ date, info }: Props) {
  const { t } = useTranslation();
  if (!info) {
    return (
      <div
        style={{
          borderRadius: 8,
          minHeight: 68,
          padding: 4,
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937' }}>{date.date()}</div>
      </div>
    );
  }

  const style = KIND_STYLE[info.kind];
  if (!style) return null;

  return (
    <Tooltip title={<CellTooltip date={date} info={info} />} placement="top">
      <div
        style={{
          background: style.bg,
          border: `1px solid ${style.border}`,
          borderRadius: 8,
          padding: 4,
          minHeight: 68,
          cursor: 'pointer',
        }}
      >
        <div style={{ fontSize: 12, fontWeight: 600, color: '#1f2937', marginBottom: 2 }}>{date.date()}</div>
        {info.kind === 'working' && info.schedule && (
          <Space direction="vertical" size={1}>
            <Tag
              color={SHIFT_COLOR[info.schedule.shift_code?.toLowerCase() ?? ''] ?? 'default'}
              style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}
            >
              <Badge
                status={STATUS_BADGE[info.schedule.status ?? 'draft']}
                style={{ marginRight: 3 }}
              />
              {info.schedule.shift_code}
            </Tag>
          </Space>
        )}

        {info.kind === 'leave' && (
          <Tag color="green" style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
            {t('drivers.scheduleStatusFilterLeave')}
          </Tag>
        )}

        {info.kind === 'noleave' && (
          <Tag color="red" style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
            {t('drivers.scheduleStatusFilterAbsent')}
          </Tag>
        )}

        {info.kind === 'holiday' && (
          <Tag color="purple" style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
            {t('drivers.scheduleHoliday')}
          </Tag>
        )}

        {info.kind === 'weekend' && (
          <Tag color="default" style={{ fontSize: 10, padding: '0 4px', margin: 0, lineHeight: '16px' }}>
            {t('drivers.scheduleWeekend')}
          </Tag>
        )}
      </div>
    </Tooltip>
  );
}

function CellTooltip({ date, info }: { date: Dayjs; info: DayInfo }) {
  const { t } = useTranslation();
  return (
    <Space direction="vertical" size={2} style={{ fontSize: 12 }}>
      <span style={{ fontWeight: 500 }}>{date.format('dddd DD/MM/YYYY')}</span>
      {info.kind === 'working' && info.schedule && (
        <>
          <span>{t('workforce.shift')}: {info.schedule.shift_code}</span>
          <span>{t('workforce.startTime')}: {info.schedule.start_time ?? '-'}</span>
          <span>{t('vehicleAssignments.vehicle')}: {info.schedule.vehicle_id ? `#${info.schedule.vehicle_id}` : '-'}</span>
          <span>{t('common.status')}: {info.schedule.status ?? '-'}</span>
        </>
      )}
      {info.kind === 'leave' && info.leave && (
        <>
          <span>{t('drivers.scheduleStatusFilterLeave')}</span>
          <span>{t('workforce.leaveType')}: {info.leave.leave_type_id}</span>
          <span>{t('common.reason')}: {info.leave.reason ?? '-'}</span>
        </>
      )}
      {info.kind === 'noleave' && info.absence && (
        <>
          <span>{t('drivers.scheduleStatusFilterAbsent')}</span>
          <span>{t('common.reason')}: {info.absence.reason ?? t('common.noData')}</span>
        </>
      )}
      {info.kind === 'holiday' && info.holiday && (
        <>
          <span>{t('drivers.scheduleHoliday')}: {info.holiday.name}</span>
          <span>{t('drivers.scheduleHolidayType')}: {info.holiday.holiday_type}</span>
        </>
      )}
      {info.kind === 'weekend' && <span>{t('drivers.scheduleWeekend')}</span>}
    </Space>
  );
}
