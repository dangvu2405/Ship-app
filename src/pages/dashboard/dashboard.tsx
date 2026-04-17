import { Suspense, useMemo, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { Alert, Button, Card, DatePicker, Flex, Select, Space, Typography } from "antd"
import { useList } from "@refinedev/core"
import dayjs from "dayjs"
import { useDashboardStats } from "@/hooks/useDashboardStats"
import { useDashboardTripRevenue } from "@/hooks/useDashboardTripRevenue"
import { DashboardRevenueByOffice } from "@/components/dashboard/DashboardRevenueByOffice"
import { DashboardChartSkeleton } from "@/components/dashboard/DashboardChartSkeleton"
import { useDashboardRevenueByOffice } from "@/hooks/useDashboardRevenueByOffice"
import { lazyWithMinDelay } from "@/utils/lazyWithMinDelay"
import reportsService from "@/services/reports.service"
import { formatMoney } from "@/utils/displayFormat"
import type { Company, Office } from "@/types"
import { useTranslation } from "@/hooks/useTranslation"

const ChartAreaInteractive = lazyWithMinDelay(() =>
  import("@/components/chart-area-interactive").then((m) => ({ default: m.ChartAreaInteractive })),
)

export default function Dashboard() {
  const { t } = useTranslation()
  const [companyId, setCompanyId] = useState<number | undefined>(undefined)
  const [officeId, setOfficeId] = useState<number | undefined>(undefined)
  const [selectedDate, setSelectedDate] = useState(dayjs())
  const period = useMemo(() => {
    return { month: selectedDate.month() + 1, year: selectedDate.year() }
  }, [selectedDate])

  const { data: companiesData } = useList<Company>({
    resource: "companies",
    pagination: { current: 1, pageSize: 100 },
    filters: [{ field: "status", operator: "eq", value: "active" }],
    sorters: [{ field: "name", order: "asc" }],
  })
  const companies = useMemo(() => companiesData?.data ?? [], [companiesData])

  const { data: officesData } = useList<Office>({
    resource: "offices",
    pagination: { current: 1, pageSize: 200 },
    sorters: [{ field: "name", order: "asc" }],
  })
  const offices = officesData?.data ?? []
  const effectiveCompanyId = companyId ?? companies[0]?.id

  const { stats, statsLoading, statsError, refetchStats } = useDashboardStats({
    enablePolling: true,
    pollingInterval: 60000,
    companyId: effectiveCompanyId,
  })

  const {
    total: clientRevenueTotal,
    tripCount: clientTripCount,
    loading: revenueLoading,
  } = useDashboardTripRevenue({
    companyId: effectiveCompanyId,
    month: period.month,
    year: period.year,
  })

  const payrollSummaryQuery = useQuery({
    queryKey: ["dashboard-payroll-summary", effectiveCompanyId ?? null, period.month, period.year],
    queryFn: async () => {
      if (!effectiveCompanyId) return null
      const response = await reportsService.getPayrollSummary(effectiveCompanyId, period.month, period.year)
      if (!response.success) {
        throw new Error(response.message || "Failed to load payroll summary")
      }
      return response.data ?? null
    },
    enabled: effectiveCompanyId != null,
  })

  const fromApi = stats?.revenue != null
  const revenueTotal = fromApi ? (stats?.revenue?.total ?? 0) : clientRevenueTotal
  const revenueTripCount = fromApi ? (stats?.trips?.completed ?? 0) : clientTripCount
  const { rows: officeRevenueRows, loading: rankingLoading } = useDashboardRevenueByOffice({
    offices,
    companyId: effectiveCompanyId,
    officeId,
    month: period.month,
    year: period.year,
  })
  const topOfficeRows = useMemo(() => officeRevenueRows.slice(0, 6), [officeRevenueRows])
  const maxRevenue = topOfficeRows[0]?.revenue ?? 1

  const handleReset = () => {
    setCompanyId(undefined)
    setOfficeId(undefined)
    setSelectedDate(dayjs())
  }

  return (
    <div className="space-y-4 px-4 pb-6 lg:px-6">
      <Card styles={{ body: { padding: 0 } }}>
        <div
          style={{
            background: "linear-gradient(135deg, #1e3a5f 0%, #1b2f4a 100%)",
            color: "#fff",
            padding: "16px 20px",
            borderTopLeftRadius: 8,
            borderTopRightRadius: 8,
          }}
        >
          <Flex justify="space-between" align="center" wrap="wrap" gap={12}>
            <div>
              <Typography.Text style={{ color: "rgba(255,255,255,0.75)", fontSize: 12 }}>
                {t("dashboard.overview")}
              </Typography.Text>
              <Typography.Title level={3} style={{ margin: 0, color: "#fff", fontSize: 30, lineHeight: "36px" }}>
                Data Details
              </Typography.Title>
            </div>
            <Space>
              <Button>{t("common.save")}</Button>
              <Button>...</Button>
            </Space>
          </Flex>
        </div>

        <div style={{ padding: 20 }}>

        <div className="rounded-md border bg-muted/20 p-3">
          <Flex gap={12} wrap="wrap">
            <Select
              value={effectiveCompanyId}
              onChange={setCompanyId}
              options={companies.map((company) => ({ label: company.name, value: company.id }))}
              placeholder={t("dashboard.filterByCompany")}
              style={{ minWidth: 240 }}
              allowClear
            />
            <Select
              value={officeId}
              onChange={setOfficeId}
              options={offices.map((office) => ({ label: office.name, value: office.id }))}
              placeholder={t("offices.title")}
              style={{ minWidth: 240 }}
              allowClear
            />
            <DatePicker
              value={selectedDate}
              onChange={(value) => setSelectedDate(value ?? dayjs())}
              style={{ minWidth: 180 }}
            />
            <Space>
              <Button onClick={handleReset}>{t("common.reset")}</Button>
              <Button type="primary" onClick={() => void refetchStats()}>{t("common.search")}</Button>
            </Space>
          </Flex>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-4">
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.totalTrips")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{stats?.trips?.total ?? 0}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.completedTrips")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{revenueTripCount}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.totalRevenue")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{statsLoading || revenueLoading ? t("common.loading") : formatMoney(revenueTotal, { withCurrency: true })}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Payroll Net</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{formatMoney(payrollSummaryQuery.data?.total_net ?? 0, { withCurrency: true })}</Typography.Title></Card>
        </div>
        <div className="mt-3 grid gap-3 md:grid-cols-5">
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.activeCompanies")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{stats?.companies?.active ?? 0}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.activeEmployees")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{stats?.employees?.active ?? 0}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>{t("dashboard.cards.activeVehicles")}</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{stats?.vehicles?.active ?? 0}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Pending trips</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{stats?.trips?.pending ?? 0}</Typography.Title></Card>
          <Card size="small" styles={{ body: { padding: 14 } }}><Typography.Text type="secondary" style={{ fontSize: 12 }}>Payroll employees</Typography.Text><Typography.Title level={4} style={{ margin: "4px 0 0", fontSize: 30 }}>{payrollSummaryQuery.data?.employees_count ?? 0}</Typography.Title></Card>
        </div>

        {statsError ? (
          <div className="mt-4">
            <Alert
              type="error"
              message={t("common.loadError")}
              description={statsError}
              showIcon
            />
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
          <Suspense fallback={<DashboardChartSkeleton />}>
            <ChartAreaInteractive
              companyId={effectiveCompanyId}
              onCompanyIdChange={setCompanyId}
              companies={companies}
              offices={offices}
            />
          </Suspense>
          <Card title={t("dashboard.topOffices")} size="small">
            {rankingLoading ? (
              <Typography.Text type="secondary">{t("common.loading")}</Typography.Text>
            ) : topOfficeRows.length === 0 ? (
              <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>
            ) : (
              <Space direction="vertical" size={10} style={{ width: "100%" }}>
                {topOfficeRows.map((row, index) => (
                  <div key={row.key}>
                    <Flex justify="space-between" align="center">
                      <Typography.Text style={{ fontSize: 12, maxWidth: 180 }} ellipsis>
                        {index + 1}.{" "}
                        {row.officeName === "__UNASSIGNED__" ? t("dashboard.chart.unassigned") : row.officeName}
                      </Typography.Text>
                      <Typography.Text style={{ fontSize: 12 }}>{Math.round((row.revenue / maxRevenue) * 100)}%</Typography.Text>
                    </Flex>
                    <div style={{ marginTop: 4, height: 6, background: "#eef2f7", borderRadius: 999 }}>
                      <div
                        style={{
                          width: `${Math.max(8, Math.round((row.revenue / maxRevenue) * 100))}%`,
                          height: 6,
                          background: "#7ea8f8",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </Space>
            )}
          </Card>
        </div>

        <div className="mt-4 grid gap-3 lg:grid-cols-3">
          <Card size="small" title="Payroll snapshot">
            {payrollSummaryQuery.isLoading ? (
              <Typography.Text type="secondary">{t("common.loading")}</Typography.Text>
            ) : payrollSummaryQuery.error ? (
              <Alert type="error" showIcon message={(payrollSummaryQuery.error as Error).message} />
            ) : payrollSummaryQuery.data ? (
              <Space direction="vertical" size={8} style={{ width: "100%" }}>
                <Flex justify="space-between"><Typography.Text type="secondary">Payroll ID</Typography.Text><Typography.Text>{payrollSummaryQuery.data.payroll?.id ?? "-"}</Typography.Text></Flex>
                <Flex justify="space-between"><Typography.Text type="secondary">Status</Typography.Text><Typography.Text>{payrollSummaryQuery.data.payroll?.status ?? "-"}</Typography.Text></Flex>
                <Flex justify="space-between"><Typography.Text type="secondary">Employees</Typography.Text><Typography.Text>{payrollSummaryQuery.data.employees_count ?? 0}</Typography.Text></Flex>
                <Flex justify="space-between"><Typography.Text type="secondary">Total net</Typography.Text><Typography.Text strong>{formatMoney(payrollSummaryQuery.data.total_net ?? 0, { withCurrency: true })}</Typography.Text></Flex>
              </Space>
            ) : (
              <Typography.Text type="secondary">{t("common.noData")}</Typography.Text>
            )}
          </Card>
          <Card size="small" title="Fleet utilization">
            <Space direction="vertical" size={10} style={{ width: "100%" }}>
              {[
                { label: t("dashboard.cards.activeVehicles"), value: stats?.vehicles?.active ?? 0, total: Math.max(stats?.vehicles?.total ?? 1, 1) },
                { label: t("dashboard.cards.activeEmployees"), value: stats?.employees?.active ?? 0, total: Math.max(stats?.employees?.total ?? 1, 1) },
                { label: t("dashboard.cards.completedTrips"), value: stats?.trips?.completed ?? 0, total: Math.max(stats?.trips?.total ?? 1, 1) },
              ].map((item) => {
                const percent = Math.round((item.value / item.total) * 100)
                return (
                  <div key={item.label}>
                    <Flex justify="space-between">
                      <Typography.Text style={{ fontSize: 12 }}>{item.label}</Typography.Text>
                      <Typography.Text style={{ fontSize: 12 }}>{percent}%</Typography.Text>
                    </Flex>
                    <div style={{ marginTop: 4, height: 6, background: "#eef2f7", borderRadius: 999 }}>
                      <div style={{ width: `${Math.max(percent, 6)}%`, height: 6, background: "#8db0f8", borderRadius: 999 }} />
                    </div>
                  </div>
                )
              })}
            </Space>
          </Card>
          <Card size="small" title="Operations health">
            <Space direction="vertical" size={8} style={{ width: "100%" }}>
              <Flex justify="space-between"><Typography.Text type="secondary">Completion rate</Typography.Text><Typography.Text>{Math.round(((stats?.trips?.completed ?? 0) / Math.max(stats?.trips?.total ?? 1, 1)) * 100)}%</Typography.Text></Flex>
              <Flex justify="space-between"><Typography.Text type="secondary">Pending rate</Typography.Text><Typography.Text>{Math.round(((stats?.trips?.pending ?? 0) / Math.max(stats?.trips?.total ?? 1, 1)) * 100)}%</Typography.Text></Flex>
              <Flex justify="space-between"><Typography.Text type="secondary">Revenue / trip</Typography.Text><Typography.Text>{formatMoney((revenueTotal || 0) / Math.max(revenueTripCount || 1, 1), { withCurrency: true })}</Typography.Text></Flex>
              <Flex justify="space-between"><Typography.Text type="secondary">Companies active</Typography.Text><Typography.Text>{stats?.companies?.active ?? 0}</Typography.Text></Flex>
            </Space>
          </Card>
        </div>

        <div className="mt-4">
          <Typography.Title level={5} style={{ marginTop: 0 }}>
            {t("dashboard.revenueByOffice")}
          </Typography.Title>
          <DashboardRevenueByOffice
            offices={offices}
            companyId={effectiveCompanyId}
            officeId={officeId}
            month={period.month}
            year={period.year}
          />
        </div>
        </div>
      </Card>
    </div>
  )
}
