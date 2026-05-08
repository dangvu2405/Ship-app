import * as React from "react"
import { Bar, CartesianGrid, ComposedChart, Line, XAxis, YAxis } from "recharts"

import { useIsMobile } from "@/hooks/use-mobile"
import { useTranslation } from "@/hooks/useTranslation"
import { useAppStore } from "@/stores/app.store"
import { Card, Col, Flex, Row, Segmented, Select, Spin, Typography, theme } from "antd"
import {
  type ChartConfig,
  ChartContainer,
  ChartLegend,
  ChartLegendContent,
  ChartTooltip,
} from "@/components/ui/chart"
import api from "@/services/api"
import { getErrorMessage } from "@/utils/errorHandler"
import { formatCurrencyVND } from "@/utils/format"
import type { Company, Office, Trip } from "@/types"

const CHART_HUES = [1, 2, 3, 4, 5] as const

type RevenueChartTimeRange = "90d" | "30d" | "7d"
type RevenueChartRow = { date: string; [key: string]: string | number }

function toDateKey(input: Date): string {
  return input.toISOString().slice(0, 10)
}

function parseTripDate(trip: Trip): Date | null {
  const candidates = [trip.actual_delivered_at, trip.end_time, trip.scheduled_date, trip.created_at]
  for (const candidate of candidates) {
    if (!candidate) continue
    const parsed = new Date(candidate)
    if (!Number.isNaN(parsed.getTime())) return parsed
  }
  return null
}

function revenueFromTrip(trip: Trip): number {
  const raw = trip.total_revenue ?? trip.price
  const value = typeof raw === "number" ? raw : Number(raw ?? 0)
  return Number.isFinite(value) ? value : 0
}

function rangeStartByTimeRange(timeRange: RevenueChartTimeRange): Date {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90
  const now = new Date()
  now.setHours(0, 0, 0, 0)
  const start = new Date(now)
  start.setDate(start.getDate() - (days - 1))
  return start
}

function useDashboardRevenueChartData(options: {
  companyId?: number
  timeRange: RevenueChartTimeRange
  offices: Office[]
}) {
  const { companyId, timeRange, offices } = options

  const [chartData, setChartData] = React.useState<RevenueChartRow[]>([])
  const [seriesKeys, setSeriesKeys] = React.useState<string[]>([])
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)

  const fetchData = React.useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const startDate = rangeStartByTimeRange(timeRange)
      const endDate = new Date()
      endDate.setHours(23, 59, 59, 999)

      const response = await api.get("/trips", {
        params: {
          status: "completed",
          per_page: 1000,
          ...(companyId != null ? { company_id: companyId } : {}),
        },
      })
      const trips = (response.data?.data?.data ?? []) as Trip[]

      const keysByDate: string[] = []
      const cursor = new Date(startDate)
      while (cursor <= endDate) {
        keysByDate.push(toDateKey(cursor))
        cursor.setDate(cursor.getDate() + 1)
      }

      const rowMap = new Map<string, RevenueChartRow>()
      for (const dateKey of keysByDate) {
        rowMap.set(dateKey, { date: dateKey })
      }

      const used = new Set<string>()
      for (const trip of trips) {
        const tripDate = parseTripDate(trip)
        if (!tripDate) continue
        if (tripDate < startDate || tripDate > endDate) continue

        const dateKey = toDateKey(tripDate)
        const row = rowMap.get(dateKey)
        if (!row) continue

        const seriesKey = companyId != null
          ? trip.office_id ? `of_${trip.office_id}` : "of_other"
          : trip.company_id ? `co_${trip.company_id}` : "co_other"

        row[seriesKey] = Number(row[seriesKey] ?? 0) + revenueFromTrip(trip)
        used.add(seriesKey)
      }

      let nextSeriesKeys = Array.from(used)
      if (companyId != null) {
        const officeKeys = offices
          .filter((office) => office.company_id === companyId)
          .map((office) => `of_${office.id}`)
        nextSeriesKeys = Array.from(new Set([...officeKeys, ...nextSeriesKeys]))
      }
      nextSeriesKeys.sort((a, b) => a.localeCompare(b))

      const nextRows = keysByDate.map((dateKey) => {
        const source = rowMap.get(dateKey) ?? { date: dateKey }
        const row: RevenueChartRow = { date: dateKey }
        for (const key of nextSeriesKeys) {
          row[key] = Number(source[key] ?? 0)
        }
        return row
      })

      setSeriesKeys(nextSeriesKeys)
      setChartData(nextRows)
    } catch (e) {
      setSeriesKeys([])
      setChartData([])
      setError(getErrorMessage(e) || "Failed to load chart data")
    } finally {
      setLoading(false)
    }
  }, [companyId, offices, timeRange])

  React.useEffect(() => {
    void fetchData()
  }, [fetchData])

  return { chartData, seriesKeys, loading, error }
}

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
  companies,
  offices,
}: {
  companyId?: number
  onCompanyIdChange?: (id: number | undefined) => void
  companies: Company[]
  offices: Office[]
}) {
  const { t } = useTranslation()
  const { token } = theme.useToken()
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

  const rangeSegmentedOptions = [
    { label: t("dashboard.chart.range90d"), value: "90d" },
    { label: t("dashboard.chart.range30d"), value: "30d" },
    { label: t("dashboard.chart.range7d"), value: "7d" },
  ]

  const chartShell = (child: React.ReactNode) => (
    <div
      style={{
        height: 280,
        width: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorder}`,
        background: token.colorFillAlter,
        padding: 16,
      }}
      className="rounded-xl"
    >
      {child}
    </div>
  )

  return (
    <Card aria-label={t("dashboard.chart.revenueAriaSummary")} className="rounded-xl border border-slate-200 shadow-sm">
      <Flex vertical gap={16}>
        <Row gutter={[16, 16]} align="top">
          <Col xs={24} md={14}>
            <Typography.Title level={4} style={{ margin: 0 }}>
              {t("dashboard.chart.revenueTitle")}
            </Typography.Title>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }} className="hidden sm:block">
              {t("dashboard.chart.revenueDescriptionLong")}
            </Typography.Paragraph>
            <Typography.Paragraph type="secondary" style={{ marginBottom: 0 }} className="sm:hidden">
              {t("dashboard.chart.revenueDescriptionShort")}
            </Typography.Paragraph>
          </Col>
        </Row>
        <Flex justify="flex-end" wrap="wrap" gap={8} className="rounded-xl border border-slate-200 bg-slate-50 p-2">
          <div className="hidden md:block">
            <Segmented options={rangeSegmentedOptions} value={timeRange} onChange={(v) => setRange(String(v))} />
          </div>
          <div className="md:hidden w-full">
            <Select
              className="w-full"
              aria-label={t("dashboard.chart.selectRange")}
              value={timeRange}
              options={rangeSegmentedOptions}
              onChange={(v) => setRange(v)}
            />
          </div>
        </Flex>
      </Flex>

      <div style={{ padding: "8px 0 0" }}>
        {loading ? (
          chartShell(
            <Spin />,
          )
        ) : error ? (
          chartShell(
            <Typography.Text type="danger" style={{ textAlign: "center" }}>
              {error}
            </Typography.Text>,
          )
        ) : !hasAnyPoint ? (
          chartShell(
            <Typography.Text type="secondary">{t("dashboard.chart.noRevenueData")}</Typography.Text>,
          )
        ) : (
          <ChartContainer config={chartConfig} className="aspect-auto h-[320px] w-full">
            <ComposedChart accessibilityLayer data={chartData} margin={{ left: 0, right: 8, top: 8, bottom: 0 }}>
              <CartesianGrid vertical={false} strokeDasharray="2 4" />
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
              {seriesKeys[0] ? (
                <Bar
                  dataKey={seriesKeys[0]}
                  fill={`var(--color-${seriesKeys[0]})`}
                  radius={[4, 4, 0, 0]}
                  maxBarSize={32}
                  isAnimationActive={!reduceMotion}
                />
              ) : null}
              {seriesKeys.slice(1).map((key) => (
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
            </ComposedChart>
          </ChartContainer>
        )}
      </div>
    </Card>
  )
}
