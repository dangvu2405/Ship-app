import { Flex, Skeleton } from 'antd';

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
}

export const TableSkeleton = ({ rows = 5, columns = 5 }: TableSkeletonProps) => {
  return (
    <Flex vertical gap={12}>
      <Flex gap={16} style={{ paddingBottom: 8, borderBottom: '1px solid var(--ant-color-split)' }}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton.Input key={`h-${i}`} active size="small" style={{ flex: 1, minWidth: 40 }} />
        ))}
      </Flex>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <Flex key={rowIndex} gap={16} align="center">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton.Input
              key={`${rowIndex}-${colIndex}`}
              active
              size="small"
              style={{ flex: 1, maxWidth: colIndex === 0 ? 80 : undefined }}
            />
          ))}
        </Flex>
      ))}
    </Flex>
  );
};
