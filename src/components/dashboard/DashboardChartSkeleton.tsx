import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

/** Mirrors `ChartAreaInteractive` shell while the chart chunk lazy-loads. */
export function DashboardChartSkeleton() {
  return (
    <Card className="@container/card" aria-hidden>
      <CardHeader className="relative space-y-3">
        <div className="flex flex-col gap-3 @[640px]/card:flex-row @[640px]/card:items-start @[640px]/card:justify-between">
          <div className="min-w-0 flex-1 space-y-2 pr-0 @[640px]/card:pr-2">
            <Skeleton className="h-6 w-48 max-w-full" />
            <Skeleton className="h-4 w-full max-w-xl" />
          </div>
          <Skeleton className="h-9 w-full @[640px]/card:w-48 @[640px]/card:min-w-[12rem]" />
        </div>
        <div className="flex justify-end">
          <Skeleton className="h-8 w-48 max-w-full" />
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        <div className="flex min-h-[280px] h-[280px] w-full flex-col justify-end gap-2 rounded-lg border border-border/70 bg-muted/15 p-4">
          <div className="flex flex-1 items-end gap-1.5 pt-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <Skeleton
                key={i}
                className="flex-1 rounded-sm"
                style={{ height: `${28 + (i % 6) * 8}%` }}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
