import { Skeleton } from '@/components/ui/skeleton';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 5 }: TableSkeletonProps) => {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4 pb-2 border-b border-border/50">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={`h-${i}`} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4 py-1">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton
              key={`${rowIndex}-${colIndex}`}
              className="h-5 flex-1"
              style={{ maxWidth: colIndex === 0 ? '80px' : undefined }}
            />
          ))}
        </div>
      ))}
    </div>
  );
};
