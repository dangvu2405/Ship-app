import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"

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

  const companySelectOptions = [
    { value: "all", label: t("dashboard.allCompanies") },
    ...companies.map((c) => ({ value: String(c.id), label: c.name })),
  ]

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
    >
      {child}
    </div>
  )

  return (
    <Card aria-label={t("dashboard.chart.revenueAriaSummary")}>
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
          <Col xs={24} md={10}>
            <Select
              className="w-full"
              aria-label={t("dashboard.filterByCompany")}
              value={companyId != null ? String(companyId) : "all"}
              options={companySelectOptions}
              onChange={(v) => onCompanyIdChange(v === "all" ? undefined : Number(v))}
            />
          </Col>
        </Row>
        <Flex justify="flex-end" wrap="wrap" gap={8}>
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
            <Spin tip={t("common.loading")} />,
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
      </div>
    </Card>
  )
}
