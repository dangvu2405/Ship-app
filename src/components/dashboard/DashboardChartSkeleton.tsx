import { Card, Flex, Skeleton, Space } from "antd"

/** Mirrors `ChartAreaInteractive` shell while the chart chunk lazy-loads. */
export function DashboardChartSkeleton() {
  return (
    <Card aria-hidden styles={{ body: { padding: 24 } }}>
      <Space direction="vertical" size="middle" className="w-full">
        <Flex vertical gap={12} className="w-full md:flex-row md:items-start md:justify-between">
          <div className="min-w-0 flex-1 space-y-2 pr-0 md:pr-2">
            <Skeleton.Input active size="small" className="!w-48 max-w-full" />
            <Skeleton active paragraph={{ rows: 1 }} title={false} className="max-w-xl" />
          </div>
          <Skeleton.Input active className="!h-9 !w-full md:!w-48 md:!min-w-[12rem]" />
        </Flex>
        <Flex justify="flex-end">
          <Skeleton.Input active className="!h-8 !w-48 max-w-full" />
        </Flex>
      </Space>
      <div className="px-2 pt-2 sm:px-6 sm:pt-4">
        <div className="flex min-h-[280px] h-[280px] w-full flex-col justify-end gap-2 rounded-lg border border-border/70 bg-muted/15 p-4">
          <div className="flex flex-1 items-end gap-1.5 pt-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                active
                title={false}
                paragraph={{ rows: 1, width: "100%" }}
                className="m-0 flex-1 [&_.ant-skeleton-paragraph]:m-0 [&_li]:h-full [&_li]:rounded-sm [&_li]:after:rounded-sm"
                style={{ height: `${28 + (i % 6) * 8}%`, minWidth: 0 }}
              />
            ))}
          </div>
        </div>
      </div>
    </Card>
  )
}
