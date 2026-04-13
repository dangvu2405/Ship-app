import { Tag, Tooltip } from 'antd';
import { formatDateTimeVN, formatDateVN } from '@/utils/format';

type DateTimeBadgeMode = 'date' | 'datetime';

interface DateTimeBadgeProps {
  value?: string | null;
  mode?: DateTimeBadgeMode;
  emptyText?: string;
}

function formatDateValue(value: string, mode: DateTimeBadgeMode): string {
  return mode === 'date' ? formatDateVN(value) : formatDateTimeVN(value);
}

export function DateTimeBadge({ value, mode = 'date', emptyText = '—' }: DateTimeBadgeProps) {
  if (!value) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }

  const formatted = formatDateValue(value, mode);

  return (
    <Tooltip title={value}>
      <Tag className="m-0 font-normal">{formatted}</Tag>
    </Tooltip>
  );
}
