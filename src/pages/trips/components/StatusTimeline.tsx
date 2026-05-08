import { Tag, Timeline, Typography } from 'antd';
import type { TripStatusHistory } from '@/types';
import { useTranslation } from '@/hooks/useTranslation';
import { formatDateTime } from '@/utils/displayFormat';
import { getTripStatusDisplay } from '@/utils/tripStatus';

export interface StatusTimelineProps {
  histories: TripStatusHistory[] | undefined;
}

export function StatusTimeline({ histories }: StatusTimelineProps) {
  const { t } = useTranslation();
  const rows = [...(histories ?? [])].sort(
    (a, b) => new Date(a.changed_at).getTime() - new Date(b.changed_at).getTime(),
  );

  if (rows.length === 0) {
    return <Typography.Text type="secondary">Chưa có lịch sử trạng thái (trip_status_histories).</Typography.Text>;
  }

  return (
    <Timeline
      mode="left"
      items={rows.map((h) => {
        const fromDisplay = h.from_status ? getTripStatusDisplay(h.from_status, t) : null;
        const toDisplay = getTripStatusDisplay(h.to_status, t);
        return {
          color: 'blue',
          children: (
            <div className="space-y-1">
              <div className="text-xs text-slate-500">{formatDateTime(h.changed_at)}</div>
              <div className="flex flex-wrap items-center gap-2">
                {fromDisplay ? (
                  <Tag color={fromDisplay.color}>{fromDisplay.label}</Tag>
                ) : (
                  <Typography.Text type="secondary">—</Typography.Text>
                )}
                <span>→</span>
                <Tag color={toDisplay.color}>{toDisplay.label}</Tag>
              </div>
              {h.note ? <Typography.Text className="text-xs">{h.note}</Typography.Text> : null}
            </div>
          ),
        };
      })}
    />
  );
}
