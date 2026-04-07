import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

type DateTimeBadgeMode = 'date' | 'datetime';

interface DateTimeBadgeProps {
  value?: string | null;
  mode?: DateTimeBadgeMode;
  emptyText?: string;
}

function formatDateValue(value: string, mode: DateTimeBadgeMode): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  if (mode === 'date') {
    return new Intl.DateTimeFormat('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(date);
  }

  return new Intl.DateTimeFormat('vi-VN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function DateTimeBadge({ value, mode = 'date', emptyText = '—' }: DateTimeBadgeProps) {
  if (!value) {
    return <span className="text-muted-foreground">{emptyText}</span>;
  }

  const formatted = formatDateValue(value, mode);

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Badge variant="outline" className="font-normal">
            {formatted}
          </Badge>
        </TooltipTrigger>
        <TooltipContent>{value}</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
