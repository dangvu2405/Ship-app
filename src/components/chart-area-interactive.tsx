import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/hooks/useTranslation"
import { useAppStore } from "@/stores/app.store"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import { useDashboardRevenueChartData, type RevenueChartTimeRange } from "@/hooks/useDashboardRevenueChartData"
import { formatCurrencyVND } from "@/utils/format"
import type { Company, Office } from "@/types"

const CHART_HUES = [1, 2, 3, 4, 5] as const

function formatAxisVnd(v: number): string {
  if (!Number.isFinite(v)) return ""
  const abs = Math.abs(v)
  if (abs >= 1e9) return `${(v / 1e9).toFixed(1)}B`
  if (abs >= 1e6) return `${(v / 1e6).toFixed(1)}M`
  if (abs >= 1e3) return `${(v / 1e3).toFixed(0)}k`
  return String(Math.round(v))
}

export function ChartAreaInteractive({
  companyId,
  onCompanyIdChange,
  companies,
  offices,
}: {
  companyId?: number
  onCompanyIdChange: (id: number | undefined) => void
  companies: Company[]
  offices: Office[]
}) {
  const { t } = useTranslation()
  const appLocale = useAppStore((s) => s.locale)
  const dateLocale = appLocale === "vi" ? "vi-VN" : "en-US"
  const isMobile = useIsMobile()
  const [timeRange, setTimeRange] = React.useState<RevenueChartTimeRange>("30d")
  const [reduceMotion, setReduceMotion] = React.useState(false)

  const { chartData, seriesKeys, loading, error } = useDashboardRevenueChartData({
    companyId,
    timeRange,
    offices,
  })

  const seriesLabels = React.useMemo(() => {
    const companyById = new Map(companies.map((c) => [c.id, c]))
    const officeById = new Map(offices.map((o) => [o.id, o]))
    const out: Record<string, string> = {}
    for (const k of seriesKeys) {
      if (k === "other") {
        out[k] = t("dashboard.chart.otherSeries")
      } else if (k === "co_other") {
        out[k] = t("dashboard.chart.unassigned")
      } else if (k === "of_other") {
        out[k] = t("dashboard.chart.unassigned")
      } else if (k.startsWith("co_")) {
        const id = Number(k.slice(3))
        out[k] = Number.isFinite(id) ? companyById.get(id)?.name ?? `#${id}` : k
      } else if (k.startsWith("of_")) {
        const id = Number(k.slice(3))
        out[k] = Number.isFinite(id) ? officeById.get(id)?.name ?? `#${id}` : k
      } else {
        out[k] = k
      }
    }
    return out
  }, [seriesKeys, companies, offices, t])

  const chartConfig = React.useMemo(() => {
    const cfg: ChartConfig = {}
    for (let i = 0; i < seriesKeys.length; i++) {
      const k = seriesKeys[i]
      const hue = CHART_HUES[i % CHART_HUES.length]
      cfg[k] = {
        label: seriesLabels[k] ?? k,
        color: `hsl(var(--chart-${hue}))`,
      }
    }
    return cfg
  }, [seriesKeys, seriesLabels])

  React.useEffect(() => {
    if (isMobile) {
      setTimeRange("7d")
    }
  }, [isMobile])

  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)")
    const update = () => setReduceMotion(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const formatShortDate = React.useCallback(
    (value: string | number) => {
      const date = new Date(value)
      return date.toLocaleDateString(dateLocale, {
        month: "short",
        day: "numeric",
      })
    },
    [dateLocale],
  )

  const setRange = React.useCallback((value: string) => {
    if (value === "90d" || value === "30d" || value === "7d") {
      setTimeRange(value)
    }
  }, [])

  const hasAnyPoint = seriesKeys.some((k) =>
    chartData.some((row) => Number(row[k] ?? 0) > 0),
  )

  return (
    <Card className="@container/card" aria-label={t("dashboard.chart.revenueAriaSummary")}>
      <CardHeader className="relative space-y-3">
        <div className="flex flex-col gap-3 @[640px]/card:flex-row @[640px]/card:items-start @[640px]/card:justify-between">
          <div className="min-w-0 flex-1 space-y-1 pr-0 @[640px]/card:pr-2">
            <CardTitle>{t("dashboard.chart.revenueTitle")}</CardTitle>
            <CardDescription>
              <span className="@[540px]/card:block hidden">{t("dashboard.chart.revenueDescriptionLong")}</span>
              <span className="@[540px]/card:hidden">{t("dashboard.chart.revenueDescriptionShort")}</span>
            </CardDescription>
          </div>
          <div className="flex w-full shrink-0 flex-col gap-2 @[640px]/card:w-auto @[640px]/card:min-w-[12rem]">
            <Select
              value={companyId != null ? String(companyId) : "all"}
              onValueChange={(v) => onCompanyIdChange(v === "all" ? undefined : Number(v))}
            >
              <SelectTrigger className="w-full" aria-label={t("dashboard.filterByCompany")}>
                <SelectValue placeholder={t("dashboard.allCompanies")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t("dashboard.allCompanies")}</SelectItem>
                {companies.map((c) => (
                  <SelectItem key={c.id} value={String(c.id)}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end">
          <ToggleGroup
            type="single"
            value={timeRange}
            onValueChange={setRange}
            variant="outline"
            className="@[767px]/card:flex hidden"
          >
            <ToggleGroupItem value="90d" className="h-8 px-2.5">
              {t("dashboard.chart.range90d")}
            </ToggleGroupItem>
            <ToggleGroupItem value="30d" className="h-8 px-2.5">
              {t("dashboard.chart.range30d")}
            </ToggleGroupItem>
            <ToggleGroupItem value="7d" className="h-8 px-2.5">
              {t("dashboard.chart.range7d")}
            </ToggleGroupItem>
          </ToggleGroup>
          <Select value={timeRange} onValueChange={setRange}>
            <SelectTrigger className="@[767px]/card:hidden flex w-40" aria-label={t("dashboard.chart.selectRange")}>
              <SelectValue placeholder={t("dashboard.chart.range90d")} />
            </SelectTrigger>
            <SelectContent className="rounded-xl">
              <SelectItem value="90d" className="rounded-lg">
                {t("dashboard.chart.range90d")}
              </SelectItem>
              <SelectItem value="30d" className="rounded-lg">
                {t("dashboard.chart.range30d")}
              </SelectItem>
              <SelectItem value="7d" className="rounded-lg">
                {t("dashboard.chart.range7d")}
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="px-2 pt-2 sm:px-6 sm:pt-4">
        {loading ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
            {t("common.loading")}
          </div>
        ) : error ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-destructive/30 bg-destructive/5 px-4 text-center text-sm text-destructive">
            {error}
          </div>
        ) : !hasAnyPoint ? (
          <div className="flex h-[280px] w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 text-sm text-muted-foreground">
            {t("dashboard.chart.noRevenueData")}
          </div>
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[280px] w-full">
            <LineChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} />
              <XAxis
                dataKey="date"
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                minTickGap={24}
                tickFormatter={formatShortDate}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickMargin={8}
                width={48}
                tickFormatter={formatAxisVnd}
              />
              <ChartTooltip
                cursor={{ stroke: "hsl(var(--border))", strokeWidth: 1 }}
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null
                  return (
                    <div className="grid min-w-[10rem] gap-1.5 rounded-lg border border-border/60 bg-background px-2.5 py-2 text-xs shadow-lg">
                      <div className="font-medium">{formatShortDate(label as string)}</div>
                      <div className="grid gap-1">
                        {payload
                          .filter((p) => p.type !== "none")
                          .map((p) => {
                            const key = String(p.dataKey ?? "")
                            const name = chartConfig[key]?.label ?? key
                            return (
                              <div key={key} className="flex justify-between gap-6 tabular-nums">
                                <span className="text-muted-foreground">{name}</span>
                                <span className="font-medium">{formatCurrencyVND(Number(p.value))}</span>
                              </div>
                            )
                          })}
                      </div>
                    </div>
                  )
                }}
              />
              <ChartLegend
                verticalAlign="bottom"
                content={<ChartLegendContent className="flex-wrap justify-center gap-x-3 gap-y-2 pt-3" />}
              />
              {seriesKeys.map((key) => (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={`var(--color-${key})`}
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 3 }}
                  connectNulls
                  isAnimationActive={!reduceMotion}
                />
              ))}
            </LineChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
