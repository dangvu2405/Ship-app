import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
